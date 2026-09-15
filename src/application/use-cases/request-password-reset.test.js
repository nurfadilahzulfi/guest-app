import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestPasswordReset } from "./request-password-reset";

describe("requestPasswordReset use case", () => {
  let mockUserRepository;
  let mockTokenService;
  let mockNotificationService;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
    };
    mockTokenService = {
      createInviteToken: vi.fn(),
      createPasswordResetToken: vi.fn(),
      invalidateUserInviteTokens: vi.fn(),
    };
    mockNotificationService = {
      sendPasswordResetEmail: vi.fn(),
    };
  });

  it("harus menolak jika email tidak valid", async () => {
    await expect(
      requestPasswordReset({
        email: "bukan-email",
        userRepository: mockUserRepository,
        tokenService: mockTokenService,
        notificationService: mockNotificationService,
      })
    ).rejects.toThrow("Format alamat email tidak valid");
  });

  it("harus tetap mengembalikan success (user enumeration protection) jika user tidak ditemukan", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await requestPasswordReset({
      email: "tidakada@tanimas.co.id",
      userRepository: mockUserRepository,
      tokenService: mockTokenService,
      notificationService: mockNotificationService,
    });

    expect(result.success).toBe(true);
    expect(mockTokenService.createPasswordResetToken).not.toHaveBeenCalled();
    expect(mockTokenService.createInviteToken).not.toHaveBeenCalled();
    expect(mockNotificationService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("harus tetap mengembalikan success jika user non-aktif (isActive = false)", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      id: "user-1",
      email: "nonaktif@tanimas.co.id",
      role: "ADMINISTRATOR",
      isActive: false,
    });

    const result = await requestPasswordReset({
      email: "nonaktif@tanimas.co.id",
      userRepository: mockUserRepository,
      tokenService: mockTokenService,
      notificationService: mockNotificationService,
    });

    expect(result.success).toBe(true);
    expect(mockTokenService.createPasswordResetToken).not.toHaveBeenCalled();
    expect(mockTokenService.createInviteToken).not.toHaveBeenCalled();
    expect(mockNotificationService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("harus berhasil mengirim email reset untuk karyawan biasa (HOST)", async () => {
    const mockHost = {
      id: "host-1",
      name: "Budi Santoso",
      email: "budi@tanimas.co.id",
      role: "HOST",
      isActive: true,
    };
    mockUserRepository.findByEmail.mockResolvedValue(mockHost);
    mockTokenService.createPasswordResetToken.mockResolvedValue({ token: "reset-host-uuid" });

    const result = await requestPasswordReset({
      email: "budi@tanimas.co.id",
      userRepository: mockUserRepository,
      tokenService: mockTokenService,
      notificationService: mockNotificationService,
      appUrl: "https://guest-oils-tanimas.vercel.app",
    });

    expect(result.success).toBe(true);
    expect(mockTokenService.createPasswordResetToken).toHaveBeenCalledWith("host-1", 10);
    expect(mockNotificationService.sendPasswordResetEmail).toHaveBeenCalledWith({
      user: mockHost,
      resetToken: { token: "reset-host-uuid" },
      resetUrl: "https://guest-oils-tanimas.vercel.app/reset-password/reset-host-uuid",
    });
  });

  it("harus membuat token reset (10 menit), invalidate token lama, dan kirim email untuk ADMINISTRATOR", async () => {
    const mockUser = {
      id: "admin-1",
      name: "Administrator Sistem",
      email: "admin@tanimas.co.id",
      role: "ADMINISTRATOR",
      isActive: true,
    };
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockTokenService.createPasswordResetToken.mockResolvedValue({ token: "reset-uuid-123" });

    const result = await requestPasswordReset({
      email: "Admin@Tanimas.co.id ", // Test case insensitive & trimming
      userRepository: mockUserRepository,
      tokenService: mockTokenService,
      notificationService: mockNotificationService,
      appUrl: "https://guest-oils-tanimas.vercel.app",
    });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("admin@tanimas.co.id");
    expect(mockTokenService.invalidateUserInviteTokens).toHaveBeenCalledWith("admin-1");
    expect(mockTokenService.createPasswordResetToken).toHaveBeenCalledWith("admin-1", 10);
    expect(mockNotificationService.sendPasswordResetEmail).toHaveBeenCalledWith({
      user: mockUser,
      resetToken: { token: "reset-uuid-123" },
      resetUrl: "https://guest-oils-tanimas.vercel.app/reset-password/reset-uuid-123",
    });
    expect(result.success).toBe(true);
  });
});
