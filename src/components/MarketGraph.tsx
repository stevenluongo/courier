"use client";

import { useMemo } from "react";

export type GraphListing = {
  id: string;
  name: string;
  kind: "api" | "human" | "orchestrator";
  source: "chargehand" | "pay.sh";
  priceUsd: number;
  capability?: string;
  category?: string;
};

type Edge = { to: string; human: boolean };
type Payment = { name: string; amountUsd: number; kind: string };

const W = 1000;
const H = 700;
const CX = W / 2;
const CY = H / 2;

function polar(angleDeg: number, r: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

export default function MarketGraph({
  listings,
  activeEdges,
  payments = [],
}: {
  listings: GraphListing[];
  activeEdges: Edge[];
  payments?: Payment[];
}) {
  const layout = useMemo(() => {
    const inner = listings.filter((l) => l.kind !== "orchestrator" && l.source === "chargehand");
    const outer = listings.filter((l) => l.source === "pay.sh");

    // Outer ring: Pay.sh supply grouped into category sectors
    const byCat = new Map<string, GraphListing[]>();
    for (const l of outer) {
      const c = l.category || "other";
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c)!.push(l);
    }
    const cats = [...byCat.entries()].sort((a, b) => b[1].length - a[1].length);
    const total = outer.length || 1;
    const nodes: (GraphListing & { x: number; y: number })[] = [];
    const sectors: { label: string; x: number; y: number; count: number }[] = [];
    let angle = 0;
    const GAP = 4;
    for (const [cat, items] of cats) {
      const span = (items.length / total) * (360 - cats.length * GAP);
      items.forEach((l, i) => {
        const a = angle + (span * (i + 0.5)) / items.length;
        const r = 265 + (i % 3) * 22; // three shallow sub-rings to avoid crowding
        nodes.push({ ...l, ...polar(a, r) });
      });
      const mid = polar(angle + span / 2, 328);
      sectors.push({ label: cat.replace(/_/g, " "), x: mid.x, y: mid.y, count: items.length });
      angle += span + GAP;
    }

    // Inner ring: first-party sellers + the human worker
    inner.forEach((l, i) => {
      const a = (360 / inner.length) * i + 24;
      nodes.push({ ...l, ...polar(a, 140) });
    });

    return { nodes, sectors };
  }, [listings]);

  const paidTo = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of payments) {
      // match payment names back to listing ids via node names
      const node = layout.nodes.find((n) => n.name === p.name);
      if (node) m.set(node.id, (m.get(node.id) || 0) + p.amountUsd);
    }
    return m;
  }, [payments, layout.nodes]);

  const hired = new Set(activeEdges.map((e) => e.to));

  return (
    <div className="w-full h-full relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="transparent" />
        <circle cx={CX} cy={CY} r={330} fill="url(#bgGlow)" />
        {/* orbit guides */}
        <circle cx={CX} cy={CY} r={140} fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx={CX} cy={CY} r={287} fill="none" stroke="#1c1c1f" strokeWidth="1" strokeDasharray="2 6" />

        {/* sector labels */}
        {layout.sectors.map((s) => (
          <text
            key={s.label}
            x={s.x}
            y={s.y}
            textAnchor="middle"
            className="fill-zinc-600"
            fontSize="11"
            style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}
          >
            {s.label} · {s.count}
          </text>
        ))}

        {/* active payment edges */}
        {activeEdges.map((e) => {
          const n = layout.nodes.find((x) => x.id === e.to);
          if (!n) return null;
          const color = e.human ? "#34d399" : "#818cf8";
          const paid = paidTo.get(n.id);
          const mx = (CX + n.x) / 2;
          const my = (CY + n.y) / 2;
          return (
            <g key={e.to}>
              <line x1={CX} y1={CY} x2={n.x} y2={n.y} stroke={color} strokeOpacity="0.25" strokeWidth="3" />
              <line
                x1={CX}
                y1={CY}
                x2={n.x}
                y2={n.y}
                stroke={color}
                strokeWidth="2"
                strokeDasharray="6 14"
                className="flow-line"
              />
              <circle r="4" fill={color}>
                <animateMotion dur="1.4s" repeatCount="indefinite" path={`M ${CX} ${CY} L ${n.x} ${n.y}`} />
              </circle>
              {paid !== undefined && (
                <g>
                  <rect x={mx - 26} y={my - 11} width="52" height="20" rx="10" fill="#09090b" stroke={color} strokeWidth="1" />
                  <text x={mx} y={my + 4} textAnchor="middle" fill={color} fontSize="12" fontWeight="700">
                    ${paid.toFixed(2)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* supply nodes */}
        {layout.nodes.map((n) => {
          const isHired = hired.has(n.id);
          const isHuman = n.kind === "human";
          const base = isHuman ? "#34d399" : n.source === "pay.sh" ? "#4f5b93" : "#8b8b96";
          const color = isHired ? (isHuman ? "#34d399" : "#a5b4fc") : base;
          const r = isHuman ? 11 : isHired ? 8 : n.source === "chargehand" ? 6 : 3.5;
          return (
            <g key={n.id} className={isHired ? "hired-node" : undefined}>
              {isHired && <circle cx={n.x} cy={n.y} r={r + 7} fill="none" stroke={color} strokeOpacity="0.5" className="pulse-ring" />}
              <circle cx={n.x} cy={n.y} r={r} fill={color} fillOpacity={isHired || isHuman ? 1 : 0.55}>
                <title>
                  {n.name} · ${n.priceUsd.toFixed(2)}
                </title>
              </circle>
              {(isHired || isHuman || n.source === "chargehand") && (
                <text x={n.x} y={n.y + r + 14} textAnchor="middle" fontSize="12" fontWeight={isHired ? 700 : 500} fill={isHired || isHuman ? color : "#71717a"}>
                  {n.name}
                  {isHuman ? " 🧑" : ""}
                </text>
              )}
            </g>
          );
        })}

        {/* center: the orchestrator */}
        <circle cx={CX} cy={CY} r={80} fill="url(#centerGlow)" />
        <circle cx={CX} cy={CY} r={26} fill="#09090b" stroke="#fbbf24" strokeWidth="2.5" />
        <text x={CX} y={CY - 2} textAnchor="middle" fontSize="13" fontWeight="900" fill="#fcd34d">
          CHARGE
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="13" fontWeight="900" fill="#fcd34d">
          HAND
        </text>
      </svg>

      {/* legend */}
      <div className="absolute top-3 left-4 flex gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> orchestrator
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#4f5b93] inline-block" /> Pay.sh federated supply
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zinc-400 inline-block" /> Chargehand sellers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> human worker
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-400 inline-block" /> hired · $ = paid
        </span>
      </div>
    </div>
  );
}
