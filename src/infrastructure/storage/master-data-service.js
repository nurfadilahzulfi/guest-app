import fs from "fs/promises";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "src", "infrastructure", "data", "master-data.json");

const DEFAULT_DATA = {
  departments: [],
  positions: [],
};

/**
 * Service untuk mengelola Master Data Departemen dan Jabatan (Posisi).
 */
export const masterDataService = {
  async getMasterData() {
    try {
      const content = await fs.readFile(FILE_PATH, "utf-8");
      if (!content || !content.trim()) {
        return DEFAULT_DATA;
      }
      try {
        return JSON.parse(content);
      } catch {
        return DEFAULT_DATA;
      }
    } catch {
      return DEFAULT_DATA;
    }
  },

  async saveMasterData(data) {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    const tempPath = `${FILE_PATH}.tmp.${Date.now()}`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempPath, FILE_PATH);
  },

  async getDepartments() {
    const data = await this.getMasterData();
    return data.departments || [];
  },

  async addDepartment(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nama departemen tidak boleh kosong");
    const data = await this.getMasterData();
    if (!data.departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      data.departments.push(trimmed);
      data.departments.sort((a, b) => a.localeCompare(b));
      await this.saveMasterData(data);
    }
    return data.departments;
  },

  async deleteDepartment(name) {
    const trimmed = name.trim();
    const data = await this.getMasterData();
    data.departments = (data.departments || []).filter(
      (d) => d.toLowerCase() !== trimmed.toLowerCase()
    );
    await this.saveMasterData(data);
    return data.departments;
  },

  async getPositions() {
    const data = await this.getMasterData();
    return data.positions || [];
  },

  async addPosition(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nama jabatan tidak boleh kosong");
    const data = await this.getMasterData();
    if (!data.positions.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      data.positions.push(trimmed);
      data.positions.sort((a, b) => a.localeCompare(b));
      await this.saveMasterData(data);
    }
    return data.positions;
  },

  async deletePosition(name) {
    const trimmed = name.trim();
    const data = await this.getMasterData();
    data.positions = (data.positions || []).filter(
      (p) => p.toLowerCase() !== trimmed.toLowerCase()
    );
    await this.saveMasterData(data);
    return data.positions;
  },
};

