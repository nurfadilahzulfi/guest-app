import { prisma } from "@/infrastructure/prisma/client";

/**
 * Implementasi konkret OwnerRepository menggunakan Prisma.
 * Mengikuti kontrak di domain/repositories/owner-repository.js
 */
export const prismaOwnerRepository = {
  /**
   * Membuat owner baru.
   * phoneNumber WAJIB sudah dalam format ternormalisasi.
   * @param {Object} data - { name, phoneNumber }
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.owner.create({ data });
  },

  /**
   * Mencari owner berdasarkan ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.owner.findUnique({ where: { id } });
  },

  /**
   * Mencari owner aktif berdasarkan nomor HP ternormalisasi.
   * Digunakan oleh checkInGuest untuk deteksi owner.
   * @param {string} normalizedPhone - Nomor HP dalam format E.164 (+62xxx)
   * @returns {Promise<Object|null>}
   */
  async findActiveByPhone(normalizedPhone) {
    return prisma.owner.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        isActive: true,
      },
    });
  },

  /**
   * Update data owner.
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    return prisma.owner.update({ where: { id }, data });
  },

  /**
   * List semua owner.
   * @param {Object} filters
   * @returns {Promise<Object[]>}
   */
  async findAll(filters = {}) {
    const where = {};
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.owner.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },
};
