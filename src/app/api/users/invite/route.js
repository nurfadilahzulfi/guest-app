import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { inviteUser } from "@/application/use-cases/invite-user";
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

    const input = await request.json();
    const appUrl = getRequestAppUrl(request);

    const user = await inviteUser({
      input,
      userRepository: prismaUserRepository,
      tokenService: cryptoTokenService,
      notificationService: emailNotificationService,
      appUrl,
    });

    return Response.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rawPassword: user.rawPassword,
        loginUrl: user.loginUrl,
        inviteToken: user.inviteToken,
        inviteUrl: user.inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite user error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
