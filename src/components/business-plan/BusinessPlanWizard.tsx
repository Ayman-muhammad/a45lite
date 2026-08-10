import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  SECTIONS,
  emptyDraft,
  loadDraft,
  saveDraft,
  validateSection,
  type BusinessPlanDraft,
  type SectionKey,
} from "@/lib/business-plan";
import { ValidationGate } from "@/components/business-plan/ValidationGate";
import { cn } from "@/lib/utils";

const field =
  "min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";
const area = "w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold text-muted-foreground">{children}</span>;
}

export function BusinessPlanWizard() {
  const [draft, setDraft] = useState<BusinessPlanDraft>(emptyDraft);
  const [step, setStep] = useState<SectionKey>("foundation");

  useEffect(() => setDraft(loadDraft()), []);
  useEffect(() => saveDraft(draft), [draft]);

  const update = (fn: (d: BusinessPlanDraft) => BusinessPlanDraft) => setDraft((d) => fn(structuredClone(d)));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SECTIONS.map((s) => {
            const valid = validateSection(s.key, draft).valid;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(s.key)}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground",
                  step === s.key && "border-primary bg-primary/12 text-primary-light",
                  valid && step !== s.key && "border-success/50 text-success",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-5">
          {step === "foundation" && (
            <>
              <div>
                <Label>Company name</Label>
                <input
                  className={field}
                  value={draft.foundation.companyName}
                  onChange={(e) =>
                    update((d) => ((d.foundation.companyName = e.target.value), d))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Legal structure</Label>
                  <select
                    className={field}
                    value={draft.foundation.legalStructure}
                    onChange={(e) =>
                      update((d) => ((d.foundation.legalStructure = e.target.value as never), d))
                    }
                  >
                    <option value="">Select…</option>
                    {["LLC", "C-Corp", "S-Corp", "Partnership", "Sole Proprietorship"].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>NAICS code (6 digits)</Label>
                  <input
                    className={field}
                    inputMode="numeric"
                    placeholder="541511"
                    value={draft.foundation.industryCode}
                    onChange={(e) =>
                      update((d) => ((d.foundation.industryCode = e.target.value), d))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Mission statement (50+ chars)</Label>
                <textarea
                  rows={4}
                  className={area}
                  value={draft.foundation.missionStatement}
                  onChange={(e) =>
                    update((d) => ((d.foundation.missionStatement = e.target.value), d))
                  }
                />
              </div>
            </>
          )}

          {step === "market" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>TAM (USD)</Label>
                  <input
                    className={field}
                    inputMode="numeric"
                    value={draft.market.tam || ""}
                    onChange={(e) => update((d) => ((d.market.tam = Number(e.target.value) || 0), d))}
                  />
                </div>
                <div>
                  <Label>TAM source URL</Label>
                  <input
                    className={field}
                    placeholder="https://…"
                    value={draft.market.tamSource}
                    onChange={(e) => update((d) => ((d.market.tamSource = e.target.value), d))}
                  />
                </div>
              </div>

              <div>
                <Label>Competitors (min 3)</Label>
                {draft.market.competitors.map((c, i) => (
                  <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    {(["name", "strength", "threat"] as const).map((k) => (
                      <input
                        key={k}
                        className={field}
                        placeholder={k}
                        value={c[k]}
                        onChange={(e) =>
                          update((d) => ((d.market.competitors[i]![k] = e.target.value), d))
                        }
                      />
                    ))}
                    <button
                      type="button"
                      aria-label="Remove competitor"
                      className="grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground"
                      onClick={() => update((d) => (d.market.competitors.splice(i, 1), d))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-primary/40 px-3 text-xs text-primary-light"
                  onClick={() =>
                    update((d) => (d.market.competitors.push({ name: "", strength: "", threat: "" }), d))
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add competitor
                </button>
              </div>

              <div>
                <Label>Personas (min 2)</Label>
                {draft.market.personas.map((p, i) => (
                  <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
                    {(["name", "demographics", "painPoints"] as const).map((k) => (
                      <input
                        key={k}
                        className={field}
                        placeholder={k === "painPoints" ? "pain points (20+ chars)" : k}
                        value={p[k]}
                        onChange={(e) =>
                          update((d) => ((d.market.personas[i]![k] = e.target.value), d))
                        }
                      />
                    ))}
                    <button
                      type="button"
                      aria-label="Remove persona"
                      className="grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground"
                      onClick={() => update((d) => (d.market.personas.splice(i, 1), d))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-primary/40 px-3 text-xs text-primary-light"
                  onClick={() =>
                    update((d) => (d.market.personas.push({ name: "", demographics: "", painPoints: "" }), d))
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add persona
                </button>
              </div>
            </>
          )}

          {step === "financial" && (
            <>
              <div>
                <Label>Revenue model</Label>
                <select
                  className={field}
                  value={draft.financial.revenueModel}
                  onChange={(e) =>
                    update((d) => ((d.financial.revenueModel = e.target.value as never), d))
                  }
                >
                  <option value="">Select…</option>
                  {["Subscription", "Transactional", "Freemium", "B2B SaaS", "Marketplace", "Other"].map(
                    (o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ),
                  )}
                </select>
              </div>
              {(["year1", "year2", "year3"] as const).map((y, i) => (
                <div key={y} className="grid gap-2 sm:grid-cols-[80px_1fr_1fr_1fr] sm:items-center">
                  <span className="text-data text-xs text-primary-light">YEAR {i + 1}</span>
                  {(["revenue", "expenses", "profit"] as const).map((k) => (
                    <input
                      key={k}
                      className={field}
                      inputMode="numeric"
                      placeholder={k}
                      value={draft.financial.projections[y][k] || ""}
                      onChange={(e) =>
                        update(
                          (d) => (
                            (d.financial.projections[y][k] = Number(e.target.value) || 0), d
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-3">
                {(["cac", "ltv", "ltvCacRatio"] as const).map((k) => (
                  <div key={k}>
                    <Label>{k === "ltvCacRatio" ? "LTV:CAC ratio" : k.toUpperCase()}</Label>
                    <input
                      className={field}
                      inputMode="decimal"
                      value={draft.financial.unitEconomics[k] || ""}
                      onChange={(e) =>
                        update((d) => ((d.financial.unitEconomics[k] = Number(e.target.value) || 0), d))
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="min-h-10 rounded-xl border border-primary/40 px-3 text-xs text-primary-light"
                onClick={() =>
                  update((d) => {
                    const { cac, ltv } = d.financial.unitEconomics;
                    d.financial.unitEconomics.ltvCacRatio = cac > 0 ? Number((ltv / cac).toFixed(2)) : 0;
                    return d;
                  })
                }
              >
                Auto-calculate LTV:CAC
              </button>
            </>
          )}

          {step === "team" && (
            <>
              <Label>Founders (min 1)</Label>
              {draft.team.founders.map((f, i) => (
                <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
                  {(["name", "role", "background"] as const).map((k) => (
                    <input
                      key={k}
                      className={field}
                      placeholder={k === "background" ? "background (30+ chars)" : k}
                      value={f[k]}
                      onChange={(e) => update((d) => ((d.team.founders[i]![k] = e.target.value), d))}
                    />
                  ))}
                  <button
                    type="button"
                    aria-label="Remove founder"
                    className="grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground"
                    onClick={() => update((d) => (d.team.founders.splice(i, 1), d))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-primary/40 px-3 text-xs text-primary-light"
                onClick={() => update((d) => (d.team.founders.push({ name: "", role: "", background: "" }), d))}
              >
                <Plus className="h-3.5 w-3.5" /> Add founder
              </button>

              <Label>Advisors (optional)</Label>
              {draft.team.advisors.map((a, i) => (
                <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  {(["name", "expertise"] as const).map((k) => (
                    <input
                      key={k}
                      className={field}
                      placeholder={k}
                      value={a[k]}
                      onChange={(e) => update((d) => ((d.team.advisors[i]![k] = e.target.value), d))}
                    />
                  ))}
                  <button
                    type="button"
                    aria-label="Remove advisor"
                    className="grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground"
                    onClick={() => update((d) => (d.team.advisors.splice(i, 1), d))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-primary/40 px-3 text-xs text-primary-light"
                onClick={() => update((d) => (d.team.advisors.push({ name: "", expertise: "" }), d))}
              >
                <Plus className="h-3.5 w-3.5" /> Add advisor
              </button>

              <div>
                <Label>Or acknowledge team gaps</Label>
                <textarea
                  rows={3}
                  className={area}
                  value={draft.team.gapsAcknowledged}
                  onChange={(e) => update((d) => ((d.team.gapsAcknowledged = e.target.value), d))}
                />
              </div>
            </>
          )}

          {step === "risk" && (
            <>
              <Label>Risks (min 3, mitigation 50+ chars)</Label>
              {draft.risk.risks.map((r, i) => (
                <div key={i} className="mb-3 rounded-xl border border-border p-3">
                  <input
                    className={cn(field, "mb-2")}
                    placeholder="Risk description"
                    value={r.description}
                    onChange={(e) => update((d) => ((d.risk.risks[i]!.description = e.target.value), d))}
                  />
                  <textarea
                    rows={2}
                    className={cn(area, "mb-2")}
                    placeholder="Mitigation plan"
                    value={r.mitigation}
                    onChange={(e) => update((d) => ((d.risk.risks[i]!.mitigation = e.target.value), d))}
                  />
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    {(["probability", "impact"] as const).map((k) => (
                      <select
                        key={k}
                        className={field}
                        value={r[k]}
                        onChange={(e) => update((d) => ((d.risk.risks[i]![k] = e.target.value as never), d))}
                      >
                        {["Low", "Medium", "High"].map((o) => (
                          <option key={o} value={o}>
                            {k}: {o}
                          </option>
                        ))}
                      </select>
                    ))}
                    <button
                      type="button"
                      aria-label="Remove risk"
                      className="grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground"
                      onClick={() => update((d) => (d.risk.risks.splice(i, 1), d))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-primary/40 px-3 text-xs text-primary-light"
                onClick={() =>
                  update(
                    (d) => (
                      d.risk.risks.push({
                        description: "",
                        mitigation: "",
                        probability: "Medium",
                        impact: "Medium",
                      }),
                      d
                    ),
                  )
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add risk
              </button>
            </>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <ValidationGate draft={draft} />
      </div>
    </div>
  );
}
