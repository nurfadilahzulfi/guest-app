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

    const users = await prisma.user.findMany({
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
        passwordHash: true,
        inviteTokens: {
          where: { usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { token: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      position: u.position,
      isDepartmentHead: u.isDepartmentHead,
      isActive: u.isActive,
      createdAt: u.createdAt,
      hasPassword: !!u.passwordHash,
      activeInviteToken: u.inviteTokens?.[0]?.token || null,
    }));
  },

  /**
   * List semua user aktif yang bisa menjadi host kunjungan tamu.
   * Mencakup semua role (HOST, ADMIN_HRD, ADMINISTRATOR) selama user aktif
   * dan memiliki departemen & jabatan yang terisi — karena semua staff yang
   * punya jabatan formal bisa dikunjungi tamu.
   * @returns {Promise<Object[]>}
   */
  async findActiveHosts() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        department: { not: null },
        position: { not: null },
        NOT: [
          { department: "" },
          { position: "" },
        ],
      },
      select: {
        id: true,
        name: true,
        department: true,
        position: true,
        photoUrl: true,
        isDepartmentHead: true,
      },
      orderBy: [{ department: "asc" }, { name: "asc" }],
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

  /**
   * Menghapus user secara permanen dari database jika tidak memiliki riwayat kunjungan.
   * AGENTS.md Bagian 9 Rule #8: Jangan pernah hard delete data yang sudah berelasi dengan Visit.
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async delete(userId) {
    const visitCount = await prisma.visit.count({
      where: { hostId: userId },
    });

    if (visitCount > 0) {
      throw new Error(
        "Karyawan/Pengguna ini sudah memiliki riwayat kunjungan tamu dan tidak dapat dihapus permanen demi menjaga integritas arsip buku tamu. Silakan gunakan opsi nonaktifkan akun."
      );
    }

    // Bersihkan relasi pendukung terlebih dahulu (token, session, account)
    await prisma.inviteToken.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });

    await prisma.user.delete({
      where: { id: userId },
    });

    return true;
  },
};
