"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { IconDownload, IconSpinner, IconCheck } from "@/components/icons/guest-icons";
import { calculateVisitDuration } from "@/domain/entities/visit";

export default function VisitSlipPage({ params }) {
  const resolvedParams = use(params);
  const token = resolvedParams?.token;

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchVisit = async () => {
      try {
        const res = await fetch(`/api/visits/status/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Data kunjungan tidak ditemukan");
        setVisit(data);

        // Buat QR code untuk verifikasi keabsahan dokumen
        const qrUrl = await QRCode.toDataURL(window.location.href, {
          margin: 1,
          width: 140,
          color: { dark: "#09090B", light: "#FFFFFF" },
        });
        setQrCodeUrl(qrUrl);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();
  }, [token]);

  const handleDownloadPdf = async () => {
    if (!visit) return;
    setDownloadingPdf(true);
    try {
      const { downloadVisitSlipPdf } = await import("@/infrastructure/pdf/visit-slip-generator");
      await downloadVisitSlipPdf(visit);
    } catch (err) {
      alert("Gagal mengunduh PDF: " + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-zinc-600 text-sm">
          <IconSpinner className="w-5 h-5 animate-spin" />
          <span>Memuat slip bukti kunjungan...</span>
        </div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 max-w-sm w-full text-center space-y-3">
          <p className="text-sm text-red-600">{error || "Data tidak ditemukan"}</p>
          <Link href="/" className="inline-block px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
            Ke Halaman Utama
          </Link>
        </div>
      </div>
    );
  }

  const isCheckedOut = Boolean(visit.checkoutAt);
  const durationText = calculateVisitDuration(visit.createdAt, visit.checkoutAt);

  return (
    <div className="min-h-screen bg-zinc-100/80 py-8 px-4 sm:px-6 print:p-0 print:bg-white">
      {/* Action Bar (Sembunyi saat dicetak) */}
      <div className="max-w-2xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/status/${token}`}
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white px-3.5 py-2 rounded-xl border border-zinc-200 shadow-2xs transition-colors"
        >
          ← Kembali ke Status
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            🖨️ Cetak Dokumen
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {downloadingPdf ? (
              <IconSpinner className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <IconDownload className="w-3.5 h-3.5" />
            )}
            <span>{downloadingPdf ? "Menyiapkan..." : "Unduh PDF Resmi"}</span>
          </button>
        </div>
      </div>

      {/* Slip Card (Kertas A4 / Cetak) */}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-zinc-200 p-6 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-0">
        {/* Header Resmi Perusahaan */}
        <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 relative shrink-0">
              <Image
                src="/assets/logos/tanimas-logo.png"
                alt="Logo PT Tanimas"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 uppercase">
                PT. Tanimas Resources Internasional
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-500 font-medium">
                Sistem Buku Tamu Digital · Exit Pass & Visitor Clearance
              </p>
              <p className="text-[10px] text-zinc-400">
                Gedung Graha Tanimas, Kawasan Industri & Bisnis Terpadu
              </p>
            </div>
          </div>

          {qrCodeUrl && (
            <div className="text-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeUrl} alt="QR Code Verifikasi" className="w-16 h-16 sm:w-20 sm:h-20 border border-zinc-200 rounded-lg p-1" />
              <span className="text-[8px] text-zinc-400 font-mono block mt-0.5">Scan Verifikasi</span>
            </div>
          )}
        </div>

        {/* Judul & Status Dokumen */}
        <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">
              SLIP BUKTI KUNJUNGAN TAMU
            </h2>
            <p className="text-xs text-zinc-500">
              Tanda bukti izin keluar area perkantoran bagi pengunjung resmi.
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
              isCheckedOut
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-amber-50 text-amber-800 border-amber-300"
            }`}
          >
            {isCheckedOut ? "✓ SUDAH CHECK-OUT" : "● SEDANG BERKUNJUNG"}
          </span>
        </div>

        {/* Informasi Utama */}
        <div className="py-6 space-y-6 text-xs">
          {/* I. Identitas Pengunjung */}
          <div>
            <h3 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
              I. Identitas Pengunjung
            </h3>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-zinc-500 block text-[11px]">Nama Tamu:</span>
                <span className="font-bold text-zinc-900 text-sm">{visit.guestName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Nomor HP:</span>
                <span className="font-mono font-semibold text-zinc-800">{visit.guestPhone}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Asal Instansi / Perusahaan:</span>
                <span className="font-semibold text-zinc-800">{visit.organization || "Pribadi"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Kategori Tamu:</span>
                <span className="font-semibold text-zinc-800">
                  {visit.visitorType === "OWNER" ? "VIP / Owner" : "Tamu Reguler"}
                </span>
              </div>
            </div>
          </div>

          {/* II. Pihak yang Dikunjungi */}
          <div>
            <h3 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
              II. Pihak yang Dikunjungi (Host)
            </h3>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-zinc-500 block text-[11px]">Nama Karyawan:</span>
                <span className="font-bold text-zinc-900">{visit.hostName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Departemen & Jabatan:</span>
                <span className="font-semibold text-zinc-800">
                  {visit.hostDepartment || "—"} {visit.hostPosition ? `(${visit.hostPosition})` : ""}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-500 block text-[11px]">Keperluan Kunjungan:</span>
                <span className="font-medium text-zinc-800">{visit.purpose}</span>
              </div>
            </div>
          </div>

          {/* III. Rekapitulasi Waktu */}
          <div>
            <h3 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
              III. Waktu & Durasi Kunjungan
            </h3>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-zinc-500 block text-[11px]">Jam Masuk (Check-in):</span>
                <span className="font-bold text-zinc-900">{formatDateTime(visit.createdAt)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Jam Keluar (Check-out):</span>
                <span className="font-bold text-zinc-900">
                  {visit.checkoutAt ? formatDateTime(visit.checkoutAt) : "Belum check-out"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Total Durasi Kunjungan:</span>
                <span className="font-bold text-emerald-700">{durationText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catatan & Penutup */}
        <div className="border-t border-zinc-200 pt-5 text-[11px] text-zinc-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="max-w-md">
            Dokumen ini diterbitkan secara otomatis dan sah oleh Guest App PT. Tanimas Resources Internasional sebagai izin kepulangan tamu.
          </p>
          <div className="text-right shrink-0">
            <span className="block font-mono text-[10px] text-zinc-400">
              ID: {visit.visitToken?.slice(0, 13) || visit.id}
            </span>
            <span className="text-[10px] text-zinc-500">
              Dicetak: {formatDateTime(new Date())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
