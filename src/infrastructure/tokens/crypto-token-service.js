import { prisma } from "@/infrastructure/prisma/client";

/**
 * Implementasi konkret TokenService menggunakan Prisma.
 * Semua token sekali pakai (AGENTS.md Bagian 9 Rule #2).
 */
export const cryptoTokenService = {
  /**
   * Buat HostActionToken untuk magic link approve/reject.
   * @param {string} visitId
   * @param {number} [expiresInHours=24] - Durasi berlaku token dalam jam
   * @returns {Promise<Object>}
   */
  async createHostActionToken(visitId, expiresInHours = 24) {
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    return prisma.hostActionToken.create({
      data: {
        visitId,
        expiresAt,
      },
    });
  },

  /**
   * Validasi HostActionToken — cek belum dipakai dan belum kedaluwarsa.
   * @param {string} token
   * @param {Object} [tx] - Prisma transaction client (opsional)
   * @returns {Promise<Object|null>} null jika token invalid
   */
  async validateHostActionToken(token, tx) {
    const client = tx || prisma;
    const actionToken = await client.hostActionToken.findUnique({
      where: { token },
      include: { visit: true },
    });

    if (!actionToken) return null;
    if (actionToken.usedAt !== null) return null;
    if (actionToken.expiresAt < new Date()) return null;

    return actionToken;
  },

  /**
   * Tandai HostActionToken sebagai sudah dipakai.
   * @param {string} id
   * @param {Object} [tx] - Prisma transaction client (opsional)
   * @returns {Promise<Object>}
   */
  async markTokenAsUsed(id, tx) {
    const client = tx || prisma;
    return client.hostActionToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  /**
   * Buat InviteToken untuk undangan user baru.
   * @param {string} userId
   * @param {number} [expiresInHours=72] - Durasi berlaku token dalam jam
   * @returns {Promise<Object>}
   */
  async createInviteToken(userId, expiresInHours = 72) {
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    return prisma.inviteToken.create({
      data: {
        userId,
        expiresAt,
      },
    });
  },

  /**
   * Validasi InviteToken — cek belum dipakai dan belum kedaluwarsa.
   * @param {string} token
   * @param {Object} [tx] - Prisma transaction client (opsional)
   * @returns {Promise<Object|null>} null jika token invalid
   */
  async validateInviteToken(token, tx) {
    const client = tx || prisma;
    const inviteToken = await client.inviteToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!inviteToken) return null;
    if (inviteToken.usedAt !== null) return null;
    if (inviteToken.expiresAt < new Date()) return null;

    return inviteToken;
  },

  /**
   * Tandai InviteToken sebagai sudah dipakai.
   * @param {string} id
   * @param {Object} [tx] - Prisma transaction client (opsional)
   * @returns {Promise<Object>}
   */
  async markInviteTokenAsUsed(id, tx) {
    const client = tx || prisma;
    return client.inviteToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },
};
