import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProDocument, DocTheme, DocType } from "@/lib/pro-doc";
import { DOC_TYPE_LABELS, ProDocumentSchema } from "@/lib/pro-doc";

type RGB = [number, number, number];

interface Theme {
  accent: RGB;
  accentSoft: RGB;
  ink: RGB;
  muted: RGB;
  coverBg: RGB;
  coverInk: RGB;
  panel: RGB;
  headingFont: "helvetica" | "times";
  bodyFont: "helvetica" | "times";
}

const THEMES: Record<DocTheme, Theme> = {
  executive: {
    accent: [234, 88, 12],
    accentSoft: [254, 235, 222],
    ink: [15, 23, 42],
    muted: [100, 116, 139],
    coverBg: [15, 23, 42],
    coverInk: [255, 255, 255],
    panel: [248, 250, 252],
    headingFont: "helvetica",
    bodyFont: "helvetica",
  },
  midnight: {
    accent: [56, 189, 248],
    accentSoft: [226, 240, 250],
    ink: [17, 24, 39],
    muted: [107, 114, 128],
    coverBg: [8, 15, 30],
    coverInk: [255, 255, 255],
    panel: [244, 247, 251],
    headingFont: "helvetica",
    bodyFont: "helvetica",
  },
  editorial: {
    accent: [120, 53, 15],
    accentSoft: [245, 236, 224],
    ink: [28, 25, 23],
    muted: [120, 113, 108],
    coverBg: [250, 246, 240],
    coverInk: [28, 25, 23],
    panel: [250, 247, 243],
    headingFont: "times",
    bodyFont: "times",
  },
};

const PAGE_W = 210;
const PAGE_H = 297;
const M = 18;
const CONTENT_W = PAGE_W - M * 2;

