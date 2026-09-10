"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Custom Tooltip interaktif bergaya modern glassmorphism dengan indikator warna semantik.
 */
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const colorMap = {
    approved: { name: "Disetujui", color: "#10b981", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { name: "Ditolak", color: "#f43f5e", bg: "bg-rose-50 text-rose-700 border-rose-200" },
    pending: { name: "Menunggu", color: "#f59e0b", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  };

  const total = payload.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  return (
    <div className="bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl shadow-xl p-3.5 min-w-[170px] text-xs space-y-2">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
        <span className="font-bold text-zinc-900">{label}</span>
        <span className="text-[10px] font-semibold text-zinc-400 uppercase">
          Total: {total}
        </span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const info = colorMap[entry.dataKey] || {
            name: entry.dataKey,
            color: entry.color,
            bg: "bg-zinc-50 text-zinc-700 border-zinc-200",
          };
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-zinc-600 font-medium">{info.name}</span>
              </div>
              <span className="font-extrabold text-zinc-900">{entry.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Komponen Chart Statistik Dashboard adaptif multi-role.
 * Menggunakan palet warna vibran semantik (Emerald untuk disetujui, Rose untuk ditolak, Amber untuk menunggu, Blue/Purple untuk tipe tamu)
 * @param {Object} props
 * @param {Object} [props.user] - Data user sesi
 */
export function DashboardCharts({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [chartRange, setChartRange] = useState(14); // default 14 hari

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/visits/stats");
        if (!res.ok) {
          throw new Error(`Status ${res.status}: Gagal memuat data statistik`);
        }
        const data = await res.json();
        if (!isCancelled) {
          setStats(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data statistik dashboard:", err);
        if (!isCancelled) {
          setError(err.message || "Gagal memuat statistik");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Skeleton saat belum mounted atau sedang memuat data
  if (!isMounted || loading) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-pulse">
        <div className="h-6 bg-zinc-200/70 rounded-lg w-56" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs lg:col-span-2 h-72" />
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs h-72" />
        </div>
      </div>
    );
  }

  // Jika terjadi error saat memuat data statistik
  if (error || !stats) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-zinc-200 p-6 text-center">
        <p className="text-xs font-semibold text-zinc-500">
          {error || "Statistik kunjungan belum tersedia saat ini."}
        </p>
      </div>
    );
  }

  const isHost = stats.isHost || user?.role === "HOST";

  // Ambil N hari terakhir dari daily trend
  const trendData = (stats.dailyTrend || [])
    .slice(-chartRange)
    .map((d) => ({
      ...d,
      label: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
        new Date(d.date + "T00:00:00")
      ),
    }));

  const totalApproved = stats.statusDistribution?.approved || 0;
  const totalRejected = stats.statusDistribution?.rejected || 0;
  const totalPending = stats.statusDistribution?.pending || 0;
  const totalAllTime = totalApproved + totalRejected + totalPending;

  // Data untuk pie chart status dengan warna semantik vibran
  const statusPieData = [
    {
      name: "Disetujui",
      value: totalApproved,
      color: "#10b981", // Emerald 500
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      name: "Ditolak",
      value: totalRejected,
      color: "#f43f5e", // Rose 500
      badge: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      name: "Menunggu",
      value: totalPending,
      color: "#f59e0b", // Amber 500
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ].filter((d) => d.value > 0);

  const totalRegular = stats.visitorTypeDistribution?.regular || 0;
  const totalOwner = stats.visitorTypeDistribution?.owner || 0;
  const totalCategory = totalRegular + totalOwner;

  // Data untuk pie chart tipe tamu dengan warna kontras & elegan
  const typePieData = [
    {
      name: "Tamu Reguler",
      value: totalRegular,
      color: "#3b82f6", // Blue 500
      badge: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      name: "Owner VIP",
      value: totalOwner,
      color: "#8b5cf6", // Purple 500
      badge: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ].filter((d) => d.value > 0);

  const growthPct =
    stats.totalLastMonth > 0
      ? Math.round(((stats.totalThisMonth - stats.totalLastMonth) / stats.totalLastMonth) * 100)
      : stats.totalThisMonth > 0
      ? 100
      : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2
            className="text-base font-bold text-zinc-900 flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span>📊</span>
            <span>{isHost ? "Analitik & Tren Kunjungan Anda" : "Analitik & Tren Kunjungan Perusahaan"}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isHost
              ? "Ringkasan statistik riwayat tamu yang berkunjung kepada Anda"
              : "Ringkasan statistik berdasarkan seluruh data kunjungan tamu di sistem"}
          </p>
        </div>

        {/* Chip pemilih rentang grafik tren */}
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto border border-zinc-200/60 shadow-xs">
          {[7, 14, 30].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setChartRange(r)}
              className={`px-3.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                chartRange === r
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
              }`}
            >
              {r} Hari
            </button>
          ))}
        </div>
      </div>

      {/* Baris 1 — Bar Chart Tren + Kartu Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Bar chart tren kunjungan */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-zinc-900">
                Tren Kunjungan ({chartRange} Hari Terakhir)
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Grafik akumulasi volume tamu berdasarkan status keputusan
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Live Data
            </span>
          </div>

          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={220}>
              <BarChart data={trendData} barCategoryGap="25%">
                {/* Definisi Gradient Warna Vibran Semantik */}
                <defs>
                  <linearGradient id="barApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="barRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                  <linearGradient id="barPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#71717a", fontWeight: 500 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#71717a", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "#f8fafc", radius: 8 }} />
                <Bar dataKey="approved" stackId="a" fill="url(#barApproved)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="rejected" stackId="a" fill="url(#barRejected)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="url(#barPending)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend visual interaktif */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-zinc-100 justify-center">
            {[
              { color: "bg-emerald-500", label: "Disetujui", gradient: "from-emerald-400 to-emerald-600" },
              { color: "bg-rose-500", label: "Ditolak", gradient: "from-rose-400 to-rose-600" },
              { color: "bg-amber-500", label: "Menunggu", gradient: "from-amber-400 to-amber-600" },
            ].map((l) => (
              <span
                key={l.label}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/60 shadow-2xs"
              >
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${l.gradient} shrink-0`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Kartu perbandingan bulan ini vs bulan lalu */}
        <div className="flex flex-col gap-4">
          {/* Card Bulan Ini (Background Putih Bersih) */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Bulan Ini
                </p>
                <span className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-bold">
                  📅
                </span>
              </div>

              <p
                className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {stats.totalThisMonth ?? 0}
              </p>
              <p className="text-xs text-zinc-400 mt-1">kunjungan masuk tercatat</p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                  growthPct >= 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                    : "bg-rose-50 text-rose-700 border-rose-200/70"
                }`}
              >
                {growthPct >= 0 ? "▲" : "▼"} {Math.abs(growthPct)}%
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">
                Bulan lalu: <strong className="text-zinc-800">{stats.totalLastMonth ?? 0}</strong>
              </span>
            </div>
          </div>

          {/* Card Total Keseluruhan (Background Putih Bersih) */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex-1 flex flex-col justify-between text-zinc-900">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Keseluruhan
                </p>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-bold border border-zinc-200">
                  All-Time
                </span>
              </div>

              <p
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {totalAllTime}
              </p>
              <p className="text-xs text-zinc-400 mt-1">kunjungan tersimpan di sistem</p>
            </div>

            {/* Sub-metrik 3 kotak ringkas di atas background putih */}
            <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-2 transition-transform hover:scale-[1.02]">
                <p className="text-base font-extrabold text-emerald-700">{totalApproved}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                  Setuju
                </p>
              </div>

              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-2 transition-transform hover:scale-[1.02]">
                <p className="text-base font-extrabold text-rose-700">{totalRejected}</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mt-0.5">
                  Tolak
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-2 transition-transform hover:scale-[1.02]">
                <p className="text-base font-extrabold text-amber-700">{totalPending}</p>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">
                  Tunggu
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Baris 2 — Pie charts + Top Host/Guest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Pie chart distribusi status */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-zinc-900">Distribusi Status</p>
              <p className="text-[11px] text-zinc-400">Persentase persetujuan kunjungan</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
          </div>

          {statusPieData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-400 text-xs">
              <span className="text-3xl mb-1">📊</span>
              <span>Belum ada data riwayat kunjungan</span>
            </div>
          ) : (
            <>
              <div className="h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        fontSize: 11,
                        padding: "6px 12px",
                      }}
                      itemStyle={{ color: "#0f172a", fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="text-xl font-extrabold text-zinc-900 leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {totalAllTime}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    Total
                  </span>
                </div>
              </div>

              {/* Legend rows dengan persentase */}
              <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100">
                {statusPieData.map((d) => {
                  const pct = totalAllTime > 0 ? Math.round((d.value / totalAllTime) * 100) : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-zinc-700 font-medium">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: d.color }}
                        />
                        {d.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                          {pct}%
                        </span>
                        <span className="font-extrabold text-zinc-900 min-w-[20px] text-right">
                          {d.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pie chart tipe tamu */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-zinc-900">Kategori Tamu</p>
              <p className="text-[11px] text-zinc-400">Komparasi Tamu Reguler vs Owner VIP</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs" />
          </div>

          {typePieData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-400 text-xs">
              <span className="text-3xl mb-1">🏷️</span>
              <span>Belum ada data kategori tamu</span>
            </div>
          ) : (
            <>
              <div className="h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                  <PieChart>
                    <Pie
                      data={typePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {typePieData.map((entry, index) => (
                        <Cell key={`cell-type-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        fontSize: 11,
                        padding: "6px 12px",
                      }}
                      itemStyle={{ color: "#0f172a", fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="text-xl font-extrabold text-zinc-900 leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {totalCategory}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    Tamu
                  </span>
                </div>
              </div>

              {/* Legend rows dengan persentase */}
              <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100">
                {typePieData.map((d) => {
                  const pct = totalCategory > 0 ? Math.round((d.value / totalCategory) * 100) : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-zinc-700 font-medium">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: d.color }}
                        />
                        {d.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                          {pct}%
                        </span>
                        <span className="font-extrabold text-zinc-900 min-w-[20px] text-right">
                          {d.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Top Host / Guest */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-zinc-900">
                  {isHost ? "Instansi / Tamu Teratas" : "Top Host (30 Hari Terakhir)"}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {isHost ? "Frekuensi kunjungan tamu ke Anda" : "Karyawan dengan kunjungan tamu terbanyak"}
                </p>
              </div>
              <span className="text-xs">🏆</span>
            </div>

            {!stats.topHosts || stats.topHosts.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-10">Belum ada riwayat kunjungan</p>
            ) : (
              <div className="space-y-2.5">
                {stats.topHosts.map((h, i) => {
                  // Badge medali untuk ranking 1, 2, 3
                  const rankStyles = [
                    "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xs shadow-amber-500/20",
                    "bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-xs",
                    "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-xs",
                  ];
                  const rankClass = rankStyles[i] || "bg-zinc-100 text-zinc-700 font-bold";

                  return (
                    <div
                      key={h.name + i}
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-zinc-50 transition-colors"
                    >
                      <span
                        className={`w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-extrabold shrink-0 ${rankClass}`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">{h.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{h.department}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-xl shrink-0">
                        {h.count} {isHost ? "x" : "tamu"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-100 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Data diperbarui otomatis</span>
            <span className="font-semibold text-zinc-600">30 Hari Terakhir</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;


