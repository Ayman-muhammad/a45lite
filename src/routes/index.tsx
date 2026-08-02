import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";
import { useProfile, useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { daysUntil, FEED_FILTERS, fetchJobs, type Job } from "@/lib/jobs";
import { syncJobs } from "@/lib/sync.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "45LITE — Verified Jobs for Kenyan Professionals" },
      {
        name: "description",
        content:
          "Discover verified lecturing, tech, TBI research, internship, attachment and remote jobs for Kenyan professionals. Career. Optimized.",
      },
      { property: "og:title", content: "45LITE — Verified Jobs for Kenyan Professionals" },
      {
        property: "og:description",
        content: "Verified job discovery and AI career optimization for Kenyan professionals.",
      },
    ],
  }),
  component: Home,
});

function useSavedIds() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["saved-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_jobs").select("job_id");
      if (error) throw error;
      return (data ?? []).map((r) => r.job_id);
    },
  });
}

export function useToggleSave() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: savedIds = [] } = useSavedIds();

  async function toggle(job: Job) {
    if (!user) {
      toast.error("Sign in to save jobs");
      return;
    }
    if (savedIds.includes(job.id)) {
      await supabase.from("saved_jobs").delete().eq("job_id", job.id).eq("user_id", user.id);
      toast("Removed from saved jobs");
    } else {
      await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: job.id });
      await supabase
        .from("job_applications")
        .upsert({ user_id: user.id, job_id: job.id, status: "saved" }, { onConflict: "user_id,job_id" });
      toast.success("Job saved");
    }
    queryClient.invalidateQueries({ queryKey: ["saved-ids"] });
    queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  }

  return { savedIds, toggle };
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-data text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SyncButton() {
  const runSync = useServerFn(syncJobs);
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    try {
      const result = await runSync();
      if (!result.ok) {
        toast.error(
          result.error === "SOURCES_UNAVAILABLE"
            ? "Job sources are unreachable right now. Try again shortly."
            : "The verification engine is busy. Please retry in a moment.",
        );
        return;
      }
      if (result.found === 0) {
        toast("No new listings since your last sync.");
      } else {
        toast.success(
          `Sync complete — ${result.verified} verified, ${result.rejected} rejected by the AI verifier.`,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch {
      toast.error("Sync failed. Check your connection and try again.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={syncing}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-70"
    >
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 rounded-full bg-primary-foreground",
          syncing && "animate-ping",
        )}
      />
      {syncing ? "Scanning & verifying…" : "Sync now"}
    </button>
  );
}



function Home() {
  const [feed, setFeed] = useState<string>("all");
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { savedIds, toggle } = useToggleSave();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", feed],
    queryFn: () => fetchJobs({ feed }),
  });

  const { data: allJobs = [] } = useQuery({ queryKey: ["jobs", "all"], queryFn: () => fetchJobs() });

  const stats = useMemo(() => {
    const prefs = profile?.job_type_preference ?? [];
    const matching = allJobs.filter((j) => {
      if (prefs.length === 0) return false;
      return prefs.some(
        (p) =>
          (p === "lecturing" && j.company_type === "university") ||
          (p === "corporate_it" && ["tech_company", "startup"].includes(j.company_type)) ||
          p === j.job_type,
      );
    }).length;
    const closing = allJobs.filter((j) => {
      const d = daysUntil(j.deadline);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    return { verified: allJobs.length, matching, closing };
  }, [allJobs, profile]);

  const urgent = allJobs.filter((j) => {
    const d = daysUntil(j.deadline);
    return d !== null && d >= 0 && d <= 3;
  });

  const trending = allJobs.slice(0, 6);

  return (
    <AppShell>
      <section className="hero-glow animate-rise rounded-3xl border border-border bg-card/40 p-6 md:p-8">
        <p className="text-data text-xs tracking-[0.24em] text-primary-light">MISSION CONTROL</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          {profile?.full_name ? `Karibu, ${profile.full_name.split(" ")[0]}` : "Verified jobs, zero noise"}
        </h1>
        <div className="mt-3 h-1 w-16 rounded-full bg-primary" />
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Every listing on 45LITE is checked against its official source before it reaches your feed —
          university posts, Kenyan tech roles, TBI research, attachments and remote-for-Africa jobs.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat value={stats.verified} label="Verified jobs live" />
          <Stat value={stats.matching} label="Match your profile" />
          <Stat value={stats.closing} label="Deadlines this week" />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {user ? (
            <>
              <SyncButton />
              <span className="text-xs text-muted-foreground">
                Every synced listing is auto-checked by our AI verifier before it reaches the feed.
              </span>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-glow"
            >
              Create your free account
            </Link>
          )}
        </div>
      </section>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FEED_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFeed(f.key)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50",
              feed === f.key && "border-primary bg-primary/12 text-primary-light",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {urgent.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-light">
            Closing in 72 hours
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {urgent.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                saved={savedIds.includes(job.id)}
                onToggleSave={toggle}
                className="border-primary/40"
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Trending today
        </h2>
        <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
          {trending.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedIds.includes(job.id)}
              onToggleSave={toggle}
              className="w-[320px] shrink-0"
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          All verified jobs
        </h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {isLoading && [0, 1, 2, 3].map((i) => <JobCardSkeleton key={i} />)}
          {jobs?.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedIds.includes(job.id)}
              onToggleSave={toggle}
            />
          ))}
        </div>
        {!isLoading && jobs?.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No verified jobs in this category yet. Try another filter.
            </p>
            <button
              type="button"
              onClick={() => setFeed("all")}
              className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </AppShell>
  );
}
