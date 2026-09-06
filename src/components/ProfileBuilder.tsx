import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useSession";
import { suggestProfileFromResume } from "@/lib/profile.functions";
import { fetchJobs } from "@/lib/jobs";
import { rankJobs } from "@/lib/matching";
import { cn } from "@/lib/utils";

type Suggestion = {
  headline: string;
  summary: string;
  skills: string[];
  experienceYears: number;
  educationLevel: string;
  salaryExpectation: string;
  targetRoles: string[];
};

export function ProfileBuilder() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const suggest = useServerFn(suggestProfileFromResume);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs", "match-pool"],
    queryFn: () => fetchJobs({}),
  });

  const run = useMutation({
    mutationFn: async () => suggest({}),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(
          result.error === "NO_RESUME"
            ? "Upload your CV first so we can read it."
            : result.error === "RATE_LIMIT"
              ? "Too many requests — try again in a moment."
              : "Could not analyse your resume right now.",
        );
        return;
      }
      setSuggestion(result.suggestion);
      setPicked(result.suggestion.skills);
      toast.success("Profile suggestions ready");
    },
    onError: () => toast.error("Could not analyse your resume right now."),
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!user || !suggestion) return;
      const merged = Array.from(
        new Set([...(profile?.skills ?? []), ...picked].map((s) => s.trim()).filter(Boolean)),
      );
      const { error } = await supabase
        .from("profiles")
        .update({
          skills: merged,
          experience_years: suggestion.experienceYears,
          education_level: suggestion.educationLevel || profile?.education_level || null,
          headline: suggestion.headline || null,
          summary: suggestion.summary || null,
          salary_expectation: suggestion.salaryExpectation || null,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated from your resume");
    },
    onError: () => toast.error("Could not save your profile"),
  });

  const activeSkills = suggestion ? picked : (profile?.skills ?? []);
  const matches = rankJobs(
    jobs,
    {
      skills: activeSkills,
      targetRoles: suggestion?.targetRoles ?? [],
      location: profile?.location,
      experienceYears: suggestion?.experienceYears ?? profile?.experience_years,
    },
    6,
  ).filter((m) => m.score > 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-primary-light">Profile builder</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Reads your uploaded CV and suggests skills, experience and a salary range, then matches
            you to live verified jobs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => run.mutate()}
          disabled={run.isPending}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {run.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {run.isPending ? "Reading CV…" : "Build from resume"}
        </button>
      </div>

      {suggestion && (
        <div className="mt-4 space-y-4">
          {suggestion.headline && (
            <p className="text-sm font-semibold text-foreground">{suggestion.headline}</p>
          )}
          {suggestion.summary && (
            <p className="text-sm text-muted-foreground">{suggestion.summary}</p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Experience" value={`${suggestion.experienceYears} yrs`} />
            <Stat label="Education" value={suggestion.educationLevel || "—"} />
            <Stat label="Salary range" value={suggestion.salaryExpectation || "—"} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Suggested skills — tap to include
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestion.skills.map((skill) => {
                const on = picked.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      setPicked((p) => (on ? p.filter((s) => s !== skill) : [...p, skill]))
                    }
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-xs text-muted-foreground",
                      on && "border-primary bg-primary/12 text-primary-light",
                    )}
                  >
                    {on && <Check className="h-3 w-3" />}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {suggestion.targetRoles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Target roles: {suggestion.targetRoles.join(" · ")}
            </p>
          )}

          <button
            type="button"
            onClick={() => apply.mutate()}
            disabled={apply.isPending}
            className="min-h-11 rounded-xl border border-primary px-4 text-sm font-semibold text-primary-light disabled:opacity-60"
          >
            {apply.isPending ? "Saving…" : "Save to my profile"}
          </button>
        </div>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Matched jobs
        </p>
        {matches.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Add skills or build from your resume to see matched jobs.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {matches.map(({ job, score, matched }) => (
              <li key={job.id}>
                <Link
                  to="/job/$id"
                  params={{ id: job.id }}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/50"
                >
                  <span className="text-data grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-sm font-bold text-primary-light">
                    {score}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {job.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {job.company} · {job.location}
                      {matched.length > 0 && ` · ${matched.join(", ")}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-data mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
