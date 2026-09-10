"use client";

import { IconMail, IconX, IconEye, IconEyeOff } from "@/components/icons/guest-icons";
import { MasterSelect } from "@/components/dashboard/master-select";

/**
 * Modal form undang pengguna baru.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.formData
 * @param {function(Object): void} props.setFormData
 * @param {boolean} props.submitting
 * @param {string} props.formError
 * @param {boolean} props.showPassword
 * @param {function(boolean): void} props.setShowPassword
 * @param {function(): void} props.onGeneratePassword
 * @param {function(Event): void} props.onSubmit
 * @param {function(): void} props.onClose
 */
export function InviteUserModal({
  isOpen,
  formData,
  setFormData,
  submitting,
  formError,
  showPassword,
  setShowPassword,
  onGeneratePassword,
  onSubmit,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
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
            onClick={onClose}
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

        <form onSubmit={onSubmit} className="mt-4 space-y-3.5 text-xs">
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
                Kata Sandi Akun (Opsional)
              </label>
              <button
                type="button"
                onClick={onGeneratePassword}
                className="text-[10px] font-semibold text-zinc-900 hover:underline cursor-pointer"
              >
                ⚡ Acak Sandi Otomatis
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Kosongkan untuk buat otomatis"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 pr-10 text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono text-xs"
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
              * Email dan kata sandi dikirimkan otomatis ke pengguna.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
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
  );
}
