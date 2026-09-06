import { cn } from "@/lib/utils";
import markUrl from "@/assets/ayglobe-mark.png";

/**
 * Ayglobe mark — a photoreal Earth seen from orbit, wrapped in a slow-turning
 * tangerine orbital ring and a soft atmospheric halo for a futuristic feel.
 */
export function GlobeMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full bg-primary/20 blur-[8px]" />
      <svg viewBox="0 0 100 100" className="animate-orbit absolute inset-0 h-full w-full">
        <ellipse
          cx="50"
          cy="50"
          rx="47"
          ry="19"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="46 190"
          opacity="0.9"
          transform="rotate(-24 50 50)"
        />
      </svg>
      <svg viewBox="0 0 100 100" className="animate-orbit-reverse absolute inset-0 h-full w-full">
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="var(--primary-glow)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="10 26"
          opacity="0.55"
        />
      </svg>
      <img
        src={markUrl}
        alt=""
        width={1024}
        height={1024}
        loading="eager"
        decoding="async"
        className="relative h-[82%] w-[82%] rounded-full object-contain drop-shadow-[0_2px_10px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
      />
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <GlobeMark size={compact ? 30 : 38} />
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
