import { cn } from "@/lib/utils";
import markUrl from "@/assets/ayglobe-mark.png";

/**
 * Ayglobe mark — an orbital globe built from concentric arcs, rendered from the
 * master brand artwork. Sits on a soft tangerine halo so it reads at any size.
 */
export function GlobeMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full bg-primary/15 blur-[6px]" />
      <img
        src={markUrl}
        alt=""
        width={1024}
        height={1024}
        loading="eager"
        decoding="async"
        className="relative h-full w-full object-contain drop-shadow-[0_2px_8px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
      />
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <GlobeMark size={compact ? 28 : 34} className="sm:scale-110" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-lg">
          Ay<span className="text-primary">globe</span>
          <span className="ml-1 text-xs font-semibold text-muted-foreground sm:text-sm">Lite</span>
        </span>
        {!compact && (
          <span className="text-data mt-1 hidden text-[9px] tracking-[0.28em] text-primary-light sm:block">
            EXECUTIVE · PLANNING
          </span>
        )}
      </span>
    </span>
  );
}

/** Back-compat alias for older imports. */
export const OrbitalMark = GlobeMark;
