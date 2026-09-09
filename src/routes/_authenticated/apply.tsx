import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { fetchJob, fetchJobs, APPLICATION_STATUSES } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/apply")({
  validateSearch: (search: Record<string, unknown>) => ({
    job: typeof search["job"] === "string" ? search["job"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Apply to a job — Ayglobe Lite" },
      {
        name: "description",
        content:
          "Attach your resume, write a tailored cover letter and keep interview notes for every verified job you apply to.",
      },
      { property: "og:title", content: "Apply to a job — Ayglobe Lite" },
      {
        property: "og:description",
        content: "Submit your resume, cover letter and interview notes for each verified job.",
      },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const { job: jobIdParam } = Route.useSearch();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [jobId, setJobId] = useState<string | undefined>(jobIdParam);
  const [resumeId, setResumeId] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [status, setStatus] = useState<string>("applied");
  const [uploading, setUploading] = useState(false);

  useEffect(() => setJobId(jobIdParam), [jobIdParam]);

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs", "apply"], queryFn: () => fetchJobs({}) });
  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    enabled: !!jobId,
    queryFn: () => fetchJob(jobId!),
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["application", user?.id, jobId],
    enabled: !!user && !!jobId,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId!)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    setCoverLetter(existing.custom_cover_letter ?? "");
    setInterviewNotes(existing.interview_notes ?? "");
    setStatus(existing.status ?? "applied");
    setResumeId(existing.resume_id ?? "");
  }, [existing]);

  useEffect(() => {
    if (!resumeId && resumes[0]) setResumeId(resumes[0].id);
  }, [resumes, resumeId]);

  async function uploadResume(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const text = file.type === "application/pdf" ? "" : await file.text();
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
      if (uploadError) throw uploadError;
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_url: path,
          file_name: file.name,
          parsed_text: text.slice(0, 20000),
        })
        .select("id")
        .single();
      if (error) throw error;
      setResumeId(data.id);
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resume"] });
      toast.success("Resume uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!user || !jobId) throw new Error("NO_JOB");
      const payload = {
        user_id: user.id,
        job_id: jobId,
        status,
        resume_id: resumeId || null,
        custom_cover_letter: coverLetter || null,
        interview_notes: interviewNotes || null,
        applied_at: status === "saved" ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase
          .from("job_applications")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_applications").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
      toast.success("Application saved to your tracker");
      navigate({ to: "/applications" });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message === "NO_JOB"
          ? "Pick a job first"
          : "Could not save your application",
      ),
  });

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Apply to a job</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Attach the CV you want to send, write your cover letter and keep interview notes in one
        place. Everything lands in your tracker.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Job">
          <select
            value={jobId ?? ""}
            onChange={(e) => setJobId(e.target.value || undefined)}
            className="min-h-12 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">Select a verified job…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} — {j.company}
              </option>
            ))}
          </select>
          {job && (
            <div className="mt-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold text-foreground">{job.title}</p>
              <p className="text-xs text-muted-foreground">
                {job.company} · {job.location}
              </p>
              <Link
                to="/job/$id"
                params={{ id: job.id }}
                className="mt-2 inline-block text-xs font-semibold text-primary-light"
              >
                View full job details
              </Link>
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Stage
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {APPLICATION_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "min-h-10 rounded-full border border-border px-3 text-xs text-muted-foreground",
                    status === s.value && "border-primary bg-primary/12 text-primary-light",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Resume">
          {resumes.length > 0 ? (
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.file_name ?? "Resume"}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No CV on file yet — upload one to attach it to this application.
            </p>
          )}
          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-primary/40 px-4 text-sm font-semibold text-primary-light">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload a CV"}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadResume(file);
              }}
            />
          </label>
        </Card>

        <Card title="Cover letter">
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={10}
            placeholder="Dear Hiring Manager, …"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground"
          />
        </Card>

        <Card title="Interview notes">
          <textarea
            value={interviewNotes}
            onChange={(e) => setInterviewNotes(e.target.value)}
            rows={10}
            placeholder="Questions asked, panel names, follow-up dates…"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground"
          />
        </Card>
      </div>

      <button
        type="button"
        onClick={() => submit.mutate()}
        disabled={submit.isPending || !jobId}
        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {existing ? "Update application" : "Submit application"}
      </button>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-light">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