export function generateProDocumentPDF(
  document: ProDocument,
  theme: DocTheme,
  docType: DocType,
): jsPDF {
  const t = THEMES[theme];
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dated = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  /* ---------- cover ---------- */
  doc.setFillColor(...t.coverBg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(...t.accent);
  doc.rect(0, 0, 6, PAGE_H, "F");
  doc.setFillColor(...t.accent);
  doc.circle(PAGE_W - 26, 46, 16, "F");
  doc.setDrawColor(...t.accent);
  doc.setLineWidth(0.6);
  doc.circle(PAGE_W - 26, 46, 24, "S");

  doc.setTextColor(...t.coverInk);
  doc.setFont(t.headingFont, "bold");
  doc.setFontSize(10);
  doc.text(DOC_TYPE_LABELS[docType].toUpperCase(), M, 40, { charSpace: 1.4 });

  doc.setFontSize(32);
  const titleLines = doc.splitTextToSize(document.title || "Untitled Document", CONTENT_W - 20);
  doc.text(titleLines.slice(0, 4), M, 120);

  if (document.subtitle) {
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(13);
    doc.text(doc.splitTextToSize(document.subtitle, CONTENT_W - 30).slice(0, 3), M, 138);
  }

  doc.setFillColor(...t.accent);
  doc.rect(M, 158, 34, 1.6, "F");

  doc.setFont(t.bodyFont, "normal");
  doc.setFontSize(10);
  const metaRows = [
    ["PREPARED FOR", document.client || "Internal distribution"],
    ["PREPARED BY", document.author || "Ayglobe Lite"],
    ["DATE", dated],
    ["REFERENCE", document.documentCode || "—"],
  ];
  let my = 178;
  for (const [label, value] of metaRows) {
    if (!label || !value) continue;
    doc.setFont(t.headingFont, "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...t.accent);
    doc.text(label, M, my, { charSpace: 0.8 });
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(11);
    doc.setTextColor(...t.coverInk);
    doc.text(doc.splitTextToSize(value, CONTENT_W)[0] ?? "", M, my + 6);
    my += 17;
  }

  doc.setFontSize(8);
  doc.setTextColor(...t.accent);
  doc.text("AYGLOBE LITE · DOCUMENT STUDIO", M, PAGE_H - 18, { charSpace: 1.2 });

  /* ---------- body ---------- */
  let y = 0;
  let page = 1;

  function newPage() {
    doc.addPage();
    page += 1;
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
    doc.setFillColor(...t.accent);
    doc.rect(0, 0, PAGE_W, 3, "F");
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...t.muted);
    doc.text((document.title || "Document").slice(0, 70), M, 12);
    doc.text(dated, PAGE_W - M, 12, { align: "right" });
    doc.setDrawColor(...t.accentSoft);
    doc.setLineWidth(0.3);
    doc.line(M, 15, PAGE_W - M, 15);
    y = 26;
  }

  function ensure(space: number) {
    if (y + space > PAGE_H - 24) newPage();
  }

  function heading(text: string, index?: number) {
    ensure(26);
    doc.setFillColor(...t.accent);
    doc.rect(M, y - 4.5, 2.4, 9, "F");
    doc.setFont(t.headingFont, "bold");
    doc.setFontSize(15);
    doc.setTextColor(...t.ink);
    const label = index ? `${String(index).padStart(2, "0")}  ${text}` : text;
    const lines = doc.splitTextToSize(label, CONTENT_W - 8);
    doc.text(lines, M + 6, y + 2);
    y += lines.length * 7 + 4;
  }

  function paragraph(text: string, size = 10, color: RGB = t.ink) {
    if (!text) return;
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    for (const line of lines) {
      ensure(7);
      doc.text(line, M, y);
      y += size * 0.52 + 1.6;
    }
    y += 3;
  }

  function bulletList(items: string[], numbered = false) {
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(10);
    items.filter(Boolean).forEach((item, i) => {
      const lines = doc.splitTextToSize(item, CONTENT_W - 8);
      ensure(lines.length * 5.6 + 3);
      doc.setTextColor(...t.accent);
      doc.setFont(t.headingFont, "bold");
      doc.text(numbered ? `${i + 1}.` : "—", M, y);
      doc.setFont(t.bodyFont, "normal");
      doc.setTextColor(...t.ink);
      doc.text(lines, M + 7, y);
      y += lines.length * 5.4 + 2.4;
    });
    y += 2;
  }

  function callout(title: string, text: string) {
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, CONTENT_W - 16);
    const h = lines.length * 5.2 + (title ? 14 : 8);
    ensure(h + 6);
    doc.setFillColor(...t.accentSoft);
    doc.roundedRect(M, y - 5, CONTENT_W, h, 2.5, 2.5, "F");
    doc.setFillColor(...t.accent);
    doc.rect(M, y - 5, 2.2, h, "F");
    let cy = y + 1;
    if (title) {
      doc.setFont(t.headingFont, "bold");
      doc.setFontSize(9);
      doc.setTextColor(...t.accent);
      doc.text(title.toUpperCase(), M + 8, cy, { charSpace: 0.6 });
      cy += 6.5;
    }
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(10);
    doc.setTextColor(...t.ink);
    doc.text(lines, M + 8, cy);
    y += h + 6;
  }

  function kpiStrip(kpis: { label: string; value: string; note: string }[]) {
    const items = kpis.slice(0, 4);
    if (!items.length) return;
    ensure(32);
    const gap = 4;
    const w = (CONTENT_W - gap * (items.length - 1)) / items.length;
    items.forEach((k, i) => {
      const x = M + i * (w + gap);
      doc.setFillColor(...t.panel);
      doc.roundedRect(x, y - 4, w, 26, 2.5, 2.5, "F");
      doc.setDrawColor(...t.accentSoft);
      doc.roundedRect(x, y - 4, w, 26, 2.5, 2.5, "S");
      doc.setFont(t.headingFont, "bold");
      doc.setFontSize(7);
      doc.setTextColor(...t.muted);
      doc.text(doc.splitTextToSize(k.label.toUpperCase(), w - 8)[0] ?? "", x + 4, y + 2);
      doc.setFontSize(16);
      doc.setTextColor(...t.accent);
      doc.text(doc.splitTextToSize(k.value, w - 8)[0] ?? "", x + 4, y + 11);
      doc.setFont(t.bodyFont, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...t.muted);
      doc.text(doc.splitTextToSize(k.note, w - 8).slice(0, 2), x + 4, y + 16.5);
    });
    y += 32;
  }

  function table(columns: string[], rows: string[][]) {
    if (!columns.length || !rows.length) return;
    ensure(30);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [columns],
      body: rows.map((r) => columns.map((_, i) => r[i] ?? "")),
      theme: "grid",
      styles: {
        font: t.bodyFont,
        fontSize: 9,
        cellPadding: 2.6,
        lineColor: t.accentSoft,
        lineWidth: 0.2,
        textColor: t.ink,
      },
      headStyles: { fillColor: t.accent, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: t.panel },
      didDrawPage: () => {},
    });
    const after = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    y = (after?.finalY ?? y) + 8;
  }

  function timeline(steps: string[]) {
    doc.setFontSize(10);
    steps.filter(Boolean).forEach((step, i) => {
      const lines = doc.splitTextToSize(step, CONTENT_W - 16);
      ensure(lines.length * 5.4 + 6);
      doc.setFillColor(...t.accent);
      doc.circle(M + 3, y - 1.4, 2.2, "F");
      if (i < steps.length - 1) {
        doc.setDrawColor(...t.accentSoft);
        doc.setLineWidth(0.8);
        doc.line(M + 3, y + 1.2, M + 3, y + lines.length * 5.4 + 1.5);
      }
      doc.setFont(t.bodyFont, "normal");
      doc.setTextColor(...t.ink);
      doc.setFontSize(10);
      doc.text(lines, M + 11, y);
      y += lines.length * 5.4 + 4;
    });
    y += 2;
  }

  newPage();

  // Executive summary panel
  if (document.executiveSummary) {
    heading("Executive Summary");
    paragraph(document.executiveSummary, 10.5);
  }

  if (document.keyTakeaways.length) {
    callout("Key takeaways", document.keyTakeaways.map((k) => `• ${k}`).join("\n"));
  }

  // Contents
  if (document.sections.length > 2) {
    ensure(20 + document.sections.length * 6);
    heading("Contents");
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(10);
    document.sections.forEach((s, i) => {
      ensure(7);
      doc.setTextColor(...t.accent);
      doc.text(String(i + 1).padStart(2, "0"), M, y);
      doc.setTextColor(...t.ink);
      doc.text(doc.splitTextToSize(s.heading, CONTENT_W - 14)[0] ?? "", M + 10, y);
      y += 6.4;
    });
    y += 4;
  }

  document.sections.forEach((section, index) => {
    newPage();
    heading(section.heading || `Section ${index + 1}`, index + 1);
    if (section.summary) {
      doc.setFont(t.headingFont, "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...t.accent);
      const lines = doc.splitTextToSize(section.summary, CONTENT_W);
      doc.text(lines, M, y);
      y += lines.length * 5.6 + 6;
    }
    section.blocks.forEach((block) => {
      switch (block.kind) {
        case "bullets":
          bulletList(block.bullets);
          break;
        case "table":
          table(block.columns, block.rows);
          break;
        case "kpi":
          kpiStrip(block.kpis);
          break;
        case "callout":
          callout(block.calloutTitle || "Insight", block.text || block.bullets.join("\n"));
          break;
        case "timeline":
          timeline(block.bullets);
          break;
        default:
          paragraph(block.text);
          if (block.bullets.length) bulletList(block.bullets);
      }
    });
  });

  if (document.conclusion || document.nextSteps.length) {
    newPage();
    heading("Conclusion & Next Steps");
    paragraph(document.conclusion);
    if (document.nextSteps.length) bulletList(document.nextSteps, true);
  }

  /* ---------- footers ---------- */
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...t.accentSoft);
    doc.setLineWidth(0.3);
    doc.line(M, PAGE_H - 16, PAGE_W - M, PAGE_H - 16);
    doc.setFont(t.bodyFont, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...t.muted);
    doc.text(
      document.footerNote || "Confidential — prepared with Ayglobe Lite Document Studio",
      M,
      PAGE_H - 11,
    );
    doc.setTextColor(...t.accent);
    doc.setFont(t.headingFont, "bold");
    doc.text(`${p - 1} / ${total - 1}`, PAGE_W - M, PAGE_H - 11, { align: "right" });
  }
  void page;

  return doc;
}

export function downloadProDocumentPDF(
  document: ProDocument,
  theme: DocTheme,
  docType: DocType,
) {
  const doc = generateProDocumentPDF(document, theme, docType);
  const name = (document.title || "document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  doc.save(`${name || "document"}.pdf`);
}
