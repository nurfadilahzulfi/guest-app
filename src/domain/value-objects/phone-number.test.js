import { describe, it, expect } from "vitest";
import { normalizePhoneNumber } from "./phone-number";

describe("phone-number value object - normalizePhoneNumber", () => {
  it("harus menormalisasi format lokal 08xxx ke +62xxx", () => {
    expect(normalizePhoneNumber("08123456789")).toBe("+628123456789");
    expect(normalizePhoneNumber("081234567890")).toBe("+6281234567890");
    expect(normalizePhoneNumber("0812345678901")).toBe("+62812345678901");
  });

  it("harus menormalisasi format 628xxx (tanpa plus) ke +628xxx", () => {
    expect(normalizePhoneNumber("628123456789")).toBe("+628123456789");
    expect(normalizePhoneNumber("62812345678901")).toBe("+62812345678901");
  });

  it("harus mempertahankan format standar +628xxx", () => {
    expect(normalizePhoneNumber("+628123456789")).toBe("+628123456789");
    expect(normalizePhoneNumber("+6289876543210")).toBe("+6289876543210");
  });

  it("harus membersihkan spasi, strip, dan tanda kurung", () => {
    expect(normalizePhoneNumber("0812-3456-7890")).toBe("+6281234567890");
    expect(normalizePhoneNumber("+62 812 3456 7890")).toBe("+6281234567890");
    expect(normalizePhoneNumber("(0812) 3456-7890")).toBe("+6281234567890");
  });

  it("harus melempar error jika input kosong, null, undefined, atau bukan string", () => {
    expect(() => normalizePhoneNumber("")).toThrow("Nomor HP wajib diisi");
    expect(() => normalizePhoneNumber(null)).toThrow("Nomor HP wajib diisi");
    expect(() => normalizePhoneNumber(undefined)).toThrow("Nomor HP wajib diisi");
    expect(() => normalizePhoneNumber(12345)).toThrow("Nomor HP wajib diisi");
  });

  it("harus melempar error jika format bukan nomor seluler Indonesia (+628)", () => {
    expect(() => normalizePhoneNumber("02112345678")).toThrow(); // nomor telepon rumah
    expect(() => normalizePhoneNumber("+1234567890")).toThrow(); // nomor luar negeri
  });

  it("harus melempar error jika panjang digit tidak sesuai aturan Indonesia (terlalu pendek atau terlalu panjang)", () => {
    expect(() => normalizePhoneNumber("0812345")).toThrow("Nomor HP tidak valid"); // digit setelah 08 kurang dari 8
    expect(() => normalizePhoneNumber("0812345678901234")).toThrow("Nomor HP tidak valid"); // digit terlalu panjang
  });
});
