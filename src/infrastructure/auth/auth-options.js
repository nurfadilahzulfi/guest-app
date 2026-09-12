import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/infrastructure/prisma/client";

/**
 * Konfigurasi Auth.js (NextAuth v5).
 * - Credentials Provider (email + password) — bukan OAuth
 * - JWT strategy dengan manual session creation di database
 * - Prisma Adapter untuk manajemen session
 * Lihat AGENTS.md Bagian 7 untuk penjelasan lengkap.
 */
export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Memvalidasi kredensial login.
       * Hanya user yang sudah diaktivasi (passwordHash !== null) dan aktif (isActive === true) yang bisa login.
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        // User tidak ditemukan
        if (!user) return null;

        // User belum diaktivasi (belum set password lewat invite)
        if (!user.passwordHash) return null;

        // User sudah dinonaktifkan
        if (!user.isActive) return null;

        // Verifikasi password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        // Return user object (TANPA passwordHash)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          isDepartmentHead: user.isDepartmentHead,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback — menambahkan data user ke token saat sign-in.
     * Manual session creation di database untuk mendukung server-side invalidation.
     */
    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user) {
        // Simpan data user di JWT token
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
        token.isDepartmentHead = user.isDepartmentHead;

        // Manual create session di database — supaya bisa di-invalidasi dari server
        const sessionToken = crypto.randomUUID();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 hari

        await prisma.session.create({
          data: {
            sessionToken,
            userId: user.id,
            expires,
          },
        });

        token.sessionToken = sessionToken;
      }

      // Setiap kali JWT diproses, cek apakah session masih valid di database
      if (token.sessionToken) {
        // Jangan panggil Prisma jika berjalan di Edge runtime (hanya di Node.js runtime)
        if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge") {
          return token;
        }

        const session = await prisma.session.findUnique({
          where: { sessionToken: token.sessionToken },
          include: { user: { select: { isActive: true } } },
        });

        // Jika session dihapus atau user sudah dinonaktifkan, invalidasi token
        if (!session || !session.user?.isActive) {
          return { ...token, invalid: true };
        }
      }

      return token;
    },

    /**
     * Session callback — menambahkan data custom ke session object yang dilihat client.
     */
    async session({ session, token }) {
      if (token.invalid) {
        // Session invalid — force logout di client
        return null;
      }

      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.department = token.department;
        session.user.isDepartmentHead = token.isDepartmentHead;
      }

      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
