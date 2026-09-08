/**
 * Menormalisasi nomor HP Indonesia ke format E.164 (+62xxxxxxxxxx).
 * WAJIB dipanggil di titik input mana pun sebelum nomor HP disimpan atau dicocokkan —
 * baik saat Administrator menambah nomor Owner, maupun saat tamu check-in.
 * @param {string} rawPhone
 * @returns {string} nomor HP ternormalisasi
 * @throws {Error} jika format tidak dikenali/tidak valid
 */
export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    throw new Error("Nomor HP wajib diisi");
  }

  const digitsOnly = rawPhone.replace(/[^\d+]/g, "");
  let normalized = digitsOnly;

  if (normalized.startsWith("0")) {
    normalized = "+62" + normalized.slice(1);
  } else if (normalized.startsWith("62")) {
    normalized = "+" + normalized;
  } else if (!normalized.startsWith("+62")) {
    throw new Error("Format nomor HP tidak dikenali");
  }

  if (!/^\+628\d{8,11}$/.test(normalized)) {
    throw new Error("Nomor HP tidak valid");
  }

  return normalized;
}
