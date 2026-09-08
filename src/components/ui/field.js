/**
 * Wrapper pembungkus input form dengan label, penanda wajib, dan petunjuk teks.
 * @param {Object} props
 * @param {string} props.label - Teks label untuk field input
 * @param {string} props.id - ID elemen input terkait
 * @param {React.ReactNode} props.children - Elemen input di dalam field
 * @param {string} [props.hint] - Petunjuk atau bantuan teks di bawah input
 * @param {boolean} [props.required] - Menandakan apakah field ini wajib diisi
 */
export function Field({ label, id, children, hint, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--tm-forest)]">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[var(--tm-muted)]">{hint}</p>}
    </div>
  );
}
