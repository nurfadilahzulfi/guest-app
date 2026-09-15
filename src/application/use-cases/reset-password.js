/**
 * Memvalidasi token reset kata sandi dan mengambil info pengguna (GET).
 * Mengikuti AGENTS.md Bagian 9 Aturan #3: GET tidak boleh mengubah data apapun.
 *
 * @param {Object} params
 * @param {string} params.token - UUID token reset
 * @param {import('@/application/services/token-service').TokenService} params.tokenService - Layanan token kriptografi
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository - Repositori user
 * @returns {Promise<Object|null>} Info pengguna atau null jika token tidak valid/kadaluwarsa
 */
export async function getResetPasswordInfo({ token, tokenService, userRepository }) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const tokenRecord = await tokenService.validateInviteToken(token);
  if (!tokenRecord) {
    return null;
  }

  const user = await userRepository.findById(tokenRecord.userId);
  if (!user || !user.isActive || user.role !== "ADMINISTRATOR") {
    return null;
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  };
}

/**
 * Mengeksekusi pengaturan ulang kata sandi dalam satu transaksi atomik (POST).
 * Validasi token, hash sandi baru, simpan ke DB, dan tandai token sebagai terpakai.
 *
 * @param {Object} params
 * @param {string} params.token - UUID token reset
 * @param {string} params.newPassword - Kata sandi baru (minimal 8 karakter)
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository - Repositori user
 * @param {import('@/application/services/token-service').TokenService} params.tokenService - Layanan token kriptografi
 * @param {function(string, number): Promise<string>} params.hashPassword - Fungsi hash bcrypt
 * @param {function(function): Promise<any>} params.transaction - Prisma transaction runner
 * @returns {Promise<Object>} Data user yang berhasil di-reset
 */
export async function resetPassword({
  token,
  newPassword,
  userRepository,
  tokenService,
  hashPassword,
  transaction,
}) {
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    throw new Error("Kata sandi minimal 8 karakter");
  }

  return await transaction(async (tx) => {
    const tokenRecord = await tokenService.validateInviteToken(token, tx);
    if (!tokenRecord) {
      throw new Error("Tautan reset kata sandi tidak valid atau sudah kedaluwarsa");
    }

    const user = await userRepository.findById(tokenRecord.userId);
    if (!user || !user.isActive || user.role !== "ADMINISTRATOR") {
      throw new Error("Pengaturan ulang kata sandi mandiri hanya diperuntukkan bagi Administrator Sistem");
    }

    const passwordHash = await hashPassword(newPassword, 12);

    const updatedUser = await userRepository.update(
      user.id,
      { passwordHash },
      tx
    );

    // Tandai token reset ini sebagai sudah digunakan
    await tokenService.markInviteTokenAsUsed(tokenRecord.id, tx);

    return updatedUser;
  });
}
