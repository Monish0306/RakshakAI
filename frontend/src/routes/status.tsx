import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SectionHeader, StatusPill } from "@/components/primitives";

export const Route = createFileRoute("/status")({
  head: () => ({ meta: [{ title: "System Status · Suraksha Bharat" }, { name: "description", content: "Live uptime and incident history for every subsystem." }] }),
  component: StatusPage,
});

const services = [
  { name: "Citizen Portal",              uptime: 99.99, status: "op" as const },
  { name: "Command Centre",              uptime: 99.98, status: "op" as const },
  { name: "AI Gateway · sd-arrest-v3",   uptime: 99.97, status: "op" as const },
  { name: "AI Gateway · cv-ficn-v2",     uptime: 99.94, status: "op" as const },
  { name: "AI Gateway · graph-mule-v1",  uptime: 99.62, status: "degraded" as const },
  { name: "NCRB relay",                   uptime: 99.99, status: "op" as const },
  { name: "Bank fraud desks (12 banks)",  uptime: 99.91, status: "op" as const },
  { name: "TRAI DLT connector",           uptime: 99.87, status: "op" as const },
];

const history = [
  { date: "Oct 06", title: "graph-mule-v1 retrained · brief degradation", tone: "warning" as const, detail: "Resolved 09:41 IST · 22 min elevated latency." },
  { date: "Sep 24", title: "TRAI DLT connector maintenance", tone: "info" as const, detail: "Scheduled window · 03:00–03:40 IST." },
  { date: "Sep 12", title: "Auth issuer certificate rotation", tone: "info" as const, detail: "No user-visible impact." },
];

function StatusPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="mx-auto max-w-[1100px] px-4 lg:px-8 py-10 flex-1 w-full space-y-8">
        <SectionHeader eyebrow="System Status" title="All operational."
          description="Uptime and incident history across every platform subsystem."
          actions={<StatusPill tone="success">Operational · 7 of 8 · 1 degraded</StatusPill>} />

        <div className="gov-card p-6 space-y-3">
          {services.map(s => (
            <div key={s.name} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{s.name}</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${s.status === "op" ? "bg-success" : "bg-warning"}`} style={{ width: `${s.uptime}%` }} />
                </div>
              </div>
              <div className="text-sm font-mono tabular-nums w-16 text-right">{s.uptime.toFixed(2)}%</div>
              <StatusPill tone={s.status === "op" ? "success" : "warning"}>{s.status === "op" ? "Operational" : "Degraded"}</StatusPill>
            </div>
          ))}
        </div>

        <div className="gov-card p-6">
          <div className="font-display font-semibold text-lg">Incident history · 30d</div>
          <ul className="mt-3 divide-y">
            {history.map(h => (
              <li key={h.date} className="py-3 flex items-start gap-4">
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground w-16 pt-0.5">{h.date}</div>
                <div className="flex-1">
                  <div className="font-medium">{h.title}</div>
                  <div className="text-sm text-muted-foreground">{h.detail}</div>
                </div>
                <StatusPill tone={h.tone}>{h.tone}</StatusPill>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
