import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SourceScope } from "@/lib/sources";

export type SyncResult =
  | {
      ok: false;
      error: string;
      found: number;
      verified: number;
      rejected: number;
      notified: number;
      sources: SyncSourceReport[];
    }
  | {
      ok: true;
      found: number;
      verified: number;
      rejected: number;
      notified: number;
      sources: SyncSourceReport[];
    };


export type SyncSourceReport = {
  id: string;
  name: string;
  url: string;
  category: string;
  status: string;
  found: number;
};

export const syncJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { scope?: SourceScope } | undefined) => ({
    scope: (input?.scope ?? "all") as SourceScope,
  }))
  .handler(async ({ data }): Promise<SyncResult> => {
    const { fetchRawJobs, verifyBatch, chunk } = await import("@/lib/sync.server");
    const { scrapeSources } = await import("@/lib/scrape.server");
    const { sourcesForScope } = await import("@/lib/sources");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const scope = data.scope;
    const pageSources = sourcesForScope(scope).filter((s) => s.category !== "api");
    const useApis = scope === "all" || scope === "api";

    const [scrape, apiJobs] = await Promise.all([
      pageSources.length ? scrapeSources(pageSources) : Promise.resolve({ jobs: [], reports: [] }),
      useApis ? fetchRawJobs() : Promise.resolve([]),
    ]);

    const apiReports: SyncSourceReport[] = useApis
      ? [
          {
            id: "aggregators",
            name: "Remote job feeds (Remotive + Arbeitnow)",
            url: "https://remotive.com",
            category: "api",
            status: apiJobs.length ? "ok" : "empty",
            found: apiJobs.length,
          },
        ]
      : [];

    const sources: SyncSourceReport[] = [...scrape.reports, ...apiReports].sort(
      (a, b) => b.found - a.found,
    );

    let raw = [...scrape.jobs, ...apiJobs];
    if (raw.length === 0) {
      return {
        ok: false,
        error: "SOURCES_UNAVAILABLE",
        found: 0,
        verified: 0,
        rejected: 0,
        sources,
      };
    }

    // Skip listings we already hold (same title + company).
    const { data: existing } = await supabaseAdmin.from("jobs").select("title, company");
    const known = new Set(
      (existing ?? []).map((j) => `${j.title.toLowerCase()}|${j.company.toLowerCase()}`),
    );
    raw = raw.filter((j) => !known.has(`${j.title.toLowerCase()}|${j.company.toLowerCase()}`));
    if (raw.length === 0) {
      return { ok: true, found: 0, verified: 0, rejected: 0, sources };
    }

    raw = raw.slice(0, 60);
    const now = new Date().toISOString();
    let verified = 0;
    let rejected = 0;

    for (const batch of chunk(raw, 8)) {
      let verdicts;
      try {
        verdicts = await verifyBatch(batch);
      } catch (error) {
        const code = error instanceof Error ? error.message : "AI_UNAVAILABLE";
        if (verified === 0 && rejected === 0) {
          return { ok: false, error: code, found: raw.length, verified, rejected, sources };
        }
        break;
      }

      const rows = batch.map((job, i) => {
        const v = verdicts[i]!;
        if (v.verdict === "verified") verified += 1;
        else rejected += 1;
        return {
          title: job.title,
          company: job.company,
          company_type: job.company_type_hint ?? v.company_type,
          location: v.location || job.location,
          job_type: v.job_type,
          experience_level: v.experience_level,
          description: job.description,
          requirements: v.requirements,
          salary_range: job.salary_range,
          deadline: job.deadline ?? null,
          apply_url: job.apply_url,
          source: job.source,
          source_url: job.source_url,
          tags: v.tags.length ? v.tags : job.tags,
          verification_status: v.verdict,
          verification_notes: v.reason,
          verified_by: "45LITE AI Verifier",
          verified_at: now,
          is_active: v.verdict === "verified",
          created_at: job.posted_at ?? now,
        };
      });

      const { error } = await supabaseAdmin.from("jobs").insert(rows);
      if (error) {
        // A duplicate in the batch aborts the whole insert — retry row by row.
        for (const row of rows) {
          await supabaseAdmin.from("jobs").insert(row);
        }
      }
    }

    return { ok: true, found: raw.length, verified, rejected, sources };
  });
