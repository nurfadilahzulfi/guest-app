import { prisma } from "@/infrastructure/prisma/client";

/**
 * Implementasi konkret VisitRepository menggunakan Prisma.
 * Mengikuti kontrak di domain/repositories/visit-repository.js
 */
export const prismaVisitRepository = {
  /**
   * Membuat visit baru.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return prisma.visit.create({
      data,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            position: true,
            isDepartmentHead: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Mencari visit berdasarkan visitToken (public-facing).
   * @param {string} visitToken
   * @returns {Promise<Object|null>}
   */
  async findByVisitToken(visitToken) {
    return prisma.visit.findUnique({
      where: { visitToken },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true,
            photoUrl: true,
          },
        },
      },
    });
  },

  /**
   * Mencari visit berdasarkan ID internal.
   * @param {string} id
   * @param {Object} [tx] - Prisma transaction client (opsional)
   * @returns {Promise<Object|null>}
   */
  async findById(id, tx) {
    const client = tx || prisma;
    return client.visit.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            position: true,
            isDepartmentHead: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Update status visit.
   * @param {string} id
   * @param {Object} data - { status, hostReply?, respondedAt? }
   * @param {Object} [tx] - Prisma transaction client (opsional)
   * @returns {Promise<Object>}
   */
  async updateStatus(id, data, tx) {
    const client = tx || prisma;
    return client.visit.update({
      where: { id },
      data,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });
  },

  /**
   * List semua visit dengan filter & pagination.
   * @param {Object} filters
   * @returns {Promise<{data: Object[], total: number}>}
   */
  async findAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      visitorType,
      hostId,
      department,
      dateFrom,
      dateTo,
    } = filters;

    const where = {};
    if (status) where.status = status;
    if (visitorType) where.visitorType = visitorType;
    if (hostId) where.hostId = hostId;
    if (department) where.host = { department };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visit.count({ where }),
    ]);

    return { data, total };
  },

  /**
   * List visit milik host tertentu.
   * @param {string} hostId
   * @param {Object} filters
   * @returns {Promise<{data: Object[], total: number}>}
   */
  async findByHostId(hostId, filters = {}) {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = filters;

    const where = { hostId };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visit.count({ where }),
    ]);

    return { data, total };
  },
};
