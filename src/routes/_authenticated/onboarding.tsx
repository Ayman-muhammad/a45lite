import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { PREFERENCE_OPTIONS } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — Ayglobe Lite" },
      { name: "description", content: "Tell Ayglobe Lite what roles you want so your feed matches your career." },
      { property: "og:title", content: "Set up your profile — Ayglobe Lite" },
      { property: "og:description", content: "Personalize your verified job feed in under a minute." },
    ],
  }),
  component: Onboarding,
});

const EDUCATION = ["Certificate", "Diploma", "Bachelors", "Masters", "PhD"];

function Onboarding() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("Nairobi");
  const [prefs, setPrefs] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [years, setYears] = useState(2);
  const [education, setEducation] = useState("Bachelors");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        location,
        job_type_preference: prefs,
        skills,
        experience_years: years,
        education_level: education,
        onboarded: true,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error("Could not save your profile");
      return;
    }
    toast.success("Profile ready — your feed is personalized");
    navigate({ to: "/" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Set up your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This drives your matches, deadline alerts and AI suggestions.
        </p>

        <div className="mt-6 space-y-6 rounded-3xl border border-border bg-card p-6">
          <Field label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground"
            />
          </Field>

          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground"
            />
          </Field>

          <Field label="What are you looking for?">
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setPrefs((prev) =>
                      prev.includes(option.value)
                        ? prev.filter((p) => p !== option.value)
                        : [...prev, option.value],
                    )
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
          </Field>

          <Field label="Skills">
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (skillInput.trim()) setSkills([...skills, skillInput.trim()]);
                    setSkillInput("");
                  }
                }}
                placeholder="Type a skill and press Enter"
                className="min-h-12 flex-1 rounded-xl border border-input bg-background px-4 text-sm text-foreground"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setSkills(skills.filter((s) => s !== skill))}
                  className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary-light"
                >
                  {skill} ×
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Years of experience: ${years}`}>
            <input
              type="range"
              min={0}
              max={30}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Field>

          <Field label="Highest education">
            <div className="flex flex-wrap gap-2">
              {EDUCATION.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEducation(level)}
                  className={cn(
                    "min-h-11 rounded-full border border-border px-4 text-sm text-muted-foreground",
                    education === level && "border-primary bg-primary/12 text-primary-light",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </Field>

          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:shadow-glow disabled:opacity-60"
          >
            {busy ? "Saving…" : "Finish setup"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-data mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
