import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "visitors");

/**
 * Service penyimpanan lokal untuk foto selfie pengunjung.
 */
export const localStorageService = {
  /**
   * Menyimpan foto pengunjung dari format Base64 Data URL ke filesystem lokal.
   * @param {string} photoData - Base64 Data URL (misal: "data:image/jpeg;base64,...") atau URL langsung
   * @param {string} [prefix="visitor"] - Awalan nama file
   * @returns {Promise<string|null>} URL publik file (misal: "/uploads/visitors/visitor_abc.jpg")
   */
  async saveVisitorPhoto(photoData, prefix = "visitor") {
    if (!photoData || typeof photoData !== "string") {
      return null;
    }

    // Jika sudah berupa URL relatif atau absolut, kembalikan langsung
    if (photoData.startsWith("http://") || photoData.startsWith("https://") || photoData.startsWith("/uploads/")) {
      return photoData;
    }

    // Pastikan direktori tujuan tersedia
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Deteksi ekstensi dari mime type data URL
    let extension = "jpg";
    let base64String = photoData;

    const matches = photoData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (matches) {
      const mime = matches[1].toLowerCase();
      extension = mime === "jpeg" ? "jpg" : mime;
      base64String = matches[2];
    }

    const buffer = Buffer.from(base64String, "base64");
    const uniqueId = crypto.randomUUID();
    const filename = `${prefix}_${uniqueId}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filePath, buffer);

    return `/uploads/visitors/${filename}`;
  },
};
