import { getInviteInfo, activateUser } from "@/application/use-cases/activate-user";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { prisma } from "@/infrastructure/prisma/client";
import bcrypt from "bcryptjs";


export async function GET(request, { params }) {
  try {
    const { token } = await params;

    const info = await getInviteInfo({
      token,
      tokenService: cryptoTokenService,
      userRepository: prismaUserRepository,
    });

    if (!info) {
      return Response.json(
        { error: "Token undangan tidak valid, sudah digunakan, atau sudah kedaluwarsa" },
        { status: 404 }
      );
    }

    return Response.json(info);
  } catch (error) {
    console.error("Get invite info error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json();

    if (!body.password) {
      return Response.json(
        { error: "Password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await activateUser({
      token,
      password: body.password,
      userRepository: prismaUserRepository,
      tokenService: cryptoTokenService,
      hashPassword: (password, rounds) => bcrypt.hash(password, rounds),
      transaction: (fn) => prisma.$transaction(fn),
    });

    return Response.json({
      message: "Akun berhasil diaktivasi. Silakan login.",
      email: user.email,
    });
  } catch (error) {
    console.error("Activate user error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
