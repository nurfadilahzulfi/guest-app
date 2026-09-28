import jsPDF from "jspdf";
import QRCode from "qrcode";
import { calculateVisitDuration } from "@/domain/entities/visit";

/**
 * Format tanggal dan jam ke format Indonesia.
 * @param {string|Date} dateStr
 * @returns {string}
 */
function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Menghasilkan dokumen PDF Slip Bukti Kunjungan Tamu Resmi.
 * @param {Object} visit Data kunjungan lengkap
 * @returns {Promise<jsPDF>} Instance jsPDF yang siap diunduh atau dipratinjau
 */
export async function generateVisitSlipPdf(visit) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header Perusahaan
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PT. TANIMAS RESOURCES INTERNASIONAL", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(212, 212, 216);
  doc.text("SISTEM MANAJEMEN BUKU TAMU DIGITAL — VISITOR PASS & EXIT CLEARANCE", margin, 18);
  doc.text("Jl. Surfaktan No.B21 - B22 KEK, Sei Mangkei, Kec. Bosar Maligas, Kab. Simalungun, Sumut 21183", margin, 22);

  // Judul Dokumen
  let y = 38;
  doc.setTextColor(9, 9, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SLIP BUKTI KUNJUNGAN TAMU", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Tanda bukti sah kunjungan dan izin keluar area perkantoran", margin, y + 5);

  // QR Code Verifikasi aktif (URL halaman slip untuk scan kamera security)
  try {
    let baseUrl = "";
    if (typeof window !== "undefined" && window.location?.origin) {
      baseUrl = window.location.origin;
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    } else if (process.env.APP_URL) {
      baseUrl = process.env.APP_URL;
    }
    const verificationUrl = baseUrl
      ? `${baseUrl}/visits/slip/${visit.visitToken || visit.id}`
      : `https://guest-app.vercel.app/visits/slip/${visit.visitToken || visit.id}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 140,
      color: { dark: "#09090B", light: "#FFFFFF" },
    });
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 26, y - 6, 26, 26);
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text("Scan Verifikasi", pageWidth - margin - 26 + 3, y + 23);
  } catch (err) {
    console.error("Gagal generate QR code slip:", err);
  }

  y += 28;

  // Status Badge Box
  const isCheckedOut = Boolean(visit.checkoutAt);
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(isCheckedOut ? 240 : 254, isCheckedOut ? 253 : 249, isCheckedOut ? 244 : 231);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(isCheckedOut ? 22 : 180, isCheckedOut ? 101 : 83, isCheckedOut ? 52 : 9);
  const statusText = isCheckedOut
    ? "✓ KUNJUNGAN SELESAI (SUDAH CHECK-OUT RESMI)"
    : "● SEDANG BERKUNJUNG (BELUM CHECK-OUT)";
  doc.text(statusText, margin + 4, y + 9);

  y += 20;

  // Helper untuk menggambar card/section
  const drawSection = (title, items) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const boxHeight = 8 + items.length * 7;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(9, 9, 11);
    doc.text(title, margin + 4, y + 6);

    let rowY = y + 12;
    doc.setFontSize(9);
    for (const [label, val] of items) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(label, margin + 4, rowY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 24, 27);
      doc.text(String(val || "—"), margin + 55, rowY);
      rowY += 7;
    }
    y += boxHeight + 4;
  };

  // Section 1: Data Tamu
  const vehicleText = visit.vehicleType
    ? `${visit.vehicleType}${visit.licensePlate ? ` (Plat: ${visit.licensePlate})` : ""}`
    : "—";

  drawSection("I. IDENTITAS PENGUNJUNG", [
    ["Nama Lengkap", visit.guestName],
    ["Nomor Telepon / WA", visit.guestPhone],
    ["Jenis Kelamin", visit.gender || "—"],
    ["Asal Instansi / Perusahaan", visit.organization || "Pribadi"],
    ["Kendaraan / No. Plat", vehicleText],
    ["Kategori Tamu", visit.visitorType === "OWNER" ? "VIP / Owner" : "Tamu Reguler"],
  ]);

  // Section 2: Pihak yang Dikunjungi
  drawSection("II. PIHAK YANG DIKUNJUNGI (HOST)", [
    ["Karyawan yang Dituju", visit.hostName || visit.host?.name],
    ["Departemen", visit.hostDepartment || visit.host?.department || "—"],
    ["Jabatan", visit.hostPosition || visit.host?.position || "—"],
    ["Keperluan Kunjungan", visit.purpose],
  ]);

  // Section 3: Waktu & Durasi Kunjungan
  const durationText = calculateVisitDuration(visit.createdAt, visit.checkoutAt);
  drawSection("III. REKAPITULASI WAKTU KUNJUNGAN", [
    ["Waktu Masuk (Check-in)", formatDateTime(visit.createdAt)],
    ["Waktu Keluar (Check-out)", visit.checkoutAt ? formatDateTime(visit.checkoutAt) : "Belum check-out"],
    ["Total Durasi Kunjungan", durationText],
    ["Disahkan Oleh", visit.checkoutBy || (isCheckedOut ? "Tamu Mandiri (QR)" : "—")],
  ]);

  // Footer & Disclaimer Resmi
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(113, 113, 122);
  doc.text(
    "Dokumen ini diterbitkan secara otomatis dan sah oleh Guest App PT. Tanimas Resources Internasional.",
    margin,
    y
  );
  doc.text(
    "Tunjukkan slip ini kepada petugas keamanan di pos keluar sebagai bukti izin kepulangan.",
    margin,
    y + 4
  );
  doc.setFont("helvetica", "bold");
  doc.text(
    "Aplikasi dibuat & dikelola oleh Departemen IT Tanimas Group.",
    margin,
    y + 8
  );

  doc.setFont("helvetica", "normal");
  const printTime = `Waktu cetak: ${formatDateTime(new Date())} | ID: ${visit.visitToken?.slice(0, 13) || visit.id}`;
  doc.text(printTime, pageWidth - margin - doc.getTextWidth(printTime), y + 8);

  return doc;
}

/**
 * Menghasilkan dan langsung memicu unduhan file PDF di browser pengguna.
 * @param {Object} visit
 */
export async function downloadVisitSlipPdf(visit) {
  const doc = await generateVisitSlipPdf(visit);
  const cleanName = (visit.guestName || "tamu").replace(/[^a-zA-Z0-9]/g, "-");
  doc.save(`Slip-Kunjungan-${cleanName}.pdf`);
}
