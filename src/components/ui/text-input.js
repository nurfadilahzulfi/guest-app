/**
 * Komponen input teks standar dengan slot icon kiri dan efek focus ring emerald.
 * @param {Object} props
 * @param {string} props.id - ID elemen input
 * @param {string} [props.placeholder] - Teks placeholder
 * @param {string} props.value - Nilai input
 * @param {function} props.onChange - Handler perubahan nilai input
 * @param {string} [props.type="text"] - Tipe input HTML (text, tel, email, dll.)
 * @param {React.ComponentType<{ className?: string }>} [props.icon] - Komponen SVG Icon di sisi kiri
 * @param {boolean} [props.disabled=false] - Status dinonaktifkan
 */
export function TextInput({ id, placeholder, value, onChange, type = "text", icon: Icon, disabled }) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tm-muted)] pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        suppressHydrationWarning
        className={`
          w-full rounded-xl border border-[var(--tm-line)] bg-white px-4 py-2.5 text-sm text-[var(--tm-forest)]
          placeholder:text-[var(--tm-muted)]/70 focus:outline-none focus:border-[var(--tm-forest)]
          focus:ring-1 focus:ring-[var(--tm-forest)] disabled:bg-slate-50 disabled:text-slate-400
          transition-colors duration-150
          ${Icon ? "pl-10" : ""}
        `}
      />
    </div>
  );
}
