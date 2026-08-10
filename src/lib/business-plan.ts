import { z } from "zod";

export const BusinessPlanRequirements = z.object({
  foundation: z.object({
    companyName: z.string().min(2, "Company name required"),
    legalStructure: z.enum(["LLC", "C-Corp", "S-Corp", "Partnership", "Sole Proprietorship"]),
    industryCode: z.string().regex(/^\d{6}$/, "Valid 6-digit NAICS code required"),
    missionStatement: z.string().min(50, "Minimum 50 characters"),
  }),
  market: z.object({
    tam: z.number().positive("TAM must be > 0"),
    tamSource: z.string().url("Citable source URL required"),
    competitors: z
      .array(
        z.object({
          name: z.string().min(1, "Name required"),
          strength: z.string().min(1, "Strength required"),
          threat: z.string().min(1, "Threat required"),
        }),
      )
      .min(3, "Minimum 3 competitors required"),
    personas: z
      .array(
        z.object({
          name: z.string().min(1, "Name required"),
          demographics: z.string().min(1, "Demographics required"),
          painPoints: z.string().min(20, "Pain points need 20+ characters"),
        }),
      )
      .min(2, "Minimum 2 personas required"),
  }),
  financial: z
    .object({
      revenueModel: z.enum([
        "Subscription",
        "Transactional",
        "Freemium",
        "B2B SaaS",
        "Marketplace",
        "Other",
      ]),
      projections: z.object({
        year1: z.object({ revenue: z.number(), expenses: z.number(), profit: z.number() }),
        year2: z.object({ revenue: z.number(), expenses: z.number(), profit: z.number() }),
        year3: z.object({ revenue: z.number(), expenses: z.number(), profit: z.number() }),
      }),
      unitEconomics: z.object({
        cac: z.number().positive("CAC must be > 0"),
        ltv: z.number().positive("LTV must be > 0"),
        ltvCacRatio: z.number().min(1, "LTV:CAC must be ≥ 1"),
      }),
    })
    .refine(
      (data) =>
        data.projections.year1.revenue < data.projections.year2.revenue &&
        data.projections.year2.revenue < data.projections.year3.revenue,
      { message: "Revenue must show growth across 3 years" },
    ),
  team: z
    .object({
      founders: z
        .array(
          z.object({
            name: z.string().min(1, "Name required"),
            role: z.string().min(1, "Role required"),
            background: z.string().min(30, "Background needs 30+ characters"),
          }),
        )
        .min(1, "At least one founder required"),
      advisors: z
        .array(z.object({ name: z.string().min(1), expertise: z.string().min(1) }))
        .optional(),
      gapsAcknowledged: z.string().optional(),
    })
    .refine((data) => (data.advisors?.length ?? 0) > 0 || !!data.gapsAcknowledged?.trim(), {
      message: "Either add advisors or acknowledge team gaps",
    }),
  risk: z.object({
    risks: z
      .array(
        z.object({
          description: z.string().min(10, "Describe the risk (10+ chars)"),
          mitigation: z.string().min(50, "Mitigation must be detailed (50+ chars)"),
          probability: z.enum(["Low", "Medium", "High"]),
          impact: z.enum(["Low", "Medium", "High"]),
        }),
      )
      .min(3, "Minimum 3 risks required"),
  }),
});

export type BusinessPlanData = z.infer<typeof BusinessPlanRequirements>;
/** Draft shape: same tree, everything editable/incomplete while the user works. */
export type BusinessPlanDraft = {
  foundation: {
    companyName: string;
    legalStructure: BusinessPlanData["foundation"]["legalStructure"] | "";
    industryCode: string;
    missionStatement: string;
  };
  market: {
    tam: number;
    tamSource: string;
    competitors: { name: string; strength: string; threat: string }[];
    personas: { name: string; demographics: string; painPoints: string }[];
  };
  financial: {
    revenueModel: BusinessPlanData["financial"]["revenueModel"] | "";
    projections: Record<"year1" | "year2" | "year3", { revenue: number; expenses: number; profit: number }>;
    unitEconomics: { cac: number; ltv: number; ltvCacRatio: number };
  };
  team: {
    founders: { name: string; role: string; background: string }[];
    advisors: { name: string; expertise: string }[];
    gapsAcknowledged: string;
  };
  risk: {
    risks: {
      description: string;
      mitigation: string;
      probability: "Low" | "Medium" | "High";
      impact: "Low" | "Medium" | "High";
    }[];
  };
};

export const SECTIONS = [
  { key: "foundation", label: "Foundation", checks: 4 },
  { key: "market", label: "Market", checks: 4 },
  { key: "financial", label: "Financial", checks: 4 },
  { key: "team", label: "Team", checks: 2 },
  { key: "risk", label: "Risk", checks: 1 },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

export function emptyDraft(): BusinessPlanDraft {
  const year = { revenue: 0, expenses: 0, profit: 0 };
  return {
    foundation: { companyName: "", legalStructure: "", industryCode: "", missionStatement: "" },
    market: {
      tam: 0,
      tamSource: "",
      competitors: [
        { name: "", strength: "", threat: "" },
        { name: "", strength: "", threat: "" },
        { name: "", strength: "", threat: "" },
      ],
      personas: [
        { name: "", demographics: "", painPoints: "" },
        { name: "", demographics: "", painPoints: "" },
      ],
    },
    financial: {
      revenueModel: "",
      projections: { year1: { ...year }, year2: { ...year }, year3: { ...year } },
      unitEconomics: { cac: 0, ltv: 0, ltvCacRatio: 0 },
    },
    team: { founders: [{ name: "", role: "", background: "" }], advisors: [], gapsAcknowledged: "" },
    risk: {
      risks: [
        { description: "", mitigation: "", probability: "Medium", impact: "Medium" },
        { description: "", mitigation: "", probability: "Medium", impact: "Medium" },
        { description: "", mitigation: "", probability: "Medium", impact: "Medium" },
      ],
    },
  };
}

export type SectionState = { valid: boolean; errors: string[] };

/** Validate one section in isolation so the checklist can show per-section state. */
export function validateSection(key: SectionKey, draft: BusinessPlanDraft): SectionState {
  const schema = BusinessPlanRequirements.shape[key] as z.ZodTypeAny;
  const result = schema.safeParse(draft[key]);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map((i) =>
      i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message,
    ),
  };
}

export function validatePlan(draft: BusinessPlanDraft) {
  const sections = SECTIONS.map((s) => ({ ...s, state: validateSection(s.key, draft) }));
  const complete = sections.filter((s) => s.state.valid).length;
  return {
    sections,
    complete,
    total: SECTIONS.length,
    percent: Math.round((complete / SECTIONS.length) * 100),
    unlocked: complete === SECTIONS.length,
  };
}

export const STORAGE_KEY = "ayglobe.business-plan.v1";

export function loadDraft(): BusinessPlanDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...(JSON.parse(raw) as BusinessPlanDraft) };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(draft: BusinessPlanDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export const PDF_TEMPLATES = [
  { key: "investor", label: "Investor Deck" },
  { key: "sba", label: "SBA Loan" },
  { key: "internal", label: "Internal Strategy" },
] as const;

export type PdfTemplate = (typeof PDF_TEMPLATES)[number]["key"];
