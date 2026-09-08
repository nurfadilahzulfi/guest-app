import { checkInGuest } from "@/application/use-cases/check-in-guest";
import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";
import { prismaOwnerRepository } from "@/infrastructure/repositories/prisma-owner-repository";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { localStorageService } from "@/infrastructure/storage/local-storage-service";
import { auth } from "@/infrastructure/auth/auth-options";
import { canViewAllVisits } from "@/domain/entities/user";

/**
 * POST /api/visits — Check-in tamu (public, tidak perlu auth).
 * Route handler tipis — semua logic di use case.
 */
export async function POST(request) {
  try {
    const input = await request.json();

    const visit = await checkInGuest({
      input,
      visitRepository: prismaVisitRepository,
      ownerRepository: prismaOwnerRepository,
      userRepository: prismaUserRepository,
      notificationService: emailNotificationService,
      tokenService: cryptoTokenService,
      storageService: localStorageService,
    });

    return Response.json(
      { visitToken: visit.visitToken },
      { status: 201 }
    );
  } catch (error) {
    console.error("Check-in error:", error);
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

/**
 * GET /api/visits — List seluruh riwayat kunjungan (ADMIN_HRD + ADMINISTRATOR only).
 * Role WAJIB divalidasi di server (AGENTS.md Bagian 9 Rule #6).
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      status: searchParams.get("status") || undefined,
      visitorType: searchParams.get("visitorType") || undefined,
      hostId: searchParams.get("hostId") || undefined,
      department: searchParams.get("department") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    // Host hanya bisa melihat kunjungan miliknya sendiri (AGENTS.md Bagian 4 & 12)
    if (session.user.role === "HOST") {
      const result = await prismaVisitRepository.findByHostId(session.user.id, filters);
      return Response.json(result);
    }

    // ADMIN_HRD & ADMINISTRATOR bisa melihat seluruh kunjungan
    if (canViewAllVisits(session.user.role)) {
      const result = await prismaVisitRepository.findAll(filters);
      return Response.json(result);
    }

    return Response.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("List visits error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
