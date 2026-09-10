"use client";

import {
  IconEdit,
  IconKey,
  IconCopy,
  IconCheck,
  IconTrash,
} from "@/components/icons/guest-icons";

/**
 * Satu card representasi pengguna sistem dalam daftar manajemen user.
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
    <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-xs transition-all space-y-3">
      {/* Baris 1: Avatar, Identitas, Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-zinc-900 truncate">{user.name}</h4>
              <span
                className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${
                  roleBadgeColor[user.role] || "bg-zinc-100 text-zinc-700"
                }`}
              >
                {roleLabelMap[user.role] || user.role}
              </span>
              {user.isDepartmentHead && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                  Kepala Dept
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-mono truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {user.hasPassword ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <IconCheck className="w-3.5 h-3.5" />
              <span>Teraktivasi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <span>⏳ Belum Aktivasi</span>
            </span>
          )}
          <span
            className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
              user.isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-zinc-100 text-zinc-500 border-zinc-200"
            }`}
          >
            {user.isActive ? "Akun Aktif" : "Nonaktif"}
          </span>
        </div>
      </div>

      {/* Baris 2: Info dan Tombol Aksi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Departemen</span>
            <span className="font-semibold text-zinc-800">{user.department || "—"}</span>
          </div>
          <div className="w-px h-6 bg-zinc-200" />
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Posisi / Jabatan</span>
            <span className="font-semibold text-zinc-800">{user.position || "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onEdit(user)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <IconEdit className="w-3.5 h-3.5 text-zinc-700" />
            <span>Edit Profil</span>
          </button>

          <button
            type="button"
            onClick={() => onResetPassword(user)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <IconKey className="w-3.5 h-3.5 text-zinc-600" />
            <span>Atur Password</span>
          </button>

          {!user.hasPassword && (
            <button
              type="button"
              onClick={() => onCopyInviteLink(user)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              {isCopied ? (
                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <IconCopy className="w-3.5 h-3.5" />
              )}
              <span>Salin Link</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleActive(user)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              user.isActive
                ? "text-red-600 border-red-200 bg-red-50/40 hover:bg-red-50 hover:border-red-300"
                : "text-emerald-700 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300"
            }`}
          >
            {user.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>

          {!user.isActive && (
            <button
              type="button"
              onClick={() => onDelete(user)}
              className="p-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
              title="Hapus Permanen"
            >
              <IconTrash className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
