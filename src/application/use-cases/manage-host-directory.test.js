import { describe, it, expect, vi } from "vitest";
import { createHost, updateHost, deactivateHost } from "./manage-host-directory";

describe("Use Case: manage-host-directory", () => {
  describe("createHost", () => {
    it("harus membuat host baru dengan validasi data lengkap", async () => {
      const userRepository = {
        findByEmail: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation((data) => Promise.resolve({ id: "host-1", ...data })),
      };

      const result = await createHost({
        input: {
          name: "Host Budi",
          email: "budi@company.com",
          department: "IT Support",
          position: "Lead",
        },
        userRepository,
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Host Budi",
          email: "budi@company.com",
          role: "HOST",
          department: "IT Support",
          position: "Lead",
        })
      );
      expect(result.id).toBe("host-1");
    });

    it("harus menolak jika email host sudah terdaftar", async () => {
      const userRepository = {
        findByEmail: vi.fn().mockResolvedValue({ id: "existing-id" }),
      };

      await expect(
        createHost({
          input: {
            name: "Host Budi",
            email: "budi@company.com",
            department: "IT Support",
            position: "Lead",
          },
          userRepository,
        })
      ).rejects.toThrow("Email sudah terdaftar dalam sistem");
    });
  });

  describe("updateHost", () => {
    it("harus memperbarui field host yang ditentukan", async () => {
      const userRepository = {
        findById: vi.fn().mockResolvedValue({ id: "host-1", role: "HOST" }),
        update: vi.fn().mockResolvedValue({ id: "host-1", department: "HR" }),
      };

      const result = await updateHost({
        hostId: "host-1",
        input: { department: "HR" },
        userRepository,
      });

      expect(userRepository.update).toHaveBeenCalledWith("host-1", { department: "HR" });
      expect(result.department).toBe("HR");
    });

    it("harus menolak update jika host tidak ditemukan atau bukan role HOST", async () => {
      const userRepository = {
        findById: vi.fn().mockResolvedValue({ id: "user-1", role: "ADMIN_HRD" }),
      };

      await expect(
        updateHost({
          hostId: "user-1",
          input: { department: "HR" },
          userRepository,
        })
      ).rejects.toThrow("Host tidak ditemukan");
    });
  });

  describe("deactivateHost (Soft delete — AGENTS.md Bagian 9 Rule #8)", () => {
    it("harus menonaktifkan host dengan mengubah isActive menjadi false", async () => {
      const userRepository = {
        findById: vi.fn().mockResolvedValue({ id: "host-1", role: "HOST", isActive: true }),
        update: vi.fn().mockResolvedValue({ id: "host-1", isActive: false }),
      };

      const result = await deactivateHost({
        hostId: "host-1",
        userRepository,
      });

      expect(userRepository.update).toHaveBeenCalledWith("host-1", { isActive: false });
      expect(result.isActive).toBe(false);
    });
  });
});
