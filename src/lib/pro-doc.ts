import { z } from "zod";

export const DOC_TYPES = [
  "report",
  "proposal",
  "whitepaper",
  "case_study",
  "brief",
  "sop",
  "one_pager",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  report: "Business Report",
  proposal: "Client Proposal",
  whitepaper: "Whitepaper",
  case_study: "Case Study",
  brief: "Strategy Brief",
  sop: "Standard Operating Procedure",
  one_pager: "Executive One-Pager",
};

export const DOC_TONES = ["executive", "technical", "persuasive", "academic"] as const;
export type DocTone = (typeof DOC_TONES)[number];

export const DOC_THEMES = ["executive", "midnight", "editorial"] as const;
export type DocTheme = (typeof DOC_THEMES)[number];

export const DOC_THEME_LABELS: Record<DocTheme, string> = {
  executive: "Executive Orange",
  midnight: "Midnight Slate",
  editorial: "Editorial Serif",
};

const BlockSchema = z.object({
  kind: z.enum(["prose", "bullets", "table", "kpi", "callout", "timeline"]),
  text: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  columns: z.array(z.string()).default([]),
  rows: z.array(z.array(z.string())).default([]),
  kpis: z
    .array(
      z.object({
        label: z.string().default(""),
        value: z.string().default(""),
        note: z.string().default(""),
      }),
    )
    .default([]),
  calloutTitle: z.string().default(""),
});

export const ProDocumentSchema = z.object({
  title: z.string().default("Untitled Document"),
  subtitle: z.string().default(""),
  client: z.string().default(""),
  author: z.string().default(""),
  documentCode: z.string().default(""),
  executiveSummary: z.string().default(""),
  keyTakeaways: z.array(z.string()).default([]),
  sections: z
    .array(
      z.object({
        heading: z.string().default(""),
        summary: z.string().default(""),
        blocks: z.array(BlockSchema).default([]),
      }),
    )
    .default([]),
  conclusion: z.string().default(""),
  nextSteps: z.array(z.string()).default([]),
  footerNote: z.string().default(""),
});

export type ProDocument = z.infer<typeof ProDocumentSchema>;
export type ProBlock = z.infer<typeof BlockSchema>;

export function safeParseDocument(raw: string): ProDocument | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = ProDocumentSchema.safeParse(JSON.parse(cleaned.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
