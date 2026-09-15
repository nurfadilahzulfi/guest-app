/**
 * Memproses permintaan lupa kata sandi.
 * Mengirimkan tautan reset ke email pengguna terdaftar jika akun aktif.
 * Mengembalikan respons sukses umum agar tidak membocorkan keberadaan email (user enumeration protection).
 *
 * @param {Object} params
 * @param {string} params.email - Email pengguna yang meminta reset kata sandi
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository - Repositori user
 * @param {import('@/application/services/token-service').TokenService} params.tokenService - Layanan token kriptografi
 * @param {import('@/application/services/notification-service').NotificationService} params.notificationService - Layanan pengiriman email
 * @param {string} [params.appUrl] - Base URL aplikasi
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function requestPasswordReset({
  email,
  userRepository,
  tokenService,
  notificationService,
  appUrl,
}) {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new Error("Format alamat email tidak valid");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);

  // Pencegahan user enumeration: jika user tidak ada atau non-aktif,
  // jangan lempar error yang membocorkan status akun.
  if (!user || !user.isActive) {
    return {
      success: true,
      message: "Jika email terdaftar pada sistem, tautan pengaturan ulang kata sandi telah dikirim.",
    };
  }

  // Invalidate token lama jika ada
  if (tokenService.invalidateUserInviteTokens) {
    await tokenService.invalidateUserInviteTokens(user.id);
  }

  // Buat token reset baru berlaku 10 menit
  const resetToken = tokenService.createPasswordResetToken
    ? await tokenService.createPasswordResetToken(user.id, 10)
    : await tokenService.createInviteToken(user.id, 10 / 60);
  const baseUrl = appUrl || "";
  const resetUrl = `${baseUrl}/reset-password/${resetToken.token}`;

  // Kirim email notifikasi reset kata sandi
  if (notificationService?.sendPasswordResetEmail) {
    await notificationService.sendPasswordResetEmail({
      user,
      resetToken,
      resetUrl,
    });
  }

  return {
    success: true,
    message: "Jika email terdaftar pada sistem, tautan pengaturan ulang kata sandi telah dikirim.",
  };
}
