import { cn } from "@/lib/utils";
import markUrl from "@/assets/45lite-mark.png";

export function OrbitalMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="animate-orbit absolute inset-[-12%]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="10 14"
            className="text-primary/40"
          />
        </svg>
      </span>
      <img
        src={markUrl}
        alt=""
        width={1024}
        height={1024}
        className="relative h-full w-full object-contain drop-shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
      />
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
