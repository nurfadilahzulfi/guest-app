/**
 * Motif judul tahapan formulir — desain tipografi minimalis monokrom.
 * Badge ikon dihilangkan; visual dibedakan dengan aksen garis dan hierarki teks.
 * @param {Object} props
 * @param {string} props.title - Judul utama tahapan
 * @param {string} [props.subtitle] - Deskripsi singkat petunjuk tahapan
 * @param {string} [props.step] - Nomor urut tahapan (opsional, misal "01")
 */
export function StepHeading({ title, subtitle, step }) {
  return (
    <div className="pb-4 border-b border-zinc-200">
      {step && (
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-400 mb-1">
          Langkah {step}
        </p>
      )}
      <h2
        className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 leading-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
