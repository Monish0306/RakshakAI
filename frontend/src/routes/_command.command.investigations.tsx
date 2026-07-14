import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SectionHeader, StatusPill, StatCard } from "@/components/primitives";
import { investigations } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, ChevronRight, MessagesSquare, Fingerprint, Users, FileText, ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/_command/command/investigations")({
  head: () => ({ meta: [{ title: "Investigations · Command Centre" }, { name: "description", content: "Master-detail investigation workspace with evidence and timeline." }] }),
  component: Investigations,
});

function Investigations() {
  const [selectedId, setSelectedId] = useState(investigations[0].id);
  const selected = investigations.find(i => i.id === selectedId)!;

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Investigations" title="Case workspace"
        description="Multi-agency case management with linked evidence, timeline and network intelligence." />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <div className="gov-card p-0 overflow-hidden">
          <div className="p-3 border-b flex gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input className="h-8 pl-8 text-sm" placeholder="Search cases, VPAs, phones…" />
            </div>
            <Button size="sm" variant="outline">New</Button>
          </div>
          <ul className="max-h-[70vh] overflow-auto divide-y">
            {investigations.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3 hover:bg-canvas ${c.id === selectedId ? "bg-navy-soft" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{c.id}</span>
                    <StatusPill tone={c.severity === "critical" ? "danger" : c.severity === "high" ? "warning" : c.severity === "medium" ? "info" : "neutral"}>{c.severity}</StatusPill>
                  </div>
                  <div className="mt-1 font-medium text-sm leading-snug">{c.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{c.agency} · {c.lead}</span>
                    <span>{c.updated}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="gov-card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                {selected.id} <ChevronRight className="h-3 w-3" /> {selected.agency}
              </div>
              <h2 className="font-display text-2xl font-semibold mt-1">{selected.title}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusPill tone={selected.severity === "critical" ? "danger" : "warning"}>{selected.severity.toUpperCase()}</StatusPill>
                <StatusPill tone="navy">{selected.status.replace("_", " ")}</StatusPill>
                <StatusPill tone="info"><MapPin className="h-3 w-3" /> {selected.district}, {selected.state}</StatusPill>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Assign</Button>
              <Button size="sm">Escalate to MHA</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Victims"           value={selected.victims.toLocaleString("en-IN")} />
            <StatCard label="Est. loss"         value={`₹${(selected.loss / 1e7).toFixed(2)} Cr`} />
            <StatCard label="Scam type"         value={selected.scamType} />
            <StatCard label="Last update"       value={selected.updated} />
          </div>

          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="suspects">Suspects</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <ol className="relative border-l pl-6 space-y-5">
                {[
                  { t: "T + 0", title: "First victim complaint filed", tone: "danger" as const, detail: "Bengaluru cybercrime desk · complainant received CBI impersonation call, transferred ₹4.8 L." },
                  { t: "T + 42m", title: "AI cluster match", tone: "info" as const, detail: "Suraksha Bharat identified script overlap across 12 unrelated complaints (cluster #DA-041)." },
                  { t: "T + 1h 20m", title: "3 mule accounts frozen", tone: "success" as const, detail: "Auto-request sent to SBI, HDFC, Axis fraud desks · 3 of 5 accounts frozen within 40m." },
                  { t: "T + 4h", title: "Cross-border spoof origin isolated", tone: "warning" as const, detail: "Telecom DLT trace resolves 82 caller IDs to a single VoIP gateway in Myanmar." },
                  { t: "T + 12h", title: "Multi-jurisdiction bulletin dispatched", tone: "navy" as const, detail: "3 states, 6 districts · Op. Nightshade code assigned · MHA notified." },
                ].map((e, i) => (
                  <li key={i} className="ml-2">
                    <span className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-background`} style={{ background: e.tone === "danger" ? "var(--destructive)" : e.tone === "success" ? "var(--success)" : e.tone === "warning" ? "var(--warning)" : e.tone === "navy" ? "var(--navy)" : "var(--info)" }} />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground">{e.t}</span>
                      <StatusPill tone={e.tone}>{e.tone === "navy" ? "action" : e.tone}</StatusPill>
                    </div>
                    <div className="mt-1 font-medium">{e.title}</div>
                    <div className="text-sm text-muted-foreground">{e.detail}</div>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="evidence" className="mt-4">
              <ul className="divide-y border rounded">
                {[
                  { id: "EV-58210", type: "Audio call recording", size: "4.2 MB", icon: <MessagesSquare className="h-4 w-4" /> },
                  { id: "EV-58207", type: "Screenshot · WhatsApp thread", size: "1.1 MB", icon: <Fingerprint className="h-4 w-4" /> },
                  { id: "EV-58198", type: "Transcript · PDF", size: "212 KB", icon: <FileText className="h-4 w-4" /> },
                ].map(e => (
                  <li key={e.id} className="p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-navy-soft text-navy grid place-items-center">{e.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{e.type}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{e.id} · {e.size}</div>
                    </div>
                    <StatusPill tone="success"><ShieldCheck className="h-3 w-3" /> Chain intact</StatusPill>
                    <Button size="sm" variant="ghost">Open</Button>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="suspects" className="mt-4 space-y-2">
              {[
                { id: "SUS-01", label: "+91 87XX XXXXXX", role: "Voice caller · CBI impersonator" },
                { id: "SUS-02", label: "acct/405218779301 · Axis Bank",  role: "Recipient account · frozen" },
                { id: "SUS-03", label: "device/AA:12:34:XX",             role: "Common device across 47 mule accounts" },
              ].map(s => (
                <div key={s.id} className="border rounded p-3 flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-mono">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.role}</div>
                  </div>
                  <StatusPill tone="warning">Under watch</StatusPill>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="notes" className="mt-4 text-sm text-muted-foreground">
              Officer notes (private to assigned team). Notes are timestamped, hashed, and included in the court-ready bundle.
            </TabsContent>

            <TabsContent value="report" className="mt-4">
              <div className="border rounded p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-navy" />
                <div className="flex-1">
                  <div className="font-medium">Generate court-ready evidence bundle</div>
                  <div className="text-xs text-muted-foreground">All evidence · timeline · AI verdicts · chain-of-custody · digital signature.</div>
                </div>
                <Button>Generate PDF</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
