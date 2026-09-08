/**
 * Komponen TextArea multiline untuk input deskripsi atau catatan kunjungan.
 * @param {Object} props
 * @param {string} props.id - ID elemen textarea
 * @param {string} [props.placeholder] - Teks placeholder
 * @param {string} props.value - Nilai textarea
 * @param {function} props.onChange - Handler perubahan teks
 * @param {number} [props.rows=3] - Jumlah baris teks yang ditampilkan
 */
export function TextArea({ id, placeholder, value, onChange, rows = 3 }) {
  return (
    <textarea
      id={id}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-[var(--tm-line)] bg-white px-4 py-2.5 text-sm text-[var(--tm-forest)] placeholder:text-[var(--tm-muted)]/70 focus:outline-none focus:border-[var(--tm-emerald)] focus:ring-2 focus:ring-[var(--tm-emerald-15)] transition-colors duration-150 resize-none"
    />
  );
}
