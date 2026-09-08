import { IconUser, IconPhone, IconMail, IconBuilding } from "@/components/icons/guest-icons";
import { GENDER_OPTIONS } from "./constants";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { StepHeading } from "@/components/ui/step-heading";

/**
 * Tahap 1: Pengisian identitas diri tamu (Nama Lengkap, Nomor HP, Email, Jenis Kelamin, Asal Instansi).
 * @param {Object} props
 * @param {Object} props.data - State data formulir
 * @param {function(string, any): void} props.onChange - Handler perubahan nilai field
 * @param {Record<string, string>} props.errors - Objek error validasi field
 */
export function StepIdentity({ data, onChange, errors }) {
  return (
    <div className="space-y-5">
      <StepHeading
        step="01"
        title="Identitas Tamu"
        subtitle="Isi data diri Anda untuk keperluan registrasi kunjungan."
      />

      <Field label="Nama Lengkap" id="guestName" required hint="Sesuai identitas resmi (KTP/SIM).">
        <TextInput
          id="guestName"
          placeholder="Contoh: Budi Santoso"
          value={data.guestName}
          onChange={(e) => onChange("guestName", e.target.value)}
          icon={IconUser}
        />
        {errors.guestName && <p className="text-xs text-red-500 mt-1">{errors.guestName}</p>}
      </Field>

      <Field label="Jenis Kelamin" id="gender" required hint="Pilih salah satu sesuai identitas resmi.">
        <div className="grid grid-cols-2 gap-3">
          {GENDER_OPTIONS.map((g) => {
            const isSelected = data.gender === g;
            return (
              <button
                key={g}
                type="button"
                id={`gender-${g.toLowerCase()}`}
                onClick={() => onChange("gender", g)}
                className={`
                  py-2.5 px-4 rounded-xl text-sm font-medium border text-center transition-colors duration-150 cursor-pointer
                  ${isSelected
                    ? "border-[var(--tm-emerald-deep)] bg-[var(--tm-emerald-10)] text-[var(--tm-emerald-deep)] font-semibold"
                    : "border-[var(--tm-line)] bg-white text-[var(--tm-forest)] hover:border-[var(--tm-emerald)]"}
                `}
              >
                {g}
              </button>
            );
          })}
        </div>
        {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
      </Field>

      <Field label="Asal Instansi / Perusahaan / Organisasi" id="organization" required hint="Jika datang atas nama pribadi (bukan instansi/organisasi), silakan isi 'Pribadi'.">
        <TextInput
          id="organization"
          placeholder="Contoh: PT Sumber Rejeki, Yayasan, Vendor, Kurir, atau Pribadi"
          value={data.organization || ""}
          onChange={(e) => onChange("organization", e.target.value)}
          icon={IconBuilding}
        />
        {errors.organization && <p className="text-xs text-red-500 mt-1">{errors.organization}</p>}
      </Field>


      <Field label="Nomor HP" id="guestPhone" required hint="Format: 08xx atau +628xx — akan dinormalisasi otomatis.">
        <TextInput
          id="guestPhone"
          type="tel"
          placeholder="08123456789"
          value={data.guestPhone}
          onChange={(e) => onChange("guestPhone", e.target.value)}
          icon={IconPhone}
        />
        {errors.guestPhone && <p className="text-xs text-red-500 mt-1">{errors.guestPhone}</p>}
      </Field>

      <Field label="Email" id="guestEmail" required hint="Untuk menerima salinan konfirmasi kunjungan resmi.">
        <TextInput
          id="guestEmail"
          type="email"
          placeholder="email@contoh.com"
          value={data.guestEmail}
          onChange={(e) => onChange("guestEmail", e.target.value)}
          icon={IconMail}
        />
        {errors.guestEmail && <p className="text-xs text-red-500 mt-1">{errors.guestEmail}</p>}
      </Field>

    </div>
  );
}

