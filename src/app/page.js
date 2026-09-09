"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconChevronRight,
  IconChevronLeft,
  IconSpinner,
  IconSend,
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
  const [currentStep, setCurrentStep] = useState(1);
  const [completedUpTo, setCompletedUpTo] = useState(1);
  const [direction, setDirection] = useState("forward");
  const [hosts, setHosts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [visitToken, setVisitToken] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
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

  // Pra-ambil daftar host untuk ringkasan di tahap konfirmasi
  useEffect(() => {
    fetch("/api/hosts")
      .then((r) => r.json())
      .then((list) => setHosts(Array.isArray(list) ? list : []))
      .catch(() => { });
  }, []);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
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
    setCurrentStep((prev) => prev - 1);
  };

  const handleJumpToStep = (id) => {
    if (id === currentStep || id > completedUpTo || submitting) return;
    setErrors({});
    setDirection(id < currentStep ? "backward" : "forward");
    setCurrentStep(id);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const finalPurpose =
        formData.purpose === "Lainnya" && formData.purposeNote
          ? formData.purposeNote
          : formData.purpose;

      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestPhoto: formData.guestPhoto || undefined,
          guestName: formData.guestName.trim(),
          guestPhone: formData.guestPhone.trim(),
          guestEmail: formData.guestEmail.trim() || undefined,
          gender: formData.gender || undefined,
          organization: formData.organization.trim() || undefined,
          duration: formData.duration || undefined,
          hostId: formData.hostId,
          purpose: finalPurpose,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Terjadi kesalahan, coba lagi.");
      setVisitToken(json.visitToken);
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


  return (
    <div className="tm-checkin min-h-screen flex flex-col" style={{ ...TOKENS, backgroundColor: "var(--tm-cream)" }}>
      <CheckInHeader />

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-2xl">
          {!visitToken && (
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--tm-muted)] mb-5">
              <span>Buku Tamu</span>
              <IconChevronRight className="w-3 h-3" />
              <span className="font-medium" style={{ color: "var(--tm-emerald-deep)" }}>Check-in Mandiri</span>
            </nav>
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

          {!visitToken && (
            <p className="text-center text-xs text-[var(--tm-muted)] mt-5">
              Data Anda digunakan semata-mata untuk keperluan pencatatan kunjungan resmi.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}