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
} from "@/components/icons/guest-icons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);

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

      {/* Alert Error */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/90 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
          <span className="font-semibold shrink-0"></span>
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
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-3.5 pr-11 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors duration-150"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors p-1"
              title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
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
            onClick={() => setShowForgotModal(true)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 max-w-sm w-full p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-700">
              <IconLock className="w-5 h-5" />
            </div>
            <h3
              className="text-base font-bold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Bantuan Reset Kata Sandi
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Demi keamanan sistem perusahaan, pembuatan akun dan reset kata sandi dikelola secara terpusat. Silahkan hubungi <strong>Administrator Sistem</strong> untuk mengatur ulang kata sandi Anda.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-2 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
            >
              Mengerti
            </button>
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
