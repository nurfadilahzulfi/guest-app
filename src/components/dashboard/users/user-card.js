"use client";

import {
  IconEdit,
  IconKey,
  IconCopy,
  IconCheck,
  IconTrash,
} from "@/components/icons/guest-icons";

/**
 * Satu baris representasi pengguna sistem dalam daftar manajemen user.
 * Layout sederhana: identitas di atas, info & aksi di bawah.
 * @param {Object} props
 * @param {Object} props.user - Objek user dari API
 * @param {boolean} props.isCopied - Apakah link aktivasi sedang disalin
 * @param {function(Object): void} props.onEdit - Buka modal edit profil
 * @param {function(Object): void} props.onResetPassword - Buka modal reset password
 * @param {function(Object): void} props.onCopyInviteLink - Salin link aktivasi
 * @param {function(Object): void} props.onToggleActive - Toggle status aktif
 * @param {function(Object): void} props.onDelete - Hapus permanen user
 */
export function UserCard({
  user,
  isCopied,
  onEdit,
  onResetPassword,
  onCopyInviteLink,
  onToggleActive,
  onDelete,
}) {
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

  return (
    <div className="p-4 rounded-2xl border border-zinc-200 bg-white hover:shadow-sm transition-shadow">
      {/* Identitas */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </div>

        {/* Nama + Badges + Email */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-zinc-900 truncate">{user.name}</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                roleBadgeColor[user.role] || "bg-zinc-100 text-zinc-600 border-zinc-200"
              }`}
            >
              {roleLabelMap[user.role] || user.role}
            </span>
            {user.isDepartmentHead && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                Kepala Dept
              </span>
            )}
            {/* Status aktif */}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                user.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-100 text-zinc-400 border-zinc-200"
              }`}
            >
              {user.isActive ? "Aktif" : "Nonaktif"}
            </span>
            {/* Status aktivasi */}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                user.hasPassword
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {user.hasPassword ? "Teraktivasi" : "Belum Aktivasi"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Dept & Jabatan */}
      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3 px-0.5">
        <span>
          <span className="text-zinc-400">Dept: </span>
          <span className="font-medium text-zinc-700">{user.department || "—"}</span>
        </span>
        <span className="text-zinc-200">|</span>
        <span>
          <span className="text-zinc-400">Jabatan: </span>
          <span className="font-medium text-zinc-700">{user.position || "—"}</span>
        </span>
      </div>

      {/* Tombol Aksi */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          <IconEdit className="w-3.5 h-3.5" />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onResetPassword(user)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          <IconKey className="w-3.5 h-3.5" />
          Password
        </button>

        {!user.hasPassword && (
          <button
            type="button"
            onClick={() => onCopyInviteLink(user)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            {isCopied ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
            Salin Link
          </button>
        )}

        <button
          type="button"
          onClick={() => onToggleActive(user)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            user.isActive
              ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
              : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
          }`}
        >
          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>

        {!user.isActive && (
          <button
            type="button"
            onClick={() => onDelete(user)}
            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
            title="Hapus Permanen"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
