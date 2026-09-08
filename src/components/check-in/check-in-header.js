import Image from "next/image";

/**
 * Header navigasi atas menampilkan identitas brand PT. Tanimas Resources Internasional.
 */
export function CheckInHeader() {
  return (
    <header className="bg-white border-b border-[var(--tm-line)] px-6 py-3.5 flex items-center gap-4 shrink-0">
      <div className="w-11 h-11 rounded-xl bg-white border border-[var(--tm-line)] flex items-center justify-center overflow-hidden shrink-0">
        <Image
          src="/assets/logos/tanimas-logo.png"
          alt="Logo PT Tanimas Resources Internasional"
          width={32}
          height={32}
          className="object-contain"
          priority
        />
      </div>
      <div className="h-8 w-px bg-[var(--tm-line)]" />
      <div>
        <p className="text-[11px] text-[var(--tm-muted)] font-medium leading-none">Buku Tamu Digital</p>
        <p className="text-sm sm:text-base font-bold text-[var(--tm-forest)] leading-tight mt-0.5" style={{ fontFamily: "var(--font-display)" }}>
          PT. Tanimas Resources Internasional
        </p>
      </div>
    </header>
  );
}
