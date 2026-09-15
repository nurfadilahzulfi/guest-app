import { getResetPasswordInfo, resetPassword } from "@/application/use-cases/reset-password";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { prisma } from "@/infrastructure/prisma/client";
import bcrypt from "bcryptjs";

/**
 * Route handler validasi token reset kata sandi (GET).
 * GET /api/auth/reset-password/[token]
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params;

    const user = await getResetPasswordInfo({
      token,
      tokenService: cryptoTokenService,
      userRepository: prismaUserRepository,
    });

    if (!user) {
      return Response.json(
        { error: "Tautan reset kata sandi tidak valid atau sudah kedaluwarsa." },
        { status: 404 }
      );
    }

    return Response.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Validate reset token error:", error);
    return Response.json(
      { error: "Terjadi kesalahan pada server saat memvalidasi tautan." },
      { status: 500 }
    );
  }
}

/**
 * Route handler eksekusi reset kata sandi (POST).
 * POST /api/auth/reset-password/[token]
 * Body: { newPassword: string }
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return Response.json(
        { error: "Kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    const updatedUser = await resetPassword({
      token,
      newPassword,
      userRepository: prismaUserRepository,
      tokenService: cryptoTokenService,
      hashPassword: (pwd, rounds) => bcrypt.hash(pwd, rounds),
      transaction: async (fn) => {
        return await prisma.$transaction(async (tx) => {
          const user = await fn(tx);
          // Invalidate semua database session lama milik user
          try {
            await tx.session.deleteMany({ where: { userId: user.id } });
          } catch (sessionErr) {
            // Abaikan jika tabel session kosong/tidak digunakan
          }
          return user;
        });
      },
    });

    return Response.json(
      {
        success: true,
        message: "Kata sandi berhasil diatur ulang. Silakan login dengan kata sandi baru.",
        email: updatedUser.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Execute reset password error:", error);
    return Response.json(
      { error: error.message || "Gagal mengatur ulang kata sandi." },
      { status: 400 }
    );
  }
}
