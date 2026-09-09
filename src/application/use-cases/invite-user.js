import { validateUserInput } from "@/domain/entities/user";
import bcrypt from "bcryptjs";

/**
 * Generate password acak yang ramah dibaca dan aman.
 * Format: Tanimas@<4 angka> (contoh: Tanimas@8492)
 * @returns {string}
 */
function generateDefaultPassword() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Tanimas@${digits}`;
}

/**
 * Mengundang / membuat user baru ke sistem dan mengirim kredensial login via email.
 * Hanya ADMINISTRATOR yang boleh mengundang user baru (AGENTS.md Bagian 9 Rule #5).
 * @param {Object} params
 * @param {{name: string, email: string, role: string, department?: string, position?: string, isDepartmentHead?: boolean, password?: string}} params.input
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @param {import('@/application/services/token-service').TokenService} [params.tokenService]
 * @param {import('@/application/services/notification-service').NotificationService} params.notificationService
 * @param {function} [params.hashPassword]
 * @param {string} params.appUrl - Base URL aplikasi untuk link login & invite
 * @returns {Promise<Object>} user yang baru dibuat beserta password & link login
 */
export async function inviteUser({
  input,
  userRepository,
  tokenService,
  notificationService,
  hashPassword = (p) => bcrypt.hash(p, 12),
  appUrl = "http://localhost:3000",
}) {
  // 1. Validasi input
  const validation = validateUserInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  // 2. Cek apakah email sudah dipakai
  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) {
    throw new Error("Email sudah terdaftar dalam sistem");
  }

  // 3. Siapkan password akun
  const plainPassword = input.password?.trim() || generateDefaultPassword();
  const passwordHash = await hashPassword(plainPassword, 12);

  // 4. Buat user baru (aktif dengan passwordHash)
  const user = await userRepository.create({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash,
    role: input.role,
    department: input.department?.trim() || null,
    position: input.position?.trim() || null,
    isDepartmentHead: input.isDepartmentHead || false,
    isActive: true,
  });

  const loginUrl = `${appUrl}/login`;

  // 5. Buat invite token jika tokenService ada (opsional / backwards-compatible)
  let inviteTokenStr = null;
  let inviteUrl = null;
  let inviteTokenObj = null;

  if (tokenService) {
    try {
      inviteTokenObj = await tokenService.createInviteToken(user.id, 72);
      inviteTokenStr = inviteTokenObj?.token || null;
      if (inviteTokenStr) {
        inviteUrl = `${appUrl}/invite/${inviteTokenStr}`;
      }
    } catch (err) {
      console.warn("Gagal membuat invite token:", err.message);
    }
  }

  // 6. Kirim email: prioritaskan email kredensial akun & link login
  if (notificationService?.sendAccountCredentialsEmail) {
    try {
      await notificationService.sendAccountCredentialsEmail({
        user,
        password: plainPassword,
        loginUrl,
      });
    } catch (err) {
      console.warn("Gagal mengirim email kredensial akun:", err.message);
    }
  } else if (notificationService?.sendInviteEmail && inviteTokenObj) {
    await notificationService.sendInviteEmail({
      user,
      inviteToken: inviteTokenObj,
      inviteUrl,
    });
  }

  return {
    ...user,
    rawPassword: plainPassword,
    loginUrl,
    inviteToken: inviteTokenStr,
    inviteUrl,
  };
}
