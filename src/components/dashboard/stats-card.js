/**
 * Komponen kartu metrik statistik pada dashboard.
 * @param {Object} props
 * @param {string} props.title - Label judul statistik
 * @param {number|string} props.value - Nilai kuantitas metrik
 * @param {string} [props.subtitle] - Keterangan konteks atau perbandingan
 * @param {React.ComponentType<{ className?: string }>} [props.icon] - Ikon SVG pendukung
 * @param {'neutral'|'emerald'|'amber'|'red'|'purple'} [props.variant] - Variasi warna aksen
 */
export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "neutral",
}) {
  return (
    <div className="p-5 rounded-2xl border border-zinc-200/90 bg-white shadow-xs transition-all hover:shadow-md hover:border-zinc-300 text-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
          {title}
        </p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-zinc-100 text-zinc-900">
            <Icon className="w-4 h-4 text-zinc-900" />
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
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
