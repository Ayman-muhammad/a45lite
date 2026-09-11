import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Home,
  Search,
  Heart,
  User,
  KanbanSquare,
  LogOut,
  WifiOff,
  FileText,
  Files,
  BarChart3,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/plan", label: "Plan", icon: FileText },
  { to: "/documents", label: "Docs", icon: Files },
  { to: "/chartboard", label: "Charts", icon: BarChart3 },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/applications", label: "Tracker", icon: KanbanSquare },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function NotificationBell() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
  const unread = data.filter((n) => !n.is_read).length;

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications, ${unread} unread`}
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="text-data absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-border bg-popover p-2 shadow-glow">
          {data.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
          )}
          {data.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={async () => {
                await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
              }}
              className={cn(
                "block w-full rounded-xl p-3 text-left hover:bg-accent",
                !n.is_read && "bg-primary/8",
              )}
            >
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const online = useOnline();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 md:px-8 md:py-3">
          <Link to="/" aria-label="Ayglobe Lite home" className="min-w-0">
            <Logo />
          </Link>
          <div className="flex shrink-0 items-center gap-2">

            {!online && (
              <span className="text-data inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/12 px-3 py-1 text-xs text-primary-light">
                <WifiOff className="h-3.5 w-3.5" /> Offline
              </span>
            )}
            <NotificationBell />
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : (
              <Link
                to="/auth"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-glow"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 md:px-8">
        <aside className="sticky top-20 hidden h-fit w-56 shrink-0 py-6 md:block">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "border-primary/40 bg-primary/10 text-primary-light",
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 md:pb-12 md:pt-6">
          {children}
        </main>

      </div>

      <footer className="hidden border-t border-border/70 py-6 md:block">
        <div className="text-data mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-muted-foreground md:px-8">
          <span className="text-primary-light">Ayglobe Lite · Executive planning, validated.</span>
          <span className="flex gap-4">
            <Link to="/profile" className="hover:text-primary">
              Privacy
            </Link>
            <Link to="/profile" className="hover:text-primary">
              Terms
            </Link>
            <a href="mailto:support@ayglobe.app" className="hover:text-primary">
              Contact Support
            </a>
          </span>
        </div>
      </footer>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-8">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors active:bg-accent/40",
                  active && "text-primary",
                )}
              >
                {active && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
                )}
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="w-full truncate text-center leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
