"use client";

import { useState } from "react";
import {
  IconX,
  IconCheck,
  IconSpinner,
  IconUser,
  IconBuilding,
} from "@/components/icons/guest-icons";

/**
 * Modal dialog konfirmasi cepat bagi Host untuk menyetujui atau menolak kunjungan tamu.
 * @param {Object} props
 * @param {{ visit: Object, action: 'APPROVED' | 'REJECTED' } | null} props.target - Target kunjungan dan aksi
 * @param {function(): void} props.onClose - Callback saat modal ditutup
 * @param {function(string, string, string): Promise<void>} props.onConfirm - Callback eksekusi respon
 */
export function QuickRespondModal({ target, onClose, onConfirm }) {
  const [hostReply, setHostReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!target || !target.visit) return null;

  const { visit, action } = target;
  const isApprove = action === "APPROVED";

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(visit.id, action, hostReply);
      onClose();
    } catch (err) {
      setError(err.message || "Gagal memproses respon kunjungan");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full overflow-hidden animate-scaleIn">
        {/* Header Modal */}
        <div className="px-6 py-4.5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isApprove
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 border border-zinc-200"
              }`}
            >
              {isApprove ? (
                <IconCheck className="w-4 h-4" />
              ) : (
                <IconX className="w-4 h-4" />
              )}
            </div>
            <h3
              className="text-base font-bold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isApprove ? "Setujui Kunjungan" : "Tolak Kunjungan"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Konten & Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 leading-relaxed">
              {error}
            </div>
          )}

          {/* Kartu Ringkasan Tamu */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2.5">
              {visit.guestPhotoUrl ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-zinc-200 bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={visit.guestPhotoUrl}
                    alt={visit.guestName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg shrink-0 bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                  <IconUser className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {visit.guestName}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {visit.guestPhone}
                </p>
              </div>
            </div>

            {visit.organization && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 pt-1 border-t border-zinc-200/60">
                <IconBuilding className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{visit.organization}</span>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 pt-0.5">
              <span className="font-semibold text-zinc-600">Keperluan:</span>{" "}
              {visit.purpose}
            </p>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed">
            {isApprove
              ? "Apakah Anda bersedia menerima kunjungan dari tamu ini sekarang?"
              : "Apakah Anda yakin ingin menolak permohonan kunjungan dari tamu ini?"}
          </p>

          {/* Input Catatan Opsional */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
              Catatan atau Pesan untuk Tamu{" "}
              <span className="text-zinc-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={3}
              value={hostReply}
              onChange={(e) => setHostReply(e.target.value)}
              placeholder={
                isApprove
                  ? "Contoh: Silakan tunggu di lobi lantai 2, saya akan segera menemui Anda..."
                  : "Contoh: Mohon maaf, saya saat ini sedang berada di luar kantor..."
              }
              className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Footer Aksi */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
              isApprove
                ? "bg-zinc-900 hover:bg-black text-white"
                : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
            }`}
          >
            {submitting ? (
              <>
                <IconSpinner className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : isApprove ? (
              "Konfirmasi Setujui"
            ) : (
              "Konfirmasi Tolak"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
