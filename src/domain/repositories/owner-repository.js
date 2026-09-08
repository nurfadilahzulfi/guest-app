/**
 * Kontrak/interface OwnerRepository.
 * Implementasi konkret ada di infrastructure/repositories/prisma-owner-repository.js
 *
 * @typedef {Object} OwnerRepository
 * @property {function(Object): Promise<Object>} create - Membuat owner baru
 * @property {function(string): Promise<Object|null>} findById - Mencari owner berdasarkan ID
 * @property {function(string): Promise<Object|null>} findActiveByPhone - Mencari owner aktif berdasarkan nomor HP ternormalisasi
 * @property {function(string, Object): Promise<Object>} update - Update data owner
 * @property {function(Object): Promise<Object[]>} findAll - List semua owner
 */

/**
 * Dokumentasi parameter untuk setiap method:
 *
 * create({ name, phoneNumber })
 *   → Promise<Owner> (phoneNumber WAJIB sudah ternormalisasi sebelum sampai sini)
 *
 * findActiveByPhone(normalizedPhone)
 *   → Promise<Owner|null> (isActive: true, phoneNumber: normalizedPhone)
 *   Digunakan oleh use case checkInGuest untuk mendeteksi apakah tamu adalah owner.
 *
 * update(ownerId, { name?, phoneNumber?, isActive? })
 *   → Promise<Owner>
 *
 * findAll({ isActive? })
 *   → Promise<Owner[]>
 */
