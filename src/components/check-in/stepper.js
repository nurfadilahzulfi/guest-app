import { IconCheck } from "@/components/icons/guest-icons";
import { STEPS } from "./constants";

/**
 * Komponen Stepper responsif untuk desktop dan mobile dengan animasi progress bar.
 * @param {Object} props
 * @param {number} props.currentStep - Langkah aktif saat ini (1-4)
 * @param {number} props.completedUpTo - Batas langkah tertinggi yang telah selesai/valid
 * @param {function(number): void} props.onJump - Handler perpindahan langsung ke langkah yang diizinkan
 */
export function Stepper({ currentStep, completedUpTo, onJump }) {
  const pct = STEPS.length > 1 ? ((currentStep - 1) / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="relative pt-1">
      <div className="absolute left-5 right-5 top-[14px] sm:top-[18px] h-1 rounded-full bg-[var(--tm-line)]" />
      <div
        className="absolute left-5 top-[14px] sm:top-[18px] h-1 rounded-full transition-[width] duration-500 ease-out"
        style={{ background: "var(--tm-emerald-deep)", width: `calc((100% - 2.5rem) * ${pct} / 100)` }}
      />
      <div className="relative flex items-start justify-between">
        {STEPS.map(({ id, label, icon: Icon }) => {
          const isCompleted = id < completedUpTo;
          const isActive = id === currentStep;
          const isReachable = id <= completedUpTo;
          return (
            <button
              key={id}
              type="button"
              disabled={!isReachable}
              onClick={() => onJump(id)}
              className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2 flex-1 group disabled:cursor-not-allowed"
            >
              <span
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200
                  ${isActive ? "bg-white border-2 border-[var(--tm-emerald)]" : ""}
                  ${!isActive && !isCompleted ? "bg-white border border-[var(--tm-line)] text-[var(--tm-muted)]" : ""}
                  ${isReachable && !isActive ? "group-hover:border-[var(--tm-emerald)]" : ""}
                  ${!isReachable ? "opacity-50" : ""}
                `}
                style={
                  isCompleted
                    ? { background: "var(--tm-emerald-deep)", color: "#fff" }
                    : isActive
                      ? { color: "var(--tm-forest)", boxShadow: "0 0 0 4px var(--tm-emerald-15)" }
                      : undefined
                }
              >
                {isCompleted ? <IconCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </span>
              <span
                className="text-[10px] sm:text-xs font-medium text-center leading-tight transition-colors"
                style={{ color: isActive ? "var(--tm-forest)" : isCompleted ? "var(--tm-emerald-deep)" : "var(--tm-muted)" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
