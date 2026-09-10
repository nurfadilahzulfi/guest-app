"use client";

import { IconSpinner } from "@/components/icons/guest-icons";
import { UserCard } from "./user-card";

/**
 * Daftar kartu pengguna sistem dengan loading state dan empty state.
 * @param {Object} props
 * @param {Array} props.users - Daftar user yang sudah difilter
 * @param {boolean} props.loading - Status loading data
 * @param {string|null} props.copiedTokenId - ID user yang linknya sedang disalin
 * @param {function(Object): void} props.onEdit
 * @param {function(Object): void} props.onResetPassword
 * @param {function(Object): void} props.onCopyInviteLink
 * @param {function(Object): void} props.onToggleActive
 * @param {function(Object): void} props.onDelete
 */
export function UsersList({
  users,
  loading,
  copiedTokenId,
  onEdit,
  onResetPassword,
  onCopyInviteLink,
  onToggleActive,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400">
        <div className="flex items-center justify-center gap-2">
          <IconSpinner className="w-5 h-5 text-zinc-600 animate-spin" />
          <span className="text-xs sm:text-sm">Memuat data pengguna...</span>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-400 text-xs sm:text-sm bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
        Tidak ada data pengguna yang sesuai dengan kriteria pencarian.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {users.map((u) => (
        <UserCard
          key={u.id}
          user={u}
          isCopied={copiedTokenId === u.id}
          onEdit={onEdit}
          onResetPassword={onResetPassword}
          onCopyInviteLink={onCopyInviteLink}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
