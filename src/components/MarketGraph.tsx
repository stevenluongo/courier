"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export type GraphListing = {
  id: string;
  name: string;
  kind: "api" | "human" | "orchestrator";
  source: "chargehand" | "pay.sh";
  priceUsd: number;
};

type Link = { source: string; target: string; active: boolean; human: boolean };

export default function MarketGraph({
  listings,
  activeEdges,
}: {
  listings: GraphListing[];
  activeEdges: { to: string; human: boolean }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 500 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const nodes = listings.map((l) => ({ ...l }));
    const hiredIds = new Set(activeEdges.map((e) => e.to));
    // Ambient edges: a faint web among federated sellers so the market looks alive
    const links: Link[] = [];
    for (let i = 0; i < listings.length; i++) {
      const l = listings[i];
      if (l.kind === "orchestrator") continue;
      if (i % 6 === 0) {
        const j = (i * 7 + 13) % listings.length;
        if (listings[j].id !== l.id && listings[j].kind !== "orchestrator") {
          links.push({ source: l.id, target: listings[j].id, active: false, human: false });
        }
      }
    }
    for (const e of activeEdges) {
      links.push({ source: "orchestrator", target: e.to, active: true, human: e.human });
    }
    return { nodes, links, hiredIds };
  }, [listings, activeEdges]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        width={dims.w}
        height={dims.h}
        graphData={{ nodes: data.nodes, links: data.links }}
        backgroundColor="#09090b"
        nodeId="id"
        nodeVal={(n: any) => (n.kind === "orchestrator" ? 14 : n.kind === "human" ? 8 : data.hiredIds.has(n.id) ? 6 : 2.5)}
        nodeColor={(n: any) =>
          n.kind === "orchestrator"
            ? "#fbbf24"
            : n.kind === "human"
            ? "#34d399"
            : data.hiredIds.has(n.id)
            ? "#818cf8"
            : n.source === "pay.sh"
            ? "#3f4a6b"
            : "#52525b"
        }
        nodeLabel={(n: any) => `${n.name}${n.priceUsd ? ` · $${n.priceUsd.toFixed(2)}` : ""}`}
        nodeCanvasObjectMode={(n: any) =>
          n.kind === "orchestrator" || n.kind === "human" || data.hiredIds.has(n.id) ? "after" : undefined
        }
        nodeCanvasObject={(n: any, ctx: any, scale: number) => {
          const label = n.kind === "orchestrator" ? "CHARGEHAND" : n.name;
          const size = Math.max(10 / scale, 3);
          ctx.font = `${n.kind === "orchestrator" ? "bold " : ""}${size}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = n.kind === "human" ? "#6ee7b7" : n.kind === "orchestrator" ? "#fcd34d" : "#a5b4fc";
          ctx.fillText(label, n.x!, n.y! + size * 1.8);
        }}
        linkColor={(l: any) => (l.active ? (l.human ? "#34d399" : "#818cf8") : "#1c1f2e")}
        linkWidth={(l: any) => (l.active ? 2 : 0.4)}
        linkDirectionalParticles={(l: any) => (l.active ? 4 : 0)}
        linkDirectionalParticleSpeed={0.012}
        linkDirectionalParticleWidth={(l: any) => (l.human ? 5 : 3.5)}
        linkDirectionalParticleColor={(l: any) => (l.human ? "#34d399" : "#a5b4fc")}
        cooldownTicks={200}
        enableNodeDrag={false}
      />
    </div>
  );
}
