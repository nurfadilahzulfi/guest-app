import { auth } from "@/infrastructure/auth/auth-options";
import { checkoutGuestById } from "@/application/use-cases/checkout-guest";
import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";

/**
 * POST /api/visits/checkout
 * Endpoint checkout manual oleh Administrator / Host di dashboard.
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { visitId } = await request.json();
    if (!visitId) {
      return Response.json({ error: "visitId wajib diisi" }, { status: 400 });
    }

    // Jika role HOST, verifikasi kepemilikan kunjungan
    if (session.user.role === "HOST") {
      const existing = await prismaVisitRepository.findById(visitId);
      if (!existing || existing.hostId !== session.user.id) {
        return Response.json({ error: "Forbidden: Bukan tamu Anda" }, { status: 403 });
      }
    }

    const checkoutBy = `${session.user.name || "Petugas"} (${session.user.role})`;
    const visit = await checkoutGuestById({
      visitId,
      visitRepository: prismaVisitRepository,
      checkoutBy,
    });

    return Response.json({
      success: true,
      message: "Tamu berhasil di-checkout.",
      visit,
    });
  } catch (error) {
    console.error("Admin checkout error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
