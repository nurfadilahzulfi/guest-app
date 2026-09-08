import { useState, useEffect } from "react";
import { IconBuilding, IconSearch, IconSpinner, IconCheck } from "@/components/icons/guest-icons";
import { StepHeading } from "@/components/ui/step-heading";
import { SelectableCard } from "@/components/ui/selectable-card";

/**
 * Tahap 2: Pemilihan host staf yang akan ditemui dengan fitur pencarian interaktif.
 * @param {Object} props
 * @param {Object} props.data - State data formulir
 * @param {function(string, any): void} props.onChange - Handler perubahan nilai field
 * @param {Record<string, string>} props.errors - Objek error validasi field
 */
export function StepHost({ data, onChange, errors }) {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/hosts")
      .then((r) => r.json())
      .then((list) => {
        setHosts(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = hosts.filter((h) => {
    const q = search.toLowerCase();
    return (
      h.name?.toLowerCase().includes(q) ||
      h.position?.toLowerCase().includes(q) ||
      h.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <StepHeading
        step="02"
        title="Pilih Host Tujuan"
        subtitle="Pilih satu orang yang akan Anda temui hari ini."
      />

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tm-muted)] pointer-events-none">
          <IconSearch className="w-4 h-4" />
        </div>
        <input
          id="hostSearch"
          type="text"
          placeholder="Cari nama, posisi, atau departemen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[var(--tm-line)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--tm-forest)] placeholder:text-[var(--tm-muted)]/70 focus:outline-none focus:border-[var(--tm-forest)] focus:ring-1 focus:ring-[var(--tm-forest)] transition-colors duration-150"

        />
      </div>

      {errors.hostId && <p className="text-xs text-red-500">{errors.hostId}</p>}

      <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-[var(--tm-muted)]">
            <IconSpinner className="w-5 h-5" />
            <span className="text-sm">Memuat daftar host...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-[var(--tm-muted)]">
            {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada host terdaftar."}
          </div>
        ) : (
          filtered.map((host) => {
            const isSelected = data.hostId === host.id;
            return (
              <SelectableCard
                key={host.id}
                id={`host-${host.id}`}
                selected={isSelected}
                onClick={() => onChange("hostId", host.id)}
              >
                <div className="px-4 py-3 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                    style={isSelected ? { background: "var(--tm-emerald-deep)" } : { background: "var(--tm-line)", color: "var(--tm-muted)" }}
                  >
                    {host.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? "text-[var(--tm-emerald-deep)]" : "text-[var(--tm-forest)]"}`}>
                      {host.name}
                    </p>
                    <p className="text-xs text-[var(--tm-muted)] truncate">
                      {host.position}{host.department ? ` — ${host.department}` : ""}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 text-[var(--tm-emerald-deep)]">
                      <IconCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </SelectableCard>
            );
          })
        )}
      </div>
    </div>
  );
}
