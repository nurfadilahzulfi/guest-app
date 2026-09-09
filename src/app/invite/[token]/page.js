"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconLock,
  IconEye,
  IconEyeOff,
  IconSpinner,
  IconCheck,
  IconCopy,
  IconUser,
  IconBuilding,
} from "@/components/icons/guest-icons";

export default function InviteActivationPage({ params }) {
  const resolvedParams = use(params);
  const token = resolvedParams?.token;

  const [loadingInfo, setLoadingInfo] = useState(true);
  const [inviteUser, setInviteUser] = useState(null);
  const [fetchError, setFetchError] = useState("");

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Success state showing credentials
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [showSavedPassword, setShowSavedPassword] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInfo = async () => {
      setLoadingInfo(true);
      setFetchError("");
      try {
        const res = await fetch(`/api/invite/${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Token undangan tidak valid atau sudah kedaluwarsa.");
        }
        setInviteUser(data.user || data);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchInfo();
  }, [token]);

  const handleActivate = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!password || password.length < 8) {
      setSubmitError("Kata sandi minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Konfirmasi kata sandi tidak cocok. Pastikan kedua kata sandi sama.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengaktifkan akun. Silahkan coba lagi.");
      }

      setActivationSuccess(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    const credText = `Kredensial Akun Guest App:\nEmail: ${inviteUser?.email}\nKata Sandi: ${password}\nURL Login: ${window.location.origin}/login`;
    await navigator.clipboard.writeText(credText);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  const roleLabelMap = {
    HOST: "Karyawan (Host)",
    ADMIN_HRD: "Admin HRD",
    ADMINISTRATOR: "Administrator",
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 sm:p-8 relative z-10">
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
            className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Aktivasi Akun Pengguna
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            PT. Tanimas Resources Internasional
          </p>
        </div>

        {/* ─── State 1: Sedang Memeriksa Token ─── */}
        {loadingInfo && (
          <div className="py-12 text-center text-zinc-500 space-y-3">
            <IconSpinner className="w-6 h-6 text-zinc-800 animate-spin mx-auto" />
            <p className="text-xs font-medium">Memvalidasi tautan aktivasi akun...</p>
          </div>
        )}

        {/* ─── State 2: Token Tidak Valid / Kedaluwarsa ─── */}
        {!loadingInfo && fetchError && (
          <div className="space-y-5 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-zinc-900">
                Tautan Aktivasi Tidak Valid
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
                {fetchError}
              </p>
            </div>
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-[11px] text-zinc-500 text-left">
              Tautan aktivasi hanya berlaku satu kali atau telah melewati batas 72 jam. Silahkan hubungi Administrator kantor untuk meminta tautan baru.
            </div>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors text-center"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        )}

        {/* ─── State 3: Layar Sukses Aktivasi & Konfirmasi Kredensial ─── */}
        {!loadingInfo && !fetchError && activationSuccess && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
                <IconCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-zinc-900">
                Akun Berhasil Diaktifkan!
              </h2>
              <p className="text-xs text-zinc-500 max-w-xs">
                Kata sandi baru Anda telah tersimpan dengan aman. Simpan atau catat kredensial ini sebelum masuk:
              </p>
            </div>

            {/* Kartu Ringkasan Kredensial */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Email Akun
                </span>
                <p className="font-semibold text-zinc-900 font-mono mt-0.5 select-all">
                  {inviteUser?.email}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Kata Sandi Anda
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSavedPassword(!showSavedPassword)}
                    className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                  >
                    {showSavedPassword ? (
                      <>
                        <IconEyeOff className="w-3.5 h-3.5" />
                        <span>Sembunyikan</span>
                      </>
                    ) : (
                      <>
                        <IconEye className="w-3.5 h-3.5" />
                        <span>Lihat Sandi</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-1 p-2.5 rounded-xl bg-white border border-zinc-200 font-mono text-sm font-bold text-zinc-900 select-all break-all">
                  {showSavedPassword ? password : "•".repeat(password.length)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCreds ? (
                  <>
                    <IconCheck className="w-4 h-4 text-emerald-600" />
                    <span>Kredensial Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <IconCopy className="w-4 h-4 text-zinc-600" />
                    <span>Salin Email & Kata Sandi</span>
                  </>
                )}
              </button>
            </div>

            <Link
              href={`/login?email=${encodeURIComponent(inviteUser?.email || "")}`}
              className="block w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors text-center cursor-pointer shadow-xs"
            >
              Lanjut Masuk ke Akun Anda →
            </Link>
          </div>
        )}

        {/* ─── State 4: Form Pembuatan Kata Sandi Baru ─── */}
        {!loadingInfo && !fetchError && !activationSuccess && inviteUser && (
          <div className="space-y-5">
            {/* Info Pengguna yang Diundang */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {inviteUser.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-900 truncate">
                    {inviteUser.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono truncate">
                    {inviteUser.email}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/70 text-zinc-800 border border-zinc-300 shrink-0">
                  {roleLabelMap[inviteUser.role] || inviteUser.role}
                </span>
              </div>

              {(inviteUser.department || inviteUser.position) && (
                <div className="text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-200/60 flex items-center gap-1.5">
                  <IconBuilding className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">
                    {inviteUser.department} {inviteUser.position ? `— ${inviteUser.position}` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Error Alert */}
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 animate-fadeIn">
                {submitError}
              </div>
            )}

            {/* Form Input Password */}
            <form onSubmit={handleActivate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
                  Buat Kata Sandi Baru *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter..."
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 pr-10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <IconEyeOff className="w-4 h-4" />
                    ) : (
                      <IconEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Gunakan kombinasi huruf besar, huruf kecil, dan angka agar lebih kuat.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">
                  Ulangi Kata Sandi *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi..."
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 pr-10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <IconEyeOff className="w-4 h-4" />
                    ) : (
                      <IconEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {submitting ? (
                  <>
                    <IconSpinner className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan Kata Sandi...</span>
                  </>
                ) : (
                  <>
                    <IconLock className="w-4 h-4" />
                    <span>Aktifkan Akun & Simpan Sandi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="text-zinc-400 text-[11px] mt-6 relative z-10">
        Guest Management System · PT. Tanimas Resources Internasional
      </p>
    </div>
  );
}
