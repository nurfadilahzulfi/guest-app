"use client";

import {
  IconCheck,
  IconMail,
  IconCopy,
} from "@/components/icons/guest-icons";

/**
 * Modal yang muncul setelah karyawan baru berhasil dibuat,
 * menampilkan kredensial dan opsi salin.
 * @param {Object} props
 * @param {Object|null} props.data - Data invite sukses {name, email, rawPassword, loginUrl}
 * @param {function(): void} props.onClose - Handler tutup modal
 */
export function HostInviteSuccessModal({ data, onClose }) {
  if (!data) return null;

  const handleCopy = async () => {
    const loginUrl = data.loginUrl || `${window.location.origin}/login`;
    const text = `Halo ${data.name},\nBerikut adalah akun Anda untuk login ke Guest App PT Tanimas Resources Internasional:\nEmail: ${data.email}\nKata Sandi: ${data.rawPassword || "(Sesuai yang diatur)"}\nLink Login: ${loginUrl}`;
    await navigator.clipboard.writeText(text);
    alert("Kredensial login berhasil disalin ke clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4 animate-scaleIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <IconCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Akun Karyawan Berhasil Dibuat!
            </h3>
            <p className="text-xs text-zinc-500">Untuk {data.name}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
          <div className="flex items-center gap-2">
            <IconMail className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Email Kredensial Telah Terkirim
            </span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Detail akun dan link masuk telah dikirimkan ke <strong>{data.email}</strong>.
          </p>

          <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-zinc-100">
              <span className="text-zinc-500">Email:</span>
              <span className="font-mono font-bold text-zinc-900">{data.email}</span>
            </div>
            {data.rawPassword && (
              <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Kata Sandi:</span>
                <span className="font-mono font-bold text-zinc-900 bg-amber-100 px-2 py-0.5 rounded">
                  {data.rawPassword}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-500">Link Login:</span>
              <span className="font-mono text-[11px] text-blue-600 truncate max-w-[200px]">
                {data.loginUrl || `${window.location.origin}/login`}
              </span>
            </div>
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
            className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
