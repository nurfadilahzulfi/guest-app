import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/infrastructure/prisma/client";

export const authConfig = {
  trustHost: true,
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) return null;
        if (!user.passwordHash) return null;
        if (!user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

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
    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
        token.isDepartmentHead = user.isDepartmentHead;

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

      if (token.sessionToken) {
        if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge") {
          return token;
        }

        const session = await prisma.session.findUnique({
          where: { sessionToken: token.sessionToken },
          include: { user: { select: { isActive: true } } },
        });

        if (!session || !session.user?.isActive) {
          return { ...token, invalid: true };
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.invalid) {
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

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return url;
      }
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl || parsed.hostname.includes("guest-oils-tanimas") || parsed.hostname === "localhost") {
          return url;
        }
      } catch { }
      return "/login";
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
