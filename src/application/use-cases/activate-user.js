/**
 * Mengaktivasi akun user — set password setelah menerima invite.
 * Token divalidasi dan di-consume dalam satu transaksi (AGENTS.md Bagian 9 Rule #2).
 * Password WAJIB di-hash sebelum disimpan (AGENTS.md Bagian 9 Rule #11).
 * @param {Object} params
 * @param {string} params.token - InviteToken UUID dari email
 * @param {string} params.password - Password plain text yang akan di-hash
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @param {import('@/application/services/token-service').TokenService} params.tokenService
 * @param {function} params.hashPassword - Fungsi untuk hash password (bcryptjs.hash)
 * @param {function} params.transaction - Fungsi untuk menjalankan operasi dalam satu transaksi
 * @returns {Promise<Object>} user yang sudah diaktivasi
 */
export async function activateUser({
  token,
  password,
  userRepository,
  tokenService,
  hashPassword,
  transaction,
}) {
  if (!password || password.length < 8) {
    throw new Error("Password minimal 8 karakter");
  }

  const result = await transaction(async (tx) => {
    // 1. Validasi token — cek usedAt === null && expiresAt > now
    const inviteToken = await tokenService.validateInviteToken(token, tx);
    if (!inviteToken) {
      throw new Error("Token undangan tidak valid, sudah digunakan, atau sudah kedaluwarsa");
    }

    // 2. Hash password (WAJIB — tidak pernah simpan plain text)
    const passwordHash = await hashPassword(password, 12);

    // 3. Update user — set passwordHash
    const user = await userRepository.update(
      inviteToken.userId,
      { passwordHash },
      tx
    );

    // 4. Tandai token sebagai sudah dipakai
    await tokenService.markInviteTokenAsUsed(inviteToken.id, tx);

    return user;
  });

  return result;
}

/**
 * Mengambil data invite token untuk halaman aktivasi (GET).
 * GET tidak boleh mengubah data apa pun (AGENTS.md Bagian 9 Rule #3).
 * @param {Object} params
 * @param {string} params.token
 * @param {import('@/application/services/token-service').TokenService} params.tokenService
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @returns {Promise<Object|null>} data user atau null jika token invalid
 */
export async function getInviteInfo({ token, tokenService, userRepository }) {
  const inviteToken = await tokenService.validateInviteToken(token);
  if (!inviteToken) {
    return null;
  }

  const user = await userRepository.findById(inviteToken.userId);
  if (!user) {
    return null;
  }

  return {
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
  };
}
