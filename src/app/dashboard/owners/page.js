"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  IconSearch,
  IconPlus,
  IconCrown,
  IconSpinner,
  IconX,
  IconCheck,
  IconPhone,
} from "@/components/icons/guest-icons";

/**
 * Halaman Pengelolaan Daftar Tamu Khusus / Owner (Administrator Only).
 * Mengizinkan penambahan nomor HP Owner (otomatis disetujui tanpa perlu respon host).
 */
export default function ManageOwnersPage() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
  });

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/owners");
      if (res.ok) {
        const data = await res.json();
        setOwners(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Gagal mengambil daftar owner:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const filteredOwners = owners.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.name?.toLowerCase().includes(q) ||
      o.phoneNumber?.includes(q)
    );
  });

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan data owner.");

      setSuccessMsg(`Owner ${formData.name} berhasil ditambahkan.`);
      setShowAddModal(false);
      setFormData({ name: "", phoneNumber: "" });
      fetchOwners();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (owner) => {
    if (!owner.isActive) return;

    const confirmMsg = `Nonaktifkan status VIP untuk "${owner.name}" (${owner.phoneNumber})? Kunjungan berikutnya tidak akan otomatis disetujui.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/owners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: owner.id }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menonaktifkan owner");
      }

      fetchOwners();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(d);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Daftar Tamu Khusus (Owner VIP)
            </h1>
            <span className="p-1 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
              <IconCrown className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Nomor HP yang terdaftar di sini otomatis mendapatkan status kunjungan <strong>APPROVED (Disetujui Langsung)</strong> saat check-in.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <IconPlus className="w-4 h-4" />
          <span>Tambah Owner Baru</span>
        </button>
      </div>

      {/* Alert Sukses */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <IconCheck className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter & Toolbar */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <IconSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau nomor HP owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
          />
        </div>

        {/* Tabel Data Owner */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/90">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3.5">Nama Owner / Pemilik</th>
                <th className="px-4 py-3.5">Nomor HP (Ternormalisasi E.164)</th>
                <th className="px-4 py-3.5">Tanggal Terdaftar</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <IconSpinner className="w-5 h-5 text-zinc-600" />
                      <span>Memuat daftar owner...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-400">
                    Belum ada data owner yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                          👑
                        </span>
                        <span>{owner.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-zinc-700">
                      {owner.phoneNumber}
                    </td>

                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(owner.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          owner.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        {owner.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {owner.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(owner)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Nonaktifkan
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">
                          Sudah dinonaktifkan
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Owner Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <IconCrown className="w-5 h-5 text-amber-600" />
                <h3
                  className="text-base font-bold text-zinc-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Tambah Owner VIP Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateOwner} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
                  Nama Lengkap Owner *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bapak Tanoto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
                  Nomor HP Tamu / Owner *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789 atau +628123456789"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  *Nomor HP akan otomatis dinormalisasi ke format standar internasional E.164 (+628...).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Owner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
