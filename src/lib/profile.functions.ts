import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SUGGEST_SYSTEM = `You are a senior Kenyan career analyst. From a candidate's CV text and existing profile, extract a structured career profile.
Respond in strict JSON only, no markdown fences, with this shape:
{"headline":"<short professional headline, max 70 chars>","summary":"<2-3 sentence professional summary>","skills":["8-16 concrete skills"],"experience_years":<integer>,"education_level":"<one of: certificate, diploma, bachelors, masters, phd, other>","salary_expectation":"<realistic KES monthly range for the Kenyan market, e.g. 'KES 120,000 - 180,000'>","target_roles":["3-6 job titles this candidate should target"]}
Only use evidence from the CV. If the CV is empty, infer conservatively from the profile fields.`;

export const suggestProfileFromResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { callGateway } = await import("@/lib/ai.server");

    const [{ data: profile }, { data: resume }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase
        .from("resumes")
        .select("parsed_text, skills_extracted, file_name")
        .eq("user_id", context.userId)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const cvText = (resume?.parsed_text ?? "").trim();
    if (!cvText && !(profile?.skills ?? []).length) {
      return { ok: false as const, error: "NO_RESUME" };
    }

    const prompt = [
      `Existing profile: name=${profile?.full_name ?? "unknown"}, location=${profile?.location ?? "Kenya"}, years=${profile?.experience_years ?? 0}, education=${profile?.education_level ?? "unknown"}, skills=${(profile?.skills ?? []).join(", ") || "none"}`,
      `Detected CV keywords: ${(resume?.skills_extracted ?? []).join(", ") || "none"}`,
      `CV text:\n${cvText.slice(0, 12000) || "(no text extracted from the uploaded file)"}`,
    ].join("\n\n");

    let raw: string;
    try {
      raw = await callGateway(SUGGEST_SYSTEM, prompt);
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "AI_UNAVAILABLE",
      };
    }

    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      const arr = (v: unknown) =>
        Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 16) : [];
      return {
        ok: true as const,
        suggestion: {
          headline: typeof parsed["headline"] === "string" ? parsed["headline"] : "",
          summary: typeof parsed["summary"] === "string" ? parsed["summary"] : "",
          skills: arr(parsed["skills"]),
          experienceYears: Math.max(0, Math.min(50, Number(parsed["experience_years"]) || 0)),
          educationLevel:
            typeof parsed["education_level"] === "string" ? parsed["education_level"] : "",
          salaryExpectation:
            typeof parsed["salary_expectation"] === "string" ? parsed["salary_expectation"] : "",
          targetRoles: arr(parsed["target_roles"]),
        },
      };
    } catch {
      return { ok: false as const, error: "PARSE_FAILED" };
    }
  });
