import { validateOwnerInput } from "@/domain/entities/owner";

/**
 * Menambahkan owner baru ke daftar.
 * Nomor HP WAJIB dinormalisasi (AGENTS.md Bagian 9 Rule #10).
 * @param {Object} params
 * @param {{name: string, phoneNumber: string}} params.input
 * @param {import('@/domain/repositories/owner-repository').OwnerRepository} params.ownerRepository
 * @returns {Promise<Object>} owner yang baru dibuat
 */
export async function createOwner({ input, ownerRepository }) {
  const validation = validateOwnerInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  // Cek apakah nomor HP sudah terdaftar
  const existing = await ownerRepository.findActiveByPhone(validation.normalized.phoneNumber);
  if (existing) {
    throw new Error("Nomor HP sudah terdaftar sebagai owner");
  }

  return ownerRepository.create(validation.normalized);
}

/**
 * Menonaktifkan owner (soft delete).
 * Perubahan TIDAK berlaku surut — Visit yang sudah dibuat tidak berubah (AGENTS.md Bagian 9 Rule #9).
 * @param {Object} params
 * @param {string} params.ownerId
 * @param {import('@/domain/repositories/owner-repository').OwnerRepository} params.ownerRepository
 * @returns {Promise<Object>} owner yang sudah dinonaktifkan
 */
export async function deactivateOwner({ ownerId, ownerRepository }) {
  const owner = await ownerRepository.findById(ownerId);
  if (!owner) {
    throw new Error("Owner tidak ditemukan");
  }

  return ownerRepository.update(ownerId, { isActive: false });
}
