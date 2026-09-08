import { describe, it, expect } from "vitest";
import { validateOwnerInput } from "./owner";

describe("Entity Owner", () => {
  describe("validateOwnerInput", () => {
    it("harus valid dan menormalisasi nomor HP jika input benar", () => {
      const result = validateOwnerInput({
        name: "Pak Komisaris",
        phoneNumber: "081234567890",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalized).toEqual({
        name: "Pak Komisaris",
        phoneNumber: "+6281234567890",
      });
    });

    it("harus menolak jika nama owner kosong atau undefined", () => {
      const result = validateOwnerInput({
        phoneNumber: "081234567890",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Nama owner wajib diisi");
      expect(result.normalized).toBeUndefined();
    });

    it("harus menolak jika nomor HP kosong atau undefined", () => {
      const result = validateOwnerInput({
        name: "Pak Komisaris",
        phoneNumber: "",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Nomor HP owner wajib diisi");
      expect(result.normalized).toBeUndefined();
    });

    it("harus menolak jika nomor HP memiliki format tidak valid", () => {
      const result = validateOwnerInput({
        name: "Pak Komisaris",
        phoneNumber: "12345",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.normalized).toBeUndefined();
    });

    it("harus aman dan tidak crash jika input berupa null/undefined", () => {
      const result = validateOwnerInput(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Input tidak valid");
    });
  });
});
