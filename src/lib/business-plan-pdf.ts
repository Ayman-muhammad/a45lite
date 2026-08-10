import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BusinessPlanDraft, PdfTemplate } from "@/lib/business-plan";

const ORANGE: [number, number, number] = [249, 115, 22];
const NAVY: [number, number, number] = [15, 23, 42];

const TEMPLATE_TITLES: Record<PdfTemplate, string> = {
  investor: "Investor Deck — Executive Business Plan",
  sba: "SBA Loan Application — Business Plan",
  internal: "Internal Strategy Brief",
};

function money(n: number) {
  return `$${Number(n || 0).toLocaleString("en-US")}`;
}

export function generateBusinessPlanPDF(data: BusinessPlanDraft, template: PdfTemplate = "investor") {
  const doc = new jsPDF();
  const stamp = new Date().toISOString();

  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("Ayglobe Lite", 14, 18);
  doc.setFontSize(11);
  doc.text(TEMPLATE_TITLES[template], 14, 26);

  doc.setTextColor(...NAVY);
  doc.setFontSize(18);
  doc.text(data.foundation.companyName || "Untitled Company", 14, 46);
  doc.setFontSize(10);
  doc.text(
    `${data.foundation.legalStructure || "—"}  ·  NAICS ${data.foundation.industryCode || "—"}`,
    14,
    53,
  );

  doc.setFontSize(12);
  doc.text("Mission", 14, 66);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(data.foundation.missionStatement || "—", 180), 14, 73);

  autoTable(doc, {
    startY: 100,
    head: [["Market", "Value"]],
    body: [
      ["TAM", money(data.market.tam)],
      ["TAM source", data.market.tamSource || "—"],
      ["Competitors tracked", String(data.market.competitors.length)],
      ["Personas defined", String(data.market.personas.length)],
    ],
    headStyles: { fillColor: ORANGE },
    theme: "striped",
  });

  autoTable(doc, {
    head: [["Competitor", "Strength", "Threat"]],
    body: data.market.competitors.map((c) => [c.name, c.strength, c.threat]),
    headStyles: { fillColor: ORANGE },
  });

  autoTable(doc, {
    head: [["Persona", "Demographics", "Pain points"]],
    body: data.market.personas.map((p) => [p.name, p.demographics, p.painPoints]),
    headStyles: { fillColor: ORANGE },
  });

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text("Financial Plan", 14, 20);
  autoTable(doc, {
    startY: 26,
    head: [["Year", "Revenue", "Expenses", "Profit"]],
    body: (["year1", "year2", "year3"] as const).map((k, i) => {
      const y = data.financial.projections[k];
      return [`Year ${i + 1}`, money(y.revenue), money(y.expenses), money(y.profit)];
    }),
    headStyles: { fillColor: ORANGE },
  });
  autoTable(doc, {
    head: [["Unit economics", "Value"]],
    body: [
      ["Revenue model", data.financial.revenueModel || "—"],
      ["CAC", money(data.financial.unitEconomics.cac)],
      ["LTV", money(data.financial.unitEconomics.ltv)],
      ["LTV:CAC", `${data.financial.unitEconomics.ltvCacRatio.toFixed(2)}x`],
    ],
    headStyles: { fillColor: ORANGE },
  });

  autoTable(doc, {
    head: [["Founder", "Role", "Background"]],
    body: data.team.founders.map((f) => [f.name, f.role, f.background]),
    headStyles: { fillColor: ORANGE },
  });
  if (data.team.advisors.length) {
    autoTable(doc, {
      head: [["Advisor", "Expertise"]],
      body: data.team.advisors.map((a) => [a.name, a.expertise]),
      headStyles: { fillColor: ORANGE },
    });
  } else if (data.team.gapsAcknowledged) {
    autoTable(doc, {
      head: [["Acknowledged team gaps"]],
      body: [[data.team.gapsAcknowledged]],
      headStyles: { fillColor: ORANGE },
    });
  }

  autoTable(doc, {
    head: [["Risk", "Probability", "Impact", "Mitigation"]],
    body: data.risk.risks.map((r) => [r.description, r.probability, r.impact, r.mitigation]),
    headStyles: { fillColor: ORANGE },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(`Ayglobe Lite — Confidential — Generated ${stamp}`, 14, 290);
    doc.text(`${i}/${pages}`, 196, 290);
  }

  const name = (data.foundation.companyName || "Business").replace(/[^\w-]+/g, "-");
  doc.save(`${name}-Business-Plan.pdf`);
}
