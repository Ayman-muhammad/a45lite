import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Download,
  FileText,
  LoaderCircle,
  Palette,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { generateProDocument } from "@/lib/pro-doc.functions";
import {
  DOC_THEMES,
  DOC_THEME_LABELS,
  DOC_TONES,
  DOC_TYPES,
  DOC_TYPE_LABELS,
  type DocTheme,
  type DocTone,
  type DocType,
  type ProDocument,
} from "@/lib/pro-doc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Professional PDF Studio — Ayglobe Lite" },
      {
        name: "description",
        content:
          "Turn source material into an expertly structured, professionally designed PDF document.",
      },
      { property: "og:title", content: "Professional PDF Studio — Ayglobe Lite" },
      {
        property: "og:description",
        content: "Create polished reports, proposals, briefs and whitepapers from your context.",
      },
    ],
  }),
  component: DocumentStudioPage,
});

const TONE_LABELS: Record<DocTone, string> = {
  executive: "Executive",
  technical: "Technical",
  persuasive: "Persuasive",
  academic: "Academic",
};

const ERROR_MESSAGES: Record<string, string> = {
  AI_UNAVAILABLE: "The document service is temporarily unavailable. Your context is still here.",
  NO_CREDITS: "AI credits are unavailable. Add credits, then generate again.",
  RATE_LIMIT: "The service is busy. Wait a moment, then generate again.",
  PARSE_FAILED: "The draft could not be formatted safely. Generate it again.",
  "AI is not configured": "Document generation is not configured yet.",
};

function DocumentStudioPage() {
  const generate = useServerFn(generateProDocument);
  const [context, setContext] = useState("");
  const [docType, setDocType] = useState<DocType>("report");
  const [tone, setTone] = useState<DocTone>("executive");
  const [theme, setTheme] = useState<DocTheme>("executive");
  const [audience, setAudience] = useState("");
  const [client, setClient] = useState("");
  const [author, setAuthor] = useState("");
  const [document, setDocument] = useState<ProDocument | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const wordCount = useMemo(() => context.trim().split(/\s+/).filter(Boolean).length, [context]);
  const canGenerate = context.trim().length >= 40 && !generating;

  async function createDocument() {
    if (!canGenerate) return;
    setGenerating(true);
    setDocument(null);
    try {
      const result = await generate({
        data: { context: context.trim(), docType, tone, audience, client, author },
      });
      if (!result.ok) {
        toast.error(ERROR_MESSAGES[result.error] ?? result.error);
        return;
      }
      setDocument(result.document);
      toast.success("Professional document ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Document generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadPdf() {
    if (!document) return;
    setDownloading(true);
    try {
      const { downloadProDocumentPDF } = await import("@/lib/pro-pdf");
      downloadProDocumentPDF(document, theme, docType);
      toast.success("PDF downloaded");
    } catch {
      toast.error("The PDF could not be downloaded.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppShell>
      <section className="hero-glow animate-rise border-b border-border pb-6 md:pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-light">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <p className="text-data text-xs">DOCUMENT STUDIO</p>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-foreground md:text-3xl">
              Professional PDF Studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add your source material. The studio structures the argument, selects the right
              visual blocks and produces a publication-ready document.
            </p>
          </div>
          <div className="text-data flex items-center gap-2 border-l-2 border-primary pl-3 text-xs text-muted-foreground">
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
            A4 · print ready
          </div>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <section className="min-w-0 space-y-5" aria-label="Document setup">
          <div>
            <div className="mb-2 flex items-end justify-between gap-3">
              <label htmlFor="document-context" className="text-sm font-semibold text-foreground">
                Source context
              </label>
              <span className="text-data text-xs text-muted-foreground">
                {wordCount} words · {context.length.toLocaleString()}/20,000
              </span>
            </div>
            <textarea
              id="document-context"
              value={context}
              onChange={(event) => setContext(event.target.value.slice(0, 20000))}
              placeholder="Paste your research, meeting notes, strategy, project information, evidence or draft material here…"
              className="min-h-72 w-full resize-y rounded-lg border border-input bg-card p-4 text-sm leading-6 text-foreground placeholder:text-muted-foreground focus:border-primary md:min-h-96"
            />
            {context.length > 0 && context.trim().length < 40 && (
              <p className="mt-2 text-xs text-warning">Add a little more context before generating.</p>
            )}
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-foreground">Document type</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {DOC_TYPES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDocType(value)}
                  className={cn(
                    "min-h-12 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                    docType === value
                      ? "border-primary bg-primary/12 text-primary-light"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {DOC_TYPE_LABELS[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Audience" value={audience} onChange={setAudience} placeholder="e.g. Board of directors" />
            <Field label="Client / organisation" value={client} onChange={setClient} placeholder="Optional" />
            <Field label="Prepared by" value={author} onChange={setAuthor} placeholder="Your name or team" />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">Tone</span>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value as DocTone)}
                className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground"
              >
                {DOC_TONES.map((value) => (
                  <option key={value} value={value}>{TONE_LABELS[value]}</option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            disabled={!canGenerate}
            onClick={createDocument}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground shadow-glow transition-opacity disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            {generating ? (
              <><LoaderCircle className="h-4 w-4 animate-spin" /> Designing document…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate professional document</>
            )}
          </button>
        </section>

        <aside className="min-w-0 border-t border-border pt-5 xl:sticky xl:top-24 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">PDF direction</h2>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {DOC_THEMES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={theme === value}
                className={cn(
                  "min-h-20 rounded-lg border p-2 text-left text-xs transition-colors",
                  theme === value
                    ? "border-primary bg-primary/12 text-primary-light"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "mb-2 block h-2 w-full rounded-full",
                    value === "executive" && "bg-primary",
                    value === "midnight" && "bg-info",
                    value === "editorial" && "bg-warning",
                  )}
                />
                {DOC_THEME_LABELS[value]}
              </button>
            ))}
          </div>

          {generating && (
            <div className="mt-6 rounded-lg border border-primary/35 bg-primary/8 p-4" role="status">
              <div className="flex items-center gap-3">
                <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Architecting your document</p>
                  <p className="mt-1 text-xs text-muted-foreground">Structuring sections, evidence and visual hierarchy.</p>
                </div>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 animate-[slide_1.6s_ease-in-out_infinite] rounded-full bg-primary" />
              </div>
            </div>
          )}

          {!document && !generating && (
            <div className="mt-6 border-y border-border py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-foreground">Your document blueprint appears here</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Generate to review the title, executive summary and section architecture before download.
              </p>
            </div>
          )}

          {document && (
            <div className="mt-6 animate-rise">
              <p className="text-data text-xs text-success">DOCUMENT READY</p>
              <h2 className="mt-2 text-xl font-bold text-foreground">{document.title}</h2>
              {document.subtitle && <p className="mt-1 text-sm text-muted-foreground">{document.subtitle}</p>}
              <div className="mt-5 border-y border-border py-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Executive summary</p>
                <p className="mt-2 line-clamp-5 text-sm leading-6 text-foreground">{document.executiveSummary}</p>
              </div>
              <ol className="mt-4 space-y-2">
                {document.sections.map((section, index) => (
                  <li key={`${section.heading}-${index}`} className="flex gap-3 text-sm">
                    <span className="text-data text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-foreground">{section.heading}</span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                disabled={downloading}
                onClick={downloadPdf}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {downloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading ? "Preparing PDF…" : "Download professional PDF"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, 200))}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
      />
    </label>
  );
}