import { cn } from "@/lib/utils";

/**
 * The 45L mark: an angular hex chip holding the "45" numerals with the L cut
 * out of the corner, wrapped by a live orbital scan ring.
 */
export function OrbitalMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="animate-orbit absolute inset-[-14%]">
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

      <svg
        viewBox="0 0 100 100"
        className="relative h-full w-full drop-shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
      >
        <defs>
          <linearGradient id="mark45l" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary-light, var(--primary))" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>

        {/* hex chip */}
        <path
          d="M50 6 88 27.5v45L50 94 12 72.5v-45z"
          fill="url(#mark45l)"
          stroke="url(#mark45l)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* inner cut for depth */}
        <path
          d="M50 15 80 32v36L50 85 20 68V32z"
          fill="var(--background, #0B0F19)"
          opacity="0.92"
        />

        {/* 45 numerals + L bar, drawn as geometry so it stays crisp at 16px */}
        <g fill="none" stroke="url(#mark45l)" strokeWidth="6" strokeLinecap="square">
          {/* 4 */}
          <path d="M42 31v18h-16L42 31" strokeLinejoin="miter" />
          <path d="M42 31v34" />
          {/* 5 */}
          <path d="M74 31H58v14h9a10 10 0 1 1-9 14" />
        </g>
        {/* L accent bar in the lower corner */}
        <path d="M30 70v12h16" fill="none" stroke="url(#mark45l)" strokeWidth="6" strokeLinecap="square" />
      </svg>
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
