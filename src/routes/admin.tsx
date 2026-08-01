import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { listPendingJobs, reviewJob } from "@/lib/admin.functions";
import type { Job } from "@/lib/jobs";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Verification console — 45LITE" },
      { name: "description", content: "Internal 45LITE console for approving or rejecting submitted jobs." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Verification console — 45LITE" },
      { property: "og:description", content: "Internal job verification console." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const list = useServerFn(listPendingJobs);
  const review = useServerFn(reviewJob);
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  async function load(currentPin: string) {
    const response = await list({ data: { pin: currentPin } });
    if (!response.ok) {
      toast.error("Incorrect PIN");
      return;
    }
    setUnlocked(true);
    setJobs(response.jobs as Job[]);
  }

  async function decide(jobId: string, decision: "verified" | "rejected") {
    await review({ data: { pin, jobId, decision } });
    toast.success(decision === "verified" ? "Job approved" : "Job rejected");
    load(pin);
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Verification console</h1>

      {!unlocked ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(pin);
          }}
          className="mt-6 flex max-w-sm gap-2"
        >
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Admin PIN"
            className="min-h-12 flex-1 rounded-xl border border-input bg-card px-4 text-sm text-foreground"
          />
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Unlock
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.length === 0 && (
            <p className="text-sm text-muted-foreground">No jobs waiting for verification.</p>
          )}
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">{job.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.company} · {job.location} · {job.source ?? "unknown source"}
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-foreground/80">{job.description}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => decide(job.id, "verified")}
                  className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(job.id, "rejected")}
                  className="min-h-11 rounded-xl border border-destructive/60 px-4 text-sm font-semibold text-destructive"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
