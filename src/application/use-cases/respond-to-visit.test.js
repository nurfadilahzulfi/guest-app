import { describe, it, expect, vi } from "vitest";
import { respondToVisit, getVisitByActionToken, respondToVisitDirectly } from "./respond-to-visit";

describe("Use Case: respondToVisit", () => {
  const mockToken = {
    id: "token-id-1",
    token: "magic-uuid-1",
    visitId: "visit-1",
    usedAt: null,
    expiresAt: new Date(Date.now() + 100000),
  };

  const mockPendingVisit = {
    id: "visit-1",
    status: "PENDING",
    guestName: "Agus Tamu",
  };

  it("harus menyetujui kunjungan (APPROVED) dan menandai token sudah terpakai di dalam transaksi", async () => {
    const updatedMockVisit = {
      ...mockPendingVisit,
      status: "APPROVED",
      hostReply: "Silakan tunggu di lobi",
      respondedAt: new Date(),
    };

    const tokenService = {
      validateHostActionToken: vi.fn().mockResolvedValue(mockToken),
      markTokenAsUsed: vi.fn().mockResolvedValue(undefined),
    };

    const visitRepository = {
      findById: vi.fn().mockResolvedValue(mockPendingVisit),
      updateStatus: vi.fn().mockResolvedValue(updatedMockVisit),
    };

    // Mock transaction runner
    const transaction = vi.fn(async (callback) => callback("mock-tx"));

    const result = await respondToVisit({
      token: "magic-uuid-1",
      action: "APPROVED",
      hostReply: "Silakan tunggu di lobi",
      visitRepository,
      tokenService,
      transaction,
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tokenService.validateHostActionToken).toHaveBeenCalledWith("magic-uuid-1", "mock-tx");
    expect(visitRepository.findById).toHaveBeenCalledWith("visit-1", "mock-tx");
    expect(visitRepository.updateStatus).toHaveBeenCalledWith(
      "visit-1",
      expect.objectContaining({
        status: "APPROVED",
        hostReply: "Silakan tunggu di lobi",
      }),
      "mock-tx"
    );
    expect(tokenService.markTokenAsUsed).toHaveBeenCalledWith("token-id-1", "mock-tx");
    expect(result.status).toBe("APPROVED");
  });

  it("harus menolak kunjungan (REJECTED) jika host memilih REJECTED", async () => {
    const updatedMockVisit = {
      ...mockPendingVisit,
      status: "REJECTED",
      hostReply: "Sedang di luar kantor",
      respondedAt: new Date(),
    };

    const tokenService = {
      validateHostActionToken: vi.fn().mockResolvedValue(mockToken),
      markTokenAsUsed: vi.fn().mockResolvedValue(undefined),
    };

    const visitRepository = {
      findById: vi.fn().mockResolvedValue(mockPendingVisit),
      updateStatus: vi.fn().mockResolvedValue(updatedMockVisit),
    };

    const transaction = vi.fn(async (callback) => callback("mock-tx"));

    const result = await respondToVisit({
      token: "magic-uuid-1",
      action: "REJECTED",
      hostReply: "Sedang di luar kantor",
      visitRepository,
      tokenService,
      transaction,
    });

    expect(visitRepository.updateStatus).toHaveBeenCalledWith(
      "visit-1",
      expect.objectContaining({ status: "REJECTED" }),
      "mock-tx"
    );
    expect(result.status).toBe("REJECTED");
  });

  it("harus menolak action selain APPROVED atau REJECTED", async () => {
    await expect(
      respondToVisit({
        token: "magic-uuid-1",
        action: "CANCELLED",
        visitRepository: {},
        tokenService: {},
        transaction: vi.fn(),
      })
    ).rejects.toThrow("Action harus APPROVED atau REJECTED");
  });

  it("harus melempar error jika token invalid, kedaluwarsa, atau sudah dipakai", async () => {
    const tokenService = {
      validateHostActionToken: vi.fn().mockResolvedValue(null),
    };

    const transaction = vi.fn(async (callback) => callback("mock-tx"));

    await expect(
      respondToVisit({
        token: "invalid-token",
        action: "APPROVED",
        visitRepository: {},
        tokenService,
        transaction,
      })
    ).rejects.toThrow("Token tidak valid, sudah digunakan, atau sudah kedaluwarsa");
  });

  it("harus melempar error jika status visit saat ini bukan PENDING (tidak boleh transisi balik)", async () => {
    const tokenService = {
      validateHostActionToken: vi.fn().mockResolvedValue(mockToken),
    };

    const visitRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "visit-1",
        status: "APPROVED", // sudah disetujui sebelumnya
      }),
    };

    const transaction = vi.fn(async (callback) => callback("mock-tx"));

    await expect(
      respondToVisit({
        token: "magic-uuid-1",
        action: "REJECTED",
        visitRepository,
        tokenService,
        transaction,
      })
    ).rejects.toThrow("Tidak bisa mengubah status dari APPROVED ke REJECTED");
  });
});

