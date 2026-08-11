import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  RefreshCw,
  ShieldCheck,
  Building2,
  GraduationCap,
  HeartHandshake,
  Globe2,
  ExternalLink,
} from "lucide-react";
import {
  SOURCE_COUNTS,
  SOURCE_SCOPES,
  SOURCES_VERIFIED_ON,
  type SourceScope,
} from "@/lib/sources";
import { syncJobs, type SyncResult } from "@/lib/sync.functions";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  ok: "border-success/40 bg-success/12 text-success",
  empty: "border-border bg-muted/20 text-muted-foreground",
  blocked: "border-violet/40 bg-violet/12 text-violet",
  disallowed: "border-warning/40 bg-warning/12 text-warning",
  unreachable: "border-destructive/40 bg-destructive/12 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  ok: "listings found",
  empty: "no open roles",
  blocked: "blocked bot access",
  disallowed: "robots.txt opt-out",
  unreachable: "unreachable",
};

const SCOPE_ICON = {
  all: ShieldCheck,
  university: GraduationCap,
  ngo: HeartHandshake,
  company: Building2,
  api: Globe2,
} as const;

const SCOPE_COUNT: Record<SourceScope, number> = {
  all: SOURCE_COUNTS.total,
  university: SOURCE_COUNTS.university,
  ngo: SOURCE_COUNTS.ngo,
  company: SOURCE_COUNTS.company,
  api: SOURCE_COUNTS.api,
};

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-background/40 px-3 py-2">
      <p
        className={cn(
          "text-data truncate text-lg font-bold",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function SyncPanel({ compact = false }: { compact?: boolean }) {
  const runSync = useServerFn(syncJobs);
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<SourceScope>("all");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    try {
      const res = await runSync({ data: { scope } });
      setResult(res);
      if (!res.ok) {
        toast.error(
          res.error === "SOURCES_UNAVAILABLE"
            ? "No source returned listings this round. Try another scope shortly."
            : "The verification engine is busy. Please retry in a moment.",
        );
        return;
      }
      if (res.found === 0) {
        toast("Sources scanned — nothing new since your last sync.");
      } else {
        toast.success(
          `${res.verified} verified · ${res.rejected} rejected across ${res.sources.length} sources.`,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch {
      toast.error("Sync failed. Check your connection and try again.");
    } finally {
      setSyncing(false);
    }
  }

  const reached = result?.sources.filter((s) => s.status === "ok") ?? [];
  const quiet = result?.sources.filter((s) => s.status !== "ok") ?? [];

  return (
    <section
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border/80 bg-card/60 shadow-[0_1px_0_0_color-mix(in_oklab,var(--primary)_12%,transparent)] backdrop-blur",
        compact && "max-w-xl",
      )}
    >
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 bg-background/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/12 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Live source sync</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {SOURCE_COUNTS.total} official pages · links verified {SOURCES_VERIFIED_ON}
            </p>
          </div>
        </div>
        <span className="text-data shrink-0 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-success">
          Verified
        </span>
      </div>

      <div className="p-4">
        {/* Scope chips — horizontally scrollable on phones */}
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {SOURCE_SCOPES.map((s) => {
            const Icon = SCOPE_ICON[s.key];
            const active = scope === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScope(s.key)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-10 shrink-0 snap-start items-center gap-2 rounded-full border border-border px-3.5 text-xs font-medium text-muted-foreground transition-colors active:scale-95 hover:border-primary/50 hover:text-foreground",
                  active && "border-primary bg-primary/12 text-primary-light",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {s.label}
                <span className="text-data text-[10px] opacity-70">{SCOPE_COUNT[s.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow active:scale-[0.98] disabled:opacity-70 sm:w-auto"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} aria-hidden="true" />
            {syncing ? "Scanning official pages…" : "Sync now"}
          </button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {SOURCE_COUNTS.university} universities · {SOURCE_COUNTS.ngo} Turkana NGOs ·{" "}
            {SOURCE_COUNTS.company} employers · {SOURCE_COUNTS.api} remote feeds — every URL probed
            live, robots.txt-checked, then AI-verified before publishing.
          </p>
        </div>

        {syncing && (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
            <div className="h-full w-1/3 animate-[slide_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat value={result.verified} label="verified" accent />
              <Stat value={result.rejected} label="rejected by AI" />
              <Stat value={reached.length} label="sources with roles" />
              <Stat value={result.notified} label="members alerted" />
            </div>

            {reached.length > 0 && (
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {reached.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs"
                  >
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-0 items-center gap-1.5 text-foreground hover:text-primary-light"
                    >
                      <span className="truncate">{s.name}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
                    </a>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[11px]",
                        STATUS_TONE[s.status],
                      )}
                    >
                      {s.found} found
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {quiet.length > 0 && (
              <details className="rounded-lg border border-border/60 bg-background/30 p-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  {quiet.length} sources with nothing to publish
                </summary>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {quiet.map((s) => (
                    <li
                      key={s.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs"
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-muted-foreground hover:text-foreground"
                      >
                        {s.name}
                      </a>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[11px]",
                          STATUS_TONE[s.status],
                        )}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
