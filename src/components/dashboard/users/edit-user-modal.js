"use client";

import { IconEdit, IconX, IconSpinner } from "@/components/icons/guest-icons";
import { MasterSelect } from "@/components/dashboard/master-select";

/**
 * Modal edit data profil pengguna sistem (tema hitam/monochrome).
 * @param {Object} props
 * @param {Object|null} props.user - User yang sedang diedit
 * @param {Object} props.formData
 * @param {function(Object): void} props.setFormData
 * @param {boolean} props.submitting
 * @param {string} props.error
 * @param {function(Event): void} props.onSubmit
 * @param {function(): void} props.onClose
 */
export function EditUserModal({
  user,
  formData,
  setFormData,
  submitting,
  error,
  onSubmit,
  onClose,
}) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden my-8 animate-scaleIn">
        <button
          type="button"
          onClick={onClose}
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
              Edit Data Pengguna
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Perbarui profil, peran, atau penempatan departemen pengguna.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-zinc-900 text-white text-xs font-medium flex items-center gap-2">
              <span className="text-zinc-400 font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900 font-medium transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
              Alamat Email (Login &amp; Notifikasi) *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900 font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
              Peran / Hak Akses *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "HOST", label: "Karyawan (Host)" },
                { val: "ADMIN_HRD", label: "Admin HRD" },
                { val: "ADMINISTRATOR", label: "Administrator" },
              ].map((r) => {
                const isSelected = formData.role === r.val;
                return (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r.val })}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {formData.role === "HOST" && (
            <>
              <div className="space-y-3 pt-1">
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
                      setFormData({ ...formData, isDepartmentHead: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-zinc-300 accent-zinc-900"
                  />
                  <span className="text-xs text-zinc-700 font-medium">
                    Kepala Departemen (Department Head)
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              {submitting ? (
                <>
                  <IconSpinner className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
