import { validateUserInput } from "@/domain/entities/user";

/**
 * Mengundang user baru ke sistem.
 * User dibuat tanpa password (passwordHash null) — akan diaktivasi lewat invite link.
 * Hanya ADMINISTRATOR yang boleh mengundang user baru (AGENTS.md Bagian 9 Rule #5).
 * @param {Object} params
 * @param {{name: string, email: string, role: string, department?: string, position?: string, isDepartmentHead?: boolean}} params.input
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @param {import('@/application/services/token-service').TokenService} params.tokenService
 * @param {import('@/application/services/notification-service').NotificationService} params.notificationService
 * @param {string} params.appUrl - Base URL aplikasi untuk generate invite link
 * @returns {Promise<Object>} user yang baru dibuat
 */
export async function inviteUser({
  input,
  userRepository,
  tokenService,
  notificationService,
  appUrl,
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

  // 3. Buat user baru (tanpa password)
  const user = await userRepository.create({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    department: input.department?.trim() || null,
    position: input.position?.trim() || null,
    isDepartmentHead: input.isDepartmentHead || false,
  });

  // 4. Buat invite token (berlaku 72 jam)
  const inviteToken = await tokenService.createInviteToken(user.id, 72);

  // 5. Kirim email undangan
  const inviteUrl = `${appUrl}/invite/${inviteToken.token}`;
  await notificationService.sendInviteEmail({
    user,
    inviteToken,
    inviteUrl,
  });

  return user;
}
