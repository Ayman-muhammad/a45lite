import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PinInput = z.object({ pin: z.string().min(1) });
const ReviewInput = z.object({
  pin: z.string().min(1),
  jobId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
});

export const listPendingJobs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PinInput.parse(input))
  .handler(async ({ data }) => {
    if (data.pin !== process.env["ADMIN_PIN"]) return { ok: false as const, jobs: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: jobs } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .neq("verification_status", "verified")
      .order("created_at", { ascending: false });
    return { ok: true as const, jobs: jobs ?? [] };
  });

export const reviewJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data }) => {
    if (data.pin !== process.env["ADMIN_PIN"]) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("jobs")
      .update({
        verification_status: data.decision,
        verified_by: "45LITE Admin",
        verified_at: new Date().toISOString(),
      })
      .eq("id", data.jobId);
    return { ok: true as const };
  });
