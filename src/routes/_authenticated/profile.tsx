import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useProfile, useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { PREFERENCE_OPTIONS } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — 45LITE" },
      {
        name: "description",
        content: "Manage your preferences, CV, notifications, privacy and career analytics on 45LITE.",
      },
      { property: "og:title", content: "Your profile — 45LITE" },
      { property: "og:description", content: "Preferences, resume, notifications and privacy controls." },
    ],
  }),
  component: ProfilePage,
});

const SKILL_DICTIONARY = [
  "python","java","javascript","typescript","react","node","sql","postgres","excel","research",
  "teaching","statistics","machine learning","data analysis","project management","communication",
  "kubernetes","aws","azure","django","laravel","php","c++","matlab","stata","monitoring","evaluation",
];

function ProfilePage() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const { data: resume } = useQuery({
    queryKey: ["resume", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("resumes")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [gens, apps] = await Promise.all([
        supabase.from("ai_generations").select("match_score, type"),
        supabase.from("job_applications").select("status"),
      ]);
      const scores = (gens.data ?? []).map((g) => g.match_score).filter((s): s is number => s !== null);
      return {
        generations: gens.data?.length ?? 0,
        applied: (apps.data ?? []).filter((a) => a.status !== "saved").length,
        tracked: apps.data?.length ?? 0,
        avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      };
    },
  });

  async function update(patch: Record<string, unknown>) {
    if (!user) return;
    await supabase.from("profiles").update(patch).eq("id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Saved");
  }

  async function uploadResume(file: File) {
    if (!user) return;
    const text = file.type === "application/pdf" ? "" : await file.text();
    const lower = text.toLowerCase();
    const found = SKILL_DICTIONARY.filter((s) => lower.includes(s));
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
    if (uploadError) {
      toast.error("Upload failed");
      return;
    }
    await supabase.from("resumes").insert({
      user_id: user.id,
      file_url: path,
      file_name: file.name,
      parsed_text: text.slice(0, 20000),
      skills_extracted: found,
    });
    queryClient.invalidateQueries({ queryKey: ["resume"] });
    toast.success("Resume uploaded");
  }

  async function deleteAllData() {
    if (!user) return;
    if (!confirm("Permanently delete your profile, resumes, saved jobs and applications?")) return;
    await Promise.all([
      supabase.from("resumes").delete().eq("user_id", user.id),
      supabase.from("saved_jobs").delete().eq("user_id", user.id),
      supabase.from("job_applications").delete().eq("user_id", user.id),
      supabase.from("ai_generations").delete().eq("user_id", user.id),
      supabase.from("notifications").delete().eq("user_id", user.id),
    ]);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    toast.success("All your data has been deleted");
    navigate({ to: "/auth" });
  }

  const prefs = profile?.job_type_preference ?? [];

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Profile & settings</h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Career analytics">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Applications sent" value={stats?.applied ?? 0} />
            <Metric label="Jobs tracked" value={stats?.tracked ?? 0} />
            <Metric label="AI generations" value={stats?.generations ?? 0} />
            <Metric label="Avg match score" value={`${stats?.avgScore ?? 0}%`} />
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${stats?.avgScore ?? 0}%` }} />
          </div>
        </Card>

        <Card title="Plan">
          <p className="text-data text-sm text-primary-light">
            {profile?.subscription_tier === "pro" ? "Pro" : "Free"} plan
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Free: 5 AI generations per day, basic filters. Pro (KES 300/month): unlimited AI,
            advanced filters and priority remote job alerts.
          </p>
          <button
            type="button"
            onClick={() => toast("Pro billing is coming soon to 45LITE.")}
            className="mt-3 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Upgrade to Pro
          </button>
        </Card>

        <Card title="Job preferences">
          <div className="flex flex-wrap gap-2">
            {PREFERENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  update({
                    job_type_preference: prefs.includes(option.value)
                      ? prefs.filter((p) => p !== option.value)
                      : [...prefs, option.value],
                  })
                }
                className={cn(
                  "min-h-11 rounded-full border border-border px-4 text-sm text-muted-foreground",
                  prefs.includes(option.value) && "border-primary bg-primary/12 text-primary-light",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <input
            defaultValue={profile?.location ?? ""}
            onBlur={(e) => update({ location: e.target.value })}
            placeholder="Location"
            className="mt-3 min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground"
          />
          <input
            defaultValue={(profile?.skills ?? []).join(", ")}
            onBlur={(e) =>
              update({ skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
            }
            placeholder="Skills, comma separated"
            className="mt-3 min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground"
          />
        </Card>

        <Card title="Resume">
          {resume ? (
            <div>
              <p className="text-sm text-foreground">{resume.file_name}</p>
              <p className="text-data mt-1 text-xs text-muted-foreground">
                Skills detected: {(resume.skills_extracted ?? []).join(", ") || "none"}
              </p>
              <button
                type="button"
                onClick={async () => {
                  await supabase.from("resumes").delete().eq("id", resume.id);
                  queryClient.invalidateQueries({ queryKey: ["resume"] });
                }}
                className="mt-3 min-h-11 rounded-xl border border-destructive/50 px-4 text-sm text-destructive"
              >
                Delete resume
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload your CV so AI match analysis and CV rewriting use your real background.
            </p>
          )}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadResume(file);
            }}
            className="mt-3 block w-full text-sm text-muted-foreground file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:text-sm file:font-semibold file:text-primary-foreground"
          />
        </Card>

        <Card title="Notifications">
          <Toggle
            label="New verified jobs matching my profile"
            checked={profile?.notify_new_jobs ?? true}
            onChange={(v) => update({ notify_new_jobs: v })}
          />
          <Toggle
            label="Deadline reminders for saved jobs"
            checked={profile?.notify_deadlines ?? true}
            onChange={(v) => update({ notify_deadlines: v })}
          />
        </Card>

        <Card title="Appearance">
          <Toggle
            label="Light mode"
            checked={light}
            onChange={(v) => {
              setLight(v);
              document.documentElement.classList.toggle("light", v);
            }}
          />
        </Card>

        <Card title="Data privacy">
          <p className="text-sm text-muted-foreground">
            Your resume is parsed for you alone and stored in your private account space. We do not
            share your data with employers. You can delete all your data permanently at any time.
          </p>
          <button
            type="button"
            onClick={deleteAllData}
            className="mt-3 min-h-11 rounded-xl border border-destructive/60 px-4 text-sm font-semibold text-destructive"
          >
            Delete all my data
          </button>
        </Card>
      </div>
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-data text-xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 text-left text-sm text-foreground"
    >
      {label}
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-background transition-all",
            checked ? "left-6" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
