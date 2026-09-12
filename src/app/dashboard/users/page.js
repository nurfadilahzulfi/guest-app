"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSearch,
  IconPlus,
  IconBuilding,
  IconCheck,
} from "@/components/icons/guest-icons";

import { MasterDataModal } from "@/components/dashboard/master-data-modal";
import { UsersList } from "@/components/dashboard/users/users-list";
import { InviteUserModal } from "@/components/dashboard/users/invite-user-modal";
import { EditUserModal } from "@/components/dashboard/users/edit-user-modal";
import { ResetPasswordModal } from "@/components/dashboard/users/reset-password-modal";
import { UserInviteSuccessModal } from "@/components/dashboard/users/user-invite-success-modal";

/**
 * Halaman Pengelolaan Pengguna Sistem (Administrator Only).
 * Orchestrator: mengelola state dan memanggil API, mendistribusikan data ke komponen presentasi.
 */
export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedTokenId, setCopiedTokenId] = useState(null);
  const [inviteSuccessData, setInviteSuccessData] = useState(null);
  const [showUserPassword, setShowUserPassword] = useState(false);

  // State reset password
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccessCreds, setResetSuccessCreds] = useState(null);

  // State edit user
  const [editModalUser, setEditModalUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "", email: "", role: "HOST", department: "", position: "", isDepartmentHead: false,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [formData, setFormData] = useState({
    name: "", email: "", role: "HOST", department: "", position: "", password: "", isDepartmentHead: false,
  });

  const generateUserPassword = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, password: `Tanimas@${digits}` }));
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchQuery =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.position?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchQuery && matchRole;
  });

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        ...(formData.password?.trim() ? { password: formData.password.trim() } : {}),
        // Departemen & jabatan dikirim untuk semua role — Administrator / Admin HRD
        // yang punya jabatan akan muncul sebagai host di dropdown buku tamu
        ...(formData.department?.trim() ? { department: formData.department.trim() } : {}),
        ...(formData.position?.trim() ? { position: formData.position.trim() } : {}),
        isDepartmentHead: formData.isDepartmentHead || false,
      };
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengundang user baru.");

      setShowInviteModal(false);
      setInviteSuccessData({
        name: formData.name,
        email: formData.email,
        rawPassword: json.rawPassword,
        loginUrl: json.loginUrl || `${window.location.origin}/login`,
        inviteUrl: json.inviteUrl || `${window.location.origin}/invite/${json.inviteToken}`,
      });
      setFormData({ name: "", email: "", role: "HOST", department: "", position: "", password: "", isDepartmentHead: false });
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (targetUser) => {
    const actionText = targetUser.isActive ? "Nonaktifkan" : "Aktifkan";
    if (!window.confirm(`${actionText} akun user "${targetUser.name}"?`)) return;
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, isActive: !targetUser.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui status user.");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const msg = `Hapus permanen akun "${targetUser.name}" (${targetUser.email})?\n\nTindakan ini tidak dapat dibatalkan.`;
    if (!window.confirm(msg)) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus pengguna.");

      setSuccessMsg(`Akun "${targetUser.name}" berhasil dihapus permanen.`);
      fetchUsers();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditUserModal = (u) => {
    setEditModalUser(u);
    setEditFormData({
      name: u.name || "", email: u.email || "", role: u.role || "HOST",
      department: u.department || "", position: u.position || "",
      isDepartmentHead: Boolean(u.isDepartmentHead),
    });
    setEditError("");
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editModalUser.id,
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          role: editFormData.role,
          department: editFormData.department ? editFormData.department.trim() : "",
          position: editFormData.position ? editFormData.position.trim() : "",
          isDepartmentHead: editFormData.isDepartmentHead,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui data pengguna.");

      setSuccessMsg(`Data pengguna "${data.name}" berhasil diperbarui.`);
      setEditModalUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCopyInviteLink = async (user) => {
    try {
      let inviteUrl = "";
      if (user.activeInviteToken) {
        inviteUrl = `${window.location.origin}/invite/${user.activeInviteToken}`;
      } else {
        const res = await fetch("/api/users/invite/resend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat tautan aktivasi.");
        inviteUrl = json.inviteUrl;
        fetchUsers();
      }
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedTokenId(user.id);
      setTimeout(() => setCopiedTokenId(null), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const openResetPasswordModal = (user) => {
    setResetModalUser(user);
    setNewPassword("");
    setShowPassword(false);
    setResetError("");
    setResetSuccessCreds(null);
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let rand = "TRI-";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    rand += "!26";
    setNewPassword(rand);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setResetError("Kata sandi minimal 8 karakter.");
      return;
    }
    setResetSubmitting(true);
    setResetError("");
    try {
      const res = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetModalUser.id, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui kata sandi.");

      setResetSuccessCreds({
        name: resetModalUser.name,
        email: resetModalUser.email,
        password: newPassword,
      });
      fetchUsers();
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetSubmitting(false);
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
            Manajemen Pengguna Sistem
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Kelola akun staf, Admin HRD, dan Administrator. Undang user baru atau reset kata sandi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowMasterModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <IconBuilding className="w-4 h-4 text-zinc-600" />
            <span>Kelola Departemen &amp; Jabatan</span>
          </button>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <IconPlus className="w-4 h-4" />
            <span>Undang User Baru</span>
          </button>
        </div>
      </div>

      {/* Alert Sukses */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter & Daftar Pengguna */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, email, departemen, atau jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div className="w-full sm:w-56">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="">Semua Peran (Role)</option>
              <option value="HOST">Karyawan</option>
              <option value="ADMIN_HRD">Admin HRD</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>
        </div>

        <UsersList
          users={filteredUsers}
          loading={loading}
          copiedTokenId={copiedTokenId}
          onEdit={openEditUserModal}
          onResetPassword={openResetPasswordModal}
          onCopyInviteLink={handleCopyInviteLink}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteUser}
        />
      </div>

      {/* Modals */}
      <InviteUserModal
        isOpen={showInviteModal}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        formError={formError}
        showPassword={showUserPassword}
        setShowPassword={setShowUserPassword}
        onGeneratePassword={generateUserPassword}
        onSubmit={handleInviteUser}
        onClose={() => setShowInviteModal(false)}
      />

      <UserInviteSuccessModal
        data={inviteSuccessData}
        onClose={() => setInviteSuccessData(null)}
      />

      <ResetPasswordModal
        user={resetModalUser}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        submitting={resetSubmitting}
        error={resetError}
        successCreds={resetSuccessCreds}
        onGeneratePassword={generateRandomPassword}
        onSubmit={handleSavePassword}
        onClose={() => setResetModalUser(null)}
      />

      <EditUserModal
        user={editModalUser}
        formData={editFormData}
        setFormData={setEditFormData}
        submitting={editSubmitting}
        error={editError}
        onSubmit={handleSaveEditUser}
        onClose={() => setEditModalUser(null)}
      />

      <MasterDataModal
        isOpen={showMasterModal}
        onClose={() => setShowMasterModal(false)}
        onUpdated={fetchUsers}
      />
    </div>
  );
}
