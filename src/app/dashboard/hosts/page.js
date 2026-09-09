"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSearch,
  IconPlus,
  IconBuilding,
  IconSpinner,
  IconX,
  IconCheck,
  IconTrash,
  IconCopy,
  IconLock,
  IconEye,
  IconEyeOff,
  IconMail,
} from "@/components/icons/guest-icons";

import { MasterSelect } from "@/components/dashboard/master-select";
import { MasterDataModal } from "@/components/dashboard/master-data-modal";

/**
 * Halaman Pengelolaan Direktori Host (Administrator Only).
 * Mengizinkan penambahan host baru, pengubahan status aktif/nonaktif, dan pencarian staf.
 */
export default function ManageHostsPage() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [inviteSuccessData, setInviteSuccessData] = useState(null);
  const [showHostPassword, setShowHostPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    password: "",
    isDepartmentHead: false,
  });

  const generateHostPassword = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, password: `Tanimas@${digits}` }));
  };

  const fetchHosts = useCallback(async () => {
    setLoading(true);
    try {
      // Ambil seluruh user dengan role HOST
      const res = await fetch("/api/users?role=HOST");
      if (res.ok) {
        const data = await res.json();
        setHosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Gagal mengambil direktori host:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  const departments = Array.from(
    new Set(hosts.map((h) => h.department).filter(Boolean))
  );

  const filteredHosts = hosts.filter((h) => {
    const q = search.toLowerCase();
    const matchQuery =
      !q ||
      h.name?.toLowerCase().includes(q) ||
      h.email?.toLowerCase().includes(q) ||
      h.position?.toLowerCase().includes(q);
    const matchDept = !deptFilter || h.department === deptFilter;
    return matchQuery && matchDept;
  });

  const handleCreateHost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/hosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan data karyawan.");

      setSuccessMsg(`Karyawan ${formData.name} berhasil ditambahkan.`);
      setShowAddModal(false);

      if (json.rawPassword || json.inviteUrl) {
        setInviteSuccessData({
          name: formData.name,
          email: formData.email,
          rawPassword: json.rawPassword,
          loginUrl: json.loginUrl || `${window.location.origin}/login`,
          inviteUrl: json.inviteUrl,
        });
      }

      setFormData({
        name: "",
        email: "",
        department: "",
        position: "",
        password: "",
        isDepartmentHead: false,
      });
      fetchHosts();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (host) => {
    const confirmMsg = host.isActive
      ? `Nonaktifkan karyawan "${host.name}"? Karyawan yang dinonaktifkan tidak akan muncul pada pilihan tamu.`
      : `Aktifkan kembali karyawan "${host.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: host.id,
          isActive: !host.isActive,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal memperbarui status host");
      }

      fetchHosts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteHost = async (host) => {
    const confirmMsg = `Hapus permanen data karyawan "${host.name}"?\n\nPerhatian: Tindakan ini tidak dapat dibatalkan. Jika karyawan sudah memiliki riwayat kunjungan tamu di masa lalu, sistem akan membatalkan penghapusan demi menjaga integritas arsip buku tamu.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/hosts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId: host.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus karyawan.");

      setSuccessMsg(`Karyawan "${host.name}" berhasil dihapus permanen.`);
      fetchHosts();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Data Karyawan & Pimpinan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Daftar seluruh staf dan pimpinan yang dapat dipilih oleh tamu saat registrasi kunjungan.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowMasterModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <IconBuilding className="w-4 h-4 text-zinc-600" />
            <span>Kelola Departemen & Jabatan</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <IconPlus className="w-4 h-4" />
            <span>Tambah Karyawan Baru</span>
          </button>
        </div>
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
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Input Search */}
          <div className="relative flex-1 w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, email, atau jabatan karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>

          {/* Filter Departemen */}
          <div className="w-full sm:w-60">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Tampilan Mobile (Daftar Kartu Tanpa Scroll Samping di HP) ─── */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="py-10 text-center text-zinc-400">
              <div className="flex items-center justify-center gap-2">
                <IconSpinner className="w-5 h-5 text-zinc-600" />
                <span>Memuat data karyawan...</span>
              </div>
            </div>
          ) : filteredHosts.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs">
              Tidak ada data karyawan yang sesuai dengan kriteria pencarian.
            </div>
          ) : (
            filteredHosts.map((host) => (
              <div
                key={host.id}
                className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {host.name?.[0]?.toUpperCase() ?? "K"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 truncate">{host.name}</h4>
                      <p className="text-xs text-zinc-500 truncate">{host.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      host.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                    }`}
                  >
                    {host.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">
                      Departemen
                    </span>
                    <span className="font-medium text-zinc-800">{host.department || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">
                      Jabatan
                    </span>
                    <span className="font-medium text-zinc-800">{host.position || "—"}</span>
                  </div>
                </div>

                {host.isDepartmentHead && (
                  <div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      Kepala Departemen
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(host)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer text-center ${
                      host.isActive
                        ? "text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50"
                        : "text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
                    }`}
                  >
                    {host.isActive ? "Nonaktifkan Karyawan" : "Aktifkan Karyawan"}
                  </button>

                  {!host.isActive && (
                    <button
                      type="button"
                      onClick={() => handleDeleteHost(host)}
                      className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                      title="Hapus Permanen"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── Tampilan Desktop / Tablet (Tabel Lengkap) ─── */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-zinc-200/90">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3.5">Nama Karyawan</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Departemen</th>
                <th className="px-4 py-3.5">Jabatan / Posisi</th>
                <th className="px-4 py-3.5 text-center">Tingkat Jabatan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <IconSpinner className="w-5 h-5 text-zinc-600" />
                      <span>Memuat data karyawan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredHosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400">
                    Tidak ada data karyawan yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredHosts.map((host) => (
                  <tr key={host.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {host.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {host.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-800 font-medium">
                      {host.department || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {host.position || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {host.isDepartmentHead ? (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          Kepala Dept
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Staf</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          host.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        {host.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(host)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            host.isActive
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {host.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        {!host.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteHost(host)}
                            className="p-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="Hapus Permanen"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Host Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3
                className="text-base font-bold text-zinc-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Tambah Karyawan Baru
              </h3>
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

            <form onSubmit={handleCreateHost} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
                  Nama Lengkap Karyawan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sarah Wijaya"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
                  Email Perusahaan *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@tanimas.co.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="space-y-3">
                <MasterSelect
                  label="Departemen"
                  required
                  value={formData.department}
                  onChange={(val) => setFormData({ ...formData, department: val })}
                  endpoint="/api/departments"
                  placeholder="Pilih Departemen..."
                  itemType="departemen"
                />

                <MasterSelect
                  label="Jabatan / Posisi"
                  required
                  value={formData.position}
                  onChange={(val) => setFormData({ ...formData, position: val })}
                  endpoint="/api/positions"
                  placeholder="Pilih Jabatan..."
                  itemType="jabatan"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
                    Kata Sandi Akun (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={generateHostPassword}
                    className="text-[10px] font-semibold text-zinc-900 hover:underline cursor-pointer"
                  >
                    ⚡ Acak Sandi Otomatis
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showHostPassword ? "text" : "password"}
                    placeholder="Kosongkan untuk buat otomatis (contoh: Tanimas@8492)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 pr-10 text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowHostPassword(!showHostPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showHostPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  *Email dan kata sandi ini akan otomatis dikirimkan ke email karyawan bersama link login ke sistem.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isDepartmentHead}
                    onChange={(e) =>
                      setFormData({ ...formData, isDepartmentHead: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                  />
                  <span className="text-xs text-zinc-700 font-medium">
                    Karyawan ini adalah Kepala Departemen (Department Head)
                  </span>
                </label>
                <p className="text-[10px] text-zinc-400 mt-1 pl-6">
                  *Kunjungan ke Kepala Dept akan otomatis mengirimkan tembusan notifikasi ke Admin HRD & Administrator.
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
                  {submitting ? "Menyimpan..." : "Simpan Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Sukses Tambah Karyawan (Kredensial Akun & Email Terkirim) ─── */}
      {inviteSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <IconCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Akun Karyawan Berhasil Dibuat!
                </h3>
                <p className="text-xs text-zinc-500">
                  Untuk {inviteSuccessData.name}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex items-center gap-2">
                <IconMail className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Email Kredensial Telah Terkirim
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Detail akun dan link masuk telah dikirimkan ke <strong>{inviteSuccessData.email}</strong>.
              </p>

              <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Email:</span>
                  <span className="font-mono font-bold text-zinc-900">{inviteSuccessData.email}</span>
                </div>
                {inviteSuccessData.rawPassword && (
                  <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Kata Sandi:</span>
                    <span className="font-mono font-bold text-zinc-900 bg-amber-100 px-2 py-0.5 rounded">
                      {inviteSuccessData.rawPassword}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-500">Link Login:</span>
                  <span className="font-mono text-[11px] text-blue-600 truncate max-w-[200px]">
                    {inviteSuccessData.loginUrl || `${window.location.origin}/login`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  const loginUrl = inviteSuccessData.loginUrl || `${window.location.origin}/login`;
                  const text = `Halo ${inviteSuccessData.name},\nBerikut adalah akun Anda untuk login ke Guest App PT Tanimas Resources Internasional:\nEmail: ${inviteSuccessData.email}\nKata Sandi: ${inviteSuccessData.rawPassword || "(Sesuai yang diatur)"}\nLink Login: ${loginUrl}`;
                  await navigator.clipboard.writeText(text);
                  alert("Kredensial login berhasil disalin ke clipboard!");
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <IconCopy className="w-4 h-4" />
                <span>Salin Kredensial Login</span>
              </button>
              <button
                type="button"
                onClick={() => setInviteSuccessData(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Master Data Departemen & Jabatan */}
      <MasterDataModal
        isOpen={showMasterModal}
        onClose={() => setShowMasterModal(false)}
        onUpdated={fetchHosts}
      />
    </div>
  );
}
