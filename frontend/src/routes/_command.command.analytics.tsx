import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatCard } from "@/components/primitives";
import { weeklyThreatSeries, scamCategories } from "@/lib/mock/data";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/_command/command/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Command Centre" }, { name: "description", content: "Historical analytics across scam types, geographies and outcomes." }] }),
  component: Analytics,
});

const byOutcome = [
  { m: "May", blocked: 21000, prevented_loss: 82 },
  { m: "Jun", blocked: 24500, prevented_loss: 96 },
  { m: "Jul", blocked: 27100, prevented_loss: 112 },
  { m: "Aug", blocked: 30800, prevented_loss: 141 },
  { m: "Sep", blocked: 33600, prevented_loss: 168 },
  { m: "Oct", blocked: 39200, prevented_loss: 197 },
];

function Analytics() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Analytics" title="Historical intelligence"
        description="Rolling 6-month view of platform performance and scam evolution." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Scams blocked · 6mo"        value="176,200" delta="+41%" trend="up" />
        <StatCard label="Loss prevented · 6mo"      value="₹796 Cr" delta="+58%" trend="up" />
        <StatCard label="Model precision (mean)"    value="94.8%"    delta="+1.4pp" trend="up" />
        <StatCard label="False-positive rate"       value="0.9%"     delta="-0.3pp" trend="down" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 gov-card p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Blocks & prevented loss · 6mo</div>
          <div className="font-display text-lg font-semibold mt-0.5">Trend</div>
          <div className="h-64 mt-3">
            <ResponsiveContainer>
              <LineChart data={byOutcome}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                <Line type="monotone" dataKey="blocked" stroke="var(--navy)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="prevented_loss" stroke="var(--success)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="gov-card p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Category mix</div>
          <div className="font-display text-lg font-semibold mt-0.5">Where fraud lives</div>
          <div className="h-52 mt-3">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={scamCategories} innerRadius={38} outerRadius={64} paddingAngle={2} dataKey="value">
                  {scamCategories.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="gov-card p-5">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Detections by day</div>
        <div className="font-display text-lg font-semibold mt-0.5">14-day pulse</div>
        <div className="h-56 mt-3">
          <ResponsiveContainer>
            <BarChart data={weeklyThreatSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="detections" fill="var(--navy)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
