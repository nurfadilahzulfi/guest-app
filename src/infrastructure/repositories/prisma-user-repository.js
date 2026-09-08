import { prisma } from "@/infrastructure/prisma/client";

/**
 * Implementasi konkret UserRepository menggunakan Prisma.
 * Mengikuti kontrak di domain/repositories/user-repository.js
 */
export const prismaUserRepository = {
  /**
   * Membuat user baru (tanpa password, untuk invite flow).
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.user.create({ data });
  },

  /**
   * Mencari user berdasarkan ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  /**
   * Mencari user berdasarkan email.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  /**
   * Update data user.
   * @param {string} id
   * @param {Object} data
   * @param {Object} [tx] - Prisma transaction client (opsional)
   * @returns {Promise<Object>}
   */
  async update(id, data, tx) {
    const client = tx || prisma;
    return client.user.update({ where: { id }, data });
  },

  /**
   * List semua user dengan filter.
   * @param {Object} filters
   * @returns {Promise<Object[]>}
   */
  async findAll(filters = {}) {
    const where = {};
    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        isDepartmentHead: true,
        isActive: true,
        createdAt: true,
        // passwordHash TIDAK pernah di-return
      },
      orderBy: { name: "asc" },
    });
  },

  /**
   * List semua host aktif (untuk form check-in tamu).
   * @returns {Promise<Object[]>}
   */
  async findActiveHosts() {
    return prisma.user.findMany({
      where: { role: "HOST", isActive: true },
      select: {
        id: true,
        name: true,
        department: true,
        position: true,
        photoUrl: true,
      },
      orderBy: { name: "asc" },
    });
  },

  /**
   * List semua user berdasarkan role.
   * @param {string} role
   * @returns {Promise<Object[]>}
   */
  async findByRole(role) {
    return prisma.user.findMany({
      where: { role, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isDepartmentHead: true,
      },
    });
  },

  /**
   * List semua ADMIN_HRD aktif (untuk CC notifikasi).
   * @returns {Promise<Object[]>}
   */
  async findAllAdminHrd() {
    return prisma.user.findMany({
      where: { role: "ADMIN_HRD", isActive: true },
      select: { id: true, name: true, email: true },
    });
  },

  /**
   * List semua ADMINISTRATOR aktif (untuk CC notifikasi).
   * @returns {Promise<Object[]>}
   */
  async findAllAdministrators() {
    return prisma.user.findMany({
      where: { role: "ADMINISTRATOR", isActive: true },
      select: { id: true, name: true, email: true },
    });
  },
};
