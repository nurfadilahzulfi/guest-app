import { describe, it, expect } from "vitest";
import { localStorageService } from "./local-storage-service";

describe("Infrastructure: localStorageService", () => {
  it("harus mengembalikan Base64 Data URL langsung (tanpa menulis ke disk) agar kompatibel dengan Vercel", async () => {
    // 1x1 transparent PNG base64
    const sampleBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const resultUrl = await localStorageService.saveVisitorPhoto(sampleBase64, "test_visitor");

    // Di Vercel, hasil kembalian adalah Data URL itu sendiri (bukan path file)
    expect(resultUrl).toBe(sampleBase64);
    expect(resultUrl).toMatch(/^data:image\//);
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
