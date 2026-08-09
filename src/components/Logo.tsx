import { cn } from "@/lib/utils";
import markUrl from "@/assets/45lite-mark.png";

/**
 * The 45L mark: an angular circuit chip carrying the 45L monogram, wrapped by a
 * live orbital scan ring.
 */
export function OrbitalMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="animate-orbit absolute inset-[-16%]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="8 16"
            strokeLinecap="round"
            className="text-primary/50"
          />
        </svg>
      </span>
      <img
        src={markUrl}
        alt=""
        width={1024}
        height={1024}
        className="relative h-full w-full scale-110 object-contain drop-shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
      />
    </span>
  );
}


export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <OrbitalMark size={compact ? 32 : 40} />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          45<span className="text-primary">L</span>ITE
        </span>
        {!compact && (
          <span className="text-data mt-1 text-[9px] tracking-[0.28em] text-primary-light">
            CAREER · OPTIMIZED
          </span>
        )}
      </span>
    </span>
  );
}
