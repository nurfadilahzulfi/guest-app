import {
  IconUser,
  IconBuilding,
  IconTarget,
  IconClipboard,
  IconBriefcase,
  IconSend,
  IconUsers,
} from "@/components/icons/guest-icons";

/**
 * Token desain warna dan tipografi resmi PT. Tanimas Resources Internasional.
 */
export const TOKENS = {
  "--tm-forest": "#09090B",
  "--tm-emerald": "#18181B",
  "--tm-emerald-deep": "#09090B",
  "--tm-cream": "#F8F9FA",
  "--tm-line": "#E2E8F0",
  "--tm-muted": "#64748B",
  "--tm-emerald-10": "rgba(9, 9, 11, 0.05)",
  "--tm-emerald-15": "rgba(9, 9, 11, 0.08)",
  "--tm-shadow-card": "0 10px 30px -10px rgba(0, 0, 0, 0.06)",
  "--tm-shadow-btn": "0 4px 14px -3px rgba(0, 0, 0, 0.25)",
  "--font-display": "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
};

/**
 * Konfigurasi langkah-langkah pada formulir check-in mandiri.
 */
export const STEPS = [
  { id: 1, label: "Identitas", icon: IconUser },
  { id: 2, label: "Pilih Host", icon: IconBuilding },
  { id: 3, label: "Tujuan", icon: IconTarget },
  { id: 4, label: "Konfirmasi", icon: IconClipboard },
];

/**
 * Pilihan kategori tujuan kunjungan tamu.
 */
export const PURPOSE_OPTIONS = [
  { value: "Kunjungan Bisnis", icon: IconBriefcase, desc: "Pertemuan, negosiasi, atau diskusi kerja" },
  { value: "Pengiriman Barang / Dokumen", icon: IconSend, desc: "Antar paket, dokumen, atau surat" },
  { value: "Keperluan Administrasi", icon: IconClipboard, desc: "Urusan administrasi perusahaan" },
  { value: "Keperluan Pribadi", icon: IconUser, desc: "Kunjungan bersifat personal" },
  { value: "Wawancara / Rekrutmen", icon: IconUsers, desc: "Sesi interview atau seleksi karyawan" },
  { value: "Lainnya", icon: IconTarget, desc: "Keperluan lain yang tidak tercantum" },
];

/**
 * Pilihan jenis kelamin tamu.
 */
export const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];

/**
 * Pilihan perkiraan durasi pertemuan tamu dengan host.
 */
export const DURATION_OPTIONS = [
  "15 Menit",
  "30 Menit",
  "1 Jam",
  "2 Jam",
  "Lebih dari 2 Jam",
];

