import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Share2, Sparkles, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { JobCard, VerifiedBadge } from "@/components/JobCard";
import { useToggleSave } from "@/routes/index";
import { useSession } from "@/hooks/useSession";
import { generateForJob, getAiQuota } from "@/lib/ai.functions";
import {
  companyTypeLabel,
  deadlineLabel,
  fetchJob,
  fetchJobs,
  jobTypeLabel,
  jobTypeTone,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/job/$id")({
  head: () => ({
    meta: [
      { title: "Job detail — Ayglobe Lite" },
      {
        name: "description",
        content:
          "Full verified job details, how to apply, and on-demand AI match analysis, CV optimization and cover letter generation.",
      },
      { property: "og:title", content: "Job detail — Ayglobe Lite" },
      { property: "og:description", content: "Verified job details and AI career tools on Ayglobe Lite." },
    ],
  }),
  component: JobDetail,
});

type AiResult = {
  type: string;
  content: string;
  match: { score: number; summary: string; strengths: string[]; gaps: string[]; keywords: string[] } | null;
};

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 42;
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <span className="text-data absolute inset-0 grid place-items-center text-2xl font-bold text-primary">
        {score}
      </span>
    </div>
  );
}

function JobDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const { savedIds, toggle } = useToggleSave();
  const generate = useServerFn(generateForJob);
  const quotaFn = useServerFn(getAiQuota);
  const [result, setResult] = useState<AiResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: job, isLoading } = useQuery({ queryKey: ["job", id], queryFn: () => fetchJob(id) });
  const { data: related = [] } = useQuery({
    queryKey: ["related", job?.company_type],
    enabled: !!job,
    queryFn: () => fetchJobs({ companyType: job!.company_type }),
  });
  const { data: quota, refetch: refetchQuota } = useQuery({
    queryKey: ["ai-quota", user?.id],
    enabled: !!user,
    queryFn: () => quotaFn({}),
  });

  async function run(type: "match_analysis" | "cv_rewrite" | "cover_letter") {
    if (!user) {
      toast.error("Sign in to use AI tools");
      return;
    }
    setBusy(type);
    try {
      const response = await generate({ data: { jobId: id, type } });
      if (!response.ok) {
        if (response.error === "QUOTA") {
          toast.error("Daily limit reached. Upgrade to Pro for unlimited.");
        } else if (response.error === "RATE_LIMIT") {
          toast.error("Too many requests right now. Try again in a moment.");
        } else {
          toast.error("Our AI writer is taking a break. Please try again in a moment.");
        }
        return;
      }
      setResult({ type: response.type, content: response.content, match: response.match });
      refetchQuota();
    } catch {
      toast.error("Our AI writer is taking a break. Please try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    if (!result) return;
    const [{ jsPDF }] = await Promise.all([import("jspdf")]);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setTextColor("#EA580C");
    doc.setFontSize(18);
    doc.text(result.type === "cv_rewrite" ? "Optimized CV" : "Cover Letter", 48, 56);
    doc.setDrawColor("#F97316");
    doc.line(48, 66, 547, 66);
    doc.setTextColor("#111827");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(result.content.replace(/[*#]/g, ""), 499) as string[];
    let y = 92;
    for (const line of lines) {
      if (y > 780) {
        doc.addPage();
        y = 60;
      }
      doc.text(line, 48, y);
      y += 16;
    }
    doc.save(result.type === "cv_rewrite" ? "ayglobe-optimized-cv.pdf" : "ayglobe-cover-letter.pdf");
  }

  async function share() {
    if (!job) return;
    const text = `Check out this ${job.title} at ${job.company} on Ayglobe Lite: ${window.location.href}`;
    if (navigator.share) {
      await navigator.share({ title: job.title, text, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard");
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-2xl bg-card" />
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">This job is no longer available.</p>
      </AppShell>
    );
  }

  const label = (base: string) =>
    quota ? `${base} (${quota.remaining} left today)` : base;

  return (
    <AppShell>
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <article className="animate-rise rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <VerifiedBadge />
              <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", jobTypeTone(job.job_type))}>
                {jobTypeLabel(job.job_type)}
              </span>
              <span className="text-data text-xs text-muted-foreground">{deadlineLabel(job.deadline)}</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{job.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.company} · {job.location} · {companyTypeLabel(job.company_type)}
            </p>
            {job.salary_range && (
              <p className="text-data mt-2 text-sm text-primary-light">{job.salary_range}</p>
            )}

            <div className="mt-6 space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-light">About the role</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{job.description}</p>
            </div>

            {job.requirements.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-light">Requirements</h2>
                <ul className="mt-2 space-y-1 text-sm text-foreground/90">
                  {job.requirements.map((req) => (
                    <li key={req} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/8 p-4">
              <h2 className="text-sm font-semibold text-primary-light">How to apply</h2>
              {job.apply_url && (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:shadow-glow"
                >
                  Apply on official site <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {job.apply_email && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(job.apply_email!);
                    toast.success("Email copied");
                  }}
                  className="text-data mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/40 px-4 text-sm text-primary-light"
                >
                  <Copy className="h-4 w-4" /> {job.apply_email}
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggle(job)}
                className="min-h-11 rounded-xl border border-border px-4 text-sm text-foreground hover:border-primary/50"
              >
                {savedIds.includes(job.id) ? "Saved ✓" : "Save job"}
              </button>
              <button
                type="button"
                onClick={share}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm text-foreground hover:border-primary/50"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </article>

          <section className="mt-6 rounded-3xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-light">
              <Sparkles className="h-4 w-4" /> AI career tools — on demand only
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Nothing runs automatically. Free plan includes 5 generations per day.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => run("match_analysis")}
                disabled={busy !== null}
                className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:shadow-glow disabled:opacity-60"
              >
                {busy === "match_analysis" ? "Analyzing…" : label("Generate Match Analysis")}
              </button>
              <button
                type="button"
                onClick={() => run("cv_rewrite")}
                disabled={busy !== null}
                className="min-h-11 rounded-xl border border-primary/50 px-4 text-sm font-semibold text-primary-light disabled:opacity-60"
              >
                {busy === "cv_rewrite" ? "Optimizing…" : label("Optimize My CV for This Role")}
              </button>
              <button
                type="button"
                onClick={() => run("cover_letter")}
                disabled={busy !== null}
                className="min-h-11 rounded-xl border border-primary/50 px-4 text-sm font-semibold text-primary-light disabled:opacity-60"
              >
                {busy === "cover_letter" ? "Writing…" : label("Generate Cover Letter")}
              </button>
            </div>

            {result && result.match && (
              <div className="mt-6 flex flex-col gap-6 sm:flex-row">
                <ScoreRing score={result.match.score} />
                <div className="flex-1 space-y-3 text-sm">
                  <p className="text-foreground">{result.match.summary}</p>
                  {result.match.gaps.length > 0 && (
                    <div>
                      <p className="text-data text-xs uppercase tracking-widest text-muted-foreground">Gap analysis</p>
                      <ul className="mt-1 space-y-1 text-foreground/90">
                        {result.match.gaps.map((g) => (
                          <li key={g}>· {g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.match.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.match.keywords.map((k) => (
                        <span key={k} className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary-light">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && !result.match && (
              <div className="mt-6">
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-sm text-foreground/90">
                  {result.content}
                </pre>
                <button
                  type="button"
                  onClick={exportPdf}
                  className="mt-3 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:shadow-glow"
                >
                  {result.type === "cv_rewrite" ? "Download Optimized CV" : "Download Cover Letter"}
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{job.company}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{companyTypeLabel(job.company_type)}</p>
            <p className="text-data mt-3 text-xs text-primary-light">
              Verified by {job.verified_by ?? "Ayglobe Lite"} · source {job.source ?? "official"}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Related jobs</h2>
            <div className="mt-3 space-y-3">
              {related
                .filter((r) => r.id !== job.id)
                .slice(0, 3)
                .map((r) => (
                  <JobCard key={r.id} job={r} />
                ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
