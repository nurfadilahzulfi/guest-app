import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;

    const users = await prismaUserRepository.findAll({ role, isActive });
    return Response.json(users);
  } catch (error) {
    console.error("List users error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      isActive,
      name,
      email,
      role,
      department,
      position,
      isDepartmentHead,
    } = body;

    if (!userId) {
      return Response.json({ error: "userId wajib diisi" }, { status: 400 });
    }

    // Mencegah Administrator menonaktifkan akun sendiri
    if (userId === session.user.id && isActive === false) {
      return Response.json({ error: "Tidak dapat menonaktifkan akun sendiri" }, { status: 400 });
    }

    // Mencegah Administrator mendowngrade role akun sendiri
    if (userId === session.user.id && role && role !== "ADMINISTRATOR") {
      return Response.json({ error: "Tidak dapat mengubah peran akun Administrator milik sendiri" }, { status: 400 });
    }

    const existingUser = await prismaUserRepository.findById(userId);
    if (!existingUser) {
      return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const updateData = {};

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return Response.json({ error: "Nama lengkap tidak boleh kosong" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return Response.json({ error: "Format email tidak valid" }, { status: 400 });
      }
      if (cleanEmail !== existingUser.email.toLowerCase()) {
        const emailExists = await prismaUserRepository.findByEmail(cleanEmail);
        if (emailExists && emailExists.id !== userId) {
          return Response.json({ error: "Email sudah digunakan oleh pengguna lain" }, { status: 400 });
        }
      }
      updateData.email = cleanEmail;
    }

    if (role !== undefined) {
      const VALID_ROLES = ["HOST", "ADMIN_HRD", "ADMINISTRATOR"];
      if (!VALID_ROLES.includes(role)) {
        return Response.json({ error: "Peran / role tidak valid" }, { status: 400 });
      }
      updateData.role = role;
    }

    if (department !== undefined) {
      updateData.department = department ? department.trim() : null;
    }

    if (position !== undefined) {
      updateData.position = position ? position.trim() : null;
    }

    if (isDepartmentHead !== undefined) {
      updateData.isDepartmentHead = Boolean(isDepartmentHead);
    }

    // Validasi aturan bisnis: Role HOST wajib memiliki departemen & jabatan (AGENTS.md Bagian 6)
    const targetRole = updateData.role || existingUser.role;
    if (targetRole === "HOST") {
      const targetDept = updateData.department !== undefined ? updateData.department : existingUser.department;
      const targetPos = updateData.position !== undefined ? updateData.position : existingUser.position;
      if (!targetDept || !targetPos) {
        return Response.json(
          { error: "Departemen dan Jabatan wajib diisi untuk peran Karyawan (Host)" },
          { status: 400 }
        );
      }
    }

    const updated = await prismaUserRepository.update(userId, updateData);
    return Response.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      department: updated.department,
      position: updated.position,
      isDepartmentHead: updated.isDepartmentHead,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return Response.json({ error: "userId wajib diisi" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return Response.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 });
    }

    await prismaUserRepository.delete(userId);
    return Response.json({ success: true, message: "Pengguna berhasil dihapus permanen" });
  } catch (error) {
    console.error("Delete user error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
