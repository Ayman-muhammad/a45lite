import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { APPLICATION_STATUSES, deadlineLabel, type Job } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Application tracker — Ayglobe Lite" },
      {
        name: "description",
        content: "Track every application from saved to offer on a single Kenyan job pipeline board.",
      },
      { property: "og:title", content: "Application tracker — Ayglobe Lite" },
      { property: "og:description", content: "Your job pipeline: saved, applied, interview, offer." },
    ],
  }),
  component: TrackerPage,
});

type Row = {
  id: string;
  status: string;
  notes: string | null;
  updated_at: string;
  job_id: string;
  jobs: Job | null;
};

function TrackerPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data = [] } = useQuery({
    queryKey: ["applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("id, status, notes, updated_at, job_id, jobs(*)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  async function move(row: Row, status: string) {
    await supabase
      .from("job_applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
        applied_at: status === "applied" ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    toast.success(`Moved to ${status}`);
  }

  async function note(row: Row, notes: string) {
    await supabase.from("job_applications").update({ notes }).eq("id", row.id);
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  }

  if (data.length === 0) {
    return (
      <AppShell>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My applications</h1>
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Track your job applications here. Save a job and mark it as applied!
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Find verified jobs
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My applications</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tap a stage to move a card through your pipeline.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {APPLICATION_STATUSES.map((column) => {
          const rows = data.filter((r) => r.status === column.value);
          return (
            <section key={column.value} className="rounded-2xl border border-border bg-card/60 p-3">
              <h2 className="text-data flex items-center justify-between text-xs uppercase tracking-widest text-primary-light">
                {column.label}
                <span className="text-muted-foreground">{rows.length}</span>
              </h2>
              <div className="mt-3 space-y-3">
                {rows.map((row) => (
                  <article key={row.id} className="rounded-xl border border-border bg-card p-3">
                    <Link
                      to="/job/$id"
                      params={{ id: row.job_id }}
                      className="text-sm font-semibold text-foreground hover:text-primary-light"
                    >
                      {row.jobs?.title ?? "Job"}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{row.jobs?.company}</p>
                    <p className="text-data mt-1 text-[11px] text-muted-foreground">
                      {deadlineLabel(row.jobs?.deadline ?? null)} · updated{" "}
                      {Math.max(
                        0,
                        Math.floor((Date.now() - new Date(row.updated_at).getTime()) / 86_400_000),
                      )}
                      d ago
                    </p>
                    <textarea
                      defaultValue={row.notes ?? ""}
                      onBlur={(e) => note(row, e.target.value)}
                      placeholder="Add note"
                      className="mt-2 min-h-12 w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {APPLICATION_STATUSES.filter((s) => s.value !== row.status).map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => move(row, s.value)}
                          className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
