import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ImportedTable = {
  fileName: string;
  format: string;
  columns: { name: string; type: "date" | "number" | "text"; calculated: boolean }[];
  rows: Record<string, unknown>[];
};

export function detectFormat(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["csv", "tsv"].includes(ext)) return "csv";
  if (["xlsx", "xls"].includes(ext)) return "excel";
  if (ext === "json") return "json";
  return ext || "unknown";
}

function inferColumns(rows: Record<string, unknown>[]) {
  const keys = rows.length ? Object.keys(rows[0]!) : [];
  return keys.map((name) => {
    const sample = rows.slice(0, 20).map((r) => r[name]).filter((v) => v !== "" && v != null);
    const allNumbers = sample.length > 0 && sample.every((v) => !Number.isNaN(Number(v)));
    const allDates =
      sample.length > 0 && sample.every((v) => !Number.isNaN(Date.parse(String(v))));
    const calculated = /profit|margin|total|net/i.test(name);
    const type: "date" | "number" | "text" = allNumbers ? "number" : allDates ? "date" : "text";
    return { name, type, calculated };
  });
}

export async function parseFile(file: File): Promise<ImportedTable> {
  const format = detectFormat(file.name);
  let rows: Record<string, unknown>[] = [];

  if (format === "csv") {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    rows = parsed.data;
  } else if (format === "excel") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]!]!;
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  } else if (format === "json") {
    const parsed = JSON.parse(await file.text());
    rows = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    throw new Error(`Unsupported format: .${format}. Use CSV, XLSX or JSON.`);
  }

  return { fileName: file.name, format, columns: inferColumns(rows), rows };
}

/** Map an imported table onto a { label, revenue, expenses, profit } chart series. */
export function toFinancialSeries(table: ImportedTable, mapping: Record<string, string>) {
  return table.rows.map((row, i) => {
    const revenue = Number(row[mapping["revenue"] ?? ""] ?? 0) || 0;
    const expenses = Number(row[mapping["expenses"] ?? ""] ?? 0) || 0;
    const profitKey = mapping["profit"];
    return {
      label: String(row[mapping["label"] ?? ""] ?? `Row ${i + 1}`),
      revenue,
      expenses,
      profit: profitKey ? Number(row[profitKey] ?? 0) || 0 : revenue - expenses,
    };
  });
}
