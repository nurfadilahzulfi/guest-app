"use client";

import { IconSpinner } from "@/components/icons/guest-icons";
import { HostCard } from "./host-card";

/**
 * Daftar kartu karyawan dengan state loading dan empty state.
 * @param {Object} props
 * @param {Array} props.hosts - Daftar host yang sudah difilter
 * @param {boolean} props.loading - Status loading data
 * @param {function(Object): void} props.onEdit - Buka modal edit
 * @param {function(Object): void} props.onToggleActive - Toggle status aktif
 * @param {function(Object): void} props.onDelete - Hapus permanen host
 */
export function HostsList({ hosts, loading, onEdit, onToggleActive, onDelete }) {
  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400">
        <div className="flex items-center justify-center gap-2">
          <IconSpinner className="w-5 h-5 text-zinc-600 animate-spin" />
          <span className="text-xs sm:text-sm">Memuat data karyawan...</span>
        </div>
      </div>
    );
  }

  if (hosts.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-400 text-xs sm:text-sm bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
        Tidak ada data karyawan yang sesuai dengan kriteria pencarian.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {hosts.map((host) => (
        <HostCard
          key={host.id}
          host={host}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
