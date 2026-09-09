"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSearch,
  IconPlus,
  IconSpinner,
  IconX,
  IconCheck,
  IconMail,
  IconKey,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconLock,
  IconBuilding,
  IconTrash,
} from "@/components/icons/guest-icons";
import { MasterSelect } from "@/components/dashboard/master-select";
import { MasterDataModal } from "@/components/dashboard/master-data-modal";

/**
 * Halaman Pengelolaan Pengguna Sistem (Administrator Only).
 * Mengizinkan pengundangan user baru, pengelolaan status akun, salin tautan aktivasi,
 * dan pengaturan/reset kata sandi langsung oleh Administrator.
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

  // State Modal Sukses Undangan Baru
  const [inviteSuccessData, setInviteSuccessData] = useState(null);

  // State Modal Reset Password
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccessCreds, setResetSuccessCreds] = useState(null);

  const [showUserPassword, setShowUserPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "HOST",
    department: "",
    position: "",
    password: "",
    isDepartmentHead: false,
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
        ...(formData.role === "HOST"
          ? {
              department: formData.department.trim(),
              position: formData.position.trim(),
              isDepartmentHead: formData.isDepartmentHead,
            }
          : {}),
      };

      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengundang user baru.");

      // Tutup form dan tampilkan modal kredensial
      setShowInviteModal(false);
      setInviteSuccessData({
        name: formData.name,
        email: formData.email,
        rawPassword: json.rawPassword,
        loginUrl: json.loginUrl || `${window.location.origin}/login`,
        inviteUrl: json.inviteUrl || `${window.location.origin}/invite/${json.inviteToken}`,
      });

      setFormData({
        name: "",
        email: "",
        role: "HOST",
        department: "",
        position: "",
        password: "",
        isDepartmentHead: false,
      });
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
        body: JSON.stringify({
          userId: targetUser.id,
          isActive: !targetUser.isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui status user.");

      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const confirmMsg = `Hapus permanen akun "${targetUser.name}" (${targetUser.email})?\n\nPerhatian: Tindakan ini tidak dapat dibatalkan. Jika pengguna sudah memiliki riwayat kunjungan tamu di masa lalu, sistem akan membatalkan penghapusan demi menjaga integritas arsip buku tamu.`;
    if (!window.confirm(confirmMsg)) return;

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

  // Salin Tautan Aktivasi untuk User yang Belum Aktivasi
  const handleCopyInviteLink = async (user) => {
    try {
      let inviteUrl = "";
      if (user.activeInviteToken) {
        inviteUrl = `${window.location.origin}/invite/${user.activeInviteToken}`;
      } else {
        // Jika token tidak ada / sudah kedaluwarsa, generate token baru
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

  // Buka Modal Reset Password
  const openResetPasswordModal = (user) => {
    setResetModalUser(user);
    setNewPassword("");
    setShowPassword(false);
    setResetError("");
    setResetSuccessCreds(null);
  };

  // Generate Kata Sandi Acak Otomatis
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let rand = "TRI-";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    rand += "!26";
    setNewPassword(rand);
  };

  // Submit Reset Password Manual
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
        body: JSON.stringify({
          userId: resetModalUser.id,
          newPassword,
        }),
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

  const roleLabelMap = {
    HOST: "Karyawan",
    ADMIN_HRD: "Admin HRD",
    ADMINISTRATOR: "Administrator",
  };

  const roleBadgeColor = {
    HOST: "bg-blue-50 text-blue-700 border-blue-200",
    ADMIN_HRD: "bg-purple-50 text-purple-700 border-purple-200",
    ADMINISTRATOR: "bg-zinc-900 text-white border-zinc-900",
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
          <h1
            className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Manajemen Pengguna Sistem
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Kelola akun staf, Admin HRD, dan Administrator. Anda dapat mengundang user baru, membagikan link aktivasi, atau mereset kata sandi secara manual.
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
              placeholder="Cari nama, email, departemen, atau jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>

          {/* Filter Role */}
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

        {/* ─── Tampilan Mobile (Daftar Kartu Tanpa Scroll Samping di HP) ─── */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="py-10 text-center text-zinc-400">
              <div className="flex items-center justify-center gap-2">
                <IconSpinner className="w-5 h-5 text-zinc-600" />
                <span>Memuat data pengguna...</span>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs">
              Tidak ada data pengguna yang sesuai.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-xs space-y-3"
              >
                {/* Header Kartu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 truncate">{u.name}</h4>
                      <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      roleBadgeColor[u.role] || "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {roleLabelMap[u.role] || u.role}
                  </span>
                </div>

                {/* Detail Baris */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">
                      Departemen
                    </span>
                    <span className="font-medium text-zinc-800">{u.department || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">
                      Posisi / Jabatan
                    </span>
                    <span className="font-medium text-zinc-800">{u.position || "—"}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      u.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                    }`}
                  >
                    {u.isActive ? "Akun Aktif" : "Nonaktif"}
                  </span>

                  {u.hasPassword ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Teraktivasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      ⏳ Belum Aktivasi
                    </span>
                  )}
                </div>

                {/* Tombol Aksi */}
                <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openResetPasswordModal(u)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <IconKey className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Atur Password</span>
                    </button>

                    {!u.hasPassword && (
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(u)}
                        className="py-1.5 px-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedTokenId === u.id ? (
                          <>
                            <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <IconCopy className="w-3.5 h-3.5" />
                            <span>Salin Link</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(u)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer text-center ${
                        u.isActive
                          ? "text-red-600 border-red-200 bg-red-50/40 hover:bg-red-50"
                          : "text-emerald-700 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50"
                      }`}
                    >
                      {u.isActive ? "Nonaktifkan Pengguna" : "Aktifkan Pengguna"}
                    </button>

                    {!u.isActive && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                        title="Hapus Permanen"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
                <th className="px-4 py-3.5">Nama Pengguna</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Peran</th>
                <th className="px-4 py-3.5">Departemen & Posisi</th>
                <th className="px-4 py-3.5 text-center">Status Sandi</th>
                <th className="px-4 py-3.5 text-center">Status Akun</th>
                <th className="px-4 py-3.5 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <IconSpinner className="w-5 h-5 text-zinc-600" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400">
                    Tidak ada pengguna yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {u.name}
                    </td>

                    <td className="px-4 py-3 text-zinc-600 font-mono text-[11px]">
                      {u.email}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          roleBadgeColor[u.role] || "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {roleLabelMap[u.role] || u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-zinc-700">
                      {u.department ? `${u.department} ${u.position ? `— ${u.position}` : ""}` : "—"}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {u.hasPassword ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Teraktivasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          ⏳ Belum Aktivasi
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openResetPasswordModal(u)}
                          title="Atur Kata Sandi Baru"
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition-colors cursor-pointer"
                        >
                          <IconKey className="w-3.5 h-3.5" />
                        </button>

                        {!u.hasPassword && (
                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(u)}
                            title="Salin Tautan Aktivasi"
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                          >
                            {copiedTokenId === u.id ? (
                              <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <IconCopy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                            u.isActive
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        {!u.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
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

      {/* ─── Modal Undang User Baru ─── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <IconMail className="w-5 h-5 text-zinc-700" />
                <h3
                  className="text-base font-bold text-zinc-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Undang Pengguna Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleInviteUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
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
                  placeholder="ahmad@tanimas.co.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
                  Peran Akun (Role) *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900"
                >
                  <option value="HOST">Karyawan (Penerima Kunjungan Tamu)</option>
                  <option value="ADMIN_HRD">Admin HRD (Pemantau seluruh buku tamu)</option>
                  <option value="ADMINISTRATOR">Administrator (Akses penuh kelola sistem)</option>
                </select>
              </div>

              {formData.role === "HOST" && (
                <>
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

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.isDepartmentHead}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isDepartmentHead: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                      />
                      <span className="text-xs text-zinc-700 font-medium">
                        Kepala Departemen (Department Head)
                      </span>
                    </label>
                  </div>
                </>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
                    Kata Sandi Akun (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={generateUserPassword}
                    className="text-[10px] font-semibold text-zinc-900 hover:underline cursor-pointer"
                  >
                    ⚡ Acak Sandi Otomatis
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showUserPassword ? "text" : "password"}
                    placeholder="Kosongkan untuk buat otomatis (contoh: Tanimas@8492)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 pr-10 text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showUserPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  *Email dan kata sandi ini akan otomatis dikirimkan ke email pengguna bersama link login.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Memproses..." : "Buat Akun & Kirim Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Sukses Undangan Baru (Kredensial Akun & Email Terkirim) ─── */}
      {inviteSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <IconCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Akun Pengguna Berhasil Dibuat!
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
                Detail akun dan link login telah dikirimkan ke <strong>{inviteSuccessData.email}</strong> via Zoho Mail.
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

      {/* ─── Modal Atur / Reset Password Manual ─── */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <IconLock className="w-5 h-5 text-zinc-700" />
                <h3 className="text-base font-bold text-zinc-900">
                  Atur Kata Sandi Pengguna
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {resetSuccessCreds ? (
              /* Tampilan Sukses Setelah Password Diubah */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <IconCheck className="w-4 h-4 text-emerald-600" />
                    <span>Kata sandi berhasil diperbarui!</span>
                  </div>
                  <div className="space-y-1 text-xs pt-1">
                    <p>
                      <strong>Email:</strong> {resetSuccessCreds.email}
                    </p>
                    <p>
                      <strong>Kata Sandi Baru:</strong>{" "}
                      <span className="font-mono font-bold">{resetSuccessCreds.password}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const text = `Halo ${resetSuccessCreds.name},\nBerikut adalah akun Anda untuk login ke Guest App:\nEmail: ${resetSuccessCreds.email}\nKata Sandi: ${resetSuccessCreds.password}\nLink Login: ${window.location.origin}/login`;
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
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 font-semibold text-xs hover:bg-zinc-50 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              /* Form Atur Kata Sandi */
              <form onSubmit={handleSavePassword} className="space-y-3.5 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                  <p className="text-[11px] text-zinc-400 font-medium">Pengguna:</p>
                  <p className="font-bold text-zinc-900">{resetModalUser.name}</p>
                  <p className="text-zinc-500 font-mono text-[11px]">{resetModalUser.email}</p>
                </div>

                {resetError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {resetError}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
                      Kata Sandi Baru *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] font-semibold text-zinc-900 hover:underline cursor-pointer"
                    >
                      Acak Sandi Otomatis
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimal 8 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 pr-10 text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Kata sandi akan otomatis di-enkripsi dengan aman (bcrypt) sebelum disimpan di sistem.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resetSubmitting ? "Menyimpan..." : "Simpan Kata Sandi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Kelola Master Data Departemen & Jabatan */}
      <MasterDataModal
        isOpen={showMasterModal}
        onClose={() => setShowMasterModal(false)}
        onUpdated={fetchUsers}
      />
    </div>
  );
}
