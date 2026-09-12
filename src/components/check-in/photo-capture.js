"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
 * Mendukung live stream browser (pada HTTPS / localhost) dan fallback native camera / upload
 * dengan capture="user" dan input file biasa.
 * 
 * @param {Object} props
 * @param {string|null} props.value - Data URL Base64 foto yang telah diambil
 * @param {function(string): void} props.onChange - Callback pembaruan nilai foto
 * @param {string} [props.error] - Pesan kesalahan validasi jika foto belum diambil
 */
export function PhotoCapture({ value, onChange, error }) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Periksa apakah perangkat memiliki lebih dari 1 kamera (kamera depan & belakang)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Hentikan stream kamera saat ditutup atau unmount
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

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Buka kamera stream browser (hanya berjalan di HTTPS atau localhost)
  const startCamera = useCallback(
    async (mode = facingMode) => {
      stopStream();
      setCameraLoading(true);
      setCameraError("");

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Peramban ini membatasi akses video langsung tanpa HTTPS.");
        }

        const constraints = {
          video: {
            facingMode: mode,
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (constraintErr) {
          console.warn("Retrying getUserMedia with basic constraints:", constraintErr);
          // Fallback ke constraint umum jika device tidak mendukung facingMode / resolusi ideal
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        streamRef.current = stream;

        // Buka tampilan kamera terlebih dahulu agar elemen video di-mount oleh React
        setIsCameraOpen(true);
        setIsVideoReady(false);

        // Jika elemen video sudah ada di DOM (misal switch camera), pasang stream langsung
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Gagal membuka live stream kamera:", err);
        // Jika gagal karena peramban non-HTTPS di HP atau tidak ada getUserMedia,
        // alihkan langsung ke pemicu kamera perangkat (capture="user")
        if (nativeCameraInputRef.current) {
          nativeCameraInputRef.current.click();
        } else {
          setCameraError(
            "Tidak dapat membuka kamera. Pastikan izin kamera aktif pada peramban Anda."
          );
        }
        setIsCameraOpen(false);
      } finally {
        setCameraLoading(false);
      }
    },
    [facingMode, stopStream]
  );

  // Sambungkan stream ke elemen <video> begitu elemen ter-mount di DOM
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.onloadedmetadata = () => {
        video.play().catch((err) => console.warn("Video play error:", err));
      };
      video.play().catch(() => {});
    }
  }, [isCameraOpen]);

  // Fungsi utama saat tombol "Buka Kamera" ditekan
  const handleTriggerCamera = () => {
    setCameraError("");

    // Cek apakah browser mendukung getUserMedia dan berada di konteks aman (HTTPS atau localhost)
    const isSecureOrLocal =
      typeof window !== "undefined" &&
      (window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    const canUseGetUserMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      isSecureOrLocal;

    if (canUseGetUserMedia) {
      startCamera();
    } else {
      // Pada HTTP non-localhost (misal akses dari HP via IP lokal seperti http://192.168.x.x),
      // Google Chrome memblokir navigator.mediaDevices.
      // Kita langsung gunakan kamera native perangkat (capture="user") yang selalu didukung!
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      } else {
        startCamera();
      }
    }
  };

  // Proses gambar yang diambil dari kamera bawaan smartphone atau berkas gambar
  const handleNativeCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = img.width;
        const height = img.height;

        // Ambil bagian tengah secara persegi (1:1 aspect ratio)
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        // Kompresi resolusi optimal maksimal 640x640px
        const targetSize = Math.min(size, 640);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);

        // Ubah menjadi data URL JPEG dengan kompresi 0.85
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onChange(dataUrl);
        setCameraError("");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Reset nilai input agar dapat mengambil foto kembali
    e.target.value = "";
  };

  // Tutup kamera secara manual
  const handleCloseCamera = () => {
    stopStream();
    setIsCameraOpen(false);
    setCameraError("");
  };

  // Alihkan antara kamera depan dan belakang
  const handleSwitchCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  // Ambil snapshot foto dari video feed ke canvas
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Kamera sedang memuat gambar, silakan tunggu sebentar.");
      return;
    }

    const canvas = document.createElement("canvas");
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Ambil area tengah (1:1 aspect ratio) agar foto proporsional
    const size = Math.min(videoWidth, videoHeight);
    const startX = (videoWidth - size) / 2;
    const startY = (videoHeight - size) / 2;

    // Resolusi penyimpanan optimal (maksimal 640x640px)
    const targetSize = Math.min(size, 640);
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Jika kamera depan, cerminkan horizontal (mirror) agar foto sesuai tampilan preview
    if (facingMode === "user") {
      ctx.translate(targetSize, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, targetSize, targetSize);

    // Dapatkan data URL JPEG dengan kompresi 0.85
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    // Hentikan kamera dan simpan foto
    stopStream();
    setIsCameraOpen(false);
    onChange(dataUrl);
    setCameraError("");
  };

  // Hapus foto yang sudah diambil
  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      {/* Input tersembunyi khusus memicu kamera native smartphone (capture="user") */}
      <input
        type="file"
        ref={nativeCameraInputRef}
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleNativeCameraCapture}
      />

      {/* Input tersembunyi untuk upload file / galeri foto sebagai alternatif */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleNativeCameraCapture}
      />

      {/* ─── Kasus 1: Kamera Sedang Aktif (Live Video Stream) ─── */}
      {isCameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-md">
          {/* Video Feed */}
          <div className="relative aspect-square w-full max-w-xs mx-auto overflow-hidden bg-black flex items-center justify-center">
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
              onLoadedMetadata={(e) => {
                e.currentTarget.play().catch(() => {});
              }}
              onLoadedData={() => setIsVideoReady(true)}
              onPlaying={() => setIsVideoReady(true)}
              onCanPlay={() => setIsVideoReady(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isVideoReady ? "opacity-100" : "opacity-0"
              } ${facingMode === "user" ? "-scale-x-100" : ""}`}
            />

            {/* Indikator Menghubungkan Kamera */}
            {!isVideoReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white gap-2.5 z-10">
                <IconSpinner className="w-8 h-8 animate-spin text-white/80" />
                <span className="text-xs font-medium text-white/80">Menghubungkan kamera...</span>
              </div>
            )}

            {/* Bingkai Panduan Posisi Wajah (Face Silhouette Guide) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
              <div className="w-56 h-68 sm:w-60 sm:h-72 rounded-[50%] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-end justify-center pb-3">
                <span className="text-[10px] sm:text-xs font-semibold text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Posisikan wajah di sini
                </span>
              </div>
            </div>

            {/* Tombol Tutup Kamera di Pojok Atas */}
            <button
              type="button"
              onClick={handleCloseCamera}
              className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
              title="Tutup Kamera"
            >
              <IconX className="w-4 h-4" />
            </button>

            {/* Tombol Ganti Kamera (jika multi-kamera) */}
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

          {/* Kontrol Shutter di Bagian Bawah */}
          <div className="p-4 bg-zinc-950 flex items-center justify-between px-6">
            <button
              type="button"
              onClick={() => {
                handleCloseCamera();
                fileInputRef.current?.click();
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Gunakan berkas foto dari galeri / perangkat"
            >
              Pilih Berkas
            </button>

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
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      ) : value ? (
        /* ─── Kasus 2: Foto Sudah Berhasil Diambil (Preview State) ─── */
        <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Foto Tamu"
              className="w-full h-full object-cover"
            />
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
                onClick={handleTriggerCamera}
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
        /* ─── Kasus 3: Belum Ada Foto (Initial State) ─── */
        <div
          className={`p-5 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center gap-3 bg-zinc-50/70 ${
            error
              ? "border-red-300 bg-red-50/30"
              : "border-zinc-300 hover:border-zinc-400"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <IconCamera className="w-6 h-6" />
          </div>

          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-bold text-zinc-900">
              Ambil Foto Wajah Tamu
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Foto wajib diambil langsung melalui kamera perangkat Anda. Pastikan wajah terlihat jelas tanpa masker atau kacamata hitam.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleTriggerCamera}
              disabled={cameraLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {cameraLoading ? (
                <>
                  <IconSpinner className="w-4 h-4 animate-spin" />
                  <span>Membuka Kamera...</span>
                </>
              ) : (
                <>
                  <IconCamera className="w-4 h-4" />
                  <span>Buka Kamera Sekarang</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <span>Upload dari Galeri / Berkas</span>
            </button>
          </div>
        </div>
      )}

      {/* Pesan Error Akses Kamera & Tombol Buka Kamera Perangkat */}
      {cameraError && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-2">
          <p>{cameraError}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white font-semibold text-xs hover:bg-black transition-colors cursor-pointer"
            >
              <IconCamera className="w-3.5 h-3.5" />
              <span>Gunakan Kamera Bawaan</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-950 font-semibold text-xs hover:bg-amber-100/50 transition-colors cursor-pointer"
            >
              <span>Pilih Berkas Foto</span>
            </button>
          </div>
        </div>
      )}

      {/* Pesan Error Validasi Form */}
      {error && !cameraError && (
        <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
