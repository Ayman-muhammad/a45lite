import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { JobCard } from "@/components/JobCard";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { daysUntil, type Job } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved jobs — 45LITE" },
      { name: "description", content: "Your saved verified jobs, sorted by closest deadline." },
      { property: "og:title", content: "Saved jobs — 45LITE" },
      { property: "og:description", content: "Track the verified jobs you saved on 45LITE." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data = [] } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, notes, job_id, jobs(*)")
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; notes: string | null; job_id: string; jobs: Job | null }>;
    },
  });

  const rows = [...data]
    .filter((r) => r.jobs)
    .sort((a, b) => (daysUntil(a.jobs!.deadline) ?? 999) - (daysUntil(b.jobs!.deadline) ?? 999));

  async function remove(jobId: string) {
    await supabase.from("saved_jobs").delete().eq("job_id", jobId);
    queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["saved-ids"] });
  }

  async function saveNote(id: string, notes: string) {
    await supabase.from("saved_jobs").update({ notes }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Saved jobs</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sorted by closest deadline.</p>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Your saved jobs will appear here. Start browsing!</p>
          <Link
            to="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Browse verified jobs
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <div key={row.id} className="space-y-2">
              <JobCard job={row.jobs!} saved onToggleSave={(j) => remove(j.id)} />
              <textarea
                defaultValue={row.notes ?? ""}
                onBlur={(e) => saveNote(row.id, e.target.value)}
                placeholder="Notes: contacts, referral, follow-up date…"
                className="min-h-16 w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
