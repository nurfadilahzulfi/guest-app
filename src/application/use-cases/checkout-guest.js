import { normalizePhoneNumber } from "@/domain/value-objects/phone-number";
import { canCheckoutVisit } from "@/domain/entities/visit";

/**
 * Use case: Checkout tamu berdasarkan visitToken (dipanggil oleh tamu di browser).
 * @param {Object} params
 * @param {string} params.visitToken
 * @param {import('@/domain/repositories/visit-repository').VisitRepository} params.visitRepository
 * @param {string} [params.checkoutBy]
 * @returns {Promise<Object>}
 */
export async function checkoutGuestByToken({ visitToken, visitRepository, checkoutBy = "GUEST" }) {
  if (!visitToken) {
    throw new Error("Token kunjungan tidak valid");
  }

  const visit = await visitRepository.findByVisitToken(visitToken);
  if (!visit) {
    throw new Error("Data kunjungan tidak ditemukan");
  }

  if (visit.checkoutAt) {
    return visit; // Idempotent jika sudah dicheckout
  }

  if (!canCheckoutVisit(visit)) {
    throw new Error("Kunjungan belum disetujui atau sudah tidak aktif");
  }

  return visitRepository.checkout(visit.id, {
    checkoutAt: new Date(),
    checkoutBy,
  });
}

/**
 * Use case: Checkout tamu berdasarkan visitId (dipanggil oleh Administrator/Host di dashboard).
 * @param {Object} params
 * @param {string} params.visitId
 * @param {import('@/domain/repositories/visit-repository').VisitRepository} params.visitRepository
 * @param {string} [params.checkoutBy]
 * @returns {Promise<Object>}
 */
export async function checkoutGuestById({ visitId, visitRepository, checkoutBy = "ADMIN" }) {
  if (!visitId) {
    throw new Error("ID kunjungan tidak valid");
  }

  const visit = await visitRepository.findById(visitId);
  if (!visit) {
    throw new Error("Data kunjungan tidak ditemukan");
  }

  if (visit.checkoutAt) {
    return visit;
  }

  if (!canCheckoutVisit(visit)) {
    throw new Error("Kunjungan belum disetujui atau sudah tidak aktif");
  }

  return visitRepository.checkout(visit.id, {
    checkoutAt: new Date(),
    checkoutBy,
  });
}

/**
 * Use case: Mencari kunjungan aktif tamu berdasarkan nomor HP (untuk tamu yang tab-nya tertutup).
 * @param {Object} params
 * @param {string} params.phone
 * @param {import('@/domain/repositories/visit-repository').VisitRepository} params.visitRepository
 * @returns {Promise<Object|null>}
 */
export async function findActiveVisitByPhone({ phone, visitRepository }) {
  if (!phone) {
    throw new Error("Nomor HP wajib diisi");
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  return visitRepository.findActiveByPhone(normalizedPhone);
}
