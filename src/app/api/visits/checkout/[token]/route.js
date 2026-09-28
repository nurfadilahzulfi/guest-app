import { checkoutGuestByToken } from "@/application/use-cases/checkout-guest";
import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";

/**
 * POST /api/visits/checkout/[token]
 * Endpoint checkout mandiri oleh tamu via token kunjungan.
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const visit = await checkoutGuestByToken({
      visitToken: token,
      visitRepository: prismaVisitRepository,
      checkoutBy: "GUEST",
    });

    return Response.json({
      success: true,
      message: "Check-out berhasil. Terima kasih atas kunjungan Anda.",
      visit,
    });
  } catch (error) {
    console.error("Guest checkout error:", error);
    const isNotFound = error.message?.includes("tidak ditemukan");
    return Response.json({ error: error.message }, { status: isNotFound ? 404 : 400 });
  }
}
