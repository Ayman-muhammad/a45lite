ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS verification_notes text;
CREATE UNIQUE INDEX IF NOT EXISTS jobs_dedupe_idx ON public.jobs (lower(title), lower(company), coalesce(source_url, ''));