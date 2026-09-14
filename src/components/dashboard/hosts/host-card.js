"use client";

import {
  IconEdit,
  IconTrash,
} from "@/components/icons/guest-icons";

/**
 * Satu card representasi karyawan/host dalam daftar.
 * Responsif di layar mobile dan desktop.
 * @param {Object} props
 * @param {Object} props.host - Objek host dari API
 * @param {function(Object): void} props.onEdit - Buka modal edit
 * @param {function(Object): void} props.onToggleActive - Toggle status aktif
 * @param {function(Object): void} props.onDelete - Hapus permanen host
 */
export function HostCard({ host, onEdit, onToggleActive, onDelete }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-xs transition-all space-y-3">
      {/* Baris 1: Avatar, Identitas, dan Status Aktif */}
      <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-zinc-100">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            {host.name?.[0]?.toUpperCase() ?? "K"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                {host.name}
              </h4>
              {host.role === "ADMINISTRATOR" && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-white shrink-0">
                  Administrator
                </span>
              )}
              {host.role === "ADMIN_HRD" && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  Admin HRD
                </span>
              )}
              {host.isDepartmentHead ? (
                <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                  Kepala Departemen
                </span>
              ) : (
                <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                  Staf
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-mono truncate mt-0.5">
              {host.email}
            </p>
          </div>
        </div>

        {/* Badge Status: Rapi di sudut kanan atas, tidak melebar */}
        <div className="shrink-0 self-start">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
              host.isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-zinc-100 text-zinc-500 border-zinc-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                host.isActive ? "bg-emerald-500" : "bg-zinc-400"
              }`}
            />
            <span>{host.isActive ? "Aktif" : "Nonaktif"}</span>
          </span>
        </div>
      </div>

      {/* Baris 2: Info Departemen/Jabatan dan Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
              Departemen
            </span>
            <span className="font-semibold text-zinc-800">{host.department || "—"}</span>
          </div>
          <div className="w-px h-6 bg-zinc-200" />
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
              Jabatan
            </span>
            <span className="font-semibold text-zinc-800">{host.position || "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1 sm:pt-0">
          <button
            type="button"
            onClick={() => onEdit(host)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <IconEdit className="w-3.5 h-3.5 text-zinc-700" />
            <span>Edit Data</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleActive(host)}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              host.isActive
                ? "border-red-200 text-red-600 bg-red-50/40 hover:bg-red-50 hover:border-red-300"
                : "border-emerald-200 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300"
            }`}
          >
            {host.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>

          {!host.isActive && (
            <button
              type="button"
              onClick={() => onDelete(host)}
              className="p-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer shrink-0"
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
