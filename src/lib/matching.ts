import type { Job } from "@/lib/jobs";

export type MatchInput = {
  skills: string[];
  targetRoles?: string[];
  location?: string | null | undefined;
  experienceYears?: number | undefined;
};

export type ScoredJob = { job: Job; score: number; matched: string[] };

const LEVEL_YEARS: Record<string, number> = { entry: 0, mid: 3, senior: 6 };

/** Lightweight on-device relevance score between a candidate profile and a job. */
export function scoreJob(job: Job, input: MatchInput): ScoredJob {
  const haystack = [
    job.title,
    job.description,
    (job.requirements ?? []).join(" "),
    job.company,
  ]
    .join(" ")
    .toLowerCase();

  const skills = input.skills.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const matched = skills.filter((s) => s.length > 1 && haystack.includes(s));
  const skillScore = skills.length ? (matched.length / skills.length) * 62 : 0;

  const roles = (input.targetRoles ?? []).map((r) => r.toLowerCase());
  const roleHit = roles.some((r) => r && job.title.toLowerCase().includes(r.split(" ")[0] ?? ""));
  const roleScore = roleHit ? 18 : 0;

  const loc = (input.location ?? "").toLowerCase();
  const locScore =
    loc && (job.location ?? "").toLowerCase().includes(loc) ? 10 : job.job_type === "remote" ? 6 : 0;

  const needed = LEVEL_YEARS[job.experience_level ?? "entry"] ?? 0;
  const years = input.experienceYears ?? 0;
  const expScore = years >= needed ? 10 : Math.max(0, 10 - (needed - years) * 4);

  return {
    job,
    score: Math.round(Math.min(100, skillScore + roleScore + locScore + expScore)),
    matched: matched.slice(0, 6),
  };
}

export function rankJobs(jobs: Job[], input: MatchInput, limit = 8): ScoredJob[] {
  return jobs
    .map((job) => scoreJob(job, input))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
