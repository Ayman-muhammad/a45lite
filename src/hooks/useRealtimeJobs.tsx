import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Status = "connecting" | "live" | "offline";

/**
 * Subscribes to live database changes on the jobs table so newly verified
 * listings stream into the feed without a refresh.
 */
export function useRealtimeJobs(options: { announce?: boolean } = {}) {
  const announce = options.announce ?? true;
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("connecting");
  const [pulses, setPulses] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        (payload) => {
          const row = payload.new as { verification_status?: string; title?: string } | null;
          const isVerified = !row || row.verification_status === "verified";
          if (!isVerified) return;
          setPulses((n) => n + 1);
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
          if (announce && payload.eventType === "INSERT" && row?.title) {
            toast.success("New verified job", { description: row.title });
          }
        },
      )
      .subscribe((state) => {
        if (state === "SUBSCRIBED") setStatus("live");
        else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED")
          setStatus("offline");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, announce]);

  return { status, pulses };
}

export function LiveBadge({ status }: { status: Status }) {
  const label = status === "live" ? "Live sync" : status === "connecting" ? "Connecting" : "Offline";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      <span className="relative flex h-2 w-2">
        {status === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
        )}
        <span
          className={
            status === "live"
              ? "relative inline-flex h-2 w-2 rounded-full bg-success"
              : status === "connecting"
                ? "relative inline-flex h-2 w-2 rounded-full bg-warning"
                : "relative inline-flex h-2 w-2 rounded-full bg-muted-foreground"
          }
        />
      </span>
      {label}
    </span>
  );
}
