/**
 * Kontrak/interface NotificationService.
 * Implementasi konkret ada di infrastructure/notifications/email-notification-service.js
 *
 * @typedef {Object} NotificationService
 * @property {function(Object): Promise<void>} notifyHostOfVisit - Kirim notifikasi ke host (dan CC jika perlu) saat tamu check-in
 * @property {function(Object): Promise<void>} sendInviteEmail - Kirim email undangan ke user baru
 */
