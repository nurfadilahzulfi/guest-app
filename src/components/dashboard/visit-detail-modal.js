"use client";

import { useState, useEffect } from "react";
import {
  IconX,
  IconUser,
  IconBuilding,
  IconPhone,
  IconMail,
  IconTarget,
  IconClock,
  IconCalendar,
  IconCrown,
  IconSpinner,
} from "@/components/icons/guest-icons";

/**
 * Modal dialog rincian lengkap satu kunjungan tamu dengan opsi respon langsung bagi Host.
 * @param {Object} props
 * @param {Object|null} props.visit - Objek data kunjungan yang dipilih
 * @param {function(): void} props.onClose - Handler menutup modal
 * @param {boolean} [props.isHost=false] - Apakah user yang membuka adalah Host
 * @param {string|null} [props.currentUserId=null] - ID user yang sedang login
 * @param {function(string, string, string): Promise<any>} [props.onRespond] - Handler aksi respon host
 */
export function VisitDetailModal({
  visit,
  onClose,
  isHost = false,
  currentUserId = null,
  onRespond = null,
}) {
  const [hostReply, setHostReply] = useState("");
  const [submittingAction, setSubmittingAction] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setHostReply("");
    setActionError("");
    setSubmittingAction(null);
  }, [visit]);

  if (!visit) return null;

  const canRespond =
    isHost &&
    visit.status === "PENDING" &&
    (!visit.hostId || visit.hostId === currentUserId);

  const statusBadge = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
  };

  const statusLabel = {
    PENDING: "Menunggu Respon",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-lg w-full overflow-hidden animate-scaleIn">
        {/* Header Modal */}
        <div className="px-6 py-4.5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3
              className="text-base font-bold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Rincian Kunjungan
            </h3>
            {visit.visitorType === "OWNER" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                <IconCrown className="w-3 h-3 text-amber-600" />
                Owner VIP
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submittingAction !== null}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Rincian */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <div>
              <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                Status Kunjungan
              </p>
              <span
                className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  statusBadge[visit.status] || "bg-zinc-100 text-zinc-700"
                }`}
              >
                {statusLabel[visit.status] || visit.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                Waktu Check-in
              </p>
              <p className="text-xs text-zinc-700 font-medium mt-1">
                {formatDate(visit.createdAt)}
              </p>
            </div>
          </div>

          {/* Data Diri Tamu */}
          <div>
            <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2.5">
              Identitas Tamu
            </p>
            <div className="rounded-2xl border border-zinc-200/80 p-4 bg-white space-y-3">
              {visit.guestPhotoUrl && (
                <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-100">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 shrink-0 bg-zinc-100 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visit.guestPhotoUrl}
                      alt={visit.guestName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Foto Wajah Terverifikasi
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">
                      Foto diambil langsung melalui kamera saat tamu check-in.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 divide-y divide-zinc-100">
                <div className="flex items-start gap-3 pt-1 first:pt-0">
                  <IconUser className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-zinc-400">Nama Lengkap</p>
                    <p className="text-xs font-bold text-zinc-900">{visit.guestName}</p>
                  </div>
                </div>

                {visit.gender && (
                  <div className="flex items-start gap-3 pt-2">
                    <span className="w-4 h-4 text-center text-zinc-400 shrink-0 text-xs">⚧</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-zinc-400">Jenis Kelamin</p>
                      <p className="text-xs font-medium text-zinc-800">{visit.gender}</p>
                    </div>
                  </div>
                )}

                {visit.organization && (
                  <div className="flex items-start gap-3 pt-2">
                    <IconBuilding className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-zinc-400">Asal Instansi / Perusahaan / Organisasi</p>
                      <p className="text-xs font-medium text-zinc-800">{visit.organization}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 pt-2">
                  <IconPhone className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-zinc-400">Nomor HP</p>
                    <p className="text-xs font-mono text-zinc-800">{visit.guestPhone}</p>
                  </div>
                </div>

                {visit.guestEmail && (
                  <div className="flex items-start gap-3 pt-2">
                    <IconMail className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-zinc-400">Email</p>
                      <p className="text-xs text-zinc-800">{visit.guestEmail}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pihak yang Dituju & Keperluan */}
          <div>
            <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2.5">
              Tujuan Pertemuan
            </p>
            <div className="space-y-2.5 rounded-2xl border border-zinc-200/80 p-4 bg-white divide-y divide-zinc-100">
              {visit.host && (
                <div className="flex items-start gap-3 pt-1 first:pt-0">
                  <IconBuilding className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-zinc-400">Karyawan yang Dituju</p>
                    <p className="text-xs font-bold text-zinc-900">
                      {visit.host.name}
                      {visit.host.position ? ` — ${visit.host.position}` : ""}
                    </p>
                    {visit.host.department && (
                      <p className="text-[11px] text-zinc-500">
                        Departemen: {visit.host.department}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 pt-2">
                <IconTarget className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-zinc-400">Kategori Keperluan</p>
                  <p className="text-xs font-medium text-zinc-800">{visit.purpose}</p>
                </div>
              </div>

              {visit.duration && (
                <div className="flex items-start gap-3 pt-2">
                  <IconClock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-zinc-400">Perkiraan Durasi</p>
                    <p className="text-xs font-medium text-zinc-800">{visit.duration}</p>
                  </div>
                </div>
              )}

              {visit.hostReply && (
                <div className="flex items-start gap-3 pt-2">
                  <span className="w-4 h-4 text-center text-zinc-400 shrink-0 text-xs">💬</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-zinc-400">Catatan dari Karyawan yang Dituju</p>
                    <p className="text-xs italic text-zinc-700 bg-zinc-50 p-2 rounded-lg mt-0.5">
                      "{visit.hostReply}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Respon Khusus Host (Jika Status Kunjungan PENDING) */}
          {canRespond && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Respon Kunjungan Tamu
                </p>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Perlu Konfirmasi Anda
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Tamu sedang menunggu konfirmasi kehadiran Anda. Anda dapat memberikan pesan atau arahan di bawah ini.
              </p>
              {actionError && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  {actionError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Catatan atau Pesan untuk Tamu <span className="text-zinc-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={hostReply}
                  onChange={(e) => setHostReply(e.target.value)}
                  placeholder="Misal: Silakan langsung menuju ke ruang meeting lt. 2 / Maaf saya sedang ada tamu lain..."
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                  disabled={submittingAction !== null}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submittingAction !== null}
            className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Tutup
          </button>

          {canRespond && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={async () => {
                  try {
                    setActionError("");
                    setSubmittingAction("REJECTED");
                    if (onRespond) {
                      await onRespond(visit.id, "REJECTED", hostReply);
                    }
                    onClose();
                  } catch (err) {
                    setActionError(err.message || "Gagal menolak kunjungan");
                    setSubmittingAction(null);
                  }
                }}
                className="px-4 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {submittingAction === "REJECTED" ? (
                  <span className="flex items-center gap-1.5">
                    <IconSpinner className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Menolak...</span>
                  </span>
                ) : (
                  "Tolak Kunjungan"
                )}
              </button>

              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={async () => {
                  try {
                    setActionError("");
                    setSubmittingAction("APPROVED");
                    if (onRespond) {
                      await onRespond(visit.id, "APPROVED", hostReply);
                    }
                    onClose();
                  } catch (err) {
                    setActionError(err.message || "Gagal menyetujui kunjungan");
                    setSubmittingAction(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingAction === "APPROVED" ? (
                  <>
                    <IconSpinner className="w-3.5 h-3.5 text-white" />
                    <span>Menyetujui...</span>
                  </>
                ) : (
                  "Setujui Kunjungan"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
