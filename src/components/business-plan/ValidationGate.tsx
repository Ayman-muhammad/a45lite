import { Lock, Check, AlertTriangle, FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  PDF_TEMPLATES,
  validatePlan,
  type BusinessPlanDraft,
  type PdfTemplate,
} from "@/lib/business-plan";
import { generateBusinessPlanPDF } from "@/lib/business-plan-pdf";
import { cn } from "@/lib/utils";

export function RequirementChecker({ draft }: { draft: BusinessPlanDraft }) {
  const { sections } = validatePlan(draft);
  return (
    <ul className="space-y-2">
      {sections.map((s) => (
        <li
          key={s.key}
          className={cn(
            "rounded-xl border border-border bg-card/60 p-3",
            s.state.valid && "border-success/50",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {s.state.valid ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              {s.label}
            </span>
            <span className="text-data text-xs text-muted-foreground">
              {s.state.valid ? `${s.checks}/${s.checks} complete` : `0/${s.checks} complete`}
            </span>
          </div>
          {!s.state.valid && (
            <ul className="mt-2 space-y-1">
              {s.state.errors.slice(0, 4).map((e) => (
                <li key={e} className="text-xs text-muted-foreground">
                  · {e}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ValidationGate({ draft }: { draft: BusinessPlanDraft }) {
  const [template, setTemplate] = useState<PdfTemplate>("investor");
  const { percent, complete, total, unlocked } = validatePlan(draft);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-data text-xs tracking-[0.24em] text-primary-light">VALIDATION GATE</p>
      <h2 className="mt-2 text-lg font-bold text-foreground">Requirements checklist</h2>

      <div className="mt-4">
        <RequirementChecker draft={draft} />
      </div>

      <div className="mt-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {unlocked
            ? "All sections validated — PDF generation unlocked."
            : `Complete all ${total} sections to unlock PDF generation. You're ${percent}% there.`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PDF_TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTemplate(t.key)}
            className={cn(
              "min-h-10 rounded-full border border-border px-4 text-xs font-medium text-muted-foreground",
              template === t.key && "border-primary bg-primary/12 text-primary-light",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!unlocked}
        onClick={() => {
          try {
            generateBusinessPlanPDF(draft, template);
            toast.success("Business plan PDF generated");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "PDF generation failed");
          }
        }}
        className={cn(
          "mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-shadow",
          unlocked
            ? "bg-primary text-primary-foreground hover:shadow-glow"
            : "cursor-not-allowed border border-border bg-muted text-muted-foreground",
        )}
      >
        {unlocked ? <FileDown className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        {unlocked ? "Generate PDF" : `Generate PDF — locked (${complete}/${total})`}
      </button>
    </div>
  );
}
