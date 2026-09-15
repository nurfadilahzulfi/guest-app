"use client";

import { useEffect } from "react";

/**
 * Komponen keamanan pelindung antarmuka (Anti-Inspect Guard).
 * Mencegah klik kanan (context menu), tombol pintas DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U),
 * serta menampilkan peringatan keamanan resmi di konsol browser.
 */
export function AntiInspectGuard() {
  useEffect(() => {
    // 1. Blokir Menu Klik Kanan
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 2. Blokir Shortcut Keyboard DevTools & View Source
    const handleKeyDown = (e) => {
      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0;

      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey;

      // Tombol F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + Shift + I / J / C (DevTools Inspector / Console)
      if (
        ctrlOrMeta &&
        e.shiftKey &&
        ["i", "I", "j", "J", "c", "C"].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + U (Lihat Source Code / View Page Source)
      if (ctrlOrMeta && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + S (Simpan Halaman Web)
      if (ctrlOrMeta && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Peringatan Keamanan di Browser Console
    try {
      console.log(
        "%c⚠️ PERINGATAN KEAMANAN — PT. TANIMAS RESOURCES INTERNASIONAL",
        "color: #dc2626; font-size: 22px; font-weight: 800; padding: 6px 0;"
      );
      console.log(
        "%cArea ini adalah antarmuka internal yang dilindungi. Dilarang menyalin, mengubah, atau menyisipkan skrip asing ke dalam aplikasi ini.",
        "color: #4b5563; font-size: 13px; font-weight: 500;"
      );
    } catch {
      // Abaikan jika console dibatasi oleh browser
    }

    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  return null;
}
