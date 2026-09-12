import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { createHost, updateHost, deactivateHost } from "@/application/use-cases/manage-host-directory";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";
import { getRequestAppUrl } from "@/infrastructure/utils/app-url";

export async function GET() {
  try {
    const hosts = await prismaUserRepository.findActiveHosts();
    return Response.json(hosts);
  } catch (error) {
    console.error("List hosts error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const host = await createHost({
      input,
      userRepository: prismaUserRepository,
      tokenService: cryptoTokenService,
      notificationService: emailNotificationService,
      appUrl,
    });

    return Response.json(host, { status: 201 });
  } catch (error) {
    console.error("Create host error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { hostId, action, ...input } = body;

    if (!hostId) {
      return Response.json({ error: "hostId wajib diisi" }, { status: 400 });
    }

    let result;
    if (action === "deactivate") {
      result = await deactivateHost({ hostId, userRepository: prismaUserRepository });
    } else {
      result = await updateHost({ hostId, input, userRepository: prismaUserRepository });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Update host error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { hostId } = await request.json();
    if (!hostId) {
      return Response.json({ error: "hostId wajib diisi" }, { status: 400 });
    }

    if (hostId === session.user.id) {
      return Response.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 });
    }

    await prismaUserRepository.delete(hostId);
    return Response.json({ success: true, message: "Data karyawan berhasil dihapus permanen" });
  } catch (error) {
    console.error("Delete host error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
