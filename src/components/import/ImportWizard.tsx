import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Link2 } from "lucide-react";
import { toast } from "sonner";
import { parseFile, toFinancialSeries, type ImportedTable } from "@/lib/import-engine";
import type { FinancialPoint } from "@/components/chartboard/ChartboardCanvas";
import { cn } from "@/lib/utils";

const CONNECTORS = ["Google Sheets", "Airtable", "Notion", "Salesforce"];

export function ImportWizard({ onImport }: { onImport: (rows: FinancialPoint[]) => void }) {
  const [table, setTable] = useState<ImportedTable | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    try {
      const parsed = await parseFile(file);
      setTable(parsed);
      const guess: Record<string, string> = {};
      for (const c of parsed.columns) {
        if (/month|date|period|year|label/i.test(c.name)) guess["label"] ??= c.name;
        if (/revenue|sales/i.test(c.name)) guess["revenue"] ??= c.name;
        if (/expense|cost/i.test(c.name)) guess["expenses"] ??= c.name;
        if (/profit|net/i.test(c.name)) guess["profit"] ??= c.name;
      }
      setMapping(guess);
      toast.success(`Detected "${file.name}" — ${parsed.rows.length} rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not parse file");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-data text-xs tracking-[0.24em] text-primary-light">IMPORT DATA</p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-3 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center transition-colors",
          dragging && "border-primary bg-primary/8",
        )}
      >
        <UploadCloud className="h-6 w-6 text-primary" />
        <span className="text-sm font-semibold text-foreground">Drop files here or click to browse</span>
        <span className="text-xs text-muted-foreground">Supports CSV, XLSX, XLS and JSON</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,.xlsx,.xls,.json"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div className="mt-4">
        <p className="text-center text-[11px] tracking-[0.2em] text-muted-foreground">— OR CONNECT —</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CONNECTORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toast("Connector coming soon — use a file export for now")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border text-xs text-muted-foreground hover:border-primary/50"
            >
              <Link2 className="h-3.5 w-3.5" /> {c}
            </button>
          ))}
        </div>
      </div>

      {table && (
        <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> {table.fileName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Schema detected</p>
          <ul className="mt-2 space-y-1">
            {table.columns.map((c) => (
              <li key={c.name} className="text-data flex justify-between text-xs">
                <span className="text-foreground">{c.name}</span>
                <span className={c.calculated ? "text-warning" : "text-success"}>
                  {c.calculated ? "⚠ calculated" : `✓ ${c.type}`}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(["label", "revenue", "expenses", "profit"] as const).map((field) => (
              <label key={field} className="text-xs text-muted-foreground">
                Map {field}
                <select
                  value={mapping[field] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                  className="mt-1 min-h-10 w-full rounded-xl border border-border bg-background px-2 text-sm text-foreground"
                >
                  <option value="">—</option>
                  {table.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-4 max-h-40 overflow-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c.name} className="px-2 py-1 font-semibold text-foreground">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    {table.columns.map((c) => (
                      <td key={c.name} className="px-2 py-1 text-muted-foreground">
                        {String(r[c.name] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => {
              onImport(toFinancialSeries(table, mapping));
              toast.success("Imported into Financial Projection");
            }}
            className="mt-4 min-h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:shadow-glow"
          >
            Map to Financial Projections → Import
          </button>
        </div>
      )}
    </div>
  );
}
