import type { Tables } from "@/integrations/supabase/types";

export type PortfolioItem = Tables<"portfolio_items">;

export const PORTFOLIO_KINDS = ["project", "achievement", "document"] as const;
export type PortfolioKind = (typeof PORTFOLIO_KINDS)[number];

export const PORTFOLIO_KIND_LABELS: Record<PortfolioKind, string> = {
  project: "Project",
  achievement: "Achievement",
  document: "Document",
};

export function isPortfolioKind(value: string): value is PortfolioKind {
  return (PORTFOLIO_KINDS as readonly string[]).includes(value);
}

function formatRange(item: PortfolioItem) {
  const start = item.start_date?.slice(0, 7);
  const end = item.end_date?.slice(0, 7);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – present`;
  if (end) return end;
  return "";
}

/** Plain-text summary of portfolio items, used as source context for the Document Studio. */
export function portfolioToContext(items: PortfolioItem[]): string {
  if (items.length === 0) return "";
  const lines: string[] = ["PORTFOLIO"];
  for (const kind of PORTFOLIO_KINDS) {
    const group = items.filter((item) => item.kind === kind);
    if (group.length === 0) continue;
    lines.push("", `${PORTFOLIO_KIND_LABELS[kind].toUpperCase()}S`);
    for (const item of group) {
      const meta = [item.role, item.organisation, formatRange(item)].filter(Boolean).join(" · ");
      lines.push(`- ${item.title}${meta ? ` (${meta})` : ""}`);
      if (item.description) lines.push(`  ${item.description}`);
      for (const highlight of item.highlights) lines.push(`  • ${highlight}`);
      if (item.tags.length) lines.push(`  Tags: ${item.tags.join(", ")}`);
      if (item.link_url) lines.push(`  Link: ${item.link_url}`);
      if (item.file_name) lines.push(`  Attachment: ${item.file_name}`);
    }
  }
  return lines.join("\n");
}

export function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
