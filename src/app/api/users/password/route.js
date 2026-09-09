import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { prisma } from "@/infrastructure/prisma/client";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, newPassword } = await request.json();

    if (!userId || typeof userId !== "string") {
      return Response.json({ error: "User ID wajib diisi" }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return Response.json({ error: "Kata sandi minimal 8 karakter" }, { status: 400 });
    }

    const user = await prismaUserRepository.findById(userId);
    if (!user) {
      return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Hash kata sandi dengan bcrypt (salt 12) sesuai standar keamanan
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      // Perbarui passwordHash
      await prismaUserRepository.update(userId, { passwordHash }, tx);

      // Tandai token invite lama sebagai terpakai agar tidak bisa digunakan lagi
      await tx.inviteToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      });
    });

    return Response.json({
      success: true,
      message: `Kata sandi untuk pengguna ${user.name} berhasil diperbarui.`,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
