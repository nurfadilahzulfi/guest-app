"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconLock,
  IconEye,
  IconEyeOff,
  IconSpinner,
  IconCircleCheck,
  IconUser,
  IconShieldCheck,
} from "@/components/icons/guest-icons";

export default function ResetPasswordPage({ params }) {
  const resolvedParams = use(params);
  const token = resolvedParams?.token;
  const router = useRouter();

  const [loadingInfo, setLoadingInfo] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [fetchError, setFetchError] = useState("");

  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const checkToken = async () => {
      setLoadingInfo(true);
      setFetchError("");
      try {
        const res = await fetch(`/api/auth/reset-password/${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error || "Tautan reset kata sandi tidak valid atau sudah kedaluwarsa."
          );
        }
        setUserInfo(data.user);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoadingInfo(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!newPassword || newPassword.length < 8) {
      setSubmitError("Kata sandi minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError("Konfirmasi kata sandi tidak cocok. Pastikan kedua kolom sama.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengatur ulang kata sandi.");
      }

      setResetSuccess(true);
      // Otomatis redirect ke login setelah 2.5 detik
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2500);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const roleLabelMap = {
    HOST: "Karyawan",
    ADMIN_HRD: "Admin HRD",
    ADMINISTRATOR: "Administrator",
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Image Perusahaan dengan overlay gelap */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/company_profile.JPG"
          alt="Latar Belakang PT Tanimas Resources Internasional"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px]" />
      </div>

      {/* Kartu Reset Password */}
      <div className="w-full max-w-md bg-white/98 rounded-3xl shadow-2xl border border-zinc-200/90 p-6 sm:p-9 relative z-10 backdrop-blur-sm animate-fadeIn">
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
            className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Reset Sandi Administrator
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xs leading-relaxed">
            PT Tanimas Resources Internasional
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-100 text-purple-800 border border-purple-200">
            Khusus Akun Administrator
          </span>

        </div>

        {/* ─── State 1: Sedang Memvalidasi Tautan ─── */}
        {loadingInfo && (
          <div className="py-10 text-center space-y-3">
            <IconSpinner className="w-8 h-8 text-zinc-800 mx-auto" />
            <p className="text-xs font-medium text-zinc-600">
              Memvalidasi tautan reset kata sandi...
            </p>
          </div>
        )}

        {/* ─── State 2: Tautan Tidak Valid atau Kedaluwarsa ─── */}
        {!loadingInfo && fetchError && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-900">
                Tautan Tidak Dapat Digunakan
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
                {fetchError}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-left text-[11px] text-zinc-600 space-y-1">
              <p className="font-semibold text-zinc-800">Kemungkinan penyebab:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Tautan sudah pernah digunakan sebelumnya.</li>
                <li>Masa berlaku tautan (1 jam) telah berakhir.</li>
                <li>Tautan salah atau tidak lengkap saat disalin.</li>
              </ul>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors items-center justify-center cursor-pointer shadow-sm"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        )}

        {/* ─── State 3: Berhasil Reset Kata Sandi ─── */}
        {!loadingInfo && !fetchError && resetSuccess && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <IconCircleCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3
                className="text-base font-bold text-zinc-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Kata Sandi Berhasil Diperbarui!
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
                Kata sandi baru Anda telah aktif. Anda sekarang dapat masuk kembali ke sistem.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2">
              <IconSpinner className="w-3.5 h-3.5 shrink-0" />
              <span>Mengalihkan ke halaman login...</span>
            </div>
            <Link
              href="/login?reset=success"
              className="inline-flex w-full py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors items-center justify-center cursor-pointer"
            >
              Masuk Sekarang
            </Link>
          </div>
        )}

        {/* ─── State 4: Form Input Kata Sandi Baru ─── */}
        {!loadingInfo && !fetchError && !resetSuccess && userInfo && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kartu Profil Pengguna */}
            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
                <IconUser className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {userInfo.name}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  {userInfo.email}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-zinc-200 text-zinc-800">
                    {roleLabelMap[userInfo.role] || userInfo.role}
                  </span>
                  {userInfo.department && (
                    <span className="text-[10px] text-zinc-500 truncate">
                      • {userInfo.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Alert Pesan Error Submit */}
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                ⚠️ {submitError}
              </div>
            )}

            {/* Input Kata Sandi Baru */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
              >
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
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

            {/* Input Konfirmasi Kata Sandi */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
              >
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <IconEyeOff className="w-4 h-4" />
                  ) : (
                    <IconEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Syarat Keamanan */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-500 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-700 font-medium">
                <IconShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ketentuan kata sandi:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-zinc-600">
                <li className={newPassword.length >= 8 ? "text-emerald-700 font-medium" : ""}>
                  Panjang minimal 8 karakter
                </li>
                <li className={newPassword && newPassword === confirmPassword ? "text-emerald-700 font-medium" : ""}>
                  Konfirmasi kata sandi harus cocok
                </li>
              </ul>
            </div>

            {/* Tombol Simpan */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold py-3 text-sm shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <IconSpinner className="w-4 h-4" />
                  <span>Menyimpan kata sandi...</span>
                </>
              ) : (
                <span>Simpan Kata Sandi Baru</span>
              )}
            </button>

            {/* Navigasi Batal / Kembali */}
            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
              >
                Batal dan kembali ke Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
