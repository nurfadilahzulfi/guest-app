/** @typedef {'HOST' | 'ADMIN_HRD' | 'ADMINISTRATOR'} UserRole */

/**
 * @param {{name: string, email: string, role: UserRole, department?: string, position?: string}} input
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateUserInput(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Input tidak valid"] };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    errors.push("Nama user wajib diisi");
  }

  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!email) {
    errors.push("Email wajib diisi");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Format email tidak valid");
  }

  if (!input.role || !["HOST", "ADMIN_HRD", "ADMINISTRATOR"].includes(input.role)) {
    errors.push("Role harus HOST, ADMIN_HRD, atau ADMINISTRATOR");
  }

  if (input.role === "HOST") {
    const department = typeof input.department === "string" ? input.department.trim() : "";
    if (!department) {
      errors.push("Department wajib diisi untuk role HOST");
    }
    const position = typeof input.position === "string" ? input.position.trim() : "";
    if (!position) {
      errors.push("Position wajib diisi untuk role HOST");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Mengecek apakah user boleh meng-approve/reject kunjungan.
 * Hanya HOST yang bisa approve/reject.
 * @param {UserRole} role
 * @returns {boolean}
 */
export function canRespondToVisit(role) {
  return role === "HOST";
}

/**
 * Mengecek apakah user memiliki akses administratif penuh.
 * @param {UserRole} role
 * @returns {boolean}
 */
export function isAdministrator(role) {
  return role === "ADMINISTRATOR";
}

/**
 * Mengecek apakah user bisa melihat seluruh riwayat kunjungan.
 * ADMIN_HRD dan ADMINISTRATOR bisa, HOST tidak.
 * @param {UserRole} role
 * @returns {boolean}
 */
export function canViewAllVisits(role) {
  return role === "ADMIN_HRD" || role === "ADMINISTRATOR";
}
