"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconChevronRight,
  IconChevronLeft,
  IconSpinner,
  IconSend,
  IconSearch,
} from "@/components/icons/guest-icons";
import { TOKENS, STEPS } from "@/components/check-in/constants";
import { validateStep } from "@/components/check-in/validation";
import { CheckInHeader } from "@/components/check-in/check-in-header";
import { Stepper } from "@/components/check-in/stepper";
import { StepIdentity } from "@/components/check-in/step-identity";
import { StepHost } from "@/components/check-in/step-host";
import { StepPurpose } from "@/components/check-in/step-purpose";
import { StepConfirm } from "@/components/check-in/step-confirm";
import { SuccessScreen } from "@/components/check-in/success-screen";

/**
 * Halaman utama pendaftaran / check-in mandiri tamu PT Tanimas Resources Internasional.
 * Mengorkestrasi alur 4 tahap, validasi per langkah, dan pengiriman data ke server.
 */
export default function CheckInPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedUpTo, setCompletedUpTo] = useState(1);
  const [direction, setDirection] = useState("forward");
  const [hosts, setHosts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [visitToken, setVisitToken] = useState(null);
  const [errors, setErrors] = useState({});

  // State untuk deteksi kunjungan aktif & check-out
  const [activeToken, setActiveToken] = useState(null);
  const [activeGuestName, setActiveGuestName] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [formData, setFormData] = useState({
    guestPhoto: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    gender: "",
    organization: "",
    duration: "",
    vehicleType: "",
    licensePlate: "",
    hostId: "",
    purpose: "",
    purposeNote: "",
  });

  useEffect(() => {
    fetch("/api/hosts")
      .then((r) => r.json())
      .then((list) => setHosts(Array.isArray(list) ? list : []))
      .catch(() => { });

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tm_active_visit_token");
      const name = localStorage.getItem("tm_active_guest_name");
      if (stored) {
        setActiveToken(stored);
        if (name) setActiveGuestName(name);
      }
    }
  }, []);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleNext = () => {
    const errs = validateStep(currentStep, formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setDirection("forward");
    const next = currentStep + 1;
    setCurrentStep(next);
    setCompletedUpTo((prev) => Math.max(prev, next));
  };

  const handleBack = () => {
    setErrors({});
    setDirection("backward");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleJumpToStep = (target) => {
    setErrors({});
    setDirection(target > currentStep ? "forward" : "backward");
    setCurrentStep(target);
  };

  const handleSubmit = async () => {
    const errs = validateStep(4, formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Terjadi kesalahan, coba lagi.");
      setVisitToken(json.visitToken);

      // Simpan token di localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("tm_active_visit_token", json.visitToken);
        localStorage.setItem("tm_active_guest_name", formData.guestName);
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      guestPhoto: "",
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      gender: "",
      organization: "",
      duration: "",
      hostId: "",
      purpose: "",
      purposeNote: "",
    });
    setCurrentStep(1);
    setCompletedUpTo(1);
    setDirection("forward");
    setVisitToken(null);
    setErrors({});
    setSubmitError("");
  };

  const handleSearchActiveVisit = async (e) => {
    e?.preventDefault();
    if (!searchPhone.trim()) {
      setSearchError("Masukkan nomor HP yang Anda gunakan saat check-in.");
      return;
    }

    setSearchingPhone(true);
    setSearchError("");

    try {
      const res = await fetch("/api/visits/active-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: searchPhone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencari data kunjungan.");

      if (!data.found) {
        setSearchError("Tidak ditemukan kunjungan aktif hari ini untuk nomor HP tersebut.");
        return;
      }

      setShowSearchModal(false);
      router.push(`/status/${data.visitToken}`);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchingPhone(false);
    }
  };

  return (
    <div className="tm-checkin min-h-screen flex flex-col" style={{ ...TOKENS, backgroundColor: "var(--tm-cream)" }}>
      <CheckInHeader />

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-2xl">
          {/* Banner Deteksi Kunjungan Aktif di Browser Ini */}
          {activeToken && !visitToken && (
            <div className="mb-5 p-4 rounded-2xl bg-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <p className="text-xs text-zinc-200 truncate">
                  Halo {activeGuestName ? <strong className="text-white">{activeGuestName}</strong> : ""}, Anda memiliki kunjungan aktif hari ini. Ingin melihat status atau <strong>Check-Out</strong>?
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/status/${activeToken}`}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
                >
                  Buka Status & Check-Out →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("tm_active_visit_token");
                    localStorage.removeItem("tm_active_guest_name");
                    setActiveToken(null);
                  }}
                  className="text-zinc-400 hover:text-white text-xs p-1"
                  title="Abaikan"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Breadcrumb & Tombol Cari Check-out */}
          {!visitToken && (
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <nav className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--tm-muted)]">
                <span>Buku Tamu</span>
                <IconChevronRight className="w-3 h-3" />
                <span className="font-medium" style={{ color: "var(--tm-emerald-deep)" }}>Check-in Mandiri</span>
              </nav>

              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ml-auto"
              >
                <span>🚪 Hendak Pulang? Cari & Check-Out</span>
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-[var(--tm-line)] overflow-hidden" style={{ boxShadow: "var(--tm-shadow-card)" }}>
            {visitToken ? (
              <div className="p-6 sm:p-10">
                <SuccessScreen visitToken={visitToken} onReset={handleReset} />
              </div>
            ) : (
              <div className="p-5 sm:p-8">
                <Stepper currentStep={currentStep} completedUpTo={completedUpTo} onJump={handleJumpToStep} />

                <div
                  key={currentStep}
                  className={direction === "forward" ? "mt-7 animate-slideInRight" : "mt-7 animate-slideInLeft"}
                >
                  {currentStep === 1 && <StepIdentity data={formData} onChange={handleChange} errors={errors} />}
                  {currentStep === 2 && <StepHost data={formData} onChange={handleChange} errors={errors} />}
                  {currentStep === 3 && <StepPurpose data={formData} onChange={handleChange} errors={errors} />}
                  {currentStep === 4 && <StepConfirm data={formData} hosts={hosts} />}
                </div>

                {submitError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--tm-line)]">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      id="btn-back"
                      onClick={handleBack}
                      disabled={submitting}
                      className="flex items-center gap-1.5 text-sm text-[var(--tm-muted)] hover:text-[var(--tm-forest)] font-medium px-4 py-2 rounded-xl border border-[var(--tm-line)] hover:border-[var(--tm-forest)]/30 transition-colors cursor-pointer"
                    >
                      <IconChevronLeft className="w-4 h-4" />
                      Kembali
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < STEPS.length ? (
                    <button
                      type="button"
                      id="btn-next"
                      onClick={handleNext}
                      className="flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-[filter] cursor-pointer hover:brightness-95"
                      style={{ background: "var(--tm-emerald-deep)", boxShadow: "var(--tm-shadow-btn)" }}
                    >
                      Lanjutkan
                      <IconChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="btn-submit"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-[filter] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 hover:brightness-95"
                      style={{ background: "var(--tm-emerald-deep)", boxShadow: "var(--tm-shadow-btn)" }}
                    >
                      {submitting ? (
                        <>
                          <IconSpinner className="w-4 h-4" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <IconSend className="w-4 h-4" />
                          Kirim Formulir
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <footer className="mt-8 pt-4 border-t border-[var(--tm-line)] text-center text-xs text-zinc-400 space-y-0.5">
            <p>© {new Date().getFullYear()} PT. Tanimas Resources Internasional</p>
            <p className="text-[11px] font-medium text-zinc-500">
              Aplikasi dibuat oleh Departemen IT Tanimas Group
            </p>
          </footer>
        </div>
      </main>

      {/* Modal Cari Kunjungan Aktif untuk Check-Out */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-sm w-full p-6 animate-scaleIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center text-sm font-bold">
                  🚪
                </span>
                <h3 className="font-bold text-zinc-900 text-sm">Cari Kunjungan & Check-Out</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Masukkan nomor HP yang Anda gunakan saat mengisi formulir check-in tadi untuk membuka slip dan check-out.
            </p>

            <form onSubmit={handleSearchActiveVisit} className="space-y-3">
              <div>
                <label htmlFor="searchPhone" className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  Nomor Handphone Tamu:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="searchPhone"
                    placeholder="Contoh: 081234567890"
                    value={searchPhone}
                    onChange={(e) => {
                      setSearchPhone(e.target.value);
                      if (searchError) setSearchError("");
                    }}
                    autoFocus
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                  />
                </div>
                {searchError && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-medium">{searchError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={searchingPhone}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {searchingPhone ? (
                    <>
                      <IconSpinner className="w-3.5 h-3.5 animate-spin" />
                      <span>Mencari...</span>
                    </>
                  ) : (
                    <>
                      <IconSearch className="w-3.5 h-3.5" />
                      <span>Temukan Kunjungan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}