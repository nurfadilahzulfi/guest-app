import { describe, it, expect, vi } from "vitest";
import { createOwner, deactivateOwner } from "./manage-owner-list";

describe("Use Case: manage-owner-list", () => {
  describe("createOwner", () => {
    it("harus menormalisasi nomor HP dan menyimpan owner baru", async () => {
      const ownerRepository = {
        findActiveByPhone: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation((data) => Promise.resolve({ id: "owner-1", ...data })),
      };

      const result = await createOwner({
        input: {
          name: "Komisaris Utama",
          phoneNumber: "0812-3456-7890",
        },
        ownerRepository,
      });

      expect(ownerRepository.findActiveByPhone).toHaveBeenCalledWith("+6281234567890");
      expect(ownerRepository.create).toHaveBeenCalledWith({
        name: "Komisaris Utama",
        phoneNumber: "+6281234567890",
      });
      expect(result.id).toBe("owner-1");
    });

    it("harus menolak jika nomor HP sudah terdaftar sebagai owner aktif", async () => {
      const ownerRepository = {
        findActiveByPhone: vi.fn().mockResolvedValue({ id: "existing-owner" }),
      };

      await expect(
        createOwner({
          input: {
            name: "Komisaris Utama",
            phoneNumber: "081234567890",
          },
          ownerRepository,
        })
      ).rejects.toThrow("Nomor HP sudah terdaftar sebagai owner");
    });

    it("harus menolak jika input nama kosong", async () => {
      await expect(
        createOwner({
          input: {
            name: "",
            phoneNumber: "081234567890",
          },
          ownerRepository: {},
        })
      ).rejects.toThrow("Nama owner wajib diisi");
    });
  });

  describe("deactivateOwner (Soft delete)", () => {
    it("harus menonaktifkan owner dengan soft delete (isActive: false)", async () => {
      const ownerRepository = {
        findById: vi.fn().mockResolvedValue({ id: "owner-1", isActive: true }),
        update: vi.fn().mockResolvedValue({ id: "owner-1", isActive: false }),
      };

      const result = await deactivateOwner({
        ownerId: "owner-1",
        ownerRepository,
      });

      expect(ownerRepository.update).toHaveBeenCalledWith("owner-1", { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it("harus melempar error jika owner tidak ditemukan", async () => {
      const ownerRepository = {
        findById: vi.fn().mockResolvedValue(null),
      };

      await expect(
        deactivateOwner({
          ownerId: "nonexistent",
          ownerRepository,
        })
      ).rejects.toThrow("Owner tidak ditemukan");
    });
  });
});
