import { normalizePhoneNumber } from "@/domain/value-objects/phone-number";
import { validateVisitInput, determineVisitorType, determineInitialStatus } from "@/domain/entities/visit";

/**
 * Memproses check-in tamu: validasi input, normalisasi nomor HP, deteksi owner, buat visit, kirim notifikasi.
 * @param {Object} params
 * @param {{guestName: string, guestPhone: string, purpose: string, guestEmail?: string, hostId: string}} params.input
 * @param {import('@/domain/repositories/visit-repository').VisitRepository} params.visitRepository
 * @param {import('@/domain/repositories/owner-repository').OwnerRepository} params.ownerRepository
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @param {import('@/application/services/notification-service').NotificationService} params.notificationService
 * @param {import('@/application/services/token-service').TokenService} params.tokenService
 * @param {Object} [params.storageService] - Service penyimpanan gambar opsional
 * @returns {Promise<Object>} visit yang baru dibuat
 */
export async function checkInGuest({
  input,
  visitRepository,
  ownerRepository,
  userRepository,
  notificationService,
  tokenService,
  storageService,
}) {
  // 1. Validasi input dasar
  const validation = validateVisitInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  // 2. Normalisasi nomor HP (WAJIB — AGENTS.md Bagian 8)
  const guestPhone = normalizePhoneNumber(input.guestPhone);

  // 3. Cek apakah host valid dan aktif
  const host = await userRepository.findById(input.hostId);
  if (!host || !host.isActive || host.role !== "HOST") {
    throw new Error("Host tidak ditemukan atau tidak aktif");
  }

  // 4. Deteksi owner — visitorType WAJIB dihitung di server (AGENTS.md Bagian 9 Rule #1)
  const owner = await ownerRepository.findActiveByPhone(guestPhone);
  const visitorType = determineVisitorType(!!owner);
  const status = determineInitialStatus(visitorType);

  // 5. Simpan foto wajah tamu jika tersedia (Base64 atau URL langsung)
  let guestPhotoUrl = input.guestPhotoUrl || null;
  if (input.guestPhoto && storageService?.saveVisitorPhoto) {
    guestPhotoUrl = await storageService.saveVisitorPhoto(input.guestPhoto, "visitor");
  }

  // 6. Buat visit
  const visit = await visitRepository.create({
    guestName: input.guestName.trim(),
    guestPhone,
    guestEmail: input.guestEmail?.trim() || null,
    guestPhotoUrl,
    purpose: input.purpose.trim(),
    visitorType,
    gender: input.gender?.trim() || null,
    organization: input.organization?.trim() || null,
    duration: input.duration?.trim() || null,
    hostId: input.hostId,
    status,
  });

  // 7. Buat action token untuk host (hanya jika REGULAR/PENDING — butuh approve/reject)
  let actionToken = null;
  if (visitorType === "REGULAR") {
    actionToken = await tokenService.createHostActionToken(visit.id);
  }

  // 8. Kirim notifikasi ke host (dan CC sesuai matriks AGENTS.md Bagian 5)
  await notificationService.notifyHostOfVisit({
    visit: { ...visit, host },
    actionToken,
  });

  return visit;
}
