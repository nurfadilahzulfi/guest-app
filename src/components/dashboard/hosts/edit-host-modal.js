"use client";

import { useState } from "react";
import {
  IconEdit,
  IconX,
} from "@/components/icons/guest-icons";
import { MasterSelect } from "@/components/dashboard/master-select";

/**
 * Modal edit data karyawan.
 * Validasi inline — tidak menggunakan popup default browser.
 * @param {Object} props
 * @param {Object|null} props.host - Host yang sedang diedit
 * @param {Object} props.formData - State form edit
 * @param {function(Object): void} props.setFormData - Setter form edit
 * @param {boolean} props.submitting - Status loading submit
 * @param {string} props.error - Pesan error (dari server)
 * @param {function(Event): void} props.onSubmit - Handler submit form
 * @param {function(): void} props.onClose - Handler tutup modal
 */
export function EditHostModal({
  host,
  formData,
  setFormData,
  submitting,
  error,
  onSubmit,
  onClose,
}) {
  const [fieldErrors, setFieldErrors] = useState({});

  if (!host) return null;

  /**
   * Validasi form sebelum submit, tampilkan error inline jika ada field kosong.
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Nama lengkap wajib diisi.";
    if (!formData.email?.trim()) {
      errors.email = "Email perusahaan wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Format email tidak valid.";
    }
    if (!formData.department) errors.department = "Departemen wajib dipilih.";
    if (!formData.position) errors.position = "Jabatan wajib dipilih.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSubmit(e);
  };

  /** Menutup modal dan mereset field errors. */
  const handleClose = () => {
    setFieldErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden my-8 animate-scaleIn">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <IconX className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <IconEdit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3
              className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Edit Data Karyawan
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Perbarui profil, departemen, atau status karyawan.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nama */}
          <div>
            <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
              Nama Lengkap Karyawan *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={`w-full rounded-xl border px-3.5 py-2 text-zinc-900 focus:outline-none transition-colors ${
                fieldErrors.name
                  ? "border-red-400 bg-red-50 focus:border-red-500"
                  : "border-zinc-200 focus:border-zinc-900"
              }`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <span>⚠</span>
                <span>{fieldErrors.name}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
              Email Perusahaan *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={`w-full rounded-xl border px-3.5 py-2 text-zinc-900 focus:outline-none transition-colors ${
                fieldErrors.email
                  ? "border-red-400 bg-red-50 focus:border-red-500"
                  : "border-zinc-200 focus:border-zinc-900"
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <span>⚠</span>
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Departemen & Jabatan */}
          <div className="space-y-3">
            <div>
              <MasterSelect
                label="Departemen"
                required
                value={formData.department}
                onChange={(val) => {
                  setFormData({ ...formData, department: val });
                  if (fieldErrors.department) setFieldErrors((prev) => ({ ...prev, department: "" }));
                }}
                endpoint="/api/departments"
                placeholder="Pilih Departemen..."
                itemType="departemen"
                hasError={!!fieldErrors.department}
              />
              {fieldErrors.department && (
                <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{fieldErrors.department}</span>
                </p>
              )}
            </div>
            <div>
              <MasterSelect
                label="Jabatan / Posisi"
                required
                value={formData.position}
                onChange={(val) => {
                  setFormData({ ...formData, position: val });
                  if (fieldErrors.position) setFieldErrors((prev) => ({ ...prev, position: "" }));
                }}
                endpoint="/api/positions"
                placeholder="Pilih Jabatan..."
                itemType="jabatan"
                hasError={!!fieldErrors.position}
              />
              {fieldErrors.position && (
                <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{fieldErrors.position}</span>
                </p>
              )}
            </div>
          </div>

          {/* Kepala Departemen */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDepartmentHead}
                onChange={(e) => {
                  const isHead = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    isDepartmentHead: isHead,
                    position: isHead ? "Head" : (prev.position === "Head" ? "" : prev.position),
                  }));
                }}
                className="w-4 h-4 rounded border-zinc-300 accent-zinc-900"
              />
              <span className="text-xs text-zinc-700 font-medium">
                Kepala Departemen (Department Head)
              </span>
            </label>
          </div>

          {/* Status Akun */}
          <div>
            <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
              Status Akun
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: true })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  formData.isActive
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: false })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  !formData.isActive
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                Nonaktif
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
