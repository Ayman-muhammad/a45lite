import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GenerateInput = z.object({
  jobId: z.string().uuid(),
  type: z.enum(["match_analysis", "cv_rewrite", "cover_letter"]),
  cvStyle: z.enum(["corporate", "academic"]).optional(),
});

export const getAiQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await context.supabase
      .from("user_daily_usage")
      .select("ai_generations")
      .eq("user_id", context.userId)
      .eq("usage_date", today)
      .maybeSingle();
    const { AI_DAILY_LIMIT } = await import("@/lib/ai-prompts");
    const used = data?.ai_generations ?? 0;
    return { used, limit: AI_DAILY_LIMIT, remaining: Math.max(0, AI_DAILY_LIMIT - used) };
  });

export const generateForJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { callGateway, parseMatchJson } = await import("@/lib/ai.server");
    const { AI_DAILY_LIMIT, CV_SYSTEM_PROMPT, COVER_SYSTEM_PROMPT, MATCH_SYSTEM_PROMPT } =
      await import("@/lib/ai-prompts");

    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await context.supabase
      .from("user_daily_usage")
      .select("id, ai_generations")
      .eq("user_id", context.userId)
      .eq("usage_date", today)
      .maybeSingle();

    const used = usage?.ai_generations ?? 0;
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();

    const isPro = profile?.subscription_tier === "pro";
    if (!isPro && used >= AI_DAILY_LIMIT) {
      return { ok: false as const, error: "QUOTA", remaining: 0 };
    }

    const { data: job } = await context.supabase
      .from("jobs")
      .select("*")
      .eq("id", data.jobId)
      .maybeSingle();
    if (!job) return { ok: false as const, error: "NOT_FOUND", remaining: AI_DAILY_LIMIT - used };

    const { data: resume } = await context.supabase
      .from("resumes")
      .select("parsed_text, skills_extracted")
      .eq("user_id", context.userId)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const candidate = [
      `Name: ${profile?.full_name ?? "Candidate"}`,
      `Location: ${profile?.location ?? "Kenya"}`,
      `Experience: ${profile?.experience_years ?? 0} years`,
      `Education: ${profile?.education_level ?? "Not specified"}`,
      `Skills: ${(profile?.skills ?? []).join(", ") || "Not specified"}`,
      resume?.parsed_text ? `CV text:\n${resume.parsed_text.slice(0, 8000)}` : "CV text: none uploaded",
    ].join("\n");

    const jobText = [
      `Title: ${job.title}`,
      `Company: ${job.company} (${job.company_type})`,
      `Location: ${job.location}`,
      `Type: ${job.job_type}`,
      `Salary: ${job.salary_range ?? "Not disclosed"}`,
      `Description: ${job.description}`,
      `Requirements: ${(job.requirements ?? []).join("; ")}`,
    ].join("\n");

    const system =
      data.type === "match_analysis"
        ? MATCH_SYSTEM_PROMPT
        : data.type === "cv_rewrite"
          ? `${CV_SYSTEM_PROMPT}\nTarget format: ${data.cvStyle ?? "corporate"}.`
          : COVER_SYSTEM_PROMPT;

    const prompt = `CANDIDATE PROFILE\n${candidate}\n\nJOB POSTING\n${jobText}`;

    let output: string;
    try {
      output = await callGateway(system, prompt);
    } catch (error) {
      const code = error instanceof Error ? error.message : "AI_UNAVAILABLE";
      return { ok: false as const, error: code, remaining: AI_DAILY_LIMIT - used };
    }

    const match = data.type === "match_analysis" ? parseMatchJson(output) : null;

    if (usage?.id) {
      await context.supabase
        .from("user_daily_usage")
        .update({ ai_generations: used + 1 })
        .eq("id", usage.id);
    } else {
      await context.supabase
        .from("user_daily_usage")
        .insert({ user_id: context.userId, usage_date: today, ai_generations: 1 });
    }

    await context.supabase.from("ai_generations").insert({
      user_id: context.userId,
      job_id: job.id,
      type: data.type,
      input_prompt: prompt.slice(0, 4000),
      output_content: output,
      match_score: match?.score ?? null,
    });

    return {
      ok: true as const,
      type: data.type,
      content: output,
      match,
      remaining: Math.max(0, AI_DAILY_LIMIT - used - 1),
    };
  });
