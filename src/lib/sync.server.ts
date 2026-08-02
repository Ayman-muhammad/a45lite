import { callGateway } from "@/lib/ai.server";

export type RawJob = {
  title: string;
  company: string;
  location: string;
  description: string;
  source: string;
  source_url: string;
  apply_url: string;
  tags: string[];
  is_remote: boolean;
  salary_range: string | null;
  posted_at: string | null;
};

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRemotive(): Promise<RawJob[]> {
  const res = await fetch("https://remotive.com/api/remote-jobs?limit=60");
  if (!res.ok) return [];
  const payload = (await res.json()) as {
    jobs?: Array<{
      title?: string;
      company_name?: string;
      candidate_required_location?: string;
      description?: string;
      url?: string;
      tags?: string[];
      salary?: string;
      publication_date?: string;
    }>;
  };
  return (payload.jobs ?? [])
    .filter((j) => j.title && j.company_name && j.url)
    .map((j) => ({
      title: j.title!.trim(),
      company: j.company_name!.trim(),
      location: j.candidate_required_location?.trim() || "Remote",
      description: stripHtml(j.description ?? "").slice(0, 6000),
      source: "Remotive",
      source_url: j.url!,
      apply_url: j.url!,
      tags: (j.tags ?? []).slice(0, 8),
      is_remote: true,
      salary_range: j.salary?.trim() ? j.salary.trim() : null,
      posted_at: j.publication_date ?? null,
    }));
}

async function fetchArbeitnow(): Promise<RawJob[]> {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  if (!res.ok) return [];
  const payload = (await res.json()) as {
    data?: Array<{
      title?: string;
      company_name?: string;
      location?: string;
      description?: string;
      url?: string;
      tags?: string[];
      remote?: boolean;
      created_at?: number;
    }>;
  };
  return (payload.data ?? [])
    .filter((j) => j.title && j.company_name && j.url && j.remote)
    .slice(0, 40)
    .map((j) => ({
      title: j.title!.trim(),
      company: j.company_name!.trim(),
      location: j.location?.trim() || "Remote",
      description: stripHtml(j.description ?? "").slice(0, 6000),
      source: "Arbeitnow",
      source_url: j.url!,
      apply_url: j.url!,
      tags: (j.tags ?? []).slice(0, 8),
      is_remote: true,
      salary_range: null,
      posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
    }));
}

export async function fetchRawJobs(): Promise<RawJob[]> {
  const results = await Promise.allSettled([fetchRemotive(), fetchArbeitnow()]);
  const jobs = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const VERIFY_SYSTEM = `You are 45LITE's autonomous job verification engine for the Kenyan and remote-Africa market.
For EACH job you receive, decide if it is a legitimate, currently open, professionally posted role that a Kenyan
professional, academic or student could realistically apply to (remote-friendly roles count).

Reject when: the posting looks like a scam, MLM, crypto/"earn from home" bait, an unpaid commission-only sales gig,
a staffing spam repost with no real employer, the title or description is empty/nonsense, the role explicitly
requires onsite presence in a country Kenyans cannot apply to without relocation sponsorship, or it asks candidates
to pay any fee.

Return ONLY a JSON array, one object per job, in the SAME order:
[{"index":0,"verdict":"verified"|"rejected","reason":"one short sentence",
"company_type":"university"|"tech_company"|"tbi"|"ngo"|"startup"|"corporate"|"remote_abroad",
"job_type":"full_time"|"part_time"|"internship"|"attachment"|"contract"|"remote",
"experience_level":"entry"|"mid"|"senior",
"location":"short human location",
"requirements":["3-6 short requirement bullets"],
"tags":["3-6 lowercase skill tags"]}]
No markdown, no commentary.`;

export type Verdict = {
  index: number;
  verdict: "verified" | "rejected";
  reason: string;
  company_type: string;
  job_type: string;
  experience_level: string;
  location: string;
  requirements: string[];
  tags: string[];
};

const COMPANY_TYPES = [
  "university",
  "tech_company",
  "tbi",
  "ngo",
  "startup",
  "corporate",
  "remote_abroad",
];
const JOB_TYPES = ["full_time", "part_time", "internship", "attachment", "contract", "remote"];
const LEVELS = ["entry", "mid", "senior"];

function parseVerdicts(raw: string): Verdict[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<Verdict>[];
    return parsed.map((v, i) => ({
      index: typeof v.index === "number" ? v.index : i,
      verdict: v.verdict === "verified" ? "verified" : "rejected",
      reason: (v.reason ?? "No reason supplied").slice(0, 240),
      company_type: COMPANY_TYPES.includes(v.company_type ?? "")
        ? v.company_type!
        : "remote_abroad",
      job_type: JOB_TYPES.includes(v.job_type ?? "") ? v.job_type! : "remote",
      experience_level: LEVELS.includes(v.experience_level ?? "") ? v.experience_level! : "mid",
      location: (v.location ?? "Remote").slice(0, 80),
      requirements: (v.requirements ?? []).slice(0, 8).map((r) => String(r).slice(0, 200)),
      tags: (v.tags ?? []).slice(0, 8).map((t) => String(t).toLowerCase().slice(0, 40)),
    }));
  } catch {
    return [];
  }
}

/** Runs the autonomous AI verification pass over a batch of raw jobs. */
export async function verifyBatch(batch: RawJob[]): Promise<Verdict[]> {
  const payload = batch
    .map((j, i) =>
      [
        `--- JOB ${i} ---`,
        `Title: ${j.title}`,
        `Company: ${j.company}`,
        `Location: ${j.location}`,
        `Source: ${j.source} (${j.source_url})`,
        `Salary: ${j.salary_range ?? "not stated"}`,
        `Tags: ${j.tags.join(", ") || "none"}`,
        `Description: ${j.description.slice(0, 1800)}`,
      ].join("\n"),
    )
    .join("\n\n");

  const out = await callGateway(VERIFY_SYSTEM, payload);
  const verdicts = parseVerdicts(out);
  return batch.map((_, i) => {
    const found = verdicts.find((v) => v.index === i) ?? verdicts[i];
    return (
      found ?? {
        index: i,
        verdict: "rejected" as const,
        reason: "Verification engine returned no verdict for this listing.",
        company_type: "remote_abroad",
        job_type: "remote",
        experience_level: "mid",
        location: batch[i]!.location,
        requirements: [],
        tags: batch[i]!.tags,
      }
    );
  });
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
