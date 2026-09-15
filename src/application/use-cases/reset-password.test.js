import { describe, it, expect, vi, beforeEach } from "vitest";
import { getResetPasswordInfo, resetPassword } from "./reset-password";

describe("resetPassword and getResetPasswordInfo use case", () => {
  let mockUserRepository;
  let mockTokenService;
  let mockHashPassword;
  let mockTransaction;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      update: vi.fn(),
    };
    mockTokenService = {
      validateInviteToken: vi.fn(),
      markInviteTokenAsUsed: vi.fn(),
    };
    mockHashPassword = vi.fn().mockResolvedValue("hashed_secret_password");
    mockTransaction = vi.fn(async (cb) => cb("mock-tx"));
  });

  describe("getResetPasswordInfo", () => {
    it("harus return null jika token tidak ada atau invalid", async () => {
      mockTokenService.validateInviteToken.mockResolvedValue(null);
      const res = await getResetPasswordInfo({
        token: "invalid-token",
        tokenService: mockTokenService,
        userRepository: mockUserRepository,
      });
      expect(res).toBeNull();
    });

    it("harus return null jika user tidak ditemukan atau nonaktif", async () => {
      mockTokenService.validateInviteToken.mockResolvedValue({ userId: "u-1" });
      mockUserRepository.findById.mockResolvedValue({ id: "u-1", isActive: false });

      const res = await getResetPasswordInfo({
        token: "valid-token",
        tokenService: mockTokenService,
        userRepository: mockUserRepository,
      });
      expect(res).toBeNull();
    });

    it("harus return null jika user BUKAN ADMINISTRATOR (misal HOST)", async () => {
      mockTokenService.validateInviteToken.mockResolvedValue({ userId: "u-host" });
      mockUserRepository.findById.mockResolvedValue({
        id: "u-host",
        name: "Staf Biasa",
        email: "staf@tanimas.co.id",
        role: "HOST",
        isActive: true,
      });

      const res = await getResetPasswordInfo({
        token: "valid-token",
        tokenService: mockTokenService,
        userRepository: mockUserRepository,
      });
      expect(res).toBeNull();
    });

    it("harus return data user jika token valid dan user aktif dengan role ADMINISTRATOR", async () => {
      mockTokenService.validateInviteToken.mockResolvedValue({ userId: "u-1" });
      mockUserRepository.findById.mockResolvedValue({
        id: "u-1",
        name: "Admin",
        email: "admin@tanimas.co.id",
        role: "ADMINISTRATOR",
        department: "IT",
        isActive: true,
      });

      const res = await getResetPasswordInfo({
        token: "valid-token",
        tokenService: mockTokenService,
        userRepository: mockUserRepository,
      });

      expect(res).toEqual({
        name: "Admin",
        email: "admin@tanimas.co.id",
        role: "ADMINISTRATOR",
        department: "IT",
      });
    });
  });

  describe("resetPassword", () => {
    it("harus menolak jika kata sandi kurang dari 8 karakter", async () => {
      await expect(
        resetPassword({
          token: "valid-token",
          newPassword: "pendek",
          userRepository: mockUserRepository,
          tokenService: mockTokenService,
          hashPassword: mockHashPassword,
          transaction: mockTransaction,
        })
      ).rejects.toThrow("Kata sandi minimal 8 karakter");
    });

    it("harus menolak jika token kedaluwarsa atau sudah terpakai", async () => {
      mockTokenService.validateInviteToken.mockResolvedValue(null);

      await expect(
        resetPassword({
          token: "expired-token",
          newPassword: "validPassword123",
          userRepository: mockUserRepository,
          tokenService: mockTokenService,
          hashPassword: mockHashPassword,
          transaction: mockTransaction,
        })
      ).rejects.toThrow("Tautan reset kata sandi tidak valid atau sudah kedaluwarsa");
    });

    it("harus menolak jika user bukan role ADMINISTRATOR", async () => {
      mockTokenService.validateInviteToken.mockResolvedValue({ id: "tok-1", userId: "u-host" });
      mockUserRepository.findById.mockResolvedValue({ id: "u-host", role: "HOST", isActive: true });

      await expect(
        resetPassword({
          token: "tok-1",
          newPassword: "passwordBaru123",
          userRepository: mockUserRepository,
          tokenService: mockTokenService,
          hashPassword: mockHashPassword,
          transaction: mockTransaction,
        })
      ).rejects.toThrow("Pengaturan ulang kata sandi mandiri hanya diperuntukkan bagi Administrator Sistem");
    });

    it("harus berhasil mengupdate password dan menandai token sebagai terpakai untuk role ADMINISTRATOR", async () => {
      mockTokenService.validateInviteToken.mockResolvedValue({ id: "tok-1", userId: "u-1" });
      mockUserRepository.findById.mockResolvedValue({ id: "u-1", role: "ADMINISTRATOR", isActive: true });
      mockUserRepository.update.mockResolvedValue({ id: "u-1", email: "admin@tanimas.co.id" });

      const updated = await resetPassword({
        token: "tok-123",
        newPassword: "newPassword123",
        userRepository: mockUserRepository,
        tokenService: mockTokenService,
        hashPassword: mockHashPassword,
        transaction: mockTransaction,
      });

      expect(mockHashPassword).toHaveBeenCalledWith("newPassword123", 12);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        "u-1",
        { passwordHash: "hashed_secret_password" },
        "mock-tx"
      );
      expect(mockTokenService.markInviteTokenAsUsed).toHaveBeenCalledWith("tok-1", "mock-tx");
      expect(updated.id).toBe("u-1");
    });
  });
});
