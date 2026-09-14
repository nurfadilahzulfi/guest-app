"use client";

import {
  IconEdit,
  IconTrash,
} from "@/components/icons/guest-icons";

/**
 * Satu baris representasi karyawan/host dalam daftar.
 * Layout sederhana dan responsif.
 * @param {Object} props
 * @param {Object} props.host - Objek host dari API
 * @param {function(Object): void} props.onEdit - Buka modal edit
 * @param {function(Object): void} props.onToggleActive - Toggle status aktif
 * @param {function(Object): void} props.onDelete - Hapus permanen host
 */
export function HostCard({ host, onEdit, onToggleActive, onDelete }) {
  const roleLabelMap = {
    HOST: null,
    ADMIN_HRD: "Admin HRD",
    ADMINISTRATOR: "Administrator",
  };

  const roleBadgeColor = {
    ADMIN_HRD: "bg-blue-50 text-blue-700 border-blue-200",
    ADMINISTRATOR: "bg-zinc-900 text-white border-zinc-900",
  };

  return (
    <div className="p-4 rounded-2xl border border-zinc-200 bg-white hover:shadow-sm transition-shadow">
      {/* Identitas */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {host.name?.[0]?.toUpperCase() ?? "K"}
        </div>

        {/* Nama + Badges + Email */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-zinc-900 truncate">{host.name}</span>
            {roleLabelMap[host.role] && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                  roleBadgeColor[host.role] || "bg-zinc-100 text-zinc-600 border-zinc-200"
                }`}
              >
                {roleLabelMap[host.role]}
              </span>
            )}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                host.isDepartmentHead
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-zinc-100 text-zinc-500 border-zinc-200"
              }`}
            >
              {host.isDepartmentHead ? "Kepala Dept" : "Staf"}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                host.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-100 text-zinc-400 border-zinc-200"
              }`}
            >
              {host.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{host.email}</p>
        </div>
      </div>

      {/* Dept & Jabatan */}
      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3 px-0.5">
        <span>
          <span className="text-zinc-400">Dept: </span>
          <span className="font-medium text-zinc-700">{host.department || "—"}</span>
        </span>
        <span className="text-zinc-200">|</span>
        <span>
          <span className="text-zinc-400">Jabatan: </span>
          <span className="font-medium text-zinc-700">{host.position || "—"}</span>
        </span>
      </div>

      {/* Tombol Aksi */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onEdit(host)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          <IconEdit className="w-3.5 h-3.5" />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onToggleActive(host)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            host.isActive
              ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
              : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
          }`}
        >
          {host.isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>

        {!host.isActive && (
          <button
            type="button"
            onClick={() => onDelete(host)}
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
