"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconCheck,
  IconX,
  IconSpinner,
  IconUser,
  IconBuilding,
  IconPhone,
  IconClock,
  IconTarget,
} from "@/components/icons/guest-icons";

export default function RespondVisitPage({ params }) {
  const resolvedParams = use(params);
  const token = resolvedParams?.token;

  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState(null);
  const [fetchError, setFetchError] = useState("");

  const [hostReply, setHostReply] = useState("");
  const [submittingAction, setSubmittingAction] = useState(null); // 'APPROVED' | 'REJECTED'
  const [submitError, setSubmitError] = useState("");
  const [completedResult, setCompletedResult] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchVisit = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch(`/api/visits/respond/${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Tautan respon kunjungan tidak valid atau sudah kedaluwarsa.");
        }
        setVisit(data);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();
  }, [token]);

  const handleRespond = async (action) => {
    setSubmitError("");
    setSubmittingAction(action);

    try {
      const res = await fetch(`/api/visits/respond/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          hostReply: hostReply.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses respon kunjungan.");
      }

      setCompletedResult({
        action,
        status: data.status,
        hostReply: data.hostReply,
      });
    } catch (err) {
      setSubmitError(err.message);
      setSubmittingAction(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 sm:p-8 relative z-10">
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
            Respon Kunjungan Tamu
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Konfirmasi penerimaan kunjungan dari tamu
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center text-zinc-500 space-y-3">
            <IconSpinner className="w-6 h-6 text-zinc-800 animate-spin mx-auto" />
            <p className="text-xs font-medium">Memuat rincian kunjungan...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && fetchError && (
          <div className="space-y-5 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-zinc-900">
                Tautan Respon Tidak Valid
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
                {fetchError}
              </p>
            </div>
            <p className="text-[11px] text-zinc-400">
              Tautan respon hanya berlaku satu kali atau kunjungan ini telah direspon sebelumnya.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors text-center"
            >
              Buka Dashboard Karyawan
            </Link>
          </div>
        )}

        {/* Completed State */}
        {!loading && completedResult && (
          <div className="space-y-5 text-center py-4 animate-fadeIn">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                completedResult.action === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-zinc-100 text-zinc-700 border border-zinc-200"
              }`}
            >
              {completedResult.action === "APPROVED" ? (
                <IconCheck className="w-7 h-7 text-emerald-600" />
              ) : (
                <IconX className="w-7 h-7 text-zinc-600" />
              )}
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-zinc-900">
                {completedResult.action === "APPROVED"
                  ? "Kunjungan Berhasil Disetujui"
                  : "Kunjungan Telah Ditolak"}
              </h2>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                {completedResult.action === "APPROVED"
                  ? "Status kunjungan telah diperbarui menjadi Disetujui. Tamu dapat melihat konfirmasi ini."
                  : "Status kunjungan telah ditolak. Tamu akan menerima informasi pembatalan ini."}
              </p>
            </div>

            {completedResult.hostReply && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-left text-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Pesan yang Anda Kirimkan:
                </span>
                <p className="italic text-zinc-800 mt-1">
                  "{completedResult.hostReply}"
                </p>
              </div>
            )}

            <Link
              href="/login"
              className="block w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors text-center"
            >
              Masuk ke Dashboard
            </Link>
          </div>
        )}

        {/* Form Respon */}
        {!loading && !fetchError && !completedResult && visit && (
          <div className="space-y-5">
            {/* Rincian Tamu */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex items-center gap-3">
                {visit.guestPhotoUrl ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visit.guestPhotoUrl}
                      alt={visit.guestName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl shrink-0 bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-500">
                    <IconUser className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-zinc-900 text-sm truncate">
                    {visit.guestName}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {visit.guestPhone}
                  </p>
                  {visit.organization && (
                    <p className="text-xs text-zinc-600 mt-0.5 truncate font-medium">
                      {visit.organization}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200/70 space-y-1 text-xs">
                <div className="flex items-start gap-2 text-zinc-700">
                  <IconTarget className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-900">Keperluan:</strong> {visit.purpose}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                  <IconClock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Waktu Check-In: {formatDate(visit.createdAt)}</span>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {submitError}
              </div>
            )}

            {/* Catatan untuk Tamu */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Catatan / Arahan untuk Tamu (Opsional)
              </label>
              <textarea
                rows={3}
                value={hostReply}
                onChange={(e) => setHostReply(e.target.value)}
                placeholder="Contoh: Silakan menunggu di lobi lantai 2, saya sedang menuju ke sana..."
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                disabled={submittingAction !== null}
              />
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() => handleRespond("REJECTED")}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 text-center"
              >
                {submittingAction === "REJECTED" ? "Memproses..." : "Tolak Kunjungan"}
              </button>
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() => handleRespond("APPROVED")}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submittingAction === "APPROVED" ? (
                  <>
                    <IconSpinner className="w-3.5 h-3.5 text-white animate-spin" />
                    <span>Menyetujui...</span>
                  </>
                ) : (
                  "Setujui Kunjungan"
                )}
              </button>
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
