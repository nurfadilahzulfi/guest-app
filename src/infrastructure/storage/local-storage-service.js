import crypto from "crypto";

/**
 * Service penyimpanan foto pengunjung.
 * Di Vercel (serverless, read-only filesystem), foto disimpan langsung sebagai Base64 Data URL
 * ke kolom database (guestPhotoUrl) alih-alih ke disk lokal.
 * Di development lokal, perilaku yang sama dipakai agar konsisten.
 */
export const localStorageService = {
  /**
   * Menangani foto pengunjung dari format Base64 Data URL.
   * Mengembalikan Base64 Data URL langsung agar bisa disimpan ke database (guestPhotoUrl).
   * Kompatibel dengan Vercel serverless (tidak ada fs.writeFile ke disk).
   * @param {string} photoData - Base64 Data URL (misal: "data:image/jpeg;base64,...") atau URL langsung
   * @param {string} [prefix="visitor"] - Tidak digunakan, disimpan untuk kompatibilitas API
   * @returns {Promise<string|null>} Base64 Data URL atau URL yang sama jika sudah berupa URL
   */
  async saveVisitorPhoto(photoData, prefix = "visitor") {
    if (!photoData || typeof photoData !== "string") {
      return null;
    }

    // Jika sudah berupa URL absolut atau relatif, kembalikan langsung
    if (
      photoData.startsWith("http://") ||
      photoData.startsWith("https://") ||
      photoData.startsWith("/uploads/")
    ) {
      return photoData;
    }

    // Jika Base64 Data URL — kembalikan langsung untuk disimpan ke database
    if (photoData.startsWith("data:image/")) {
      // Kompresi ringan: pastikan tidak ada whitespace/linebreak
      return photoData.replace(/\s+/g, "");
    }

    // Fallback: string tidak dikenal, kembalikan null
    return null;
  },
};
