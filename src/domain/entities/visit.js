/** @typedef {'PENDING' | 'APPROVED' | 'REJECTED'} VisitStatus */
/** @typedef {'REGULAR' | 'OWNER'} VisitorType */

const VALID_TRANSITIONS = {
  PENDING: ["APPROVED", "REJECTED"],
};

/**
 * Mengecek apakah transisi status valid.
 * @param {VisitStatus} currentStatus
 * @param {VisitStatus} newStatus
 * @returns {boolean}
 */
export function isValidStatusTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}

/**
 * Menentukan status awal berdasarkan jenis pengunjung.
 * OWNER langsung APPROVED, REGULAR mulai dari PENDING.
 * @param {VisitorType} visitorType
 * @returns {VisitStatus}
 */
export function determineInitialStatus(visitorType) {
  return visitorType === "OWNER" ? "APPROVED" : "PENDING";
}

/**
 * Menentukan jenis pengunjung berdasarkan apakah nomor HP terdaftar sebagai owner aktif.
 * @param {boolean} isOwner - apakah nomor HP ditemukan di daftar owner aktif
 * @returns {VisitorType}
 */
export function determineVisitorType(isOwner) {
  return isOwner ? "OWNER" : "REGULAR";
}

/**
 * Validasi field wajib untuk membuat Visit baru.
 * @param {{guestName: string, guestPhone: string, purpose: string, hostId: string}} input
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateVisitInput(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Input tidak valid"] };
  }

  const guestName = typeof input.guestName === "string" ? input.guestName.trim() : "";
  if (!guestName) {
    errors.push("Nama tamu wajib diisi");
  }

  const guestPhone = typeof input.guestPhone === "string" ? input.guestPhone.trim() : "";
  if (!guestPhone) {
    errors.push("Nomor HP tamu wajib diisi");
  }

  const purpose = typeof input.purpose === "string" ? input.purpose.trim() : "";
  if (!purpose) {
    errors.push("Tujuan kunjungan wajib diisi");
  }

  const hostId = typeof input.hostId === "string" ? input.hostId.trim() : "";
  if (!hostId) {
    errors.push("Host tujuan wajib dipilih");
  }

  if (input.requirePhoto && (!input.guestPhoto || typeof input.guestPhoto !== "string" || input.guestPhoto.trim().length === 0)) {
    errors.push("Foto wajah tamu wajib diambil");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validasi apakah kunjungan memenuhi syarat untuk checkout.
 * @param {Object} visit
 * @returns {boolean}
 */
export function canCheckoutVisit(visit) {
  if (!visit) return false;
  return visit.status === "APPROVED" && !visit.checkoutAt;
}

/**
 * Cek apakah kunjungan masih aktif di dalam gedung.
 * @param {Object} visit
 * @returns {boolean}
 */
export function isVisitActive(visit) {
  return canCheckoutVisit(visit);
}

/**
 * Menghitung selisih durasi antara check-in dan check-out.
 * @param {string|Date} createdAt
 * @param {string|Date} checkoutAt
 * @returns {string} Durasi dalam format teks (e.g. "1 Jam 15 Menit")
 */
export function calculateVisitDuration(createdAt, checkoutAt) {
  if (!createdAt || !checkoutAt) return "—";
  const start = new Date(createdAt);
  const end = new Date(checkoutAt);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return "< 1 Menit";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours} Jam ${minutes} Menit`;
  if (hours > 0) return `${hours} Jam`;
  return `${minutes} Menit`;
}
