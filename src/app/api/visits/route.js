import { checkInGuest } from "@/application/use-cases/check-in-guest";
import { respondToVisitDirectly } from "@/application/use-cases/respond-to-visit";
import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";
import { prismaOwnerRepository } from "@/infrastructure/repositories/prisma-owner-repository";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { localStorageService } from "@/infrastructure/storage/local-storage-service";
import { auth } from "@/infrastructure/auth/auth-options";
import { canViewAllVisits } from "@/domain/entities/user";
import { prisma } from "@/infrastructure/prisma/client";
import { getRequestAppUrl } from "@/infrastructure/utils/app-url";


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

    if (session.user.role === "HOST") {
      const result = await prismaVisitRepository.findByHostId(session.user.id, filters);
      return Response.json(result);
    }

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

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hanya Host yang boleh approve/reject kunjungan (AGENTS.md Bagian 4)
    if (session.user.role !== "HOST") {
      return Response.json(
        { error: "Hanya karyawan (Host) yang memiliki izin untuk menyetujui atau menolak kunjungan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { visitId, action, hostReply } = body;

    if (!visitId) {
      return Response.json({ error: "visitId wajib diisi" }, { status: 400 });
    }

    if (!action || !["APPROVED", "REJECTED"].includes(action)) {
      return Response.json(
        { error: "Action harus APPROVED atau REJECTED" },
        { status: 400 }
      );
    }

    const appUrl = getRequestAppUrl(request);
    const updatedVisit = await respondToVisitDirectly({
      visitId,
      hostUserId: session.user.id,
      action,
      hostReply,
      visitRepository: prismaVisitRepository,
      transaction: (fn) => prisma.$transaction(fn),
      notificationService: emailNotificationService,
      appUrl,
    });

    // Tandai token action yang belum terpakai sebagai sudah digunakan
    try {
      await prisma.hostActionToken.updateMany({
        where: { visitId, usedAt: null },
        data: { usedAt: new Date() },
      });
    } catch {
      // Abaikan jika tidak ada token
    }

    return Response.json({
      id: updatedVisit.id,
      status: updatedVisit.status,
      hostReply: updatedVisit.hostReply,
      respondedAt: updatedVisit.respondedAt,
    });
  } catch (error) {
    console.error("Direct respond to visit error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
