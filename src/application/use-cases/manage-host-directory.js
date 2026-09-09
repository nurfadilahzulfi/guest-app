import { validateUserInput } from "@/domain/entities/user";
import bcrypt from "bcryptjs";

/**
 * Generate password acak yang ramah dibaca dan aman.
 * Format: Tanimas@<4 angka> (contoh: Tanimas@8492)
 * @returns {string}
 */
export function generateDefaultPassword() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Tanimas@${digits}`;
}

/**
 * Membuat host baru dalam direktori beserta akun login dan kirim kredensial ke email.
 * Hanya ADMINISTRATOR yang boleh mengelola direktori host (AGENTS.md Bagian 4).
 * @param {Object} params
 * @param {{name: string, email: string, department: string, position: string, photoUrl?: string, isDepartmentHead?: boolean, password?: string}} params.input
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @param {import('@/application/services/token-service').TokenService} [params.tokenService]
 * @param {import('@/application/services/notification-service').NotificationService} [params.notificationService]
 * @param {function} [params.hashPassword]
 * @param {string} [params.appUrl]
 * @returns {Promise<Object>} host yang baru dibuat beserta kredensial login
 */
export async function createHost({
  input,
  userRepository,
  tokenService,
  notificationService,
  hashPassword = (p) => bcrypt.hash(p, 12),
  appUrl = "http://localhost:3000",
}) {
  const fullInput = { ...input, role: "HOST" };
  const validation = validateUserInput(fullInput);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) {
    throw new Error("Email sudah terdaftar dalam sistem");
  }

  // Tentukan password: dari input admin atau generate default aman
  const plainPassword = input.password?.trim() || generateDefaultPassword();
  const passwordHash = await hashPassword(plainPassword, 12);

  const user = await userRepository.create({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash,
    role: "HOST",
    department: input.department.trim(),
    position: input.position.trim(),
    photoUrl: input.photoUrl || null,
    isDepartmentHead: input.isDepartmentHead || false,
    isActive: true,
  });

  const loginUrl = `${appUrl}/login`;

  // Kirim email kredensial akun dan link login ke host baru
  if (notificationService?.sendAccountCredentialsEmail) {
    try {
      await notificationService.sendAccountCredentialsEmail({
        user,
        password: plainPassword,
        loginUrl,
      });
    } catch (err) {
      console.warn("Gagal mengirim email kredensial ke host:", err.message);
    }
  }

  let inviteTokenStr = null;
  let inviteUrl = null;

  if (tokenService) {
    try {
      const inviteToken = await tokenService.createInviteToken(user.id, 72);
      inviteTokenStr = inviteToken.token;
      inviteUrl = `${appUrl}/invite/${inviteToken.token}`;

      if (notificationService?.sendInviteEmail && !notificationService?.sendAccountCredentialsEmail) {
        await notificationService.sendInviteEmail({
          user,
          inviteToken,
          inviteUrl,
        });
      }
    } catch (err) {
      console.warn("Gagal membuat invite token sekunder:", err.message);
    }
  }

  return {
    ...user,
    rawPassword: plainPassword,
    loginUrl,
    inviteToken: inviteTokenStr,
    inviteUrl,
  };
}

/**
 * Mengupdate data host dalam direktori.
 * @param {Object} params
 * @param {string} params.hostId
 * @param {{name?: string, department?: string, position?: string, photoUrl?: string, isDepartmentHead?: boolean}} params.input
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @returns {Promise<Object>} host yang sudah diupdate
 */
export async function updateHost({ hostId, input, userRepository }) {
  const host = await userRepository.findById(hostId);
  if (!host || host.role !== "HOST") {
    throw new Error("Host tidak ditemukan");
  }

  const updateData = {};
  if (input.name) updateData.name = input.name.trim();
  if (input.department) updateData.department = input.department.trim();
  if (input.position) updateData.position = input.position.trim();
  if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;
  if (input.isDepartmentHead !== undefined) updateData.isDepartmentHead = input.isDepartmentHead;

  return userRepository.update(hostId, updateData);
}

/**
 * Menonaktifkan host (soft delete — AGENTS.md Bagian 9 Rule #8).
 * Jangan pernah hard delete data yang sudah berelasi dengan Visit.
 * @param {Object} params
 * @param {string} params.hostId
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @returns {Promise<Object>} host yang dinonaktifkan
 */
export async function deactivateHost({ hostId, userRepository }) {
  const host = await userRepository.findById(hostId);
  if (!host || host.role !== "HOST") {
    throw new Error("Host tidak ditemukan");
  }

  return userRepository.update(hostId, { isActive: false });
}
