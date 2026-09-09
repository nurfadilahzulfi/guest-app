"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconCircleCheck, IconChevronRight, IconMail, IconClock } from "@/components/icons/guest-icons";

/**
 * Tampilan layar sukses setelah formulir check-in berhasil dikirim ke server.
 * Mengarahkan tamu secara otomatis ke halaman live status real-time atau via tombol langsung.
 * @param {Object} props
 * @param {string} props.visitToken - Token unik kunjungan yang dihasilkan server
 * @param {function(): void} props.onReset - Handler untuk mereset form dan kembali ke awal
 */
export function SuccessScreen({ visitToken, onReset }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!visitToken) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/status/${visitToken}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visitToken, router]);

  const handleGoToStatus = () => {
    router.push(`/status/${visitToken}`);
  };

  return (
    <div className="flex flex-col items-center text-center px-4 py-6 space-y-5 animate-fadeIn">
      <div
        className="flex items-center justify-center w-20 h-20 rounded-full"
        style={{ background: "var(--tm-emerald-10)" }}
      >
        <IconCircleCheck className="w-10 h-10 text-[var(--tm-emerald-deep)] animate-checkPop" />
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--tm-forest)]" style={{ fontFamily: "var(--font-display)" }}>
          Check-in Berhasil!
        </h2>
        <p className="text-xs sm:text-sm text-[var(--tm-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
          Permohonan kunjungan Anda telah terkirim ke staf tujuan. Silakan menunggu konfirmasi di lobi.
        </p>
      </div>

      {/* Info Token & Notifikasi Email */}
      <div className="w-full max-w-sm rounded-2xl border border-[var(--tm-line)] bg-[var(--tm-cream)] p-4 space-y-2 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--tm-emerald-deep)]">
            Token Kunjungan Anda
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">Simpan jika perlu</span>
        </div>
        <p className="font-mono text-xs text-[var(--tm-forest)] font-bold break-all select-all bg-white p-2 rounded-lg border border-[var(--tm-line)]">
          {visitToken}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--tm-muted)] pt-1">
          <IconMail className="w-3.5 h-3.5 text-[var(--tm-emerald-deep)] shrink-0" />
          <span>Salinan status & balasan host juga dikirimkan ke email Anda.</span>
        </div>
      </div>

      {/* Tombol Utama: Live Status */}
      <div className="w-full max-w-sm space-y-2.5 pt-2">
        <button
          type="button"
          onClick={handleGoToStatus}
          className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md hover:brightness-95 cursor-pointer"
          style={{ background: "var(--tm-emerald-deep)" }}
        >
          <span>Pantau Status Real-Time</span>
          <IconChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--tm-muted)]">
          <IconClock className="w-3.5 h-3.5 animate-spin" />
          <span>Membuka otomatis dalam <strong>{countdown}</strong> detik...</span>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--tm-line)] w-full max-w-xs">
        <button
          type="button"
          id="btn-checkin-again"
          onClick={onReset}
          className="text-xs text-[var(--tm-muted)] hover:text-[var(--tm-forest)] transition-colors cursor-pointer"
        >
          ← Daftarkan tamu lain / Kembali ke awal
        </button>
      </div>
    </div>
  );
}
