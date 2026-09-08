/**
 * Kontrak/interface UserRepository.
 * Implementasi konkret ada di infrastructure/repositories/prisma-user-repository.js
 *
 * @typedef {Object} UserRepository
 * @property {function(Object): Promise<Object>} create - Membuat user baru (tanpa password, untuk invite flow)
 * @property {function(string): Promise<Object|null>} findById - Mencari user berdasarkan ID
 * @property {function(string): Promise<Object|null>} findByEmail - Mencari user berdasarkan email
 * @property {function(string, Object): Promise<Object>} update - Update data user
 * @property {function(Object): Promise<Object[]>} findAll - List semua user dengan filter
 * @property {function(): Promise<Object[]>} findActiveHosts - List semua host aktif (untuk form check-in)
 * @property {function(string): Promise<Object[]>} findByRole - List semua user berdasarkan role
 * @property {function(): Promise<Object[]>} findAllAdminHrd - List semua ADMIN_HRD aktif
 * @property {function(): Promise<Object[]>} findAllAdministrators - List semua ADMINISTRATOR aktif
 */

/**
 * Dokumentasi parameter untuk setiap method:
 *
 * create({ name, email, role, department?, position?, photoUrl?, isDepartmentHead? })
 *   → Promise<User> (passwordHash null, akan diisi saat aktivasi invite)
 *
 * findByEmail(email)
 *   → Promise<User|null>
 *
 * update(userId, { name?, department?, position?, photoUrl?, isDepartmentHead?, isActive? })
 *   → Promise<User>
 *
 * findActiveHosts()
 *   → Promise<User[]> (isActive: true, role: HOST)
 *
 * findAllAdminHrd()
 *   → Promise<User[]> (isActive: true, role: ADMIN_HRD) — untuk CC notifikasi
 *
 * findAllAdministrators()
 *   → Promise<User[]> (isActive: true, role: ADMINISTRATOR) — untuk CC notifikasi
 */
