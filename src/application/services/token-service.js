/**
 * Kontrak/interface TokenService.
 * Implementasi konkret ada di infrastructure/tokens/crypto-token-service.js
 *
 * @typedef {Object} TokenService
 * @property {function(string, number?): Promise<Object>} createHostActionToken - Buat token aksi untuk host (approve/reject)
 * @property {function(string): Promise<Object|null>} validateHostActionToken - Validasi token aksi host
 * @property {function(string, number?): Promise<Object>} createInviteToken - Buat token undangan untuk user baru
 * @property {function(string): Promise<Object|null>} validateInviteToken - Validasi token undangan
 */

/**
 * Dokumentasi parameter:
 *
 * createHostActionToken(visitId, expiresInHours = 24)
 *   → Promise<HostActionToken> (termasuk token UUID untuk magic link)
 *
 * validateHostActionToken(token)
 *   → Promise<HostActionToken|null>
 *   Mengembalikan null jika token tidak ditemukan, sudah dipakai (usedAt !== null),
 *   atau sudah kedaluwarsa (expiresAt < now).
 *
 * createInviteToken(userId, expiresInHours = 72)
 *   → Promise<InviteToken>
 *
 * validateInviteToken(token)
 *   → Promise<InviteToken|null>
 *   Sama seperti validateHostActionToken — null jika invalid.
 */
