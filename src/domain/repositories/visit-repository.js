/**
 * Kontrak/interface VisitRepository.
 * Implementasi konkret ada di infrastructure/repositories/prisma-visit-repository.js
 *
 * @typedef {Object} VisitRepository
 * @property {function(Object): Promise<Object>} create - Membuat visit baru
 * @property {function(string): Promise<Object|null>} findByVisitToken - Mencari visit berdasarkan visitToken (public-facing)
 * @property {function(string): Promise<Object|null>} findById - Mencari visit berdasarkan ID internal
 * @property {function(string, Object): Promise<Object>} updateStatus - Update status visit (APPROVED/REJECTED)
 * @property {function(Object): Promise<{data: Object[], total: number}>} findAll - List semua visit dengan filter & pagination
 * @property {function(string, Object): Promise<{data: Object[], total: number}>} findByHostId - List visit milik host tertentu
 */

/**
 * Dokumentasi parameter untuk setiap method:
 *
 * create({ guestName, guestPhone, guestEmail?, purpose, visitorType, hostId, status })
 *   → Promise<Visit> (termasuk visitToken yang auto-generated)
 *
 * findByVisitToken(visitToken)
 *   → Promise<Visit|null> (include host data untuk ditampilkan ke tamu)
 *
 * updateStatus(visitId, { status, hostReply?, respondedAt })
 *   → Promise<Visit>
 *
 * findAll({ page?, limit?, status?, visitorType?, hostId?, department?, dateFrom?, dateTo? })
 *   → Promise<{ data: Visit[], total: number }>
 *
 * findByHostId(hostId, { page?, limit?, status?, dateFrom?, dateTo? })
 *   → Promise<{ data: Visit[], total: number }>
 */
