const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

export async function callGateway(system: string, user: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (response.status === 429) throw new Error("RATE_LIMIT");
  if (response.status === 402) throw new Error("NO_CREDITS");
  if (!response.ok) throw new Error("AI_UNAVAILABLE");

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI_UNAVAILABLE");
  return content;
}

export function parseMatchJson(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as {
      score?: number;
      summary?: string;
      strengths?: string[];
      gaps?: string[];
      keywords?: string[];
    };
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score ?? 0))),
      summary: parsed.summary ?? "",
      strengths: parsed.strengths ?? [],
      gaps: parsed.gaps ?? [],
      keywords: parsed.keywords ?? [],
    };
  } catch {
    return { score: 0, summary: raw.slice(0, 300), strengths: [], gaps: [], keywords: [] };
  }
}
