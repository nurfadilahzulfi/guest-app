import { isValidStatusTransition } from "@/domain/entities/visit";

/**
 * Memproses respons host terhadap kunjungan tamu (approve/reject).
 * Token divalidasi dan di-consume dalam satu transaksi (AGENTS.md Bagian 9 Rule #2).
 * @param {Object} params
 * @param {string} params.token - HostActionToken UUID dari magic link
 * @param {'APPROVED' | 'REJECTED'} params.action - Keputusan host
 * @param {string} [params.hostReply] - Catatan/alasan opsional dari host
 * @param {import('@/domain/repositories/visit-repository').VisitRepository} params.visitRepository
 * @param {import('@/application/services/token-service').TokenService} params.tokenService
 * @param {function} params.transaction - Fungsi untuk menjalankan operasi dalam satu transaksi database
 * @returns {Promise<Object>} visit yang sudah diupdate
 */
export async function respondToVisit({
  token,
  action,
  hostReply,
  visitRepository,
  tokenService,
  transaction,
}) {
  if (!["APPROVED", "REJECTED"].includes(action)) {
    throw new Error("Action harus APPROVED atau REJECTED");
  }

  // Validasi dan consume token dalam satu transaksi (AGENTS.md Bagian 9 Rule #2)
  const result = await transaction(async (tx) => {
    // 1. Validasi token — cek usedAt === null && expiresAt > now
    const actionToken = await tokenService.validateHostActionToken(token, tx);
    if (!actionToken) {
      throw new Error("Token tidak valid, sudah digunakan, atau sudah kedaluwarsa");
    }

    // 2. Ambil visit terkait
    const visit = await visitRepository.findById(actionToken.visitId, tx);
    if (!visit) {
      throw new Error("Kunjungan tidak ditemukan");
    }

    // 3. Validasi transisi status
    if (!isValidStatusTransition(visit.status, action)) {
      throw new Error(`Tidak bisa mengubah status dari ${visit.status} ke ${action}`);
    }

    // 4. Update status visit
    const updatedVisit = await visitRepository.updateStatus(
      visit.id,
      {
        status: action,
        hostReply: hostReply?.trim() || null,
        respondedAt: new Date(),
      },
      tx
    );

    // 5. Tandai token sebagai sudah dipakai
    await tokenService.markTokenAsUsed(actionToken.id, tx);

    return updatedVisit;
  });

  return result;
}

/**
 * Mengambil data kunjungan berdasarkan action token (untuk halaman respond — GET).
 * GET tidak boleh mengubah data apa pun (AGENTS.md Bagian 9 Rule #3).
 * @param {Object} params
 * @param {string} params.token
 * @param {import('@/application/services/token-service').TokenService} params.tokenService
 * @param {import('@/domain/repositories/visit-repository').VisitRepository} params.visitRepository
 * @returns {Promise<Object|null>} visit data atau null jika token invalid
 */
export async function getVisitByActionToken({ token, tokenService, visitRepository }) {
  const actionToken = await tokenService.validateHostActionToken(token);
  if (!actionToken) {
    return null;
  }

  const visit = await visitRepository.findById(actionToken.visitId);
  return visit;
}
