"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  IconSearch,
  IconSpinner,
  IconCrown,
  IconUser,
  IconBuilding,
  IconClock,
  IconCheck,
  IconX,
  IconTrash,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconClipboard,
} from "@/components/icons/guest-icons";
import { VisitDetailModal } from "../visit-detail-modal";
import { QuickRespondModal } from "../quick-respond-modal";

/**
 * Tampilan halaman khusus Riwayat Kunjungan & Buku Tamu.
 * Mendukung pencarian, filter multi-dimensi, pagination, ekspor CSV,
 * aksi respon langsung oleh Host, serta penghapusan tunggal & massal oleh Administrator.
 * 
 * @param {Object} props
 * @param {Object} props.user - Objek sesi user login (id, name, email, role, department)
 */
export function VisitsHistoryView({ user }) {
  const isHost = user?.role === "HOST";
  const isHRDorAdmin = user?.role === "ADMIN_HRD" || user?.role === "ADMINISTRATOR";
  const isAdmin = user?.role === "ADMINISTRATOR";

  const [visits, setVisits] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [quickResponding, setQuickResponding] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // State untuk penghapusan (Khusus Administrator)
  const [visitToDelete, setVisitToDelete] = useState(null);
  const [selectedVisitIds, setSelectedVisitIds] = useState([]);
  const [deletingVisit, setDeletingVisit] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Daftar departemen untuk dropdown filter
  const [departments, setDepartments] = useState([]);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("");
  const [visitorTypeFilter, setVisitorTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Mengambil daftar departemen untuk opsi filter Admin & HRD
  useEffect(() => {
    if (isHRDorAdmin) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const depts = Array.from(
              new Set(data.map((u) => u.department).filter(Boolean))
            ).sort();
            setDepartments(depts);
          }
        })
        .catch((err) => console.error("Gagal memuat departemen:", err));
    }
  }, [isHRDorAdmin]);

  // Mengambil data kunjungan dari API
  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (statusFilter) params.set("status", statusFilter);
      if (visitorTypeFilter) params.set("visitorType", visitorTypeFilter);
      if (departmentFilter) params.set("department", departmentFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/visits?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setVisits(Array.isArray(json.data) ? json.data : []);
        setTotalCount(typeof json.total === "number" ? json.total : 0);
      }
    } catch (err) {
      console.error("Gagal mengambil data riwayat kunjungan:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, visitorTypeFilter, departmentFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Handler respon langsung oleh Host (Approve / Reject)
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

    await fetchVisits();
    return data;
  };

  // Filter pencarian client-side berdasarkan nama, instansi, keperluan, atau host
  const filteredVisits = visits.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.guestName?.toLowerCase().includes(q) ||
      v.guestPhone?.toLowerCase().includes(q) ||
      v.organization?.toLowerCase().includes(q) ||
      v.purpose?.toLowerCase().includes(q) ||
      v.host?.name?.toLowerCase().includes(q) ||
      v.host?.department?.toLowerCase().includes(q)
    );
  });

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

  // Handler eksekusi hapus kunjungan tamu (single / bulk)
  const handleConfirmDelete = async () => {
    if (!visitToDelete) return;
    setDeletingVisit(true);
    setDeleteError("");
    try {
      let bodyPayload = {};
      if (visitToDelete.isBulk) {
        bodyPayload = { visitIds: selectedVisitIds };
      } else {
        bodyPayload = { visitId: visitToDelete.id };
      }

      const res = await fetch("/api/visits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus data kunjungan.");
      }

      setFeedbackToast({
        type: "success",
        message: data.message || "Data kunjungan tamu berhasil dihapus.",
      });
      setTimeout(() => setFeedbackToast(null), 4000);

      // Reset selection dan modal
      setVisitToDelete(null);
      setSelectedVisitIds([]);
      if (
        selectedVisit &&
        (selectedVisit.id === visitToDelete.id ||
          selectedVisitIds.includes(selectedVisit.id))
      ) {
        setSelectedVisit(null);
      }

      await fetchVisits();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingVisit(false);
    }
  };

  const toggleSelectVisit = (id) => {
    setSelectedVisitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVisitIds.length === filteredVisits.length) {
      setSelectedVisitIds([]);
    } else {
      setSelectedVisitIds(filteredVisits.map((v) => v.id));
    }
  };

  // Handler ekspor daftar kunjungan ke file CSV
  const handleExportCSV = () => {
    if (!filteredVisits || filteredVisits.length === 0) return;
    const headers = [
      "ID Kunjungan",
      "Waktu Check-in",
      "Nama Tamu",
      "Jenis Kelamin",
      "Nomor HP",
      "Email Tamu",
      "Asal Instansi",
      "Karyawan yang Dituju",
      "Departemen Host",
      "Jabatan Host",
      "Keperluan",
      "Durasi",
      "Kategori Tamu",
      "Status Kunjungan",
      "Catatan Host",
      "Waktu Respon",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredVisits.map((v) => [
      escapeCsv(v.id),
      escapeCsv(formatDate(v.createdAt)),
      escapeCsv(v.guestName),
      escapeCsv(v.gender || "—"),
      escapeCsv(v.guestPhone),
      escapeCsv(v.guestEmail || "—"),
      escapeCsv(v.organization || "—"),
      escapeCsv(v.host?.name || "—"),
      escapeCsv(v.host?.department || "—"),
      escapeCsv(v.host?.position || "—"),
      escapeCsv(v.purpose),
      escapeCsv(v.duration || "—"),
      escapeCsv(v.visitorType),
      escapeCsv(statusLabel[v.status] || v.status),
      escapeCsv(v.hostReply || "—"),
      escapeCsv(v.respondedAt ? formatDate(v.respondedAt) : "—"),
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `rekap-kunjungan-tamu-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset semua filter
  const handleResetFilter = () => {
    setStatusFilter("");
    setVisitorTypeFilter("");
    setDepartmentFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    statusFilter || visitorTypeFilter || departmentFilter || dateFrom || dateTo || searchQuery
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-6">
      {/* ─── Header Halaman Riwayat Kunjungan ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-zinc-900 text-white shadow-xs">
              <IconClipboard className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-700">
              Buku Tamu Digital
            </span>
          </div>
          <h1
            className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Riwayat Kunjungan Tamu
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isHost
              ? "Daftar seluruh riwayat kunjungan dan janji temu yang ditujukan kepada Anda."
              : "Daftar seluruh riwayat kunjungan buku tamu PT. Tanimas Resources Internasional."}
          </p>
        </div>

        {/* Tombol Ekspor CSV */}
        {isHRDorAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredVisits.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              title="Unduh data riwayat kunjungan ke file CSV / Excel"
            >
              <IconDownload className="w-4 h-4 text-zinc-600" />
              <span>Ekspor Rekap CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Card Filter & Konten Utama ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Baris Pencarian & Counter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900">
              Total {totalCount} Data Kunjungan
            </span>
            {hasActiveFilters && (
              <span className="text-[11px] text-zinc-400">
                (Menampilkan {filteredVisits.length} hasil filter)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <IconSearch className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari nama, nomor HP, instansi, host..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Multi-Filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-zinc-100 text-xs">
          {/* Filter Status */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Status Kunjungan
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu Respon</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>

          {/* Kategori Tamu (Khusus Admin / HRD) */}
          {isHRDorAdmin ? (
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Kategori Tamu
              </label>
              <select
                value={visitorTypeFilter}
                onChange={(e) => {
                  setVisitorTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:border-zinc-900"
              >
                <option value="">Semua Kategori</option>
                <option value="REGULAR">Tamu Biasa</option>
                <option value="OWNER">Owner VIP</option>
              </select>
            </div>
          ) : null}

          {/* Departemen (Khusus Admin / HRD) */}
          {isHRDorAdmin ? (
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Departemen Host
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:border-zinc-900"
              >
                <option value="">Semua Departemen</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Tanggal Dari */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:border-zinc-900"
            />
          </div>

          {/* Tanggal Sampai */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* ─── Bulk Action Bar (Khusus Administrator) ─── */}
        {isAdmin && filteredVisits.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={
                  selectedVisitIds.length === filteredVisits.length &&
                  filteredVisits.length > 0
                }
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
              />
              <span className="text-xs font-medium text-zinc-600">
                Pilih Semua ({filteredVisits.length})
              </span>
            </label>

            {selectedVisitIds.length > 0 && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-xs font-bold text-zinc-800">
                  {selectedVisitIds.length} dipilih
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setVisitToDelete({
                      isBulk: true,
                      count: selectedVisitIds.length,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih ({selectedVisitIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVisitIds([])}
                  className="px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── Daftar Riwayat Kunjungan (Card Layout Responsif) ─── */}
        <div className="space-y-3 sm:space-y-3.5">
          {loading ? (
            <div className="py-16 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-200/90">
              <div className="flex items-center justify-center gap-2">
                <IconSpinner className="w-5 h-5 text-zinc-600 animate-spin" />
                <span>Memuat riwayat kunjungan...</span>
              </div>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-200/90 px-4">
              <div className="max-w-xs mx-auto space-y-3">
                <div className="w-16 h-16 mx-auto relative opacity-70">
                  <Image
                    src="/assets/images/dashboard-meeting.png"
                    alt="Empty State"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <p className="text-xs font-semibold text-zinc-600">
                  Belum ada kunjungan yang ditemukan
                </p>
                <p className="text-[11px] text-zinc-400">
                  {hasActiveFilters
                    ? "Coba ubah kata kunci pencarian atau sesuaikan opsi filter Anda."
                    : "Data kunjungan tamu akan muncul di sini secara otomatis setelah tamu check-in."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredVisits.map((visit) => (
              <div
                key={visit.id}
                className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-xs space-y-3 hover:border-zinc-300 transition-colors"
              >
                {/* Header Kartu: Checkbox (Admin), Foto, Nama, Kategori & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={selectedVisitIds.includes(visit.id)}
                        onChange={() => toggleSelectVisit(visit.id)}
                        className="w-4 h-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer shrink-0"
                      />
                    )}
                    {visit.guestPhotoUrl ? (
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-zinc-100 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={visit.guestPhotoUrl}
                          alt={visit.guestName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl shrink-0 bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                        <IconUser className="w-5 h-5" />
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
                <div className="space-y-1.5 pt-2 border-t border-zinc-100 text-xs">
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

                {/* Aksi Host / Rincian / Hapus */}
                <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                  {isHost && visit.status === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setQuickResponding({ visit, action: "APPROVED" })}
                        className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors text-center cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickResponding({ visit, action: "REJECTED" })}
                        className="flex-1 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors text-center cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedVisit(visit)}
                        className="px-3 py-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Detail
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setVisitToDelete(visit)}
                          title="Hapus Kunjungan"
                          className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer shrink-0"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setSelectedVisit(visit)}
                        className="flex-1 py-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-900 hover:text-white text-xs font-semibold transition-colors cursor-pointer text-center"
                      >
                        Lihat Rincian Lengkap
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setVisitToDelete(visit)}
                          title="Hapus Kunjungan"
                          className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer shrink-0"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── Kontrol Pagination ────────────────────────────────────────── */}
        {!loading && totalCount > limit && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-100 text-xs">
            <div className="text-zinc-500 text-center sm:text-left">
              Halaman <span className="font-bold text-zinc-800">{page}</span> dari{" "}
              <span className="font-bold text-zinc-800">{totalPages}</span> (Total {totalCount} kunjungan)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              >
                <IconChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              >
                <span>Selanjutnya</span>
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal Rincian Kunjungan Lengkap ───────────────────────────── */}
      <VisitDetailModal
        visit={selectedVisit}
        onClose={() => setSelectedVisit(null)}
        isHost={isHost}
        isAdmin={isAdmin}
        currentUserId={user?.id}
        onRespond={handleDirectRespond}
        onDelete={(visit) => setVisitToDelete(visit)}
      />

      {/* ─── Modal Respon Cepat Host ───────────────────────────────────── */}
      <QuickRespondModal
        target={quickResponding}
        onClose={() => setQuickResponding(null)}
        onConfirm={handleDirectRespond}
      />

      {/* ─── Modal Konfirmasi Hapus Kunjungan (Khusus Administrator) ─── */}
      {visitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-sm w-full p-6 animate-scaleIn space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
              <IconTrash className="w-6 h-6" />
            </div>

            <div>
              <h3
                className="text-base font-bold text-zinc-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {visitToDelete.isBulk
                  ? "Hapus Kunjungan Terpilih?"
                  : "Hapus Data Kunjungan Tamu?"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {visitToDelete.isBulk
                  ? `Apakah Anda yakin ingin menghapus ${selectedVisitIds.length} data kunjungan tamu yang dipilih? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`
                  : `Apakah Anda yakin ingin menghapus riwayat kunjungan dari "${visitToDelete.guestName}"? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`}
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                ⚠️ {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                disabled={deletingVisit}
                onClick={() => {
                  setVisitToDelete(null);
                  setDeleteError("");
                }}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingVisit}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingVisit ? (
                  <>
                    <IconSpinner className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Hapus Permanen</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
