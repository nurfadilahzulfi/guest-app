"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import {
  IconCamera,
  IconRotateCcw,
  IconTrash,
  IconCheck,
  IconX,
  IconSpinner,
} from "@/components/icons/guest-icons";

/**
 * Komponen pengambilan foto wajah tamu secara langsung melalui kamera.
 * Hanya mendukung live stream getUserMedia (HTTPS / localhost).
 * Tidak ada opsi upload berkas.
 *
 * @param {Object} props
 * @param {string|null} props.value - Data URL Base64 foto yang telah diambil
 * @param {function(string): void} props.onChange - Callback pembaruan nilai foto
 * @param {string} [props.error] - Pesan kesalahan validasi jika foto belum diambil
 */
export function PhotoCapture({ value, onChange, error }) {
  const [isCameraOpen, setIsCameraOpen]     = useState(false);
  const [isVideoReady, setIsVideoReady]     = useState(false);
  const [facingMode, setFacingMode]         = useState("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraLoading, setCameraLoading]   = useState(false);
  const [cameraError, setCameraError]       = useState("");

  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  // Periksa apakah perangkat memiliki lebih dari 1 kamera
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Hentikan semua track kamera dan bersihkan srcObject
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  }, []);

  // Hentikan stream saat komponen unmount
  useEffect(() => () => stopStream(), [stopStream]);

  /**
   * Pasangkan stream yang tersimpan di streamRef ke elemen <video> yang baru saja
   * di-mount oleh React. Menggunakan useLayoutEffect agar berjalan SETELAH DOM
   * diperbarui tetapi SEBELUM browser me-paint, sehingga tidak ada frame hitam.
   */
  useLayoutEffect(() => {
    if (!isCameraOpen || !streamRef.current) return;

    const attachStream = () => {
      const video = videoRef.current;
      if (!video) return;

      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }

      const tryPlay = () => {
        video.play().catch((err) => {
          // NotAllowedError bisa muncul di beberapa browser; coba ulang setelah interaksi
          console.warn("Video play() error:", err.name, err.message);
        });
      };

      if (video.readyState >= 1) {
        // Metadata sudah tersedia, langsung play
        tryPlay();
      } else {
        video.onloadedmetadata = tryPlay;
      }
    };

    // Jalankan sekarang (jika <video> sudah ada di DOM)
    attachStream();
  }, [isCameraOpen]);

  // Buka stream kamera via getUserMedia
  const startCamera = useCallback(
    async (mode = facingMode) => {
      stopStream();
      setCameraLoading(true);
      setCameraError("");
      setIsVideoReady(false);

      try {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error(
            "Peramban tidak mendukung akses kamera. Pastikan halaman dibuka melalui HTTPS."
          );
        }

        let stream;
        try {
          // Coba dengan facingMode dan resolusi ideal terlebih dahulu
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch {
          // Fallback: constraint paling dasar agar semua device terdukung
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;

        // Set state SETELAH stream siap — useLayoutEffect akan pasang srcObject
        setIsCameraOpen(true);
      } catch (err) {
        console.error("Gagal membuka kamera:", err);

        let pesanError =
          "Tidak dapat membuka kamera. Pastikan izin kamera sudah diaktifkan di peramban Anda.";

        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          pesanError =
            "Akses kamera ditolak. Klik ikon kunci/info di address bar untuk mengizinkan kamera, lalu muat ulang halaman.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          pesanError = "Tidak ada kamera yang ditemukan pada perangkat ini.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          pesanError =
            "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain lalu coba lagi.";
        } else if (err.name === "OverconstrainedError") {
          pesanError = "Konfigurasi kamera tidak didukung oleh perangkat ini.";
        }

        setCameraError(pesanError);
        setIsCameraOpen(false);
      } finally {
        setCameraLoading(false);
      }
    },
    [facingMode, stopStream]
  );

  // Tutup kamera secara manual
  const handleCloseCamera = useCallback(() => {
    stopStream();
    setIsCameraOpen(false);
    setCameraError("");
  }, [stopStream]);

  // Alihkan antara kamera depan (user) dan belakang (environment)
  const handleSwitchCamera = useCallback(() => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    startCamera(newMode);
  }, [facingMode, startCamera]);

  // Ambil snapshot dari video feed ke canvas dan simpan sebagai JPEG Base64
  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Kamera belum siap. Tunggu hingga gambar muncul, lalu coba lagi.");
      return;
    }

    const { videoWidth, videoHeight } = video;

    // Crop area tengah 1:1 (portrait-safe)
    const size      = Math.min(videoWidth, videoHeight);
    const startX    = (videoWidth  - size) / 2;
    const startY    = (videoHeight - size) / 2;
    const targetSize = Math.min(size, 640);

    const canvas = document.createElement("canvas");
    canvas.width  = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontal untuk kamera depan agar hasil sesuai tampilan preview
    if (facingMode === "user") {
      ctx.translate(targetSize, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, targetSize, targetSize);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopStream();
    setIsCameraOpen(false);
    setCameraError("");
    onChange(dataUrl);
  }, [facingMode, onChange, stopStream]);

  // Hapus foto yang sudah diambil
  const handleRemove = useCallback(() => onChange(""), [onChange]);

  return (
    <div className="space-y-2">
      {/* ─── Kasus 1: Kamera Sedang Aktif ─── */}
      {isCameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-md">
          {/* Area Video */}
          <div className="relative aspect-square w-full max-w-xs mx-auto overflow-hidden bg-black flex items-center justify-center">
            {/* ─ Elemen <video> ─
                ref callback memastikan srcObject langsung dipasang saat elemen
                pertama kali muncul di DOM, sebelum useLayoutEffect berikutnya
                sempat berjalan — double-coverage untuk menghindari layar hitam. */}
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
              onLoadedData={() => setIsVideoReady(true)}
              onPlaying={() => setIsVideoReady(true)}
              onCanPlay={() => setIsVideoReady(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isVideoReady ? "opacity-100" : "opacity-0"
              } ${facingMode === "user" ? "-scale-x-100" : ""}`}
            />

            {/* Spinner saat menghubungkan kamera */}
            {!isVideoReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white gap-2.5 z-10">
                <IconSpinner className="w-8 h-8 animate-spin text-white/70" />
                <span className="text-xs font-medium text-white/70">
                  Menghubungkan kamera…
                </span>
              </div>
            )}

            {/* Panduan posisi wajah */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
              <div className="w-56 h-[17rem] sm:w-60 sm:h-72 rounded-[50%] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-end justify-center pb-3">
                <span className="text-[10px] sm:text-xs font-semibold text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  Posisikan wajah di sini
                </span>
              </div>
            </div>

            {/* Tutup kamera */}
            <button
              type="button"
              onClick={handleCloseCamera}
              className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
              title="Tutup Kamera"
            >
              <IconX className="w-4 h-4" />
            </button>

            {/* Ganti kamera (hanya jika ada lebih dari 1) */}
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="absolute top-3 left-3 z-30 p-2 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
                title="Ganti Kamera"
              >
                <IconRotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Kontrol shutter */}
          <div className="p-4 bg-zinc-950 flex items-center justify-between px-8">
            {/* Spacer kiri agar tombol shutter tepat di tengah */}
            <span className="w-12" />

            <button
              type="button"
              onClick={handleCapture}
              disabled={!isVideoReady}
              className="group flex items-center justify-center w-16 h-16 rounded-full border-4 border-white/80 p-1 hover:border-white transition-all transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Ambil Foto"
            >
              <span className="w-full h-full rounded-full bg-white group-hover:bg-zinc-200 transition-colors flex items-center justify-center">
                <IconCamera className="w-6 h-6 text-zinc-900" />
              </span>
            </button>

            <button
              type="button"
              onClick={handleCloseCamera}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer w-12 text-right"
            >
              Batal
            </button>
          </div>
        </div>
      ) : value ? (
        /* ─── Kasus 2: Foto Sudah Diambil ─── */
        <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Foto Tamu" className="w-full h-full object-cover" />
            <div className="absolute bottom-1 right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
              <IconCheck className="w-3 h-3" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <IconCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Foto wajah berhasil diambil</span>
            </div>
            <p className="text-xs text-zinc-500">
              Foto wajah ini akan digunakan untuk verifikasi fisik saat kedatangan tamu di lokasi.
            </p>
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <IconRotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span>Ambil Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <IconTrash className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Kasus 3: Belum Ada Foto ─── */
        <div
          className={`p-5 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center gap-3 bg-zinc-50/70 ${
            error ? "border-red-300 bg-red-50/30" : "border-zinc-300 hover:border-zinc-400"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <IconCamera className="w-6 h-6" />
          </div>

          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-bold text-zinc-900">Ambil Foto Wajah Tamu</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Foto wajib diambil langsung melalui kamera perangkat. Pastikan wajah terlihat
              jelas tanpa masker atau kacamata hitam.
            </p>
          </div>

          <button
            type="button"
            onClick={() => startCamera()}
            disabled={cameraLoading}
            className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {cameraLoading ? (
              <>
                <IconSpinner className="w-4 h-4 animate-spin" />
                <span>Membuka Kamera…</span>
              </>
            ) : (
              <>
                <IconCamera className="w-4 h-4" />
                <span>Buka Kamera Sekarang</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Pesan error akses kamera */}
      {cameraError && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-2">
          <p className="font-medium">{cameraError}</p>
          <button
            type="button"
            onClick={() => startCamera()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white font-semibold text-xs hover:bg-black transition-colors cursor-pointer"
          >
            <IconCamera className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Pesan error validasi form */}
      {error && !cameraError && (
        <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
