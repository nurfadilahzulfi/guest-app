import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";

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
      guestEmail: visit.guestEmail,
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
