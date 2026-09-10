"use client";

import {
  IconLock, IconX, IconCheck, IconCopy, IconEye, IconEyeOff, IconSpinner,
} from "@/components/icons/guest-icons";

/**
 * Modal reset/atur password pengguna sistem.
 * @param {Object} props
 * @param {Object|null} props.user - User target reset password
 * @param {string} props.newPassword - Nilai kata sandi baru
 * @param {function(string): void} props.setNewPassword
 * @param {boolean} props.showPassword - Toggle visibilitas
 * @param {function(boolean): void} props.setShowPassword
 * @param {boolean} props.submitting
 * @param {string} props.error
 * @param {Object|null} props.successCreds - Data kredensial setelah berhasil
 * @param {function(): void} props.onGeneratePassword
 * @param {function(Event): void} props.onSubmit
 * @param {function(): void} props.onClose
 */
export function ResetPasswordModal({
  user,
  newPassword,
  setNewPassword,
  showPassword,
  setShowPassword,
  submitting,
  error,
  successCreds,
  onGeneratePassword,
  onSubmit,
  onClose,
}) {
  if (!user) return null;

  const handleCopy = async () => {
    const text = `Halo ${successCreds.name},\nBerikut adalah akun Anda untuk login ke Guest App:\nEmail: ${successCreds.email}\nKata Sandi: ${successCreds.password}\nLink Login: ${window.location.origin}/login`;
    await navigator.clipboard.writeText(text);
    alert("Kredensial login berhasil disalin ke clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4 animate-scaleIn">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <IconLock className="w-5 h-5 text-zinc-700" />
            <h3 className="text-base font-bold text-zinc-900">Atur Kata Sandi Pengguna</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {successCreds ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <IconCheck className="w-4 h-4 text-emerald-600" />
                <span>Kata sandi berhasil diperbarui!</span>
              </div>
              <div className="space-y-1 text-xs pt-1">
                <p><strong>Email:</strong> {successCreds.email}</p>
                <p>
                  <strong>Kata Sandi Baru:</strong>{" "}
                  <span className="font-mono font-bold">{successCreds.password}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <IconCopy className="w-4 h-4" />
                <span>Salin Kredensial Login</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 font-semibold text-xs hover:bg-zinc-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <p className="text-[11px] text-zinc-400 font-medium">Pengguna:</p>
              <p className="font-bold text-zinc-900">{user.name}</p>
              <p className="text-zinc-500 font-mono text-[11px]">{user.email}</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
                  Kata Sandi Baru *
                </label>
                <button
                  type="button"
                  onClick={onGeneratePassword}
                  className="text-[10px] font-semibold text-zinc-900 hover:underline cursor-pointer"
                >
                  Acak Sandi Otomatis
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 pr-10 text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
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
                Kata sandi akan otomatis di-enkripsi (bcrypt) sebelum disimpan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
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
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <IconSpinner className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  "Simpan Kata Sandi"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
