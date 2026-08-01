import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — 45LITE" },
      {
        name: "description",
        content: "Sign in or create your free 45LITE account to save verified jobs and optimize your CV.",
      },
      { property: "og:title", content: "Sign in — 45LITE" },
      { property: "og:description", content: "Access verified Kenyan job listings and AI career tools." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to confirm your account");
          return;
        }
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="animate-rise mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
          <h1 className="text-xl font-bold text-foreground">
            {mode === "signin" ? "Sign in to 45LITE" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified jobs for Kenyan professionals and academics.
          </p>

          {sent ? (
            <p className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary-light">
              We sent a confirmation link to {email}. Confirm it, then sign in.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "signup" && (
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={busy}
                className="min-h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-glow disabled:opacity-60"
              >
                {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={google}
            className="min-h-12 w-full rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/50"
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "signin"
              ? "New here? Create a free account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
