import { describe, it, expect, afterAll } from "vitest";
import { localStorageService } from "./local-storage-service";
import fs from "fs/promises";
import path from "path";

describe("Infrastructure: localStorageService", () => {
  const createdFiles = [];

  afterAll(async () => {
    // Cleanup file yang dibuat selama testing
    for (const fileUrl of createdFiles) {
      try {
        const fullPath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
        await fs.unlink(fullPath);
      } catch {
        // Abaikan jika file sudah tidak ada
      }
    }
  });

  it("harus menyimpan Data URL base64 ke folder uploads dan mengembalikan path URL", async () => {
    // 1x1 transparent PNG base64
    const sampleBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const resultUrl = await localStorageService.saveVisitorPhoto(sampleBase64, "test_visitor");

    expect(resultUrl).toMatch(/^\/uploads\/visitors\/test_visitor_[a-f0-9-]+\.png$/);
    createdFiles.push(resultUrl);

    // Pastikan file benar-benar ada di filesystem
    const diskPath = path.join(process.cwd(), "public", resultUrl.replace(/^\//, ""));
    const stat = await fs.stat(diskPath);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(0);
  });

  it("harus langsung mengembalikan URL jika input sudah berupa URL http/https atau /uploads/", async () => {
    const httpUrl = "https://example.com/photo.jpg";
    expect(await localStorageService.saveVisitorPhoto(httpUrl)).toBe(httpUrl);

    const localUrl = "/uploads/visitors/existing.jpg";
    expect(await localStorageService.saveVisitorPhoto(localUrl)).toBe(localUrl);
  });

  it("harus mengembalikan null jika input null, undefined, atau bukan string", async () => {
    expect(await localStorageService.saveVisitorPhoto(null)).toBeNull();
    expect(await localStorageService.saveVisitorPhoto(undefined)).toBeNull();
    expect(await localStorageService.saveVisitorPhoto(12345)).toBeNull();
  });
});
