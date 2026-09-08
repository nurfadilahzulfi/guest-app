import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";

/**
 * GET /api/users — List semua user (ADMINISTRATOR only).
 * Role WAJIB divalidasi di server (AGENTS.md Bagian 9 Rule #6).
 */
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

/**
 * PATCH /api/users — Update status user (nonaktifkan/aktifkan) (ADMINISTRATOR only).
 * Menonaktifkan user selalu soft delete (isActive = false) (AGENTS.md Bagian 9 Rule #8).
 */
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
    const { userId, isActive } = body;

    if (!userId) {
      return Response.json({ error: "userId wajib diisi" }, { status: 400 });
    }

    // Tidak boleh menonaktifkan diri sendiri
    if (userId === session.user.id && isActive === false) {
      return Response.json({ error: "Tidak dapat menonaktifkan akun sendiri" }, { status: 400 });
    }

    const updated = await prismaUserRepository.update(userId, { isActive });
    return Response.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
