import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionHeader, StatCard, StatusPill } from "@/components/primitives";
import { STATS, incidents, weeklyThreatSeries, scamCategories, trendingScripts, threatFeed, stateHotspots } from "@/lib/mock/data";
import { AlertTriangle, ShieldCheck, Landmark, Network, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/_command/command/")({
  head: () => ({ meta: [{ title: "Threat Dashboard · Command Centre" }, { name: "description", content: "Live threat intelligence dashboard for law enforcement, banks and telecoms." }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Threat Intelligence · Live" title="National Command Centre"
        description="Real-time posture across cybercrime, digital arrest scams, mule networks and FICN circulation."
        actions={<StatusPill tone="success">All systems operational</StatusPill>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active digital-arrest sessions" value={STATS.activeDigitalArrestSessions} delta="+12" trend="up" hint="last 15 min" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Scams blocked today"           value="4,218" delta="+38%" trend="up" hint="vs yesterday" icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="FICN notes flagged today"      value="347"  delta="+7%"  trend="up" hint="84 branches" icon={<Landmark className="h-4 w-4" />} />
        <StatCard label="Fraud rings under active watch" value={STATS.fraudRingsMapped} delta="+3" trend="up" hint="7 court-ready" icon={<Network className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 gov-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Threat volume · 14 days</div>
              <div className="font-display text-lg font-semibold mt-0.5">Detections vs blocked</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-navy" />Detections</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Blocked</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={weeklyThreatSeries}>
                <defs>
                  <linearGradient id="da" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--navy)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--navy)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="db" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--success)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="detections" stroke="var(--navy)" fill="url(#da)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocks"     stroke="var(--success)" fill="url(#db)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gov-card p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Category mix · 24h</div>
          <div className="font-display text-lg font-semibold mt-0.5">Where scams are concentrating</div>
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={scamCategories} innerRadius={44} outerRadius={70} paddingAngle={2} dataKey="value">
                  {scamCategories.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5 text-xs">
            {scamCategories.map(c => (
              <li key={c.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                <span className="flex-1">{c.name}</span>
                <span className="font-mono text-muted-foreground">{c.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 gov-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 hairline">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Live incidents · federated feed</div>
              <div className="font-display text-lg font-semibold mt-0.5">Priority queue</div>
            </div>
            <Link to="/command/investigations" className="text-xs text-navy hover:underline">Open workspace →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-xs font-mono uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Time</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Origin</th>
                  <th className="text-left p-3 font-medium">Target</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-right p-3 font-medium">Risk</th>
                  <th className="text-right p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {incidents.map(i => (
                  <tr key={i.id} className="hover:bg-canvas/60">
                    <td className="p-3 font-mono text-[11px]">{i.id}</td>
                    <td className="p-3 text-muted-foreground">{i.time}</td>
                    <td className="p-3">{i.type}</td>
                    <td className="p-3 font-mono text-[11px]">{i.origin}</td>
                    <td className="p-3">{i.target}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{i.amount ? `₹${i.amount.toLocaleString("en-IN")}` : "—"}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{i.risk}</td>
                    <td className="p-3 text-right">
                      <StatusPill tone={i.status === "active" ? "danger" : i.status === "escalated" ? "warning" : i.status === "contained" ? "info" : "neutral"}>{i.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="gov-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Threat feed</div>
                <div className="font-display text-lg font-semibold mt-0.5">Now</div>
              </div>
              <Link to="/command/threat-feed" className="text-xs text-navy hover:underline">All</Link>
            </div>
            <ul className="space-y-3">
              {threatFeed.slice(0, 4).map(t => (
                <li key={t.time} className="flex gap-3 text-sm">
                  <div className="text-[11px] font-mono text-muted-foreground w-10 pt-0.5">{t.time}</div>
                  <div className="flex-1 min-w-0">
                    <StatusPill tone={t.severity === "critical" ? "danger" : t.severity === "high" ? "warning" : t.severity === "medium" ? "info" : "neutral"}>{t.severity}</StatusPill>
                    <div className="mt-1 font-medium leading-snug">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="gov-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">District hotspots · 24h</div>
                <div className="font-display text-lg font-semibold mt-0.5">Top 6</div>
              </div>
              <Link to="/command/geo" className="text-xs text-navy hover:underline">Map</Link>
            </div>
            <ul className="space-y-2 text-sm">
              {stateHotspots.slice(0, 6).map(h => (
                <li key={h.district} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{h.district}</div>
                    <div className="text-[11px] font-mono text-muted-foreground uppercase">{h.state}</div>
                  </div>
                  <div className="font-mono tabular-nums text-sm">{h.count.toLocaleString("en-IN")}</div>
                  <StatusPill tone={h.tone}>{h.delta}</StatusPill>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="gov-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Trending scripts · 24h</div>
            <div className="font-display text-lg font-semibold mt-0.5">Script cluster surveillance</div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
          {trendingScripts.map(s => (
            <div key={s.title} className="border rounded p-3 bg-canvas/60">
              <div className="text-sm leading-snug">{s.title}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground uppercase">{s.channel}</span>
                <span className={s.delta.startsWith("+") ? "text-destructive" : "text-success"}>{s.delta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
