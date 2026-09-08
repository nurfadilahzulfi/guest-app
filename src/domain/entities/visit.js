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
