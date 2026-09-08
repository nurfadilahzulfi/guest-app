import { describe, it, expect, vi, beforeEach } from "vitest";
import { cryptoTokenService } from "./crypto-token-service";
import { prisma } from "@/infrastructure/prisma/client";

describe("Infrastructure: cryptoTokenService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("HostActionToken", () => {
    it("createHostActionToken harus membuat token dengan waktu kedaluwarsa 24 jam", async () => {
      const createSpy = vi.spyOn(prisma.hostActionToken, "create").mockResolvedValue({
        id: "action-1",
        visitId: "visit-1",
        token: "uuid-token-1",
      });

      const result = await cryptoTokenService.createHostActionToken("visit-1");

      expect(createSpy).toHaveBeenCalledTimes(1);
      const callData = createSpy.mock.calls[0][0].data;
      expect(callData.visitId).toBe("visit-1");
      // Cek apakah selisih waktu sekitar 24 jam
      const hoursDiff = (callData.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeCloseTo(24, 0);
      expect(result.id).toBe("action-1");
    });

    it("validateHostActionToken harus mengembalikan token jika valid, belum terpakai, dan belum kedaluwarsa", async () => {
      const validToken = {
        id: "action-1",
        token: "uuid-1",
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000), // masih berlaku
      };

      vi.spyOn(prisma.hostActionToken, "findUnique").mockResolvedValue(validToken);

      const result = await cryptoTokenService.validateHostActionToken("uuid-1");
      expect(result).toEqual(validToken);
    });

    it("validateHostActionToken harus mengembalikan null jika token tidak ditemukan di database", async () => {
      vi.spyOn(prisma.hostActionToken, "findUnique").mockResolvedValue(null);

      const result = await cryptoTokenService.validateHostActionToken("not-found");
      expect(result).toBeNull();
    });

    it("validateHostActionToken harus mengembalikan null jika token sudah pernah digunakan (usedAt !== null)", async () => {
      vi.spyOn(prisma.hostActionToken, "findUnique").mockResolvedValue({
        id: "action-1",
        usedAt: new Date(), // sudah terpakai
        expiresAt: new Date(Date.now() + 60000),
      });

      const result = await cryptoTokenService.validateHostActionToken("used-token");
      expect(result).toBeNull();
    });

    it("validateHostActionToken harus mengembalikan null jika token sudah kedaluwarsa (expiresAt < now)", async () => {
      vi.spyOn(prisma.hostActionToken, "findUnique").mockResolvedValue({
        id: "action-1",
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000), // sudah lewat
      });

      const result = await cryptoTokenService.validateHostActionToken("expired-token");
      expect(result).toBeNull();
    });

    it("validateHostActionToken harus menggunakan transaction client jika tx diberikan", async () => {
      const mockTx = {
        hostActionToken: {
          findUnique: vi.fn().mockResolvedValue({
            id: "action-1",
            usedAt: null,
            expiresAt: new Date(Date.now() + 60000),
          }),
        },
      };

      await cryptoTokenService.validateHostActionToken("uuid-1", mockTx);
      expect(mockTx.hostActionToken.findUnique).toHaveBeenCalledWith({
        where: { token: "uuid-1" },
        include: { visit: true },
      });
    });

    it("markTokenAsUsed harus mengupdate field usedAt", async () => {
      const updateSpy = vi.spyOn(prisma.hostActionToken, "update").mockResolvedValue({
        id: "action-1",
        usedAt: new Date(),
      });

      await cryptoTokenService.markTokenAsUsed("action-1");
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: "action-1" },
        data: { usedAt: expect.any(Date) },
      });
    });
  });

  describe("InviteToken", () => {
    it("createInviteToken harus membuat token undangan dengan waktu kedaluwarsa 72 jam", async () => {
      const createSpy = vi.spyOn(prisma.inviteToken, "create").mockResolvedValue({
        id: "inv-1",
        userId: "user-1",
      });

      await cryptoTokenService.createInviteToken("user-1");
      const callData = createSpy.mock.calls[0][0].data;
      expect(callData.userId).toBe("user-1");
      const hoursDiff = (callData.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeCloseTo(72, 0);
    });

    it("validateInviteToken harus menolak token yang sudah dipakai atau kedaluwarsa", async () => {
      // Kasus sudah terpakai
      vi.spyOn(prisma.inviteToken, "findUnique").mockResolvedValue({
        id: "inv-1",
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      });
      expect(await cryptoTokenService.validateInviteToken("token")).toBeNull();

      // Kasus kedaluwarsa
      vi.spyOn(prisma.inviteToken, "findUnique").mockResolvedValue({
        id: "inv-2",
        usedAt: null,
        expiresAt: new Date(Date.now() - 60000),
      });
      expect(await cryptoTokenService.validateInviteToken("token")).toBeNull();
    });

    it("markInviteTokenAsUsed harus mengupdate usedAt pada InviteToken", async () => {
      const updateSpy = vi.spyOn(prisma.inviteToken, "update").mockResolvedValue({
        id: "inv-1",
        usedAt: new Date(),
      });

      await cryptoTokenService.markInviteTokenAsUsed("inv-1");
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { usedAt: expect.any(Date) },
      });
    });
  });
});
