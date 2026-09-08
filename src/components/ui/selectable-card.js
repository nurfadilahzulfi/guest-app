/**
 * Kartu tombol interaktif untuk opsi pemilihan (host tujuan, keperluan kunjungan)
 * dengan highlight border dan background saat terpilih.
 * @param {Object} props
 * @param {boolean} props.selected - Status apakah kartu sedang terpilih
 * @param {function} props.onClick - Handler klik kartu
 * @param {string} [props.id] - Atribut ID untuk kartu/tombol
 * @param {React.ReactNode} props.children - Konten di dalam kartu
 */
export function SelectableCard({ selected, onClick, id, children }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={`
        w-full text-left rounded-xl border transition-colors duration-150 cursor-pointer
        ${selected
          ? "border-[var(--tm-emerald-deep)] bg-[var(--tm-emerald-10)]"
          : "border-[var(--tm-line)] bg-white hover:border-[var(--tm-emerald)]"}
      `}
    >
      {children}
    </button>
  );
}
