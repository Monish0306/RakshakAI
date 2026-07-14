import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatCard, StatusPill } from "@/components/primitives";
import { useMemo } from "react";

export const Route = createFileRoute("/_command/command/network")({
  head: () => ({ meta: [{ title: "Fraud Network Graph · Command Centre" }, { name: "description", content: "Graph AI mapping accounts, devices, phone numbers and mules into actionable clusters." }] }),
  component: NetworkGraphPage,
});

type Node = { id: string; label: string; kind: "victim" | "phone" | "account" | "device" | "mule" | "hub"; x: number; y: number; r: number };
type Edge = { a: string; b: string; strength: number };

function useMockGraph(): { nodes: Node[]; edges: Edge[] } {
  return useMemo(() => {
    const nodes: Node[] = [
      { id: "hub-1", label: "Op. Nightshade hub", kind: "hub", x: 500, y: 260, r: 22 },
      { id: "d-1",   label: "device AA:12", kind: "device", x: 340, y: 130, r: 12 },
      { id: "d-2",   label: "device 9F:07", kind: "device", x: 660, y: 130, r: 12 },
      { id: "a-1",   label: "acct 4052…9301", kind: "account", x: 240, y: 260, r: 14 },
      { id: "a-2",   label: "acct 5182…6612", kind: "account", x: 760, y: 260, r: 14 },
      { id: "m-1",   label: "mule · Jamtara-01", kind: "mule", x: 180, y: 380, r: 12 },
      { id: "m-2",   label: "mule · Jamtara-02", kind: "mule", x: 320, y: 420, r: 12 },
      { id: "m-3",   label: "mule · Malda-01",   kind: "mule", x: 680, y: 420, r: 12 },
      { id: "m-4",   label: "mule · Delhi-07",   kind: "mule", x: 820, y: 380, r: 12 },
      { id: "p-1",   label: "+91 87XX…12", kind: "phone", x: 410, y: 60, r: 11 },
      { id: "p-2",   label: "+91 87XX…41", kind: "phone", x: 500, y: 40, r: 11 },
      { id: "p-3",   label: "+91 90XX…08", kind: "phone", x: 590, y: 60, r: 11 },
      { id: "v-1",   label: "victim · Pune",       kind: "victim", x: 100, y: 470, r: 10 },
      { id: "v-2",   label: "victim · Bengaluru",  kind: "victim", x: 260, y: 500, r: 10 },
      { id: "v-3",   label: "victim · Chennai",    kind: "victim", x: 500, y: 520, r: 10 },
      { id: "v-4",   label: "victim · Kolkata",    kind: "victim", x: 740, y: 500, r: 10 },
      { id: "v-5",   label: "victim · Delhi",      kind: "victim", x: 900, y: 470, r: 10 },
    ];
    const edges: Edge[] = [
      { a: "hub-1", b: "d-1", strength: 3 }, { a: "hub-1", b: "d-2", strength: 3 },
      { a: "hub-1", b: "a-1", strength: 4 }, { a: "hub-1", b: "a-2", strength: 4 },
      { a: "hub-1", b: "p-1", strength: 2 }, { a: "hub-1", b: "p-2", strength: 3 }, { a: "hub-1", b: "p-3", strength: 2 },
      { a: "a-1", b: "m-1", strength: 2 }, { a: "a-1", b: "m-2", strength: 2 },
      { a: "a-2", b: "m-3", strength: 2 }, { a: "a-2", b: "m-4", strength: 2 },
      { a: "m-1", b: "v-1", strength: 1 }, { a: "m-2", b: "v-2", strength: 1 }, { a: "m-2", b: "v-3", strength: 1 },
      { a: "m-3", b: "v-4", strength: 1 }, { a: "m-4", b: "v-5", strength: 1 },
      { a: "d-1", b: "a-1", strength: 2 }, { a: "d-2", b: "a-2", strength: 2 },
      { a: "p-1", b: "d-1", strength: 1 }, { a: "p-3", b: "d-2", strength: 1 },
    ];
    return { nodes, edges };
  }, []);
}

const kindColor = {
  hub: "var(--destructive)",
  account: "var(--navy)",
  device: "var(--info)",
  phone: "var(--warning)",
  mule: "#8b5cf6",
  victim: "var(--success)",
} as const;

function NetworkGraphPage() {
  const { nodes, edges } = useMockGraph();
  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Graph AI · Network intelligence" title="Op. Nightshade — cross-border cluster"
        description="Graph clustering of accounts, devices, phone numbers and mule networks. Auto-refreshes every 30s in production."
        actions={<StatusPill tone="navy">Cluster #DA-041 · confidence 94%</StatusPill>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Nodes"        value={nodes.length}  hint="16 in cluster" />
        <StatCard label="Edges"        value={edges.length}  hint="weighted co-occurrence" />
        <StatCard label="Est. victims" value="143"          delta="+22 · 24h" trend="up" />
        <StatCard label="Est. loss"    value="₹8.75 Cr"     delta="+₹47 L · 24h" trend="up" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="gov-card p-3 overflow-hidden">
          <svg viewBox="0 0 1000 580" className="w-full h-[560px]">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1000" height="580" fill="url(#grid)" opacity="0.4" />
            {edges.map((e, i) => {
              const a = nodeById[e.a], b = nodeById[e.b];
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--muted-foreground)" strokeOpacity={0.3} strokeWidth={e.strength * 0.7} />;
            })}
            {nodes.map(n => (
              <g key={n.id} className="cursor-pointer">
                <circle cx={n.x} cy={n.y} r={n.r + 4} fill={kindColor[n.kind]} opacity={0.18} />
                <circle cx={n.x} cy={n.y} r={n.r} fill={kindColor[n.kind]} />
                <text x={n.x} y={n.y + n.r + 12} textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" fill="var(--foreground)">{n.label}</text>
              </g>
            ))}
          </svg>
        </div>

        <div className="space-y-4">
          <div className="gov-card p-4">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Legend</div>
            {Object.entries(kindColor).map(([k, c]) => (
              <div key={k} className="flex items-center gap-2 text-sm py-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                <span className="capitalize">{k}</span>
              </div>
            ))}
          </div>
          <div className="gov-card p-4">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Cluster actions</div>
            <div className="space-y-2 text-sm">
              <button className="w-full text-left border rounded p-2 hover:bg-canvas">Freeze all linked accounts</button>
              <button className="w-full text-left border rounded p-2 hover:bg-canvas">Notify all victim banks</button>
              <button className="w-full text-left border rounded p-2 hover:bg-canvas">Dispatch to MHA · I4C</button>
              <button className="w-full text-left border rounded p-2 hover:bg-canvas">Export cluster (JSON · GraphML)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
