/**
 * Motif judul tahapan formulir dengan badge ikon solid hijau emerald khas Tanimas.
 * @param {Object} props
 * @param {React.ComponentType<{ className?: string }>} props.icon - Komponen SVG Icon pada badge
 * @param {string} props.title - Judul utama tahapan
 * @param {string} [props.subtitle] - Deskripsi singkat petunjuk tahapan
 */
export function StepHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white"
        style={{ background: "var(--tm-emerald-deep)" }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--tm-forest)]" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        {subtitle && <p className="text-sm text-[var(--tm-muted)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
