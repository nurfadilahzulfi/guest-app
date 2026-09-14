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
      {/* Baris 1: Avatar + Identitas */}
      <div className="flex items-start gap-3 pb-3 border-b border-zinc-100">
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-bold text-zinc-900 truncate">{user.name}</h4>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
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
          {/* Status badges di bawah nama — selalu muat di mobile */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            {user.hasPassword ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <IconCheck className="w-3 h-3 text-emerald-600" />
                <span>Teraktivasi</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <span>⏳ Belum Aktivasi</span>
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                user.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-100 text-zinc-500 border-zinc-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
              <span>{user.isActive ? "Akun Aktif" : "Nonaktif"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Baris 2: Info Departemen / Jabatan */}
      <div className="flex items-center gap-4 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Departemen</span>
          <span className="font-semibold text-zinc-800">{user.department || "—"}</span>
        </div>
        <div className="w-px h-6 bg-zinc-200 shrink-0" />
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Posisi / Jabatan</span>
          <span className="font-semibold text-zinc-800">{user.position || "—"}</span>
        </div>
      </div>

      {/* Baris 3: Tombol Aksi */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-zinc-100">
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
  );
}
