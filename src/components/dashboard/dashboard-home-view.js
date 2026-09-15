"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconSpinner,
  IconCrown,
  IconUser,
  IconBuilding,
  IconClock,
  IconCheck,
  IconX,
  IconChevronRight,
  IconClipboard,
} from "@/components/icons/guest-icons";
import dynamic from "next/dynamic";
import { StatsCard } from "./stats-card";
import { VisitDetailModal } from "./visit-detail-modal";
import { QuickRespondModal } from "./quick-respond-modal";

const DashboardCharts = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 sm:space-y-5 animate-pulse">
        <div className="h-6 bg-zinc-200/70 rounded-lg w-56" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs lg:col-span-2 h-72" />
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs h-72" />
        </div>
      </div>
    ),
  }
);

/**
 * Tampilan utama Dashboard (Pusat Ringkasan & Analitik).
 * Menampilkan Hero banner adaptif, kartu metrik statistik, grafik analitik,
 * dan pratinjau kunjungan terkini dengan tautan ke halaman riwayat lengkap.
 * 
 * @param {Object} props
 * @param {Object} props.user - Objek sesi user login
 */
export function DashboardHomeView({ user }) {
  const isHost = user?.role === "HOST";
  const isHRDorAdmin = user?.role === "ADMIN_HRD" || user?.role === "ADMINISTRATOR";
  const isAdmin = user?.role === "ADMINISTRATOR";

  const [recentVisits, setRecentVisits] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [quickResponding, setQuickResponding] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Ambil 5 kunjungan terbaru untuk widget pratinjau cepat
  const fetchRecentVisits = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const res = await fetch("/api/visits?page=1&limit=5");
      if (res.ok) {
        const json = await res.json();
        setRecentVisits(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error("Gagal mengambil data kunjungan terkini:", err);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  // Ambil data ringkasan statistik DB
  const fetchStatsSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/visits/stats");
      if (res.ok) {
        const json = await res.json();
        if (json.summary) {
          setSummaryStats(json.summary);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil ringkasan statistik:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecentVisits();
    fetchStatsSummary();
  }, [fetchRecentVisits, fetchStatsSummary]);

  // Handler respon langsung oleh Host (Approve / Reject) dari pratinjau
  const handleDirectRespond = async (visitId, action, hostReply) => {
    const res = await fetch("/api/visits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitId, action, hostReply }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Gagal memproses respon kunjungan");
    }

    setFeedbackToast({
      type: "success",
      message:
        action === "APPROVED"
          ? "Kunjungan tamu berhasil disetujui."
          : "Kunjungan tamu telah ditolak.",
    });

    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);

    if (selectedVisit && selectedVisit.id === visitId) {
      setSelectedVisit((prev) =>
        prev
          ? {
              ...prev,
              status: action,
              hostReply: hostReply || prev.hostReply,
              respondedAt: data.respondedAt || new Date().toISOString(),
            }
          : null
      );
    }

    await Promise.all([fetchRecentVisits(), fetchStatsSummary()]);
    return data;
  };

  // Nilai metrik statistik akurat
  const pendingCount = summaryStats?.pending ?? 0;
  const approvedCount = summaryStats?.approved ?? 0;
  const rejectedCount = summaryStats?.rejected ?? 0;
  const ownerCount = summaryStats?.owner ?? 0;
  const displayTotalCount = summaryStats?.total ?? 0;

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
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero Banner Adaptif ────────────────────────────────────────── */}
      {isHost ? (
        // Banner Khusus Host (Ilustrasi Rapat / Diskusi)
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="max-w-xl space-y-2 z-10 text-center sm:text-left">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700">
              Dashboard Karyawan
            </span>
            <h1
              className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Halo, {user?.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Berikut adalah ringkasan janji temu dan aktivitas kunjungan Anda hari ini. Anda dapat menyetujui kehadiran tamu atau membuka seluruh riwayat lengkap kapan saja.
            </p>
          </div>

          <div className="relative w-36 h-28 sm:w-44 sm:h-32 md:w-52 md:h-36 shrink-0">
            <Image
              src="/assets/images/dashboard-meeting.png"
              alt="Ilustrasi Pertemuan Tim"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        </div>
      ) : (
        // Banner Global Admin HRD & Administrator (Ilustrasi Analisis & Tren)
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="max-w-xl space-y-2 z-10 text-center sm:text-left">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-zinc-900 text-white">
              {user?.role === "ADMINISTRATOR" ? "Administrator Portal" : "Admin HRD Portal"}
            </span>
            <h1
              className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ringkasan Kunjungan Perusahaan
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Pantau tren dan aktivitas tamu di seluruh departemen PT. Tanimas Resources Internasional secara terpusat, akurat, dan *real-time*.
            </p>
          </div>

          <div className="relative w-36 h-28 sm:w-44 sm:h-32 md:w-52 md:h-36 shrink-0">
            <Image
              src="/assets/images/dashboard-growth.png"
              alt="Ilustrasi Analisis Data"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        </div>
      )}

      {/* ─── Kartu Statistik Metrik ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <StatsCard
          title="Total Kunjungan"
          value={displayTotalCount}
          subtitle="Tercatat di sistem"
          icon={IconUser}
        />
        <StatsCard
          title="Menunggu Respon"
          value={pendingCount}
          subtitle="Perlu konfirmasi"
          icon={IconClock}
        />
        <StatsCard
          title="Disetujui"
          value={approvedCount}
          subtitle="Kunjungan aktif"
          icon={IconBuilding}
        />
        {isHost ? (
          <StatsCard
            title="Ditolak"
            value={rejectedCount}
            subtitle="Kunjungan dibatalkan"
            icon={IconX}
          />
        ) : (
          <StatsCard
            title="Tamu Owner VIP"
            value={ownerCount}
            subtitle="Disetujui otomatis"
            icon={IconCrown}
          />
        )}
      </div>

      {/* ─── Analitik & Grafik (Adaptif Multi-Role) ───────────────────── */}
      <DashboardCharts user={user} />

      {/* ─── Widget Kunjungan Terkini & Pintasan Riwayat ───────────────── */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
                <IconClipboard className="w-4 h-4" />
              </span>
              <h2
                className="text-base font-bold text-zinc-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Kunjungan Terkini
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Menampilkan 5 aktivitas tamu terbaru di sistem.
            </p>
          </div>

          <Link
            href="/dashboard/visits"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>Buka Riwayat Lengkap</span>
            <IconChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* List Card Kunjungan Terkini */}
        <div className="space-y-3 pt-2">
          {loadingRecent ? (
            <div className="py-10 text-center text-zinc-400 bg-zinc-50/50 rounded-2xl border border-zinc-200/70">
              <div className="flex items-center justify-center gap-2">
                <IconSpinner className="w-5 h-5 text-zinc-600 animate-spin" />
                <span className="text-xs">Memuat kunjungan terbaru...</span>
              </div>
            </div>
          ) : recentVisits.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 bg-zinc-50/50 rounded-2xl border border-zinc-200/70 px-4">
              <p className="text-xs font-semibold text-zinc-600">
                Belum ada aktivitas kunjungan terbaru.
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Data akan tampil otomatis saat ada tamu yang check-in di pos security.
              </p>
            </div>
          ) : (
            recentVisits.map((visit) => (
              <div
                key={visit.id}
                className="bg-zinc-50/60 rounded-2xl border border-zinc-200/80 p-4 space-y-3 hover:border-zinc-300 hover:bg-white transition-all shadow-2xs"
              >
                {/* Header Kartu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {visit.guestPhotoUrl ? (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-zinc-100 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={visit.guestPhotoUrl}
                          alt={visit.guestName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl shrink-0 bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                        <IconUser className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-zinc-900 text-xs sm:text-sm truncate">
                          {visit.guestName}
                        </h4>
                        {visit.visitorType === "OWNER" && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            <IconCrown className="w-2.5 h-2.5 text-amber-600" />
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {visit.guestPhone}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      statusBadge[visit.status] || "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {statusLabel[visit.status] || visit.status}
                  </span>
                </div>

                {/* Info Detail */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-200/60 text-xs">
                  {visit.organization && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <IconBuilding className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{visit.organization}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-zinc-700">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mt-0.5">
                      Keperluan:
                    </span>
                    <span className="line-clamp-2 text-xs">{visit.purpose}</span>
                  </div>
                  {isHRDorAdmin && visit.host && (
                    <div className="flex items-center gap-2 text-zinc-600 text-[11px]">
                      <span className="font-semibold text-zinc-400 uppercase tracking-wider">Host:</span>
                      <span className="truncate font-medium text-zinc-800">
                        {visit.host.name} {visit.host.department ? `(${visit.host.department})` : ""}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5">
                    <IconClock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Check-in: {formatDate(visit.createdAt)}</span>
                  </div>
                </div>

                {/* Aksi Cepat / Rincian */}
                <div className="pt-2 border-t border-zinc-200/60 flex items-center gap-2">
                  {isHost && visit.status === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setQuickResponding({ visit, action: "APPROVED" })}
                        className="flex-1 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors text-center cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickResponding({ visit, action: "REJECTED" })}
                        className="flex-1 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors text-center cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedVisit(visit)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Detail
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedVisit(visit)}
                      className="w-full py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-900 hover:text-white text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      Lihat Rincian Tamu
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Banner CTA Menuju Riwayat Lengkap */}
        <div className="pt-3 mt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-zinc-500 text-center sm:text-left">
            Butuh pencarian komprehensif, filter rentang tanggal, atau ekspor laporan Excel?
          </p>
          <Link
            href="/dashboard/visits"
            className="inline-flex items-center gap-1 font-semibold text-zinc-900 hover:text-zinc-700 underline underline-offset-4 cursor-pointer shrink-0"
          >
            <span>Buka Riwayat Kunjungan Selengkapnya</span>
            <IconChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── Modal Rincian Kunjungan Lengkap ───────────────────────────── */}
      <VisitDetailModal
        visit={selectedVisit}
        onClose={() => setSelectedVisit(null)}
        isHost={isHost}
        isAdmin={isAdmin}
        currentUserId={user?.id}
        onRespond={handleDirectRespond}
        onDelete={() => {}}
      />

      {/* ─── Modal Respon Cepat Host ───────────────────────────────────── */}
      <QuickRespondModal
        target={quickResponding}
        onClose={() => setQuickResponding(null)}
        onConfirm={handleDirectRespond}
      />

      {/* ─── Toast Notifikasi Feedback ─────────────────────────────────── */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 text-white shadow-xl text-xs font-medium animate-fadeIn">
          <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
            <IconCheck className="w-3 h-3" />
          </div>
          <span>{feedbackToast.message}</span>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="ml-2 text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
