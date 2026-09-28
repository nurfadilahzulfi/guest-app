import { IconTarget } from "@/components/icons/guest-icons";
import { PURPOSE_OPTIONS, DURATION_OPTIONS, VEHICLE_OPTIONS } from "./constants";
import { StepHeading } from "@/components/ui/step-heading";
import { SelectableCard } from "@/components/ui/selectable-card";
import { Field } from "@/components/ui/field";
import { TextArea } from "@/components/ui/text-area";
import { TextInput } from "@/components/ui/text-input";

/**
 * Tahap 3: Pemilihan kategori tujuan kunjungan, estimasi durasi, dan kendaraan.
 */
export function StepPurpose({ data, onChange, errors }) {
  return (
    <div className="space-y-5">
      <StepHeading
        step="03"
        title="Tujuan & Transportasi"
        subtitle="Pilih kategori kedatangan, estimasi durasi, dan kendaraan yang digunakan."
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
      <Field label="Perkiraan Durasi Pertemuan" id="duration" required hint="Pilih estimasi alokasi waktu yang Anda butuhkan bersama pihak yang dituju.">
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

      {/* Jenis & Nomor Plat Kendaraan */}
      <Field label="Kendaraan yang Digunakan" id="vehicleType" required hint="Pilih sarana transportasi yang Anda bawa saat berkunjung.">
        <div className="flex flex-wrap gap-2">
          {VEHICLE_OPTIONS.map((veh) => {
            const isSelected = data.vehicleType === veh;
            return (
              <button
                key={veh}
                type="button"
                id={`vehicle-${veh.replace(/[\s/]+/g, "-").toLowerCase()}`}
                onClick={() => {
                  onChange("vehicleType", veh);
                  if (veh === "Jalan Kaki / Tanpa Kendaraan") {
                    onChange("licensePlate", "");
                  }
                }}
                className={`
                  py-2 px-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors duration-150 cursor-pointer
                  ${isSelected
                    ? "border-[var(--tm-emerald-deep)] bg-[var(--tm-emerald-10)] text-[var(--tm-emerald-deep)] font-semibold"
                    : "border-[var(--tm-line)] bg-white text-[var(--tm-forest)] hover:border-[var(--tm-emerald)]"}
                `}
              >
                {veh}
              </button>
            );
          })}
        </div>
        {errors.vehicleType && <p className="text-xs text-red-500 mt-1">{errors.vehicleType}</p>}
      </Field>

      {/* Input Nomor Plat Kendaraan jika bermotor */}
      {data.vehicleType && data.vehicleType !== "Jalan Kaki / Tanpa Kendaraan" && (
        <Field label="Nomor Plat Kendaraan" id="licensePlate" required hint="Contoh: BK 1234 ABC (Untuk verifikasi dan tracking pos security).">
          <TextInput
            id="licensePlate"
            placeholder="Contoh: BK 1234 ABC"
            value={data.licensePlate ?? ""}
            onChange={(e) => onChange("licensePlate", e.target.value.toUpperCase())}
          />
          {errors.licensePlate && <p className="text-xs text-red-500 mt-1">{errors.licensePlate}</p>}
        </Field>
      )}
    </div>
  );
}


