import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";
import { getRequestAppUrl } from "@/infrastructure/utils/app-url";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId || typeof userId !== "string") {
      return Response.json({ error: "User ID wajib diisi" }, { status: 400 });
    }

    const user = await prismaUserRepository.findById(userId);
    if (!user) {
      return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Buat token aktivasi baru yang berlaku 72 jam
    const inviteToken = await cryptoTokenService.createInviteToken(user.id, 72);
    const appUrl = getRequestAppUrl(request);
    const inviteUrl = `${appUrl}/invite/${inviteToken.token}`;

    // Kirim notifikasi email (opsional, jika SMTP aktif)
    try {
      await emailNotificationService.sendInviteEmail({
        user,
        inviteToken,
        inviteUrl,
      });
    } catch (e) {
      // Email gagal tidak membatalkan kembalinya link
      console.warn("Kirim email aktivasi gagal, tautan tetap dihasilkan:", e.message);
    }

    return Response.json({
      success: true,
      inviteToken: inviteToken.token,
      inviteUrl,
    });
  } catch (error) {
    console.error("Resend invite error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
