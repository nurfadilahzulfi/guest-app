"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSearch,
  IconPlus,
  IconBuilding,
  IconCheck,
} from "@/components/icons/guest-icons";

import { MasterSelect } from "@/components/dashboard/master-select";
import { MasterDataModal } from "@/components/dashboard/master-data-modal";
import { HostsList } from "@/components/dashboard/hosts/hosts-list";
import { AddHostModal } from "@/components/dashboard/hosts/add-host-modal";
import { EditHostModal } from "@/components/dashboard/hosts/edit-host-modal";
import { HostInviteSuccessModal } from "@/components/dashboard/hosts/host-invite-success-modal";

/**
 * Halaman Pengelolaan Direktori Karyawan Host (Administrator Only).
 * Orchestrator: mengelola state dan memanggil use-case melalui API,
 * lalu mendistribusikan data ke komponen presentasi yang terpisah.
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

  // State Modal Edit
  const [editHost, setEditHost] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "", email: "", department: "", position: "",
    isDepartmentHead: false, isActive: true,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [formData, setFormData] = useState({
    name: "", email: "", department: "", position: "", password: "", isDepartmentHead: false,
  });

  const generateHostPassword = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, password: `Tanimas@${digits}` }));
  };

  const fetchHosts = useCallback(async () => {
    setLoading(true);
    try {
      // Ambil semua user (semua role) yang memiliki data departemen/jabatan
      // agar administrator dan admin HRD yang berperan sebagai karyawan juga muncul
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        // Ambil semua pengguna sistem (HOST, ADMINISTRATOR, ADMIN_HRD)
        // Seluruh staf dan pimpinan akan tampil di direktori karyawan
        const allEmployees = Array.isArray(data) ? data : [];
        setHosts(allEmployees);
      }
    } catch (err) {
      console.error("Gagal mengambil direktori karyawan:", err);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => { fetchHosts(); }, [fetchHosts]);

  const departments = Array.from(new Set(hosts.map((h) => h.department).filter(Boolean)));

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
        });
      }
      setFormData({ name: "", email: "", department: "", position: "", password: "", isDepartmentHead: false });
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
      ? `Nonaktifkan karyawan "${host.name}"?`
      : `Aktifkan kembali karyawan "${host.name}"?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: host.id, isActive: !host.isActive }),
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
    const msg = `Hapus permanen data karyawan "${host.name}"?\n\nPerhatian: Tindakan ini tidak dapat dibatalkan.`;
    if (!window.confirm(msg)) return;
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

  const openEditHostModal = (host) => {
    setEditHost(host);
    setEditFormData({
      name: host.name || "", email: host.email || "", department: host.department || "",
      position: host.position || "", isDepartmentHead: !!host.isDepartmentHead,
      isActive: host.isActive ?? true,
    });
    setEditError("");
  };

  const handleSaveEditHost = async (e) => {
    e.preventDefault();
    if (!editHost) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editHost.id, ...editFormData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui data karyawan.");

      setSuccessMsg(`Data karyawan "${editFormData.name}" berhasil diperbarui.`);
      setEditHost(null);
      fetchHosts();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Data Karyawan</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Daftar staf dan pimpinan yang dapat dipilih tamu saat kunjungan.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowMasterModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <IconBuilding className="w-3.5 h-3.5" />
            <span>Dept &amp; Jabatan</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <IconPlus className="w-3.5 h-3.5" />
            <span>Tambah Karyawan</span>
          </button>
        </div>
      </div>

      {/* Alert Sukses */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter & Daftar */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <IconSearch className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, email, atau jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-900"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <HostsList
          hosts={filteredHosts}
          loading={loading}
          onEdit={openEditHostModal}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteHost}
        />
      </div>

      {/* Modals */}
      <AddHostModal
        isOpen={showAddModal}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        formError={formError}
        showPassword={showHostPassword}
        setShowPassword={setShowHostPassword}
        onGeneratePassword={generateHostPassword}
        onSubmit={handleCreateHost}
        onClose={() => setShowAddModal(false)}
      />

      <HostInviteSuccessModal
        data={inviteSuccessData}
        onClose={() => setInviteSuccessData(null)}
      />

      <EditHostModal
        host={editHost}
        formData={editFormData}
        setFormData={setEditFormData}
        submitting={editSubmitting}
        error={editError}
        onSubmit={handleSaveEditHost}
        onClose={() => setEditHost(null)}
      />

      <MasterDataModal
        isOpen={showMasterModal}
        onClose={() => setShowMasterModal(false)}
        onUpdated={fetchHosts}
      />
    </div>
  );
}
