ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS salary_expectation text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS summary text;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interview_notes text;