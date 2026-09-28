import { findActiveVisitByPhone } from "@/application/use-cases/checkout-guest";
import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";

/**
 * POST /api/visits/active-search
 * Mencari kunjungan aktif hari ini berdasarkan nomor HP (untuk tamu yang tab-nya tertutup).
 */
export async function POST(request) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return Response.json({ error: "Nomor HP wajib diisi" }, { status: 400 });
    }

    const visit = await findActiveVisitByPhone({
      phone,
      visitRepository: prismaVisitRepository,
    });

    if (!visit) {
      return Response.json({
        found: false,
        message: "Tidak ditemukan kunjungan aktif dengan nomor HP tersebut.",
      });
    }

    return Response.json({
      found: true,
      visitToken: visit.visitToken,
      guestName: visit.guestName,
      hostName: visit.host?.name || "Staf",
      createdAt: visit.createdAt,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
