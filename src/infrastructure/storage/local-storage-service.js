import crypto from "crypto";

export const localStorageService = {
  /**
   * @param {string} photoData - Base64 Data URL (misal: "data:image/jpeg;base64,...") atau URL langsung
   * @param {string} [prefix="visitor"] - Tidak digunakan, disimpan untuk kompatibilitas API
   * @returns {Promise<string|null>} Base64 Data URL atau URL yang sama jika sudah berupa URL
   */
  async saveVisitorPhoto(photoData, prefix = "visitor") {
    if (!photoData || typeof photoData !== "string") {
      return null;
    }

    if (
      photoData.startsWith("http://") ||
      photoData.startsWith("https://") ||
      photoData.startsWith("/uploads/")
    ) {
      return photoData;
    }

    if (photoData.startsWith("data:image/")) {
      return photoData.replace(/\s+/g, "");
    }

    return null;
  },
};
