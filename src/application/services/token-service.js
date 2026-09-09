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
