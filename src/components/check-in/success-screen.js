import { IconCircleCheck } from "@/components/icons/guest-icons";

/**
 * Tampilan layar sukses setelah formulir check-in berhasil dikirim ke server.
 * Menampilkan token kunjungan dan aksi untuk mendaftarkan tamu berikutnya.
 * @param {Object} props
 * @param {string} props.visitToken - Token unik kunjungan yang dihasilkan server
 * @param {function(): void} props.onReset - Handler untuk mereset form dan kembali ke awal
 */
export function SuccessScreen({ visitToken, onReset }) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-6 space-y-5">
      <div
        className="flex items-center justify-center w-20 h-20 rounded-full"
        style={{ background: "var(--tm-emerald-10)" }}
      >
        <IconCircleCheck className="w-10 h-10 text-[var(--tm-emerald-deep)] animate-checkPop" />
      </div>

      <div>
        <h2 className="text-xl font-extrabold text-[var(--tm-forest)]" style={{ fontFamily: "var(--font-display)" }}>
          Check-in Berhasil!
        </h2>
        <p className="text-sm text-[var(--tm-muted)] mt-1 max-w-xs mx-auto">
          Formulir Anda telah dikirim. Host akan segera menerima notifikasi.
        </p>
      </div>

      <div className="w-full max-w-xs rounded-xl border border-[var(--tm-line)] bg-[var(--tm-cream)] px-4 py-3">
        <p className="text-xs font-semibold text-[var(--tm-emerald-deep)]">Token Kunjungan</p>
        <p className="mt-1 font-mono text-xs text-[var(--tm-forest)] break-all select-all">{visitToken}</p>
      </div>

      <button
        type="button"
        id="btn-checkin-again"
        onClick={onReset}
        className="mt-1 text-sm text-[var(--tm-emerald-deep)] hover:text-[var(--tm-forest)] font-medium underline underline-offset-2 transition-colors cursor-pointer"
      >
        Daftarkan tamu lain
      </button>
    </div>
  );
}
