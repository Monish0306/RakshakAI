import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatCard, StatusPill } from "@/components/primitives";
import { modelCards } from "@/lib/mock/data";
import { ResponsiveContainer, LineChart, Line } from "recharts";

export const Route = createFileRoute("/_command/command/ai-health")({
  head: () => ({ meta: [{ title: "AI Health · Command Centre" }, { name: "description", content: "Real-time health of every AI agent — latency, accuracy, drift." }] }),
  component: Health,
});

const spark = (seed: number) => Array.from({ length: 24 }).map((_, i) => ({ v: 40 + Math.round(Math.sin((i + seed) / 2) * 15 + Math.random() * 8) }));

function Health() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="AI Health" title="Model performance · live"
        description="Latency, throughput, drift indicators and last audit date for every model in production."
        actions={<StatusPill tone="success">5 of 5 models within SLA</StatusPill>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Median inference latency" value="128 ms" delta="-12ms" trend="down" hint="on-device p50" />
        <StatCard label="Requests · 24h"           value="14.2 M" delta="+3%"   trend="up" />
        <StatCard label="Drift alerts · 7d"        value="1"      delta="—"     trend="flat" hint="graph-mule-v1 · retrained" />
        <StatCard label="False-positive rate"      value="0.9%"   delta="-0.3pp" trend="down" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {modelCards.map((m, i) => (
          <div key={m.id} className="gov-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{m.id} · {m.version}</div>
                <div className="font-display text-lg font-semibold mt-0.5">{m.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{m.purpose}</div>
              </div>
              <StatusPill tone={m.onDevice ? "success" : "info"}>{m.onDevice ? "On-device" : "Cloud"}</StatusPill>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Accuracy</div><div className="font-mono tabular-nums">{m.accuracy}%</div></div>
              <div><div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">FPR</div><div className="font-mono tabular-nums">{m.fpr}%</div></div>
              <div><div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Latency</div><div className="font-mono tabular-nums">{m.latencyMs} ms</div></div>
            </div>
            <div className="h-16 mt-3">
              <ResponsiveContainer>
                <LineChart data={spark(i)}>
                  <Line type="monotone" dataKey="v" stroke="var(--navy)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] font-mono text-muted-foreground">Last audit · {m.audit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
