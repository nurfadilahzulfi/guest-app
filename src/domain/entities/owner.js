import { normalizePhoneNumber } from "@/domain/value-objects/phone-number";

/**
 * Validasi dan normalisasi input untuk membuat/mengedit Owner.
 * Nomor HP WAJIB dinormalisasi sebelum disimpan (lihat AGENTS.md Bagian 8).
 * @param {{name: string, phoneNumber: string}} input
 * @returns {{valid: boolean, errors: string[], normalized?: {name: string, phoneNumber: string}}}
 */
export function validateOwnerInput(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Input tidak valid"] };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    errors.push("Nama owner wajib diisi");
  }

  const phoneNumber = typeof input.phoneNumber === "string" ? input.phoneNumber.trim() : "";
  let normalizedPhone = null;

  if (!phoneNumber) {
    errors.push("Nomor HP owner wajib diisi");
  } else {
    try {
      normalizedPhone = normalizePhoneNumber(phoneNumber);
    } catch (err) {
      errors.push(err.message);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    normalized: {
      name,
      phoneNumber: normalizedPhone,
    },
  };
}
