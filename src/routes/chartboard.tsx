import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  ChartboardCanvas,
  type FinancialPoint,
} from "@/components/chartboard/ChartboardCanvas";
import { ImportWizard } from "@/components/import/ImportWizard";
import { emptyDraft, loadDraft, type BusinessPlanDraft } from "@/lib/business-plan";

export const Route = createFileRoute("/chartboard")({
  head: () => ({
    meta: [
      { title: "Executive Chartboard — Ayglobe Lite" },
      {
        name: "description",
        content:
          "Interactive executive chartboard: financial projections, market sizing, roadmap, competitive map and KPI dashboard with 300dpi export.",
      },
      { property: "og:title", content: "Executive Chartboard — Ayglobe Lite" },
      {
        property: "og:description",
        content: "Pan, zoom, comment and export executive charts built from your plan data.",
      },
    ],
  }),
  component: ChartboardPage,
});

function ChartboardPage() {
  const [draft, setDraft] = useState<BusinessPlanDraft>(emptyDraft);
  const [series, setSeries] = useState<FinancialPoint[] | null>(null);

  useEffect(() => setDraft(loadDraft()), []);

  const planSeries: FinancialPoint[] = (["year1", "year2", "year3"] as const).map((k, i) => ({
    label: `Year ${i + 1}`,
    ...draft.financial.projections[k],
  }));
  // Illustrative shape until the plan has real numbers, so charts are never blank.
  const hasPlanNumbers = planSeries.some((y) => y.revenue || y.expenses || y.profit);
  const demoSeries: FinancialPoint[] = [
    { label: "Year 1", revenue: 250000, expenses: 210000, profit: 40000 },
    { label: "Year 2", revenue: 780000, expenses: 540000, profit: 240000 },
    { label: "Year 3", revenue: 1900000, expenses: 1150000, profit: 750000 },
  ];

  return (
    <AppShell>
      <section className="hero-glow animate-rise rounded-3xl border border-border bg-card/40 p-6 md:p-8">
        <p className="text-data text-xs tracking-[0.24em] text-primary-light">CHARTBOARD</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          Executive Chartboard
        </h1>
        <div className="mt-3 h-1 w-16 rounded-full bg-primary" />
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Five executive visualizations wired to your plan data — or import a spreadsheet and map it
          straight onto the projection series.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ChartboardCanvas
          financial={series ?? (hasPlanNumbers ? planSeries : demoSeries)}
          tam={draft.market.tam}
          competitors={draft.market.competitors}
          ltvCac={draft.financial.unitEconomics.ltvCacRatio}
        />
        <ImportWizard onImport={setSeries} />
      </div>
    </AppShell>
  );
}
