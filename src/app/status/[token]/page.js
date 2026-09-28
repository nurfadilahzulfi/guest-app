"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconCheck,
  IconX,
  IconClock,
  IconSpinner,
  IconCopy,
  IconMail,
  IconDownload,
} from "@/components/icons/guest-icons";
import { calculateVisitDuration } from "@/domain/entities/visit";

function playNotificationChime(isApproved) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = "sine";
    if (isApproved) {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      osc.frequency.setValueAtTime(349.23, now);
      osc.frequency.setValueAtTime(293.66, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {
    // Abaikan jika browser memblokir audio autoplay
  }
}

export default function VisitStatusPage({ params }) {
  const resolvedParams = use(params);
  const token = resolvedParams?.token;

  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [prevStatus, setPrevStatus] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/visits/status/${token}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Data kunjungan tidak ditemukan.");
      }

      if (prevStatus === "PENDING" && (data.status === "APPROVED" || data.status === "REJECTED")) {
        playNotificationChime(data.status === "APPROVED");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }

      // Simpan di localStorage jika masih aktif agar mudah check-out jika tab tertutup
      if (typeof window !== "undefined") {
        if (data.status === "APPROVED" && !data.checkoutAt) {
          localStorage.setItem("tm_active_visit_token", token);
          localStorage.setItem("tm_active_guest_name", data.guestName);
        } else if (data.checkoutAt) {
          localStorage.removeItem("tm_active_visit_token");
        }
      }

      setPrevStatus(data.status);
      setVisit(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchStatus();

    // Polling hanya jika masih PENDING atau belum checkout
    const interval = setInterval(() => {
      fetchStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [token, prevStatus]);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch(`/api/visits/checkout/${token}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan check-out");

      setCheckoutFeedback("Check-out berhasil dicatat. Terima kasih!");
      setShowCheckoutModal(false);
      await fetchStatus();

      // Otomatis download slip PDF
      try {
        const { downloadVisitSlipPdf } = await import("@/infrastructure/pdf/visit-slip-generator");
        await downloadVisitSlipPdf(data.visit || visit);
      } catch (pdfErr) {
        console.error("Gagal auto-download PDF:", pdfErr);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleDownloadSlip = async () => {
    if (!visit) return;
    setDownloadingPdf(true);
    try {
      const { downloadVisitSlipPdf } = await import("@/infrastructure/pdf/visit-slip-generator");
      await downloadVisitSlipPdf(visit);
    } catch (err) {
      alert("Gagal mengunduh slip PDF: " + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // ignore
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  };

  const isCheckedOut = Boolean(visit?.checkoutAt);
  const durationText = visit ? calculateVisitDuration(visit.createdAt, visit.checkoutAt) : "—";

  const statusConfig = {
    PENDING: {
      title: "Menunggu Respon Host",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "bg-amber-100/80 text-amber-600 border-amber-300",
      description: "Permohonan kunjungan telah diteruskan ke staf tujuan. Layar ini akan otomatis berganti begitu ada respon.",
    },
    APPROVED: isCheckedOut
      ? {
          title: "Kunjungan Selesai",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          iconBg: "bg-blue-100 text-blue-700 border-blue-300",
          description: "Anda telah melakukan check-out resmi. Terima kasih atas kunjungan Anda di kantor kami.",
        }
      : {
          title: "Kunjungan Disetujui (Aktif)",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          iconBg: "bg-emerald-100 text-emerald-700 border-emerald-300 animate-checkPop",
          description: "Kunjungan Anda telah disetujui. Anda sedang berada di dalam area gedung PT. Tanimas Resources Internasional.",
        },
    REJECTED: {
      title: "Kunjungan Belum Dapat Diterima",
      badge: "bg-red-50 text-red-700 border-red-200",
      iconBg: "bg-red-100 text-red-700 border-red-300",
      description: "Mohon maaf, saat ini staf yang bersangkutan belum dapat menerima kunjungan Anda.",
    },
  };

  const currentStatus = visit ? statusConfig[visit.status] || statusConfig.PENDING : statusConfig.PENDING;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 sm:p-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center p-2 mb-3.5 shadow-xs">
            <Image
              src="/assets/logos/tanimas-logo.png"
              alt="Logo PT Tanimas Resources Internasional"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <h1
            className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Status Kunjungan Tamu
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            PT. Tanimas Resources Internasional
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-zinc-500 space-y-3">
            <IconSpinner className="w-6 h-6 text-zinc-800 animate-spin mx-auto" />
            <p className="text-xs font-medium">Memeriksa status kunjungan...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <p className="text-xs text-zinc-600">{error}</p>
            <Link
              href="/"
              className="inline-block w-full py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold"
            >
              Halaman Utama
            </Link>
          </div>
        )}

        {/* Visit Details & Live Status */}
        {!loading && !error && visit && (
          <div className="space-y-5 animate-fadeIn">
            {/* Status Card Hero */}
            <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${currentStatus.iconBg}`}
              >
                {visit.status === "APPROVED" ? (
                  <IconCheck className="w-6 h-6" />
                ) : visit.status === "REJECTED" ? (
                  <IconX className="w-6 h-6" />
                ) : (
                  <IconClock className="w-6 h-6" />
                )}
              </div>
              <div>
                <span
                  className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md border mb-1 ${currentStatus.badge}`}
                >
                  {currentStatus.title}
                </span>
                <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mt-1">
                  {currentStatus.description}
                </p>
              </div>

              {visit.status === "PENDING" && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-1">
                  <IconSpinner className="w-3 h-3 animate-spin text-zinc-500" />
                  <span>Memperbarui otomatis secara real-time...</span>
                </div>
              )}
            </div>

            {/* Alert Sukses Checkout */}
            {checkoutFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{checkoutFeedback}</span>
              </div>
            )}

            {/* SEKSI CHECK-OUT: Kunjungan Disetujui & Belum Checkout */}
            {visit.status === "APPROVED" && !isCheckedOut && (
              <div className="p-4 rounded-2xl bg-zinc-900 text-white text-xs space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Kunjungan Sedang Berlangsung
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Jika pertemuan telah selesai dan Anda hendak meninggalkan gedung, silakan tekan tombol di bawah ini untuk melakukan check-out dan mengunduh slip bukti kunjungan resmi.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={checkingOut}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span>🚪 Check-Out Sekarang & Dapatkan Slip</span>
                </button>
              </div>
            )}

            {/* SEKSI SLIP KUNJUNGAN: Kunjungan Selesai / Sudah Checkout */}
            {visit.status === "APPROVED" && isCheckedOut && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                    <IconCheck className="w-4 h-4 text-emerald-600" />
                    Kunjungan Selesai (Sudah Check-out)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700">
                    {formatDateTime(visit.checkoutAt)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Terima kasih atas kunjungan Anda di PT. Tanimas Resources Internasional. Slip bukti kunjungan resmi telah diterbitkan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadSlip}
                    disabled={downloadingPdf}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {downloadingPdf ? (
                      <IconSpinner className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <IconDownload className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingPdf ? "Menyiapkan PDF..." : "Unduh Slip PDF"}</span>
                  </button>
                  <Link
                    href={`/visits/slip/${visit.visitToken || token}`}
                    target="_blank"
                    className="py-2.5 px-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <span>Lihat Slip Digital</span>
                  </Link>
                </div>
                <p className="text-[10px] text-emerald-600 italic text-center">
                  *Tunjukkan slip kepada petugas di pos keluar sebelum meninggalkan area gedung.
                </p>
              </div>
            )}

            {/* Pesan dari Host jika ada */}
            {visit.hostReply && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2 shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-700">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  <span>Pesan dari {visit.hostName}:</span>
                </div>
                <div className="relative bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                  <p className="italic text-zinc-900 leading-relaxed font-medium">
                    "{visit.hostReply}"
                  </p>
                </div>
              </div>
            )}

            {/* Info Kunjungan */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                <span className="text-zinc-500">Nama Tamu:</span>
                <span className="font-bold text-zinc-900">{visit.guestName}</span>
              </div>
              {visit.organization && (
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Instansi:</span>
                  <span className="font-semibold text-zinc-800">{visit.organization}</span>
                </div>
              )}
              {visit.vehicleType && (
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Kendaraan:</span>
                  <span className="font-semibold text-zinc-900">
                    {visit.vehicleType}
                    {visit.licensePlate ? ` (${visit.licensePlate})` : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                <span className="text-zinc-500">Staf yang Dituju:</span>
                <span className="font-semibold text-zinc-900">
                  {visit.hostName} {visit.hostDepartment ? `(${visit.hostDepartment})` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                <span className="text-zinc-500">Waktu Check-In:</span>
                <span className="font-mono text-zinc-800">{formatDateTime(visit.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                <span className="text-zinc-500">Waktu Check-Out:</span>
                <span className="font-mono text-zinc-800">
                  {visit.checkoutAt ? formatDateTime(visit.checkoutAt) : "Belum check-out"}
                </span>
              </div>
              {isCheckedOut && (
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Total Durasi:</span>
                  <span className="font-bold text-emerald-700">{durationText}</span>
                </div>
              )}
              <div className="flex items-start justify-between pt-0.5">
                <span className="text-zinc-500 shrink-0">Keperluan:</span>
                <span className="text-right text-zinc-800 font-medium pl-4">{visit.purpose}</span>
              </div>
            </div>

            {/* Tombol Salin Tautan & Kembali */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <IconCopy className="w-3.5 h-3.5 text-zinc-500" />
                <span>{copiedLink ? "✓ Tautan Disalin ke Clipboard!" : "Salin Tautan Status Ini"}</span>
              </button>

              <Link
                href="/"
                className="block w-full py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold transition-colors text-center"
              >
                Kembali ke Formulir Check-In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Check-Out */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-sm w-full p-6 animate-scaleIn space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-xl">
              🚪
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-zinc-900 text-sm">Konfirmasi Check-Out</h3>
              <p className="text-xs text-zinc-500">
                Apakah Anda telah menyelesaikan seluruh keperluan dan hendak meninggalkan area kantor PT. Tanimas Resources Internasional?
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                {checkingOut ? (
                  <>
                    <IconSpinner className="w-4 h-4 animate-spin" />
                    <span>Memproses check-out...</span>
                  </>
                ) : (
                  <span>Ya, Check-Out Sekarang</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                disabled={checkingOut}
                className="w-full py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-6 text-center text-xs text-zinc-400 space-y-1 relative z-10">
        <p>© {new Date().getFullYear()} PT. Tanimas Resources Internasional</p>
        <p className="text-[11px] text-zinc-500 font-medium">Aplikasi dibuat oleh Departemen IT Tanimas Group</p>
      </footer>
    </div>
  );
}
