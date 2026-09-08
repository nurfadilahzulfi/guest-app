import { describe, it, expect } from "vitest";
import {
  determineVisitorType,
  determineInitialStatus,
  isValidStatusTransition,
  validateVisitInput,
} from "./visit";

describe("Entity Visit", () => {
  describe("determineVisitorType", () => {
    it("harus mengembalikan OWNER jika isOwner bernilai true", () => {
      expect(determineVisitorType(true)).toBe("OWNER");
    });

    it("harus mengembalikan REGULAR jika isOwner bernilai false", () => {
      expect(determineVisitorType(false)).toBe("REGULAR");
    });
  });

  describe("determineInitialStatus", () => {
    it("harus mengembalikan APPROVED untuk jenis kunjungan OWNER (langsung disetujui)", () => {
      expect(determineInitialStatus("OWNER")).toBe("APPROVED");
    });

    it("harus mengembalikan PENDING untuk jenis kunjungan REGULAR", () => {
      expect(determineInitialStatus("REGULAR")).toBe("PENDING");
    });
  });

  describe("isValidStatusTransition", () => {
    it("harus mengizinkan transisi PENDING -> APPROVED", () => {
      expect(isValidStatusTransition("PENDING", "APPROVED")).toBe(true);
    });

    it("harus mengizinkan transisi PENDING -> REJECTED", () => {
      expect(isValidStatusTransition("PENDING", "REJECTED")).toBe(true);
    });

    it("tidak boleh mengizinkan transisi balik dari APPROVED", () => {
      expect(isValidStatusTransition("APPROVED", "PENDING")).toBe(false);
      expect(isValidStatusTransition("APPROVED", "REJECTED")).toBe(false);
    });

    it("tidak boleh mengizinkan transisi balik dari REJECTED", () => {
      expect(isValidStatusTransition("REJECTED", "PENDING")).toBe(false);
      expect(isValidStatusTransition("REJECTED", "APPROVED")).toBe(false);
    });
  });

  describe("validateVisitInput", () => {
    it("harus valid ketika semua field wajib terisi dengan benar", () => {
      const result = validateVisitInput({
        guestName: "Budi Santoso",
        guestPhone: "081234567890",
        purpose: "Meeting vendor",
        hostId: "host-uuid-1",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("harus menolak input yang tidak lengkap atau kosong", () => {
      const result = validateVisitInput({
        guestName: "   ",
        guestPhone: "",
        purpose: "",
        hostId: "",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Nama tamu wajib diisi");
      expect(result.errors).toContain("Nomor HP tamu wajib diisi");
      expect(result.errors).toContain("Tujuan kunjungan wajib diisi");
      expect(result.errors).toContain("Host tujuan wajib dipilih");
    });

    it("harus menolak jika input null atau undefined tanpa crash", () => {
      const result = validateVisitInput(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Input tidak valid");
    });

    it("harus memvalidasi foto wajah tamu saat requirePhoto diaktifkan", () => {
      // Gagal saat requirePhoto true tapi guestPhoto kosong
      const invalid = validateVisitInput({
        guestName: "Budi Santoso",
        guestPhone: "081234567890",
        purpose: "Meeting",
        hostId: "host-uuid-1",
        requirePhoto: true,
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("Foto wajah tamu wajib diambil");

      // Sukses saat requirePhoto true dan guestPhoto ada
      const valid = validateVisitInput({
        guestName: "Budi Santoso",
        guestPhone: "081234567890",
        purpose: "Meeting",
        hostId: "host-uuid-1",
        requirePhoto: true,
        guestPhoto: "data:image/jpeg;base64,samplephoto",
      });
      expect(valid.valid).toBe(true);
    });
  });
});
