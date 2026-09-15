import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postForgotPassword } from "./forgot-password/route";
import {
  GET as getResetPassword,
  POST as postResetPassword,
} from "./reset-password/[token]/route";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";
import { prisma } from "@/infrastructure/prisma/client";
import bcrypt from "bcryptjs";

describe("Forgot & Reset Password Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/forgot-password", () => {
    it("harus return 400 jika email tidak ada atau tidak valid", async () => {
      const req = new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "invalid-email" }),
      });

      const res = await postForgotPassword(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("Format alamat email tidak valid");
    });

    it("harus return 200 dan mengirim email reset jika user terdaftar", async () => {
      vi.spyOn(prismaUserRepository, "findByEmail").mockResolvedValue({
        id: "u-1",
        name: "Admin User",
        email: "admin@tanimas.co.id",
        role: "ADMINISTRATOR",
        isActive: true,
      });
      vi.spyOn(cryptoTokenService, "invalidateUserInviteTokens").mockResolvedValue({});
      vi.spyOn(cryptoTokenService, "createInviteToken").mockResolvedValue({
        token: "tok-reset-uuid",
      });
      const sendEmailSpy = vi
        .spyOn(emailNotificationService, "sendPasswordResetEmail")
        .mockResolvedValue({});

      const req = new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "admin@tanimas.co.id" }),
      });

      const res = await postForgotPassword(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ email: "admin@tanimas.co.id" }),
          resetToken: { token: "tok-reset-uuid" },
        })
      );
    });
  });

  describe("GET /api/auth/reset-password/[token]", () => {
    it("harus return 404 jika token tidak valid atau kadaluwarsa", async () => {
      vi.spyOn(cryptoTokenService, "validateInviteToken").mockResolvedValue(null);

      const req = new Request("http://localhost/api/auth/reset-password/bad-token");
      const res = await getResetPassword(req, {
        params: Promise.resolve({ token: "bad-token" }),
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toContain("Tautan reset kata sandi tidak valid");
    });

    it("harus return 200 dan data user jika token valid", async () => {
      vi.spyOn(cryptoTokenService, "validateInviteToken").mockResolvedValue({
        userId: "u-1",
      });
      vi.spyOn(prismaUserRepository, "findById").mockResolvedValue({
        id: "u-1",
        name: "Admin User",
        email: "admin@tanimas.co.id",
        role: "ADMINISTRATOR",
        department: "IT",
        isActive: true,
      });

      const req = new Request("http://localhost/api/auth/reset-password/good-token");
      const res = await getResetPassword(req, {
        params: Promise.resolve({ token: "good-token" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.user.name).toBe("Admin User");
      expect(json.user.email).toBe("admin@tanimas.co.id");
    });
  });

  describe("POST /api/auth/reset-password/[token]", () => {
    it("harus return 400 jika newPassword kurang dari 8 karakter", async () => {
      const req = new Request("http://localhost/api/auth/reset-password/tok-1", {
        method: "POST",
        body: JSON.stringify({ newPassword: "short" }),
      });
      const res = await postResetPassword(req, {
        params: Promise.resolve({ token: "tok-1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("Kata sandi minimal 8 karakter");
    });

    it("harus return 200 dan mereset password jika parameter valid", async () => {
      vi.spyOn(cryptoTokenService, "validateInviteToken").mockResolvedValue({
        id: "tok-db-id",
        userId: "u-1",
      });
      vi.spyOn(prismaUserRepository, "findById").mockResolvedValue({
        id: "u-1",
        email: "admin@tanimas.co.id",
        role: "ADMINISTRATOR",
        isActive: true,
      });
      vi.spyOn(prismaUserRepository, "update").mockResolvedValue({
        id: "u-1",
        email: "admin@tanimas.co.id",
      });
      vi.spyOn(cryptoTokenService, "markInviteTokenAsUsed").mockResolvedValue({});
      vi.spyOn(prisma, "$transaction").mockImplementation(async (cb) => {
        const mockTx = {
          session: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await cb(mockTx);
      });

      const req = new Request("http://localhost/api/auth/reset-password/tok-valid", {
        method: "POST",
        body: JSON.stringify({ newPassword: "PasswordBaru123!" }),
      });
      const res = await postResetPassword(req, {
        params: Promise.resolve({ token: "tok-valid" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.email).toBe("admin@tanimas.co.id");
    });
  });
});