describe("Use Case: getVisitByActionToken (GET idempotency)", () => {
  it("harus mengembalikan data visit jika token valid tanpa mengubah data apa pun", async () => {
    const mockToken = { visitId: "visit-1" };
    const mockVisit = { id: "visit-1", guestName: "Tamu" };

    const tokenService = {
      validateHostActionToken: vi.fn().mockResolvedValue(mockToken),
    };
    const visitRepository = {
      findById: vi.fn().mockResolvedValue(mockVisit),
    };

    const result = await getVisitByActionToken({
      token: "valid-token",
      tokenService,
      visitRepository,
    });

    expect(result).toEqual(mockVisit);
  });

  it("harus mengembalikan null jika token tidak valid atau expired", async () => {
    const tokenService = {
      validateHostActionToken: vi.fn().mockResolvedValue(null),
    };

    const result = await getVisitByActionToken({
      token: "invalid-token",
      tokenService,
      visitRepository: {},
    });

    expect(result).toBeNull();
  });
});

describe("Use Case: respondToVisitDirectly (Dashboard Host Action)", () => {
  const mockPendingVisit = {
    id: "visit-123",
    hostId: "host-me",
    status: "PENDING",
    guestName: "Budi Tamu",
  };

  it("harus menyetujui kunjungan langsung jika host yang login adalah host tujuan", async () => {
    const visitRepository = {
      findById: vi.fn().mockResolvedValue(mockPendingVisit),
      updateStatus: vi.fn().mockResolvedValue({
        ...mockPendingVisit,
        status: "APPROVED",
        hostReply: "Silakan ke lantai 3",
      }),
    };

    const result = await respondToVisitDirectly({
      visitId: "visit-123",
      hostUserId: "host-me",
      action: "APPROVED",
      hostReply: "Silakan ke lantai 3",
      visitRepository,
    });

    expect(result.status).toBe("APPROVED");
    expect(result.hostReply).toBe("Silakan ke lantai 3");
    expect(visitRepository.updateStatus).toHaveBeenCalledWith(
      "visit-123",
      expect.objectContaining({
        status: "APPROVED",
        hostReply: "Silakan ke lantai 3",
      }),
      null
    );
  });

  it("harus menolak aksi jika user yang login BUKAN host tujuan dari kunjungan tersebut", async () => {
    const visitRepository = {
      findById: vi.fn().mockResolvedValue(mockPendingVisit),
      updateStatus: vi.fn(),
    };

    await expect(
      respondToVisitDirectly({
        visitId: "visit-123",
        hostUserId: "host-other",
        action: "APPROVED",
        visitRepository,
      })
    ).rejects.toThrow("Anda tidak memiliki hak untuk merespon kunjungan staf lain");
  });

  it("harus menolak jika status kunjungan bukan PENDING (misal sudah APPROVED)", async () => {
    const visitRepository = {
      findById: vi.fn().mockResolvedValue({
        ...mockPendingVisit,
        status: "APPROVED",
      }),
      updateStatus: vi.fn(),
    };

    await expect(
      respondToVisitDirectly({
        visitId: "visit-123",
        hostUserId: "host-me",
        action: "REJECTED",
        visitRepository,
      })
    ).rejects.toThrow("Tidak bisa mengubah status kunjungan dari APPROVED ke REJECTED");
  });
});
