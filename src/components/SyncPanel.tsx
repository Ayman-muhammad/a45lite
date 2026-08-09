import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SOURCE_COUNTS, SOURCE_SCOPES, type SourceScope } from "@/lib/sources";
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
    <div className={cn("w-full", compact && "max-w-xl")}>
      <div className="flex flex-wrap items-center gap-2">
        {SOURCE_SCOPES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setScope(s.key)}
            className={cn(
              "min-h-9 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50",
              scope === s.key && "border-primary bg-primary/12 text-primary-light",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow active:scale-95 disabled:opacity-70"
        >
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full bg-primary-foreground",
              syncing && "animate-ping",
            )}
          />
          {syncing ? "Scanning official pages…" : "Sync now"}
        </button>
        <p className="text-xs text-muted-foreground">
          {SOURCE_COUNTS.university} universities · {SOURCE_COUNTS.ngo} Turkana NGOs ·{" "}
          {SOURCE_COUNTS.company} employers · {SOURCE_COUNTS.api} remote feeds — robots.txt-checked,
          scraped live, then AI-verified before publishing.
        </p>
      </div>

      {syncing && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted/30">
          <div className="h-full w-1/3 animate-[slide_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-data text-sm font-bold text-primary">
              {result.verified} verified
            </span>
            <span className="text-muted-foreground">{result.rejected} rejected by AI</span>
            <span className="text-muted-foreground">{reached.length} sources with openings</span>
            {result.notified > 0 && (
              <span className="text-muted-foreground">{result.notified} members alerted</span>
            )}
          </div>


          {reached.length > 0 && (
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {reached.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-foreground underline-offset-2 hover:text-primary-light hover:underline"
                  >
                    {s.name}
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
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                {quiet.length} sources with nothing to publish
              </summary>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {quiet.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
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
  );
}
