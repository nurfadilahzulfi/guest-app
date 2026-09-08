import { describe, it, expect } from "vitest";
import {
  validateUserInput,
  canRespondToVisit,
  isAdministrator,
  canViewAllVisits,
} from "./user";

describe("Entity User", () => {
  describe("validateUserInput", () => {
    it("harus valid untuk user biasa non-host (ADMIN_HRD / ADMINISTRATOR)", () => {
      const result = validateUserInput({
        name: "Admin John",
        email: "john@company.com",
        role: "ADMINISTRATOR",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("harus valid untuk role HOST jika dilengkapi department dan position", () => {
      const result = validateUserInput({
        name: "Host Jane",
        email: "jane@company.com",
        role: "HOST",
        department: "Engineering",
        position: "Tech Lead",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("harus menolak jika role HOST tidak memiliki department atau position", () => {
      const result = validateUserInput({
        name: "Host Jane",
        email: "jane@company.com",
        role: "HOST",
        department: "",
        position: "",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Department wajib diisi untuk role HOST");
      expect(result.errors).toContain("Position wajib diisi untuk role HOST");
    });

    it("harus menolak email dengan format tidak valid", () => {
      const result = validateUserInput({
        name: "User",
        email: "not-an-email",
        role: "ADMIN_HRD",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Format email tidak valid");
    });

    it("harus menolak role yang tidak dikenal", () => {
      const result = validateUserInput({
        name: "User",
        email: "user@company.com",
        role: "SECURITY", // Sesuai aturan: tidak ada peran Security
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Role harus HOST, ADMIN_HRD, atau ADMINISTRATOR");
    });

    it("harus menangani input null/undefined secara aman", () => {
      const result = validateUserInput(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Input tidak valid");
    });
  });

  describe("Role Capability Checks (Matriks Kapabilitas)", () => {
    it("canRespondToVisit hanya boleh bernilai true untuk role HOST", () => {
      expect(canRespondToVisit("HOST")).toBe(true);
      expect(canRespondToVisit("ADMIN_HRD")).toBe(false);
      expect(canRespondToVisit("ADMINISTRATOR")).toBe(false);
    });

    it("isAdministrator hanya boleh bernilai true untuk role ADMINISTRATOR", () => {
      expect(isAdministrator("ADMINISTRATOR")).toBe(true);
      expect(isAdministrator("ADMIN_HRD")).toBe(false);
      expect(isAdministrator("HOST")).toBe(false);
    });

    it("canViewAllVisits boleh untuk ADMIN_HRD dan ADMINISTRATOR, tetapi tidak untuk HOST", () => {
      expect(canViewAllVisits("ADMIN_HRD")).toBe(true);
      expect(canViewAllVisits("ADMINISTRATOR")).toBe(true);
      expect(canViewAllVisits("HOST")).toBe(false);
    });
  });
});
