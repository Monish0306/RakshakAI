import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatCard, StatusPill } from "@/components/primitives";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_command/command/currency")({
  head: () => ({ meta: [{ title: "FICN Intelligence · Command Centre" }, { name: "description", content: "Counterfeit currency circulation intelligence." }] }),
  component: FicnPage,
});

const byDenom = [
  { denom: "₹500", seized: 1420, growth: 22 },
  { denom: "₹200", seized: 380,  growth: 8 },
  { denom: "₹100", seized: 244,  growth: -3 },
  { denom: "₹2000", seized: 190,  growth: 41 },
  { denom: "₹50",  seized: 62,   growth: 4 },
  { denom: "₹20",  seized: 45,   growth: -1 },
];

const bySeries = [
  { series: "4KA", batch: "2025-08 · Malda cluster", risk: "critical", notes: "Sharp intaglio absent · UV fibres present" },
  { series: "7QF", batch: "2025-06 · Purnia mill",   risk: "high",     notes: "Serial pattern re-use across 411 seizures" },
  { series: "2PC", batch: "2025-03 · unknown press", risk: "medium",   notes: "Watermark half-tone, low volume" },
];

function FicnPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="FICN · Counterfeit currency" title="Circulation intelligence"
        description="Field seizures + bank counter scans fused into a national FICN posture."
        actions={<StatusPill tone="warning">2 active batches</StatusPill>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Notes seized · 24h" value="347"      delta="+7%"  trend="up" hint="84 branches" />
        <StatCard label="Notes seized · 30d" value="2,341"    delta="+18%" trend="up" hint="all denominations" />
        <StatCard label="Face value · 30d"   value="₹11.4 L" delta="+22%" trend="up" hint="predominantly ₹500" />
        <StatCard label="Active print batches" value="2"       delta="—"    trend="flat" hint="under CBI trace" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 gov-card p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Seizures by denomination · 30d</div>
          <div className="font-display text-lg font-semibold mt-0.5">Where fakes are concentrating</div>
          <div className="h-64 mt-3">
            <ResponsiveContainer>
              <BarChart data={byDenom}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="denom" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="seized" fill="var(--navy)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="gov-card p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Active batches</div>
          <ul className="divide-y">
            {bySeries.map(b => (
              <li key={b.series} className="py-3">
                <div className="flex items-center gap-2">
                  <div className="font-mono font-semibold">Series {b.series}</div>
                  <StatusPill tone={b.risk === "critical" ? "danger" : b.risk === "high" ? "warning" : "info"}>{b.risk}</StatusPill>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{b.batch}</div>
                <div className="text-sm mt-1">{b.notes}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
