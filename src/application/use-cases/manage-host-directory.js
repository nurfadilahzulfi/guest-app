import { validateUserInput } from "@/domain/entities/user";

/**
 * Membuat host baru dalam direktori.
 * Hanya ADMINISTRATOR yang boleh mengelola direktori host (AGENTS.md Bagian 4).
 * @param {Object} params
 * @param {{name: string, email: string, department: string, position: string, photoUrl?: string, isDepartmentHead?: boolean}} params.input
 * @param {import('@/domain/repositories/user-repository').UserRepository} params.userRepository
 * @returns {Promise<Object>} host yang baru dibuat
 */
export async function createHost({ input, userRepository }) {
  const fullInput = { ...input, role: "HOST" };
  const validation = validateUserInput(fullInput);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) {
    throw new Error("Email sudah terdaftar dalam sistem");
  }

  return userRepository.create({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: "HOST",
    department: input.department.trim(),
    position: input.position.trim(),
    photoUrl: input.photoUrl || null,
    isDepartmentHead: input.isDepartmentHead || false,
  });
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
 * @returns {Promise<Object>} host yang sudah dinonaktifkan
 */
export async function deactivateHost({ hostId, userRepository }) {
  const host = await userRepository.findById(hostId);
  if (!host || host.role !== "HOST") {
    throw new Error("Host tidak ditemukan");
  }

  return userRepository.update(hostId, { isActive: false });
}
