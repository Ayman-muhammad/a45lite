import { Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, MapPin, Building2, Heart } from "lucide-react";
import {
  companyTypeLabel,
  daysUntil,
  deadlineLabel,
  jobTypeLabel,
  jobTypeTone,
  postedLabel,
  type Job,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";

export function VerifiedBadge() {
  return (
    <span
      title="Verified Official — confirmed against the employer's official source"
      className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary-light"
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Verified
    </span>
  );
}

export function JobCard({
  job,
  saved,
  onToggleSave,
  className,
}: {
  job: Job;
  saved?: boolean;
  onToggleSave?: (job: Job) => void;
  className?: string;
}) {
  const left = daysUntil(job.deadline);
  const urgent = left !== null && left >= 0 && left <= 3;

  return (
    <article
      className={cn(
        "card-lift animate-rise relative min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">

        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-sm font-bold text-primary-light">
          {job.company.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedBadge />
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                jobTypeTone(job.job_type),
              )}
            >
              {jobTypeLabel(job.job_type)}
            </span>
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-foreground">
            <Link to="/job/$id" params={{ id: job.id }} className="hover:text-primary-light">
              {job.title}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              {job.company}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {job.location}
            </span>
            <span className="text-data">{companyTypeLabel(job.company_type)}</span>
          </p>
        </div>
        {onToggleSave && (
          <button
            type="button"
            aria-label={saved ? "Remove from saved jobs" : "Save job"}
            onClick={() => onToggleSave(job)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Heart className={cn("h-5 w-5", saved && "fill-primary text-primary")} />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
        <span className="text-data text-xs text-muted-foreground">{postedLabel(job.created_at)}</span>
        <div className="flex items-center gap-3">
          {job.salary_range && (
            <span className="text-data text-xs text-primary-light">{job.salary_range}</span>
          )}
          <span
            className={cn(
              "text-data inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
              urgent ? "bg-primary/15 text-primary-light" : "text-muted-foreground",
            )}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {deadlineLabel(job.deadline)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/15" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-primary/15" />
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-3 w-full rounded bg-muted" />
    </div>
  );
}
