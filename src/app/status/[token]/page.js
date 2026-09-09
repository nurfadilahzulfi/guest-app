"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconCheck,
  IconX,
  IconClock,
  IconSpinner,
  IconUser,
  IconBuilding,
  IconCrown,
  IconCopy,
  IconMail,
} from "@/components/icons/guest-icons";

/**
 * Memainkan suara notifikasi halus saat status kunjungan berubah (disetujui/ditolak).
 * Menggunakan Web Audio API bawaan browser tanpa butuh file audio eksternal.
 * @param {boolean} isApproved
 */
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
      // 2-tone chime nada naik (C5 -> G5)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      // 2-tone nada turun (F4 -> D4)
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

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/visits/status/${token}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Data kunjungan tidak ditemukan.");
      }

      // Deteksi jika terjadi transisi status dari PENDING ke APPROVED / REJECTED
      if (prevStatus === "PENDING" && (data.status === "APPROVED" || data.status === "REJECTED")) {
        playNotificationChime(data.status === "APPROVED");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
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

    // Polling berkala jika status masih PENDING
    const interval = setInterval(() => {
      fetchStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [token, prevStatus]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // ignore
    }
  };

  const statusConfig = {
    PENDING: {
      title: "Menunggu Respon Host",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "bg-amber-100/80 text-amber-600 border-amber-300",
      description: "Permohonan kunjungan telah diteruskan ke staf tujuan. Layar ini akan otomatis berganti begitu ada respon.",
    },
    APPROVED: {
      title: "Kunjungan Disetujui",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconBg: "bg-emerald-100 text-emerald-700 border-emerald-300 animate-checkPop",
      description: "Staf yang Anda tuju telah menyetujui kunjungan Anda. Silakan ikuti arahan di bawah ini.",
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

            {/* Panduan Aksi Tamu Berdasarkan Status */}
            {visit.status === "APPROVED" && (
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-1.5 text-emerald-900">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Langkah Selanjutnya:</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Silakan menuju ke lobi / meja resepsionis atau perlihatkan layar ini kepada petugas keamanan untuk diarahkan ke ruangan {visit.hostName}.
                </p>
              </div>
            )}

            {visit.status === "REJECTED" && (
              <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200 text-xs space-y-1.5 text-red-900">
                <div className="flex items-center gap-1.5 font-bold text-red-800">
                  <IconX className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Pemberitahuan:</span>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Mohon maaf atas ketidaknyamanannya. Anda dapat menghubungi staf terkait di lain waktu atau membuat janji temu terlebih dahulu.
                </p>
              </div>
            )}

            {/* Notifikasi Salinan Email */}
            {visit.guestEmail && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-100/80 border border-zinc-200 text-[11px] text-zinc-600">
                <IconMail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">
                  Salinan keputusan juga dikirim ke <strong className="text-zinc-800">{visit.guestEmail}</strong>
                </span>
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
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                <span className="text-zinc-500">Staf yang Dituju:</span>
                <span className="font-semibold text-zinc-900">
                  {visit.hostName} {visit.hostDepartment ? `(${visit.hostDepartment})` : ""}
                </span>
              </div>
              <div className="flex items-start justify-between pt-0.5">
                <span className="text-zinc-500 shrink-0">Keperluan:</span>
                <span className="text-right text-zinc-800 font-medium pl-4">{visit.purpose}</span>
              </div>
            </div>

            {/* Tombol Aksi */}
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

      <p className="text-zinc-400 text-[11px] mt-6 relative z-10">
        Guest Management System · PT. Tanimas Resources Internasional
      </p>
    </div>
  );
}
