import { IconTarget } from "@/components/icons/guest-icons";
import { PURPOSE_OPTIONS, DURATION_OPTIONS } from "./constants";
import { StepHeading } from "@/components/ui/step-heading";
import { SelectableCard } from "@/components/ui/selectable-card";
import { Field } from "@/components/ui/field";
import { TextArea } from "@/components/ui/text-area";

/**
 * Tahap 3: Pemilihan kategori tujuan kunjungan, keterangan tambahan, dan estimasi durasi.
 * @param {Object} props
 * @param {Object} props.data - State data formulir
 * @param {function(string, any): void} props.onChange - Handler perubahan nilai field
 * @param {Record<string, string>} props.errors - Objek error validasi field
 */
export function StepPurpose({ data, onChange, errors }) {
  return (
    <div className="space-y-5">
      <StepHeading
        icon={IconTarget}
        title="Tujuan Kunjungan"
        subtitle="Pilih satu kategori yang paling sesuai dengan kedatangan Anda."
      />

      {errors.purpose && <p className="text-xs text-red-500">{errors.purpose}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PURPOSE_OPTIONS.map(({ value, icon: Icon, desc }) => {
          const isSelected = data.purpose === value;
          return (
            <SelectableCard
              key={value}
              id={`purpose-${value.replace(/[\s/]+/g, "-").toLowerCase()}`}
              selected={isSelected}
              onClick={() => onChange("purpose", value)}
            >
              <div className="px-4 py-3.5 flex items-start gap-3">
                <div
                  className="mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={isSelected ? { background: "var(--tm-emerald-deep)", color: "#fff" } : { background: "var(--tm-cream)", color: "var(--tm-muted)" }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? "text-[var(--tm-emerald-deep)]" : "text-[var(--tm-forest)]"}`}>
                    {value}
                  </p>
                  <p className="text-xs text-[var(--tm-muted)] mt-0.5">{desc}</p>
                </div>
              </div>
            </SelectableCard>
          );
        })}
      </div>

      {data.purpose === "Lainnya" && (
        <div>
          <Field label="Keterangan Tujuan" id="purposeNote" required>
            <TextArea
              id="purposeNote"
              placeholder="Jelaskan tujuan kunjungan Anda..."
              value={data.purposeNote ?? ""}
              onChange={(e) => onChange("purposeNote", e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* Perkiraan Durasi Pertemuan */}
      <Field label="Perkiraan Durasi Pertemuan" id="duration" required hint="Pilih estimasi alokasi waktu yang Anda butuhkan bersama host.">
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((dur) => {
            const isSelected = data.duration === dur;
            return (
              <button
                key={dur}
                type="button"
                id={`duration-${dur.replace(/[\s>]+/g, "-").toLowerCase()}`}
                onClick={() => onChange("duration", dur)}
                className={`
                  py-2 px-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors duration-150 cursor-pointer
                  ${isSelected
                    ? "border-[var(--tm-emerald-deep)] bg-[var(--tm-emerald-10)] text-[var(--tm-emerald-deep)] font-semibold"
                    : "border-[var(--tm-line)] bg-white text-[var(--tm-forest)] hover:border-[var(--tm-emerald)]"}
                `}
              >
                {dur}
              </button>
            );
          })}
        </div>
        {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
      </Field>
    </div>
  );
}


