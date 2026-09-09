import { describe, it, expect, vi } from "vitest";
import { inviteUser } from "./invite-user";

describe("Use Case: inviteUser", () => {
  it("harus berhasil mengundang user baru, membuat token invite 72 jam, dan mengirim email", async () => {
    const mockCreatedUser = {
      id: "user-1",
      name: "Staff Baru",
      email: "staff@company.com",
      role: "HOST",
      department: "Finance",
      position: "Accountant",
      isDepartmentHead: false,
    };

    const mockInviteToken = {
      id: "tok-1",
      token: "invite-uuid-1",
      userId: "user-1",
    };

    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockCreatedUser),
    };

    const tokenService = {
      createInviteToken: vi.fn().mockResolvedValue(mockInviteToken),
    };

    const notificationService = {
      sendInviteEmail: vi.fn().mockResolvedValue(undefined),
    };

    const result = await inviteUser({
      input: {
        name: "Staff Baru",
        email: "staff@company.com",
        role: "HOST",
        department: "Finance",
        position: "Accountant",
      },
      userRepository,
      tokenService,
      notificationService,
      appUrl: "http://localhost:3000",
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith("staff@company.com");
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Staff Baru",
        email: "staff@company.com",
        role: "HOST",
        department: "Finance",
        position: "Accountant",
        isDepartmentHead: false,
      })
    );
    expect(tokenService.createInviteToken).toHaveBeenCalledWith("user-1", 72);
    expect(notificationService.sendInviteEmail).toHaveBeenCalledWith({
      user: mockCreatedUser,
      inviteToken: mockInviteToken,
      inviteUrl: "http://localhost:3000/invite/invite-uuid-1",
    });
    expect(result).toEqual(
      expect.objectContaining({
        ...mockCreatedUser,
        inviteToken: "invite-uuid-1",
        inviteUrl: "http://localhost:3000/invite/invite-uuid-1",
      })
    );
  });

  it("harus menolak jika email sudah terdaftar dalam sistem", async () => {
    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue({ id: "existing-user" }),
    };

    await expect(
      inviteUser({
        input: {
          name: "Staff",
          email: "staff@company.com",
          role: "ADMIN_HRD",
        },
        userRepository,
        tokenService: {},
        notificationService: {},
        appUrl: "http://localhost:3000",
      })
    ).rejects.toThrow("Email sudah terdaftar dalam sistem");
  });

  it("harus menolak jika data input tidak valid sebelum mengakses repository", async () => {
    await expect(
      inviteUser({
        input: {
          name: "",
          email: "invalid-email",
          role: "INVALID_ROLE",
        },
        userRepository: {},
        tokenService: {},
        notificationService: {},
        appUrl: "http://localhost:3000",
      })
    ).rejects.toThrow();
  });
});
