import { describe, it, expect, vi } from "vitest";
import { activateUser, getInviteInfo } from "./activate-user";

describe("Use Case: activateUser", () => {
  const mockInviteToken = {
    id: "invite-tok-1",
    token: "valid-invite-uuid",
    userId: "user-1",
    usedAt: null,
    expiresAt: new Date(Date.now() + 100000),
  };

  it("harus mengaktivasi user dengan memvalidasi token, hashing password, dan update di dalam transaksi", async () => {
    const userRepository = {
      update: vi.fn().mockResolvedValue({ id: "user-1", email: "user@company.com" }),
    };
    const tokenService = {
      validateInviteToken: vi.fn().mockResolvedValue(mockInviteToken),
      markInviteTokenAsUsed: vi.fn().mockResolvedValue(undefined),
    };
    const hashPassword = vi.fn().mockResolvedValue("hashed-secret-password");
    const transaction = vi.fn(async (cb) => cb("mock-tx"));

    const result = await activateUser({
      token: "valid-invite-uuid",
      password: "strongpassword123",
      userRepository,
      tokenService,
      hashPassword,
      transaction,
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tokenService.validateInviteToken).toHaveBeenCalledWith("valid-invite-uuid", "mock-tx");
    expect(hashPassword).toHaveBeenCalledWith("strongpassword123", 12);
    expect(userRepository.update).toHaveBeenCalledWith(
      "user-1",
      { passwordHash: "hashed-secret-password" },
      "mock-tx"
    );
    expect(tokenService.markInviteTokenAsUsed).toHaveBeenCalledWith("invite-tok-1", "mock-tx");
    expect(result.id).toBe("user-1");
  });

  it("harus menolak jika panjang password kurang dari 8 karakter", async () => {
    await expect(
      activateUser({
        token: "valid-invite-uuid",
        password: "short",
        userRepository: {},
        tokenService: {},
        hashPassword: vi.fn(),
        transaction: vi.fn(),
      })
    ).rejects.toThrow("Password minimal 8 karakter");
  });

  it("harus menolak jika token tidak valid, kedaluwarsa, atau sudah terpakai", async () => {
    const tokenService = {
      validateInviteToken: vi.fn().mockResolvedValue(null),
    };
    const transaction = vi.fn(async (cb) => cb("mock-tx"));

    await expect(
      activateUser({
        token: "expired-token",
        password: "strongpassword123",
        userRepository: {},
        tokenService,
        hashPassword: vi.fn(),
        transaction,
      })
    ).rejects.toThrow("Token undangan tidak valid, sudah digunakan, atau sudah kedaluwarsa");
  });
});

describe("Use Case: getInviteInfo (GET idempotency)", () => {
  it("harus mengembalikan info user jika token valid", async () => {
    const tokenService = {
      validateInviteToken: vi.fn().mockResolvedValue({ userId: "user-1" }),
    };
    const userRepository = {
      findById: vi.fn().mockResolvedValue({
        name: "Jane Doe",
        email: "jane@company.com",
        role: "HOST",
      }),
    };

    const result = await getInviteInfo({
      token: "valid-token",
      tokenService,
      userRepository,
    });

    expect(result).toEqual({
      userName: "Jane Doe",
      userEmail: "jane@company.com",
      userRole: "HOST",
    });
  });

  it("harus mengembalikan null jika token tidak valid", async () => {
    const tokenService = {
      validateInviteToken: vi.fn().mockResolvedValue(null),
    };

    const result = await getInviteInfo({
      token: "invalid-token",
      tokenService,
      userRepository: {},
    });

    expect(result).toBeNull();
  });
});
