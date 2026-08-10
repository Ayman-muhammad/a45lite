import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Mic, Search as SearchIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";
import { useToggleSave } from "@/routes/index";
import {
  COMPANY_TYPES,
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  LOCATIONS,
  fetchJobs,
  type JobFilters,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";

type SearchParams = {
  q?: string | undefined;
  jobType?: string | undefined;
  companyType?: string | undefined;
  location?: string | undefined;
  experience?: string | undefined;
};

const SMART_CATEGORIES = [
  { label: "Lecturing Positions", params: { companyType: "university" } },
  { label: "Tech Corporate", params: { companyType: "tech_company" } },
  { label: "Internships & Attachments", params: { jobType: "internship" } },
  { label: "TBI Research", params: { companyType: "tbi" } },
  { label: "Remote Africa", params: { jobType: "remote" } },
] as const;

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    jobType: typeof search["jobType"] === "string" ? search["jobType"] : undefined,
    companyType: typeof search["companyType"] === "string" ? search["companyType"] : undefined,
    location: typeof search["location"] === "string" ? search["location"] : undefined,
    experience: typeof search["experience"] === "string" ? search["experience"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search verified jobs — Ayglobe Lite" },
      {
        name: "description",
        content:
          "Search verified Kenyan and remote jobs by keyword, location, job type, company type and experience level.",
      },
      { property: "og:title", content: "Search verified jobs — Ayglobe Lite" },
      { property: "og:description", content: "Filter verified jobs across Kenya and remote roles." },
    ],
  }),
  component: SearchPage,
});

function RecentSearches({ onPick }: { onPick: (q: string) => void }) {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("ayglobe:recent") ?? "[]"));
    } catch {
      setItems([]);
    }
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="text-data min-h-11 rounded-full border border-border px-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function pushRecent(term: string) {
  if (!term.trim()) return;
  try {
    const prev: string[] = JSON.parse(localStorage.getItem("ayglobe:recent") ?? "[]");
    const next = [term, ...prev.filter((p) => p !== term)].slice(0, 10);
    localStorage.setItem("ayglobe:recent", JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function SearchPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [term, setTerm] = useState(params.q ?? "");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);
  const { savedIds, toggle } = useToggleSave();

  const filters: JobFilters = {
    q: params.q,
    jobType: params.jobType,
    companyType: params.companyType,
    location: params.location,
    experience: params.experience,
  };

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["search", filters],
    queryFn: () => fetchJobs(filters),
  });

  function update(next: Partial<SearchParams>) {
    navigate({ search: (prev: SearchParams) => ({ ...prev, ...next }) });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    pushRecent(term);
    update({ q: term || undefined });
  }

  function startVoice() {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: never;
    };
    const Ctor = w.SpeechRecognition ?? (w as never as { webkitSpeechRecognition?: typeof w.SpeechRecognition }).webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = "en-KE";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setTerm(transcript);
      pushRecent(transcript);
      update({ q: transcript });
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Search verified jobs</h1>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Lecturer, backend engineer, attachment…"
            aria-label="Search jobs"
            className="min-h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="button"
          onClick={startVoice}
          aria-label="Search by voice"
          className={cn(
            "grid h-12 w-12 place-items-center rounded-xl border border-border text-muted-foreground hover:border-primary/50 hover:text-primary",
            listening && "border-primary text-primary",
          )}
        >
          <Mic className="h-5 w-5" />
        </button>
        <button
          type="submit"
          className="min-h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:shadow-glow"
        >
          Search
        </button>
      </form>
      <RecentSearches onPick={(q) => { setTerm(q); update({ q }); }} />

      <div className="mt-4 flex flex-wrap gap-2">
        {SMART_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => update({ jobType: undefined, companyType: undefined, ...cat.params })}
            className="min-h-11 rounded-full border border-border px-4 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary"
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-4">
          <FilterGroup
            label="Location"
            value={params.location}
            options={LOCATIONS.map((l) => ({ value: l, label: l }))}
            onChange={(v) => update({ location: v })}
          />
          <FilterGroup
            label="Job type"
            value={params.jobType}
            options={JOB_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(v) => update({ jobType: v })}
          />
          <FilterGroup
            label="Company type"
            value={params.companyType}
            options={COMPANY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(v) => update({ companyType: v })}
          />
          <FilterGroup
            label="Experience"
            value={params.experience}
            options={EXPERIENCE_LEVELS.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(v) => update({ experience: v })}
          />
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() =>
                navigate({ search: {} })
              }
              className="min-h-11 w-full rounded-xl border border-primary/50 text-sm font-medium text-primary"
            >
              Clear filters
            </button>
          )}
        </aside>

        <div className="grid gap-3">
          {isLoading && [0, 1, 2].map((i) => <JobCardSkeleton key={i} />)}
          {jobs?.map((job) => (
            <JobCard key={job.id} job={job} saved={savedIds.includes(job.id)} onToggleSave={toggle} />
          ))}
          {!isLoading && jobs?.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No verified jobs match your criteria. Try broadening your search or enable
                notifications for new matches.
              </p>
              <button
                type="button"
                onClick={() => { setTerm(""); navigate({ search: {} }); }}
                className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div>
      <p className="text-data text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(value === option.value ? undefined : option.value)}
            className={cn(
              "min-h-9 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/50",
              value === option.value && "border-primary bg-primary/12 text-primary-light",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
