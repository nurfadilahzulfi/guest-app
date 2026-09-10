/**
 * Komponen kartu metrik statistik pada dashboard dengan background putih bersih.
 * @param {Object} props
 * @param {string} props.title - Label judul statistik
 * @param {number|string} props.value - Nilai kuantitas metrik
 * @param {string} [props.subtitle] - Keterangan konteks atau perbandingan
 * @param {React.ComponentType<{ className?: string }>} [props.icon] - Ikon SVG pendukung
 */
export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
}) {
  return (
    <div className="p-5 rounded-3xl border border-zinc-200/90 bg-white shadow-xs transition-all duration-200 hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
          {title}
        </p>
        {Icon && (
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-zinc-100 text-zinc-700 border border-zinc-200/60">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <p
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}


