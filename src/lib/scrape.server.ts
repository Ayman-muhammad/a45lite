import { callGateway } from "@/lib/ai.server";
import { canFetch, USER_AGENT } from "@/lib/robots.server";
import type { JobSource } from "@/lib/sources";
import type { RawJob } from "@/lib/sync.server";

export type SourceReport = {
  id: string;
  name: string;
  url: string;
  category: JobSource["category"];
  status: "ok" | "empty" | "unreachable" | "blocked" | "disallowed";
  found: number;
};

const FETCH_TIMEOUT_MS = 12_000;
const MAX_TEXT_CHARS = 14_000;
const MAX_JOBS_PER_SOURCE = 8;

/**
 * Careers pages are usually 90% site chrome. Narrow the HTML to the main
 * content region first so the extraction budget is spent on real vacancies
 * instead of the mega-menu.
 */
function mainContent(html: string) {
  const stripped = html
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ");

  const candidates = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]+(?:id|class)=["'][^"']*(?:content|entry|post|vacanc|career|job)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const re of candidates) {
    const match = stripped.match(re);
    if (match && match[1] && match[1].length > 600) return match[1];
  }
  return stripped;
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Absolute links found on the page, used to give the extractor real apply URLs. */
function extractLinks(html: string, base: string): string[] {
  const links: string[] = [];
  const re = /href\s*=\s*["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null && links.length < 120) {
    const href = match[1]!;
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    try {
      links.push(new URL(href, base).toString());
    } catch {
      /* ignore malformed hrefs */
    }
  }
  return Array.from(new Set(links));
}

type Page = { html: string; status: number };

async function fetchPage(url: string): Promise<Page | "disallowed" | null> {
  // Robots + crawl-delay check before EVERY outbound request.
  const decision = await canFetch(url);
  if (!decision.allowed) return "disallowed";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });
    const html = await res.text();
    return { html, status: res.status };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}


const EXTRACT_SYSTEM = `You extract job vacancies from the raw text of an official careers page.
Return ONLY a JSON array (no markdown) of the vacancies that are clearly advertised on this page.

Each object:
{"title":"exact job title","description":"2-5 sentence summary of the role and its requirements drawn only from the page text",
"location":"place if stated, else empty string","deadline":"YYYY-MM-DD if an application deadline is stated, else null",
"apply_url":"the most specific URL from the provided link list that leads to this vacancy, else empty string",
"tags":["3-6 lowercase skill or discipline tags"]}

Rules:
- Only include real, currently advertised vacancies. Navigation labels, page headings, news items, course names,
  student notices and "no vacancies at the moment" text are NOT vacancies.
- Never invent a vacancy. If the page advertises none, return [].
- Maximum 8 vacancies, the most recent first.`;

type Extracted = {
  title?: string;
  description?: string;
  location?: string;
  deadline?: string | null;
  apply_url?: string;
  tags?: string[];
};

function parseExtracted(raw: string): Extracted[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
    return Array.isArray(parsed) ? (parsed as Extracted[]) : [];
  } catch {
    return [];
  }
}

const CAREER_LINK = /career|vacanc|job|opportunit|recruit|employment|hiring/i;

/**
 * Careers pages get moved and renamed constantly. When the configured URL is
 * dead, fall back to the site root and follow the first careers-looking link.
 */
async function resolvePage(source: JobSource) {
  const direct = await fetchPage(source.url);
  if (direct && direct.status < 400) return { page: direct, url: source.url };

  let origin: string;
  try {
    origin = new URL(source.url).origin;
  } catch {
    return { page: direct, url: source.url };
  }

  const home = await fetchPage(origin);
  if (!home || home.status >= 400) return { page: direct, url: source.url };

  const candidate = extractLinks(home.html, origin).find(
    (l) => CAREER_LINK.test(l) && l.startsWith(origin),
  );
  if (!candidate) return { page: home, url: origin };

  const followed = await fetchPage(candidate);
  if (followed && followed.status < 400) return { page: followed, url: candidate };
  return { page: home, url: origin };
}

/** Scrapes one official careers page and returns normalised raw jobs. */
export async function scrapeSource(
  source: JobSource,
): Promise<{ jobs: RawJob[]; report: SourceReport }> {
  const base: SourceReport = {
    id: source.id,
    name: source.name,
    url: source.url,
    category: source.category,
    status: "ok",
    found: 0,
  };

  const { page, url: pageUrl } = await resolvePage(source);
  if (!page) return { jobs: [], report: { ...base, status: "unreachable" } };
  if (page.status === 403 || page.status === 401 || page.status === 429) {
    return { jobs: [], report: { ...base, status: "blocked" } };
  }
  if (page.status >= 400) return { jobs: [], report: { ...base, status: "unreachable" } };
  base.url = pageUrl;

  const text = htmlToText(page.html).slice(0, MAX_TEXT_CHARS);
  if (text.length < 400) return { jobs: [], report: { ...base, status: "empty" } };

  const links = extractLinks(page.html, pageUrl).slice(0, 60);
  const prompt = [

    `Employer: ${source.name}`,
    `Careers page: ${pageUrl}`,
    `Default location: ${source.location}`,
    "",
    "LINKS ON PAGE:",
    links.join("\n"),
    "",
    "PAGE TEXT:",
    text,
  ].join("\n");

  let output: string;
  try {
    output = await callGateway(EXTRACT_SYSTEM, prompt);
  } catch {
    return { jobs: [], report: { ...base, status: "unreachable" } };
  }

  const jobs = parseExtracted(output)
    .filter((j) => typeof j.title === "string" && j.title.trim().length > 3)
    .slice(0, MAX_JOBS_PER_SOURCE)
    .map<RawJob>((j) => ({
      title: j.title!.trim().slice(0, 200),
      company: source.name,
      location: (j.location?.trim() || source.location).slice(0, 80),
      description: (j.description ?? "").slice(0, 6000),
      source: source.name,
      source_url: pageUrl,
      apply_url: j.apply_url?.startsWith("http") ? j.apply_url : pageUrl,
      tags: (j.tags ?? []).slice(0, 6).map((t) => String(t).toLowerCase().slice(0, 40)),
      is_remote: /remote/i.test(j.location ?? ""),
      salary_range: null,
      posted_at: null,
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(j.deadline ?? "") ? j.deadline! : null,
      company_type_hint: source.companyType,
    }));

  return {
    jobs,
    report: { ...base, status: jobs.length ? "ok" : "empty", found: jobs.length },
  };
}

/** Scrapes many sources with bounded concurrency so a request stays responsive. */
export async function scrapeSources(
  sources: JobSource[],
  concurrency = 6,
): Promise<{ jobs: RawJob[]; reports: SourceReport[] }> {
  const queue = [...sources];
  const jobs: RawJob[] = [];
  const reports: SourceReport[] = [];

  async function worker() {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      const result = await scrapeSource(next);
      jobs.push(...result.jobs);
      reports.push(result.report);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, worker));
  return { jobs, reports };
}
