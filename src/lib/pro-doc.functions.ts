import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { DOC_TONES, DOC_TYPES, DOC_TYPE_LABELS } from "@/lib/pro-doc";

const Input = z.object({
  context: z.string().min(40).max(20000),
  docType: z.enum(DOC_TYPES),
  tone: z.enum(DOC_TONES),
  audience: z.string().max(200).default(""),
  client: z.string().max(200).default(""),
  author: z.string().max(200).default(""),
});

const SYSTEM = `You are a senior document designer and management consultant who produces board-grade documents for firms like McKinsey, Deloitte and BCG.

You receive raw context and must architect a complete, publication-ready document.

Rules:
- Return ONLY valid JSON matching the schema. No markdown fences, no commentary.
- Never invent hard numbers that are not derivable from the context. If a figure is unknown, use a qualitative statement instead.
- Write in crisp, active, executive prose. No filler, no "in today's fast-paced world".
- 4 to 7 sections. Each section has 1-3 blocks. Vary block kinds so the layout breathes: use "kpi" for metric strips, "table" for comparisons, "callout" for the single most important insight per section, "timeline" for phased plans, "bullets" for scannable lists, "prose" for argument.
- Tables: 2-4 columns, 2-6 rows, every row the same length as columns.
- KPI values are short (max 12 characters).

JSON schema:
{
  "title": string,
  "subtitle": string,
  "client": string,
  "author": string,
  "documentCode": string,           // e.g. "STRAT-2026-01"
  "executiveSummary": string,       // 60-120 words
  "keyTakeaways": string[],         // 3-5 items, one line each
  "sections": [
    {
      "heading": string,
      "summary": string,            // one-sentence deck-style takeaway
      "blocks": [
        {
          "kind": "prose" | "bullets" | "table" | "kpi" | "callout" | "timeline",
          "text": string,           // prose text, callout body, or "" 
          "bullets": string[],      // bullets or timeline steps ("Phase 1 — ...")
          "columns": string[],
          "rows": string[][],
          "kpis": [{ "label": string, "value": string, "note": string }],
          "calloutTitle": string
        }
      ]
    }
  ],
  "conclusion": string,
  "nextSteps": string[],            // 3-5 concrete actions
  "footerNote": string              // short confidentiality / source line
}`;

export const generateProDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { callGateway } = await import("@/lib/ai.server");
    const { safeParseDocument } = await import("@/lib/pro-doc");

    const prompt = [
      `DOCUMENT TYPE: ${DOC_TYPE_LABELS[data.docType]}`,
      `TONE: ${data.tone}`,
      data.audience ? `AUDIENCE: ${data.audience}` : "",
      data.client ? `CLIENT / ORGANISATION: ${data.client}` : "",
      data.author ? `AUTHOR: ${data.author}` : "",
      "",
      "RAW CONTEXT:",
      data.context,
    ]
      .filter(Boolean)
      .join("\n");

    let raw: string;
    try {
      raw = await callGateway(SYSTEM, prompt);
    } catch (error) {
      const code = error instanceof Error ? error.message : "AI_UNAVAILABLE";
      return { ok: false as const, error: code };
    }

    const doc = safeParseDocument(raw);
    if (!doc) return { ok: false as const, error: "PARSE_FAILED" };

    if (data.client) doc.client = data.client;
    if (data.author) doc.author = data.author;

    await context.supabase.from("ai_generations").insert({
      user_id: context.userId,
      type: "pdf_document",
      input_prompt: prompt.slice(0, 4000),
      output_content: JSON.stringify(doc).slice(0, 20000),
    });

    return { ok: true as const, document: doc };
  });
