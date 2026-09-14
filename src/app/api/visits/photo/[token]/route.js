import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";

/**
 * Endpoint publik untuk menyajikan foto wajah tamu secara langsung sebagai binary image (JPEG/PNG).
 * Digunakan oleh email client, link share, atau browser tanpa perlu payload Base64 raksasa di HTML.
 * 
 * @param {Request} request
 * @param {{ params: Promise<{ token: string }> }} context
 * @returns {Promise<Response>}
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params;
    if (!token) {
      return new Response("Not Found", { status: 404 });
    }

    const visit = await prismaVisitRepository.findByVisitToken(token);
    if (!visit || !visit.guestPhotoUrl) {
      return new Response("Not Found", { status: 404 });
    }

    // Jika disimpan sebagai Base64 Data URL (data:image/...)
    if (visit.guestPhotoUrl.startsWith("data:image/")) {
      const match = visit.guestPhotoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");

        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "public, max-age=604800, immutable",
          },
        });
      }
    }

    // Jika disimpan sebagai URL eksternal (Cloudinary / S3 / dll)
    if (visit.guestPhotoUrl.startsWith("http://") || visit.guestPhotoUrl.startsWith("https://")) {
      return Response.redirect(visit.guestPhotoUrl, 302);
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    console.error("[Photo Route] Gagal memuat foto tamu:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
