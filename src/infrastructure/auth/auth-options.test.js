import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

import { authConfig } from "./auth-options";
import { prisma } from "@/infrastructure/prisma/client";
import bcrypt from "bcryptjs";

describe("Infrastructure: authConfig (Auth.js v5 Credentials & Session Invalidation)", () => {
  const authorize = authConfig.providers[0].options?.authorize || authConfig.providers[0].authorize;
  const { jwt: jwtCallback, session: sessionCallback } = authConfig.callbacks;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Credentials authorize", () => {
    it("harus mengembalikan null jika email atau password tidak disertakan", async () => {
      expect(await authorize({})).toBeNull();
      expect(await authorize({ email: "user@example.com" })).toBeNull();
      expect(await authorize({ password: "password" })).toBeNull();
    });

    it("harus mengembalikan null jika user tidak ditemukan di database", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const result = await authorize({
        email: "unknown@company.com",
        password: "password123",
      });
      expect(result).toBeNull();
    });

    it("harus menolak login jika user belum aktivasi (passwordHash masih null)", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-1",
        email: "invited@company.com",
        passwordHash: null, // belum set password
        isActive: true,
      });

      const result = await authorize({
        email: "invited@company.com",
        password: "password123",
      });
      expect(result).toBeNull();
    });

    it("harus menolak login jika user sudah dinonaktifkan (isActive: false)", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-2",
        email: "deactivated@company.com",
        passwordHash: "$2a$12$samplehash",
        isActive: false, // dinonaktifkan
      });

      const result = await authorize({
        email: "deactivated@company.com",
        password: "password123",
      });
      expect(result).toBeNull();
    });

    it("harus menolak login jika password tidak cocok", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-3",
        email: "user@company.com",
        passwordHash: "$2a$12$samplehash",
        isActive: true,
      });
      bcrypt.compare.mockResolvedValue(false); // password salah

      const result = await authorize({
        email: "user@company.com",
        password: "wrongpassword",
      });
      expect(result).toBeNull();
    });

    it("harus berhasil login jika kredensial benar dan TIDAK PERNAH menyertakan passwordHash", async () => {
      const mockUser = {
        id: "user-4",
        name: "Budi Host",
        email: "budi@company.com",
        passwordHash: "$2a$12$correcthash",
        role: "HOST",
        department: "Engineering",
        isDepartmentHead: false,
        isActive: true,
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await authorize({
        email: "budi@company.com",
        password: "correctpassword",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("user-4");
      expect(result.name).toBe("Budi Host");
      expect(result.role).toBe("HOST");
      // Password hash WAJIB tidak ada di objek yang di-return
      expect(result.passwordHash).toBeUndefined();
    });
  });

  describe("Session Invalidation & Callbacks", () => {
    it("jwt callback harus menyimpan sesi di database saat sign in", async () => {
      const createSessionSpy = vi.spyOn(prisma.session, "create").mockResolvedValue({});

      const token = {};
      const user = {
        id: "user-1",
        role: "HOST",
        department: "IT",
        isDepartmentHead: false,
      };
      const account = { provider: "credentials" };

      const resultToken = await jwtCallback({ token, user, account });

      expect(createSessionSpy).toHaveBeenCalledTimes(1);
      expect(resultToken.id).toBe("user-1");
      expect(resultToken.sessionToken).toBeDefined();
    });

    it("jwt callback harus menandai invalid jika sesi database dihapus atau user dinonaktifkan", async () => {
      // Kasus sesi dihapus / user tidak aktif
      vi.spyOn(prisma.session, "findUnique").mockResolvedValue(null);

      const token = { sessionToken: "test-sess-token" };
      const resultToken = await jwtCallback({ token });

      expect(resultToken.invalid).toBe(true);
    });

    it("session callback harus mengembalikan null jika token bertanda invalid (force logout)", async () => {
      const session = { user: { name: "Test" } };
      const token = { invalid: true };

      const result = await sessionCallback({ session, token });
      expect(result).toBeNull();
    });

    it("session callback harus mengisi user data ke session object jika token valid", async () => {
      const session = { user: {} };
      const token = {
        id: "user-123",
        role: "ADMINISTRATOR",
        department: "Management",
        isDepartmentHead: true,
      };

      const result = await sessionCallback({ session, token });
      expect(result.user.id).toBe("user-123");
      expect(result.user.role).toBe("ADMINISTRATOR");
    });
  });
});
