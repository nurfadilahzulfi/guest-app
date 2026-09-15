"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  IconEye,
  IconEyeOff,
  IconSpinner,
  IconLock,
  IconMail,
  IconCircleCheck,
  IconX,
} from "@/components/icons/guest-icons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);

  // State untuk modal Lupa Kata Sandi
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleOpenForgotModal = () => {
    setForgotEmail(email || "");
    setForgotSent(false);
    setForgotError("");
    setShowForgotModal(true);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setForgotError("Format alamat email tidak valid.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim tautan reset kata sandi.");
      }

      setForgotSent(true);
    } catch (err) {
      setForgotError(err.message || "Terjadi kesalahan saat memproses permintaan.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Email atau kata sandi salah, atau akun Anda belum aktif.");
        setLoading(false);
        return;
      }

      // Redirect ke dashboard tujuan atau URL callback
      window.location.href = callbackUrl;
    } catch (err) {
      setError("Terjadi kesalahan sistem saat mencoba masuk. Silahkan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/98 rounded-3xl shadow-2xl border border-zinc-200/90 p-6 sm:p-9 relative z-10 backdrop-blur-sm">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center p-2 mb-3.5 shadow-xs">
          <Image
            src="/assets/logos/tanimas-logo.png"
            alt="Logo PT Tanimas Resources Internasional"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        <h1
          className="text-2xl font-extrabold text-zinc-900 tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Masuk Akun Staf
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xs leading-relaxed">
          Silahkan masukkan email dan kata sandi Anda.
        </p>
      </div>

      {/* Alert Sukses Reset Password */}
      {resetSuccess && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
          <IconCircleCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-emerald-900">Kata Sandi Berhasil Diperbarui!</p>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Silakan masuk menggunakan kata sandi baru Anda.
            </p>
          </div>
        </div>
      )}

      {/* Alert Error */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/90 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
          <span className="font-semibold shrink-0">⚠️</span>
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Formulir */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@tanimas.co.id"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors duration-150"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors duration-150"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <IconEyeOff className="w-4 h-4" />
              ) : (
                <IconEye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Baris Opsi: Ingat Perangkat & Lupa Sandi */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900 cursor-pointer"
            />
            <span className="text-xs text-zinc-600 font-medium">
              Ingat perangkat ini
            </span>
          </label>

          <button
            type="button"
            onClick={handleOpenForgotModal}
            className="text-xs text-zinc-600 hover:text-zinc-900 hover:underline font-medium transition-colors cursor-pointer"
          >
            Lupa kata sandi?
          </button>
        </div>

        {/* Tombol Masuk */}
        <button
          type="submit"
          id="btn-login-submit"
          disabled={loading}
          className="w-full mt-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold py-3 text-sm shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <IconSpinner className="w-4 h-4" />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Masuk</span>
          )}
        </button>
      </form>

      {/* Navigasi Kembali ke Buku Tamu */}
      <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
        >
          <span>←</span>
          <span>Bukan staf? Kembali ke Buku Tamu</span>
        </Link>
      </div>

      {/* Modal Dialog Lupa Kata Sandi */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-sm w-full p-6 space-y-4">
            {forgotSent ? (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <IconCircleCheck className="w-6 h-6" />
                </div>
                <h3
                  className="text-base font-bold text-zinc-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Tautan Telah Dikirim
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Jika email <strong>{forgotEmail}</strong> terdaftar sebagai <strong>Administrator Sistem</strong>, tautan untuk mengatur ulang kata sandi telah dikirim. Silakan periksa <strong>Kotak Masuk (Inbox)</strong> atau folder <strong>Spam</strong> email Anda.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-left leading-relaxed">
                  ⏳ Tautan ini hanya berlaku selama <strong>1 jam</strong> dan hanya dapat digunakan 1 kali.
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-3 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                >
                  Kembali ke Login
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                      <IconLock className="w-4 h-4" />
                    </div>
                    <h3
                      className="text-sm font-bold text-zinc-900"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Reset Sandi Administrator
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-7 h-7 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3.5">
                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-600 leading-relaxed">
                    ℹ️ Layanan reset kata sandi via email ini <strong>khusus untuk Administrator Sistem</strong>. Untuk staf atau karyawan, pengaturan kata sandi dikelola secara terpusat oleh Administrator.
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Masukkan email Administrator Anda yang terdaftar pada Guest App:
                  </p>

                  {forgotError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 leading-relaxed">
                      {forgotError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        <IconMail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="contoh: admin@tanimas.co.id"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      disabled={forgotLoading}
                      className="w-1/3 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-2/3 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <IconSpinner className="w-3.5 h-3.5" />
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <span>Kirim Tautan Reset</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Halaman utama login internal (/login).
 * Menampilkan latar belakang company_profile.JPG dengan overlay gelap profesional.
 */
export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Image Perusahaan */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/company_profile.JPG"
          alt="Latar Belakang PT Tanimas Resources Internasional"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Overlay gelap agar kartu login di tengah sangat jelas dan kontras */}
        <div className="absolute inset-0 bg-zinc-950/65 backdrop-blur-[2px]" />
      </div>

      {/* Konten Kartu Login */}
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white/95 rounded-3xl p-8 text-center text-zinc-500 relative z-10 flex items-center justify-center gap-2">
            <IconSpinner className="w-5 h-5" />
            <span className="text-sm font-medium">Memuat halaman login...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
