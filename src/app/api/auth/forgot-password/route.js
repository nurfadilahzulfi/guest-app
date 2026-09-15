import { requestPasswordReset } from "@/application/use-cases/request-password-reset";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";
import { getBaseAppUrl } from "@/infrastructure/utils/app-url";

/**
 * Route handler publik untuk permintaan lupa kata sandi.
 * POST /api/auth/forgot-password
 * Body: { email: string }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return Response.json(
        { error: "Format alamat email tidak valid" },
        { status: 400 }
      );
    }

    const appUrl = getBaseAppUrl();
    const result = await requestPasswordReset({
      email,
      userRepository: prismaUserRepository,
      tokenService: cryptoTokenService,
      notificationService: emailNotificationService,
      appUrl,
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json(
      { error: error.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
