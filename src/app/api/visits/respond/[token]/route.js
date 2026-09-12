import { respondToVisit, getVisitByActionToken } from "@/application/use-cases/respond-to-visit";
import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";
import { prisma } from "@/infrastructure/prisma/client";
import { getRequestAppUrl } from "@/infrastructure/utils/app-url";

export async function GET(request, { params }) {
  try {
    const { token } = await params;

    const visit = await getVisitByActionToken({
      token,
      tokenService: cryptoTokenService,
      visitRepository: prismaVisitRepository,
    });

    if (!visit) {
      return Response.json(
        { error: "Token tidak valid, sudah digunakan, atau sudah kedaluwarsa" },
        { status: 404 }
      );
    }

    return Response.json({
      id: visit.id,
      guestName: visit.guestName,
      guestPhone: visit.guestPhone,
      guestEmail: visit.guestEmail,
      guestPhotoUrl: visit.guestPhotoUrl,
      gender: visit.gender,
      organization: visit.organization,
      duration: visit.duration,
      purpose: visit.purpose,
      visitorType: visit.visitorType,
      status: visit.status,
      hostName: visit.host?.name,
      createdAt: visit.createdAt,
    });
  } catch (error) {
    console.error("Get visit by token error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json();

    if (!body.action || !["APPROVED", "REJECTED"].includes(body.action)) {
      return Response.json(
        { error: "Action harus APPROVED atau REJECTED" },
        { status: 400 }
      );
    }

    const appUrl = getRequestAppUrl(request);
    const visit = await respondToVisit({
      token,
      action: body.action,
      hostReply: body.hostReply || null,
      visitRepository: prismaVisitRepository,
      tokenService: cryptoTokenService,
      transaction: (fn) => prisma.$transaction(fn),
      notificationService: emailNotificationService,
      appUrl,
    });

    return Response.json({
      id: visit.id,
      status: visit.status,
      respondedAt: visit.respondedAt,
    });
  } catch (error) {
    console.error("Respond to visit error:", error);
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
