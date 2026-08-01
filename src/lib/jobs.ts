import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Job = Tables<"jobs">;
export type SavedJob = Tables<"saved_jobs">;
export type Application = Tables<"job_applications">;

export const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "attachment", label: "Attachment" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
] as const;

export const COMPANY_TYPES = [
  { value: "university", label: "University" },
  { value: "tech_company", label: "Tech Company" },
  { value: "tbi", label: "Turkana Basin Institute" },
  { value: "ngo", label: "NGO / Development" },
  { value: "remote_abroad", label: "Remote / Abroad" },
  { value: "startup", label: "Startup" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
] as const;

export const LOCATIONS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Turkana", "Remote", "Abroad"];

export const APPLICATION_STATUSES = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
] as const;

export const PREFERENCE_OPTIONS = [
  { value: "lecturing", label: "Lecturing" },
  { value: "corporate_it", label: "Corporate IT" },
  { value: "internship", label: "Internship" },
  { value: "attachment", label: "Attachment" },
  { value: "remote", label: "Remote" },
] as const;

export const FEED_FILTERS = [
  { key: "all", label: "All" },
  { key: "lecturing", label: "Lecturing" },
  { key: "corporate_it", label: "Corporate IT" },
  { key: "internship", label: "Internship" },
  { key: "attachment", label: "Attachment" },
  { key: "remote", label: "Remote" },
  { key: "tbi", label: "TBI" },
] as const;

export function jobTypeLabel(value: string) {
  return JOB_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function companyTypeLabel(value: string) {
  return COMPANY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function jobTypeTone(value: string) {
  switch (value) {
    case "remote":
      return "border-info/40 bg-info/12 text-info";
    case "internship":
      return "border-success/40 bg-success/12 text-success";
    case "attachment":
      return "border-violet/40 bg-violet/12 text-violet";
    default:
      return "border-primary/40 bg-primary/12 text-primary-light";
  }
}

export function daysUntil(deadline: string | null) {
  if (!deadline) return null;
  const ms = new Date(deadline + "T23:59:59Z").getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function deadlineLabel(deadline: string | null) {
  const d = daysUntil(deadline);
  if (d === null) return "Open until filled";
  if (d < 0) return "Closed";
  if (d === 0) return "Closes today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

export function postedLabel(created: string) {
  const days = Math.floor((Date.now() - new Date(created).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days}d ago`;
}

export type JobFilters = {
  q?: string;
  jobType?: string;
  companyType?: string;
  location?: string;
  experience?: string;
  feed?: string;
};

function applyFeedFilter(
  query: ReturnType<typeof baseQuery>,
  feed: string | undefined,
): ReturnType<typeof baseQuery> {
  switch (feed) {
    case "lecturing":
      return query.eq("company_type", "university");
    case "corporate_it":
      return query.in("company_type", ["tech_company", "startup"]);
    case "internship":
      return query.eq("job_type", "internship");
    case "attachment":
      return query.eq("job_type", "attachment");
    case "remote":
      return query.eq("job_type", "remote");
    case "tbi":
      return query.eq("company_type", "tbi");
    default:
      return query;
  }
}

function baseQuery() {
  return supabase
    .from("jobs")
    .select("*")
    .eq("verification_status", "verified")
    .eq("is_active", true);
}

export async function fetchJobs(filters: JobFilters = {}) {
  let query = baseQuery();
  query = applyFeedFilter(query, filters.feed);
  if (filters.jobType) query = query.eq("job_type", filters.jobType);
  if (filters.companyType) query = query.eq("company_type", filters.companyType);
  if (filters.experience) query = query.eq("experience_level", filters.experience);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.q) {
    const term = filters.q.replace(/[%,]/g, " ");
    query = query.or(
      `title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`,
    );
  }
  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function fetchJob(id: string) {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
