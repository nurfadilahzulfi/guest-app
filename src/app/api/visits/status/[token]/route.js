import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";

/**
 * GET /api/visits/status/[token] — Polling status visit by visitToken (public).
 * Tamu menggunakan ini untuk mengecek status kunjungannya.
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params;

    const visit = await prismaVisitRepository.findByVisitToken(token);
    if (!visit) {
      return Response.json(
        { error: "Kunjungan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hanya kembalikan data yang perlu diketahui tamu
    return Response.json({
      guestName: visit.guestName,
      guestPhotoUrl: visit.guestPhotoUrl,
      gender: visit.gender,
      organization: visit.organization,
      duration: visit.duration,
      purpose: visit.purpose,
      visitorType: visit.visitorType,
      status: visit.status,
      hostName: visit.host.name,
      hostDepartment: visit.host.department,
      hostReply: visit.hostReply,
      createdAt: visit.createdAt,
      respondedAt: visit.respondedAt,
    });
  } catch (error) {
    console.error("Status polling error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
