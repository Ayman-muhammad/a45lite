/**
 * Minimal robots.txt client used by the scraper.
 *
 * Every outbound page fetch is gated through `canFetch()`, which downloads and
 * caches the origin's robots.txt, matches the most specific rule for our
 * user-agent and honours any `Crawl-delay` by serialising requests per host.
 */

export const USER_AGENT_TOKEN = "45lite-jobsync";
export const USER_AGENT =
  "Mozilla/5.0 (compatible; Ayglobe Lite-JobSync/1.0; +https://a45lite.lovable.app)";

const ROBOTS_TIMEOUT_MS = 6_000;
const DEFAULT_DELAY_MS = 400;
const MAX_DELAY_MS = 10_000;

type Rule = { path: string; allow: boolean };
type Robots = { rules: Rule[]; crawlDelayMs: number };

const cache = new Map<string, Promise<Robots>>();
const lastRequestAt = new Map<string, number>();

function parseRobots(text: string): Robots {
  const groups: Array<{ agents: string[]; rules: Rule[]; delayMs: number | null }> = [];
  let current: (typeof groups)[number] | null = null;
  let lastLineWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0]!.trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastLineWasAgent) {
        current = { agents: [], rules: [], delayMs: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
      continue;
    }
    lastLineWasAgent = false;
    if (!current) continue;

    if (field === "disallow") current.rules.push({ path: value, allow: false });
    else if (field === "allow") current.rules.push({ path: value, allow: true });
    else if (field === "crawl-delay") {
      const seconds = Number.parseFloat(value);
      if (Number.isFinite(seconds) && seconds >= 0) {
        current.delayMs = Math.min(seconds * 1000, MAX_DELAY_MS);
      }
    }
  }

  // Prefer a group naming us explicitly; otherwise fall back to the wildcard group.
  const specific = groups.filter((g) => g.agents.some((a) => USER_AGENT_TOKEN.includes(a) && a !== "*"));
  const wildcard = groups.filter((g) => g.agents.includes("*"));
  const chosen = specific.length ? specific : wildcard;

  return {
    rules: chosen.flatMap((g) => g.rules),
    crawlDelayMs: Math.max(
      DEFAULT_DELAY_MS,
      ...chosen.map((g) => g.delayMs ?? 0),
    ),
  };
}

async function loadRobots(origin: string): Promise<Robots> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROBOTS_TIMEOUT_MS);
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/plain,*/*;q=0.8" },
    });
    // 4xx means "no robots.txt" → crawling is allowed. 5xx means the site is
    // unhappy; stay conservative and skip it this run.
    if (res.status >= 500) return { rules: [{ path: "/", allow: false }], crawlDelayMs: DEFAULT_DELAY_MS };
    if (!res.ok) return { rules: [], crawlDelayMs: DEFAULT_DELAY_MS };
    const text = await res.text();
    if (text.length > 500_000) return { rules: [], crawlDelayMs: DEFAULT_DELAY_MS };
    return parseRobots(text);
  } catch {
    return { rules: [], crawlDelayMs: DEFAULT_DELAY_MS };
  } finally {
    clearTimeout(timer);
  }
}

function matches(rulePath: string, target: string) {
  if (rulePath === "") return false;
  const hasEnd = rulePath.endsWith("$");
  const pattern = hasEnd ? rulePath.slice(0, -1) : rulePath;
  const segments = pattern.split("*");

  let cursor = 0;
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]!;
    if (segment === "") continue;
    const found = i === 0 ? (target.startsWith(segment) ? 0 : -1) : target.indexOf(segment, cursor);
    if (found === -1) return false;
    cursor = found + segment.length;
  }
  if (hasEnd && !pattern.includes("*")) return target === pattern;
  return true;
}

function isAllowed(robots: Robots, pathname: string) {
  let best: { length: number; allow: boolean } | null = null;
  for (const rule of robots.rules) {
    if (!matches(rule.path, pathname)) continue;
    const length = rule.path.length;
    if (!best || length > best.length || (length === best.length && rule.allow)) {
      best = { length, allow: rule.allow };
    }
  }
  return best ? best.allow : true;
}

/** Waits out the origin's crawl-delay so we never burst a host. */
async function throttle(origin: string, delayMs: number) {
  const previous = lastRequestAt.get(origin) ?? 0;
  const wait = previous + delayMs - Date.now();
  lastRequestAt.set(origin, Math.max(Date.now(), previous + delayMs));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(wait, MAX_DELAY_MS)));
}

export type RobotsDecision = { allowed: boolean; crawlDelayMs: number };

/**
 * Returns whether the URL may be fetched. When allowed, this also waits for the
 * host's crawl-delay window before resolving, so callers can fetch immediately.
 */
export async function canFetch(url: string): Promise<RobotsDecision> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, crawlDelayMs: 0 };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { allowed: false, crawlDelayMs: 0 };
  }

  const origin = parsed.origin;
  let pending = cache.get(origin);
  if (!pending) {
    pending = loadRobots(origin);
    cache.set(origin, pending);
  }
  const robots = await pending;

  const allowed = isAllowed(robots, parsed.pathname + parsed.search);
  if (allowed) await throttle(origin, robots.crawlDelayMs);
  return { allowed, crawlDelayMs: robots.crawlDelayMs };
}
