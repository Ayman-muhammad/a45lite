import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { BusinessPlanWizard } from "@/components/business-plan/BusinessPlanWizard";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Business Plan Builder — Ayglobe Lite" },
      {
        name: "description",
        content:
          "Build an investor-ready business plan with a strict validation gate: foundation, market, financials, team and risk must all pass before PDF export unlocks.",
      },
      { property: "og:title", content: "Business Plan Builder — Ayglobe Lite" },
      {
        property: "og:description",
        content: "Validation-gated executive business plan builder with branded PDF export.",
      },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  return (
    <AppShell>
      <section className="hero-glow animate-rise rounded-3xl border border-border bg-card/40 p-6 md:p-8">
        <p className="text-data text-xs tracking-[0.24em] text-primary-light">EXECUTIVE PLANNING</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          Business Plan Builder
        </h1>
        <div className="mt-3 h-1 w-16 rounded-full bg-primary" />
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Every section is validated against investor-grade requirements. PDF generation stays locked
          until all five sections pass — no half-finished plans leave this room.
        </p>
      </section>

      <div className="mt-6">
        <BusinessPlanWizard />
      </div>
    </AppShell>
  );
}
