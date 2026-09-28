import { describe, it, expect, vi } from "vitest";
import {
  checkoutGuestByToken,
  checkoutGuestById,
  findActiveVisitByPhone,
} from "./checkout-guest";

describe("Use Case: checkout-guest", () => {
  describe("checkoutGuestByToken", () => {
    it("berhasil checkout jika status visit APPROVED dan belum checkout", async () => {
      const mockVisit = {
        id: "v-1",
        visitToken: "token-123",
        status: "APPROVED",
        checkoutAt: null,
      };

      const visitRepository = {
        findByVisitToken: vi.fn().mockResolvedValue(mockVisit),
        checkout: vi.fn().mockImplementation((id, data) =>
          Promise.resolve({ ...mockVisit, ...data })
        ),
      };

      const result = await checkoutGuestByToken({
        visitToken: "token-123",
        visitRepository,
        checkoutBy: "GUEST",
      });

      expect(visitRepository.findByVisitToken).toHaveBeenCalledWith("token-123");
      expect(visitRepository.checkout).toHaveBeenCalled();
      expect(result.checkoutAt).toBeDefined();
      expect(result.checkoutBy).toBe("GUEST");
    });

    it("mengembalikan data langsung jika visit sudah pernah di-checkout (idempotent)", async () => {
      const existingDate = new Date();
      const mockVisit = {
        id: "v-1",
        visitToken: "token-123",
        status: "APPROVED",
        checkoutAt: existingDate,
      };

      const visitRepository = {
        findByVisitToken: vi.fn().mockResolvedValue(mockVisit),
        checkout: vi.fn(),
      };

      const result = await checkoutGuestByToken({
        visitToken: "token-123",
        visitRepository,
      });

      expect(visitRepository.checkout).not.toHaveBeenCalled();
      expect(result.checkoutAt).toBe(existingDate);
    });

    it("menolak jika status visit PENDING", async () => {
      const mockVisit = {
        id: "v-1",
        visitToken: "token-123",
        status: "PENDING",
        checkoutAt: null,
      };

      const visitRepository = {
        findByVisitToken: vi.fn().mockResolvedValue(mockVisit),
      };

      await expect(
        checkoutGuestByToken({
          visitToken: "token-123",
          visitRepository,
        })
      ).rejects.toThrow("Kunjungan belum disetujui atau sudah tidak aktif");
    });

    it("menolak jika visit tidak ditemukan", async () => {
      const visitRepository = {
        findByVisitToken: vi.fn().mockResolvedValue(null),
      };

      await expect(
        checkoutGuestByToken({
          visitToken: "not-found",
          visitRepository,
        })
      ).rejects.toThrow("Data kunjungan tidak ditemukan");
    });
  });

  describe("checkoutGuestById", () => {
    it("berhasil checkout oleh admin/host berdasarkan visitId", async () => {
      const mockVisit = {
        id: "v-1",
        status: "APPROVED",
        checkoutAt: null,
      };

      const visitRepository = {
        findById: vi.fn().mockResolvedValue(mockVisit),
        checkout: vi.fn().mockImplementation((id, data) =>
          Promise.resolve({ ...mockVisit, ...data })
        ),
      };

      const result = await checkoutGuestById({
        visitId: "v-1",
        visitRepository,
        checkoutBy: "ADMIN",
      });

      expect(visitRepository.findById).toHaveBeenCalledWith("v-1");
      expect(result.checkoutBy).toBe("ADMIN");
    });
  });

  describe("findActiveVisitByPhone", () => {
    it("menormalisasi nomor HP dan mencari kunjungan aktif", async () => {
      const visitRepository = {
        findActiveByPhone: vi.fn().mockResolvedValue({ id: "v-1", guestName: "Tamu" }),
      };

      const result = await findActiveVisitByPhone({
        phone: "081234567890",
        visitRepository,
      });

      expect(visitRepository.findActiveByPhone).toHaveBeenCalledWith("+6281234567890");
      expect(result.id).toBe("v-1");
    });
  });
});
