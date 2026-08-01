import { cn } from "@/lib/utils";

const NODES = [0, 60, 120, 180, 240, 300];

export function OrbitalMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="animate-orbit absolute inset-0">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-primary/70"
          />
          {NODES.map((deg, i) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={50 + 45 * Math.cos(rad)}
                cy={50 + 45 * Math.sin(rad)}
                r={i % 2 === 0 ? 6 : 4}
                className={i % 2 === 0 ? "fill-primary" : "fill-primary/35"}
              />
            );
          })}
        </svg>
      </span>
      <span className="animate-orbit-reverse absolute inset-[14%]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary-glow/50"
          />
        </svg>
      </span>
      <svg viewBox="0 0 100 100" className="relative h-[52%] w-[52%]">
        <path d="M56 6 L26 56 H46 L40 94 L74 40 H52 Z" className="fill-primary-light" />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <OrbitalMark size={compact ? 32 : 40} />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-foreground">45LITE</span>
        {!compact && (
          <span className="text-data mt-1 text-[9px] tracking-[0.28em] text-primary-light">
            CAREER · OPTIMIZED
          </span>
        )}
      </span>
    </span>
  );
}
