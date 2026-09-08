/**
 * Kontrak/interface NotificationService.
 * Implementasi konkret ada di infrastructure/notifications/email-notification-service.js
 *
 * @typedef {Object} NotificationService
 * @property {function(Object): Promise<void>} notifyHostOfVisit - Kirim notifikasi ke host (dan CC jika perlu) saat tamu check-in
 * @property {function(Object): Promise<void>} sendInviteEmail - Kirim email undangan ke user baru
 */

/**
 * Dokumentasi parameter:
 *
 * notifyHostOfVisit(visit)
 *   visit harus sudah include data host (dengan role, isDepartmentHead, email).
 *   Routing notifikasi mengikuti matriks AGENTS.md Bagian 5:
 *   - OWNER + staf biasa → host saja (informational)
 *   - OWNER + dept head → host + semua ADMIN_HRD + semua ADMINISTRATOR (informational)
 *   - REGULAR + staf biasa → host saja (actionable: approve/reject link)
 *   - REGULAR + dept head → host + semua ADMIN_HRD + semua ADMINISTRATOR (actionable)
 *
 * sendInviteEmail({ user, inviteToken, inviteUrl })
 *   Kirim email berisi link aktivasi akun ke user yang baru diundang.
 */
