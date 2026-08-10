import { useCallback, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import html2canvas from "html2canvas";
import { Download, Maximize2, MessageSquarePlus, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type FinancialPoint = { label: string; revenue: number; expenses: number; profit: number };

const CHART_TYPES = [
  { key: "financial", label: "Financial Projection" },
  { key: "market", label: "Market Sizing" },
  { key: "roadmap", label: "Roadmap" },
  { key: "competitive", label: "Competitive Map" },
  { key: "kpi", label: "KPI Dashboard" },
] as const;

type ChartKey = (typeof CHART_TYPES)[number]["key"];

const ORANGE = "var(--primary)";
const ORANGE_LIGHT = "var(--primary-light)";
const ORANGE_GLOW = "var(--primary-glow)";
const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };

function Grad({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={ORANGE} stopOpacity={0.85} />
        <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0.15} />
      </linearGradient>
    </defs>
  );
}

export function FinancialProjection({ data, onPick }: { data: FinancialPoint[]; onPick: (l: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} onClick={(e) => e?.activeLabel && onPick(String(e.activeLabel))}>
        <Grad id="revGrad" />
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} />
        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
        <Legend />
        <Area type="monotone" dataKey="revenue" stroke={ORANGE} fill="url(#revGrad)" />
        <Line type="monotone" dataKey="expenses" stroke={ORANGE_LIGHT} dot />
        <Line type="monotone" dataKey="profit" stroke={ORANGE_GLOW} dot />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MarketSizing({ tam }: { tam: number }) {
  const data = [
    { name: "TAM", value: tam || 100 },
    { name: "SAM", value: (tam || 100) * 0.35 },
    { name: "SOM", value: (tam || 100) * 0.08 },
  ];
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical">
        <Grad id="mktGrad" />
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" {...axis} />
        <YAxis type="category" dataKey="name" {...axis} />
        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={[ORANGE, ORANGE_LIGHT, ORANGE_GLOW][i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RoadmapGantt() {
  const data = [
    { phase: "Discovery", start: 0, span: 2 },
    { phase: "Build MVP", start: 2, span: 4 },
    { phase: "Pilot", start: 5, span: 3 },
    { phase: "GTM launch", start: 8, span: 4 },
  ];
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" stackOffset="expand">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" domain={[0, 12]} {...axis} />
        <YAxis type="category" dataKey="phase" width={90} {...axis} />
        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
        <Bar dataKey="start" stackId="a" fill="transparent" />
        <Bar dataKey="span" stackId="a" fill={ORANGE} radius={8} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CompetitiveMap({
  competitors,
}: {
  competitors: { name: string; strength: string; threat: string }[];
}) {
  const data = competitors.map((c, i) => ({
    name: c.name || `Competitor ${i + 1}`,
    x: (c.strength?.length ?? 0) % 100,
    y: (c.threat?.length ?? 0) % 100,
    z: 200,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" dataKey="x" name="Strength" {...axis} />
        <YAxis type="number" dataKey="y" name="Threat" {...axis} />
        <ZAxis type="number" dataKey="z" range={[80, 300]} />
        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
        <Scatter data={data} fill={ORANGE} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function KPIDashboard({ ltvCac }: { ltvCac: number }) {
  const data = [
    { kpi: "Growth", value: 72 },
    { kpi: "Retention", value: 64 },
    { kpi: "Margin", value: 58 },
    { kpi: "LTV:CAC", value: Math.min(100, (ltvCac || 1) * 20) },
    { kpi: "Runway", value: 80 },
  ];
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="kpi" {...axis} />
        <PolarRadiusAxis {...axis} />
        <Radar dataKey="value" stroke={ORANGE} fill={ORANGE} fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ChartboardCanvas({
  financial,
  tam,
  competitors,
  ltvCac,
}: {
  financial: FinancialPoint[];
  tam: number;
  competitors: { name: string; strength: string; threat: string }[];
  ltvCac: number;
}) {
  const [type, setType] = useState<ChartKey>("financial");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [comments, setComments] = useState<{ id: number; point: string; text: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const shotRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  const handleWheel = useCallback((e: WheelEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    const { zoom: z, offset: o } = stateRef.current;
    const next = Math.min(3, Math.max(0.5, z * Math.exp(-dy * 0.0015)));
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const k = next / z;
    setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
    setZoom(next);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleWheel(e);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [handleWheel]);

  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  async function exportPng() {
    if (!shotRef.current) return;
    try {
      const canvas = await html2canvas(shotRef.current, { scale: 3, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `ayglobe-${type}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Chart exported at 300dpi");
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {CHART_TYPES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setType(c.key)}
            className={cn(
              "min-h-10 rounded-full border border-border px-4 text-xs font-medium text-muted-foreground",
              type === c.key && "border-primary bg-primary/12 text-primary-light",
            )}
          >
            {c.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Reset view"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={exportPng}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" /> Export PNG
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setOffset({
            x: drag.current.ox + (e.clientX - drag.current.x),
            y: drag.current.oy + (e.clientY - drag.current.y),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        className="mt-4 cursor-grab overflow-hidden rounded-xl border border-border bg-background/60 active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <div
          ref={shotRef}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          className="p-4"
        >
          {type === "financial" && (
            <FinancialProjection
              data={financial}
              onPick={(label) => {
                const text = window.prompt(`Comment on ${label}`);
                if (text) setComments((c) => [...c, { id: Date.now(), point: label, text }]);
              }}
            />
          )}
          {type === "market" && <MarketSizing tam={tam} />}
          {type === "roadmap" && <RoadmapGantt />}
          {type === "competitive" && <CompetitiveMap competitors={competitors} />}
          {type === "kpi" && <KPIDashboard ltvCac={ltvCac} />}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Drag to pan · scroll to zoom · click a data point on the financial chart to attach a comment.
      </p>

      {comments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-background/60 p-3 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-primary-light">
                <MessageSquarePlus className="h-3.5 w-3.5" /> {c.point}
              </span>
              <p className="mt-1 text-muted-foreground">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
