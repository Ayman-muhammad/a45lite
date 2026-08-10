import { cn } from "@/lib/utils";

/**
 * Ayglobe mark: an abstract globe formed by three intersecting arcs with a
 * central node. Pure SVG, themed with design tokens (no hardcoded colors).
 */
export function GlobeMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
          <circle cx="32" cy="32" r="24" className="text-primary" stroke="currentColor" />
          <ellipse cx="32" cy="32" rx="11" ry="24" className="text-primary-light" stroke="currentColor" />
          <path d="M9 24c7 4 15 6 23 6s16-2 23-6" className="text-primary-glow" stroke="currentColor" />
        </g>
        <circle cx="32" cy="32" r="6.5" className="fill-primary" />
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-70 shadow-glow" />
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <GlobeMark size={compact ? 30 : 38} />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          Ay<span className="text-primary">globe</span>
          <span className="ml-1 text-sm font-semibold text-muted-foreground">Lite</span>
        </span>
        {!compact && (
          <span className="text-data mt-1 text-[9px] tracking-[0.28em] text-primary-light">
            EXECUTIVE · PLANNING
          </span>
        )}
      </span>
    </span>
  );
}

/** Back-compat alias for older imports. */
export const OrbitalMark = GlobeMark;
