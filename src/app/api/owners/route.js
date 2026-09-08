import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { prismaOwnerRepository } from "@/infrastructure/repositories/prisma-owner-repository";
import { createOwner, deactivateOwner } from "@/application/use-cases/manage-owner-list";

/**
 * POST /api/owners — Tambah owner baru (ADMINISTRATOR only).
 * Role WAJIB divalidasi di server (AGENTS.md Bagian 9 Rule #6).
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const input = await request.json();
    const owner = await createOwner({
      input,
      ownerRepository: prismaOwnerRepository,
    });

    return Response.json(owner, { status: 201 });
  } catch (error) {
    console.error("Create owner error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

/**
 * PATCH /api/owners — Nonaktifkan owner (ADMINISTRATOR only).
 * Soft delete — perubahan tidak berlaku surut (AGENTS.md Bagian 9 Rule #9).
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
    if (!body.ownerId) {
      return Response.json({ error: "ownerId wajib diisi" }, { status: 400 });
    }

    const owner = await deactivateOwner({
      ownerId: body.ownerId,
      ownerRepository: prismaOwnerRepository,
    });

    return Response.json(owner);
  } catch (error) {
    console.error("Deactivate owner error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

/**
 * GET /api/owners — List semua owner (ADMINISTRATOR only).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const owners = await prismaOwnerRepository.findAll();
    return Response.json(owners);
  } catch (error) {
    console.error("List owners error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
