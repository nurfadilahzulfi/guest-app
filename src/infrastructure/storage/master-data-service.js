import fs from "fs/promises";
import path from "path";
import { prisma } from "../prisma/client.js";

const FILE_PATH = path.join(process.cwd(), "src", "infrastructure", "data", "master-data.json");

const DEFAULT_DEPARTMENTS = ["IT", "PPIC", "HRD", "Finance", "Operasional"];
const DEFAULT_POSITIONS = ["Head of IT", "Admin PPIC", "Staff", "Manager", "Supervisor"];

const TOKEN_KEY_DEPT = "MASTER_DATA_DEPARTMENTS";
const TOKEN_KEY_POS = "MASTER_DATA_POSITIONS";

/**
 * Service untuk mengelola Master Data Departemen dan Jabatan (Posisi).
 * Mendukung persistensi ganda: database PostgreSQL (production Vercel)
 * dan fallback lokal file JSON (development/offline).
 */
export const masterDataService = {
  /**
   * Mengambil seluruh daftar departemen.
   * @returns {Promise<string[]>}
   */
  async getDepartments() {
    try {
      const record = await prisma.verificationToken.findFirst({
        where: { identifier: TOKEN_KEY_DEPT },
      });
      if (record?.token) {
        const parsed = JSON.parse(record.token);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => a.localeCompare(b));
        }
      }
    } catch (dbErr) {
      console.warn("Gagal membaca master departemen dari DB, mencoba file:", dbErr.message);
    }

    // Fallback baca file lokal
    let list = await this.readDepartmentsFromFile();
    if (!list || list.length === 0) {
      list = [...DEFAULT_DEPARTMENTS];
    }

    // Coba simpan ke DB agar selanjutnya tersinkronisasi
    try {
      await this.saveDepartmentsToDb(list);
    } catch {
      // Abaikan jika DB belum siap
    }

    return list.sort((a, b) => a.localeCompare(b));
  },

  /**
   * Mengambil seluruh daftar jabatan / posisi.
   * @returns {Promise<string[]>}
   */
  async getPositions() {
    try {
      const record = await prisma.verificationToken.findFirst({
        where: { identifier: TOKEN_KEY_POS },
      });
      if (record?.token) {
        const parsed = JSON.parse(record.token);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => a.localeCompare(b));
        }
      }
    } catch (dbErr) {
      console.warn("Gagal membaca master jabatan dari DB, mencoba file:", dbErr.message);
    }

    // Fallback baca file lokal
    let list = await this.readPositionsFromFile();
    if (!list || list.length === 0) {
      list = [...DEFAULT_POSITIONS];
    }

    // Coba simpan ke DB agar selanjutnya tersinkronisasi
    try {
      await this.savePositionsToDb(list);
    } catch {
      // Abaikan jika DB belum siap
    }

    return list.sort((a, b) => a.localeCompare(b));
  },

  /**
   * Menambahkan departemen baru ke master data.
   * @param {string} name
   * @returns {Promise<string[]>}
   */
  async addDepartment(name) {
    const trimmed = name?.trim();
    if (!trimmed) throw new Error("Nama departemen tidak boleh kosong");

    const current = await this.getDepartments();
    if (current.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      return current; // Sudah ada
    }

    const updated = [...current, trimmed].sort((a, b) => a.localeCompare(b));
    await this.saveDepartmentsToDb(updated);
    await this.saveToFileSafe({ departments: updated });
    return updated;
  },

  /**
   * Mengubah nama departemen dan meng-cascade update ke seluruh data user di database.
   * @param {string} oldName
   * @param {string} newName
   * @returns {Promise<string[]>}
   */
  async renameDepartment(oldName, newName) {
    const trimmedOld = oldName?.trim();
    const trimmedNew = newName?.trim();
    if (!trimmedNew) throw new Error("Nama departemen baru tidak boleh kosong");

    const current = await this.getDepartments();
    const index = current.findIndex((d) => d.toLowerCase() === trimmedOld.toLowerCase());
    if (index === -1) throw new Error("Departemen tidak ditemukan");

    if (
      current.some(
        (d, i) => i !== index && d.toLowerCase() === trimmedNew.toLowerCase()
      )
    ) {
      throw new Error("Nama departemen sudah ada");
    }

    current[index] = trimmedNew;
    const updated = [...current].sort((a, b) => a.localeCompare(b));

    // Update di DB master
    await this.saveDepartmentsToDb(updated);
    await this.saveToFileSafe({ departments: updated });

    // Cascade update ke semua akun user yang memakai departemen ini
    try {
      await prisma.user.updateMany({
        where: { department: trimmedOld },
        data: { department: trimmedNew },
      });
    } catch (err) {
      console.warn("Cascade update department to users error:", err.message);
    }

    return updated;
  },

  /**
   * Menghapus departemen dari master data.
   * @param {string} name
   * @returns {Promise<string[]>}
   */
  async deleteDepartment(name) {
    const trimmed = name?.trim();
    const current = await this.getDepartments();
    const updated = current.filter((d) => d.toLowerCase() !== trimmed.toLowerCase());

    await this.saveDepartmentsToDb(updated);
    await this.saveToFileSafe({ departments: updated });
    return updated;
  },

  /**
   * Menambahkan jabatan baru ke master data.
   * @param {string} name
   * @returns {Promise<string[]>}
   */
  async addPosition(name) {
    const trimmed = name?.trim();
    if (!trimmed) throw new Error("Nama jabatan tidak boleh kosong");

    const current = await this.getPositions();
    if (current.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      return current; // Sudah ada
    }

    const updated = [...current, trimmed].sort((a, b) => a.localeCompare(b));
    await this.savePositionsToDb(updated);
    await this.saveToFileSafe({ positions: updated });
    return updated;
  },

  /**
   * Mengubah nama jabatan dan meng-cascade update ke seluruh data user di database.
   * @param {string} oldName
   * @param {string} newName
   * @returns {Promise<string[]>}
   */
  async renamePosition(oldName, newName) {
    const trimmedOld = oldName?.trim();
    const trimmedNew = newName?.trim();
    if (!trimmedNew) throw new Error("Nama jabatan baru tidak boleh kosong");

    const current = await this.getPositions();
    const index = current.findIndex((p) => p.toLowerCase() === trimmedOld.toLowerCase());
    if (index === -1) throw new Error("Jabatan tidak ditemukan");

    if (
      current.some(
        (p, i) => i !== index && p.toLowerCase() === trimmedNew.toLowerCase()
      )
    ) {
      throw new Error("Nama jabatan sudah ada");
    }

    current[index] = trimmedNew;
    const updated = [...current].sort((a, b) => a.localeCompare(b));

    // Update di DB master
    await this.savePositionsToDb(updated);
    await this.saveToFileSafe({ positions: updated });

    // Cascade update ke semua akun user yang memakai posisi ini
    try {
      await prisma.user.updateMany({
        where: { position: trimmedOld },
        data: { position: trimmedNew },
      });
    } catch (err) {
      console.warn("Cascade update position to users error:", err.message);
    }

    return updated;
  },

  /**
   * Menghapus jabatan dari master data.
   * @param {string} name
   * @returns {Promise<string[]>}
   */
  async deletePosition(name) {
    const trimmed = name?.trim();
    const current = await this.getPositions();
    const updated = current.filter((p) => p.toLowerCase() !== trimmed.toLowerCase());

    await this.savePositionsToDb(updated);
    await this.saveToFileSafe({ positions: updated });
    return updated;
  },

  // === Helper Simpan DB ===
  async saveDepartmentsToDb(departments) {
    try {
      await prisma.verificationToken.deleteMany({
        where: { identifier: TOKEN_KEY_DEPT },
      });
      await prisma.verificationToken.create({
        data: {
          identifier: TOKEN_KEY_DEPT,
          token: JSON.stringify(departments),
          expires: new Date("2100-01-01"),
        },
      });
    } catch (err) {
      console.warn("Gagal simpan departemen ke DB:", err.message);
    }
  },

  async savePositionsToDb(positions) {
    try {
      await prisma.verificationToken.deleteMany({
        where: { identifier: TOKEN_KEY_POS },
      });
      await prisma.verificationToken.create({
        data: {
          identifier: TOKEN_KEY_POS,
          token: JSON.stringify(positions),
          expires: new Date("2100-01-01"),
        },
      });
    } catch (err) {
      console.warn("Gagal simpan jabatan ke DB:", err.message);
    }
  },

  // === Helper File Lokal (Aman di Vercel read-only) ===
  async readDepartmentsFromFile() {
    try {
      const content = await fs.readFile(FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      return parsed.departments || [];
    } catch {
      return [];
    }
  },

  async readPositionsFromFile() {
    try {
      const content = await fs.readFile(FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      return parsed.positions || [];
    } catch {
      return [];
    }
  },

  async saveToFileSafe(partial) {
    try {
      let currentData = { departments: [], positions: [] };
      try {
        const content = await fs.readFile(FILE_PATH, "utf-8");
        currentData = JSON.parse(content);
      } catch {
        // Abaikan
      }
      const merged = { ...currentData, ...partial };
      await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
      const tempPath = `${FILE_PATH}.tmp.${Date.now()}`;
      await fs.writeFile(tempPath, JSON.stringify(merged, null, 2), "utf-8");
      await fs.rename(tempPath, FILE_PATH);
    } catch (err) {
      // Pada Vercel, filesystem read-only, abaikan error file karena DB sudah menyimpan datanya
      console.warn("Info: file master data tidak dapat ditulis (normal di serverless Vercel):", err.message);
    }
  },
};
