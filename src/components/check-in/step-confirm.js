import {
  IconUser,
  IconPhone,
  IconMail,
  IconBuilding,
  IconTarget,
  IconClipboard,
  IconClock,
} from "@/components/icons/guest-icons";
import { StepHeading } from "@/components/ui/step-heading";

/**
 * Tahap 4: Ringkasan verifikasi data kunjungan sebelum pengiriman formulir resmi.
 * @param {Object} props
 * @param {Object} props.data - State data formulir
 * @param {Array<{id: string, name: string, position?: string, department?: string}>} props.hosts - Daftar host terdaftar
 */
export function StepConfirm({ data, hosts }) {
  const host = hosts.find((h) => h.id === data.hostId);
  const rows = [
    { label: "Nama Tamu", value: data.guestName, icon: IconUser },
    ...(data.gender ? [{ label: "Jenis Kelamin", value: data.gender, icon: IconUser }] : []),
    ...(data.organization ? [{ label: "Asal Instansi / Perusahaan / Organisasi", value: data.organization, icon: IconBuilding }] : []),
    { label: "Nomor HP", value: data.guestPhone, icon: IconPhone },
    { label: "Email", value: data.guestEmail || "—", icon: IconMail },
    {
      label: "Pihak yang Dituju",
      value: host
        ? `${host.name}${host.position ? ` — ${host.position}` : ""}${host.department ? ` (${host.department})` : ""}`
        : "—",
      icon: IconBuilding,
    },
    {
      label: "Tujuan Kunjungan",
      value: data.purpose === "Lainnya" ? (data.purposeNote || "Lainnya") : data.purpose,
      icon: IconTarget,
    },
    ...(data.duration ? [{ label: "Perkiraan Durasi", value: data.duration, icon: IconClock }] : []),
  ];


  return (
    <div className="space-y-5">
      <StepHeading
        step="04"
        title="Konfirmasi Data"
        subtitle="Periksa kembali data Anda sebelum mengirim."
      />

      {data.guestPhoto && (
        <div className="p-3.5 rounded-2xl border border-[var(--tm-line)] bg-white flex items-center gap-3.5 shadow-xs">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-zinc-200 shrink-0 bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.guestPhoto}
              alt="Foto Wajah Tamu"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[var(--tm-muted)] font-medium">Foto Wajah Terverifikasi</p>
            <p className="text-sm font-bold text-[var(--tm-forest)] truncate">{data.guestName}</p>
            <span className="inline-block mt-0.5 text-[11px] text-emerald-700 font-medium">
              ✓ Siap digunakan untuk verifikasi fisik
            </span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--tm-line)] overflow-hidden divide-y divide-[var(--tm-line)]">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3 bg-white">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--tm-cream)", color: "var(--tm-emerald-deep)" }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--tm-muted)]">{label}</p>
              <p className="text-sm font-medium text-[var(--tm-forest)] truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--tm-muted)] leading-relaxed">
        Dengan menekan <strong className="font-semibold text-[var(--tm-forest)]">Kirim Formulir</strong>, Anda menyetujui bahwa data di atas benar dan akan digunakan sebagai catatan kunjungan resmi.
      </p>
    </div>
  );
}
