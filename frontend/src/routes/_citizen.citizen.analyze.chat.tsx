import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SectionHeader, RiskMeter, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sampleTranscript, sampleAnalysis } from "@/lib/mock/data";
import { PlayCircle, Sparkles, Shield, Copy, ChevronRight, AlertTriangle, PhoneCall, FileText } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_citizen/citizen/analyze/chat")({
  head: () => ({ meta: [{ title: "Chat Analyzer · Suraksha Bharat" }, { name: "description", content: "Paste any suspicious chat and get an on-device AI verdict with Scam DNA and explainability." }] }),
  component: ChatAnalyzer,
});

function ChatAnalyzer() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);

  const run = () => {
    if (!text.trim() && phase === "idle") return;
    setPhase("running"); setStep(0);
    const steps = sampleAnalysis.timeline.length;
    let i = 0;
    const tick = () => {
      i += 1; setStep(i);
      if (i < steps) setTimeout(tick, 260);
      else setTimeout(() => setPhase("done"), 200);
    };
    setTimeout(tick, 200);
  };

  const loadSample = () => { setText(sampleTranscript); setPhase("idle"); };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Citizen · AI conversation analyzer"
        title="Paste a chat, get an honest answer."
        description="Works with WhatsApp, SMS, Telegram, email — in 12 Indian languages. Runs on-device."
        actions={<StatusPill tone="navy">On-device · Model sd-arrest-v3.2.1</StatusPill>}
      />

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className="gov-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Conversation</div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={loadSample}><Sparkles className="h-3.5 w-3.5" /> Load sample</Button>
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.readText().then(t => setText(t)).catch(() => {})}><Copy className="h-3.5 w-3.5" /> Paste</Button>
            </div>
          </div>
          <Textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={14}
            placeholder="Paste the WhatsApp, SMS or email conversation here. You can include timestamps and phone numbers."
            className="font-mono text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-muted-foreground">{text.length} characters · {text.trim().split(/\s+/).filter(Boolean).length} words</div>
            <Button onClick={run} disabled={phase === "running"} className="h-10">
              <PlayCircle className="h-4 w-4" /> {phase === "running" ? "Analyzing…" : "Analyze now"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <PipelineCard step={step} running={phase === "running"} />
          {phase === "done" && <RiskMeter score={sampleAnalysis.score} />}
          {phase === "done" && (
            <div className="gov-card p-4 border-destructive/30 bg-destructive/[0.04]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <div className="font-medium text-destructive">{sampleAnalysis.scamType}</div>
              </div>
              <div className="text-sm text-foreground/80 mt-1">Do <b>not</b> send money. Hang up. Verify by calling 1930.</div>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="destructive"><a href="tel:1930"><PhoneCall className="h-3.5 w-3.5" /> Call 1930</a></Button>
                <Button asChild size="sm" variant="outline"><Link to="/citizen/cooling-off">Start cooling-off</Link></Button>
                <Button asChild size="sm" variant="ghost"><Link to="/citizen/report"><FileText className="h-3.5 w-3.5" /> File report</Link></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {phase === "done" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 gov-card p-5">
            <Tabs defaultValue="dna">
              <TabsList>
                <TabsTrigger value="dna">Scam DNA</TabsTrigger>
                <TabsTrigger value="highlights">Evidence</TabsTrigger>
                <TabsTrigger value="entities">Entities</TabsTrigger>
              </TabsList>
              <TabsContent value="dna" className="mt-4 space-y-3">
                {sampleAnalysis.signals.map(s => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.label}</span>
                      <span className="font-mono text-muted-foreground">{s.strength}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-destructive" style={{ width: `${s.strength}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground">{s.explain}</div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="highlights" className="mt-4 space-y-3">
                <div className="font-mono text-sm p-4 rounded bg-canvas border leading-relaxed whitespace-pre-wrap">
                  {highlight(sampleTranscript, sampleAnalysis.highlights.map(h => h.span))}
                </div>
                <div className="grid gap-2">
                  {sampleAnalysis.highlights.map(h => (
                    <div key={h.span} className="border rounded p-3">
                      <div className="text-xs font-mono text-destructive">“{h.span}”</div>
                      <div className="text-sm mt-1">{h.reason}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="entities" className="mt-4">
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-canvas text-xs font-mono uppercase text-muted-foreground">
                      <tr><th className="text-left p-2">Type</th><th className="text-left p-2">Value</th><th className="text-left p-2">Risk</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {sampleAnalysis.entities.map(e => (
                        <tr key={e.value}>
                          <td className="p-2 text-muted-foreground">{e.type}</td>
                          <td className="p-2 font-mono">{e.value}</td>
                          <td className="p-2"><StatusPill tone={e.risk === "high" ? "danger" : e.risk === "med" ? "warning" : "info"}>{e.risk.toUpperCase()}</StatusPill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="gov-card p-5">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Why this verdict</div>
            <div className="font-display font-semibold mt-0.5">Explainable AI</div>
            <ol className="mt-4 space-y-3">
              {sampleAnalysis.timeline.map((t, i) => (
                <li key={t.t} className="flex gap-3 text-sm">
                  <div className="text-[11px] font-mono text-muted-foreground w-12 pt-0.5 tabular-nums">{t.t}</div>
                  <div className="mt-1 h-2 w-2 rounded-full bg-navy shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{t.step}</div>
                    <div className="text-xs text-muted-foreground">{t.detail}</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-1" />
                </li>
              ))}
            </ol>
            <div className="mt-4 pt-4 border-t text-[11px] font-mono text-muted-foreground flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> Verifiable · every span shows the model, version, and confidence.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineCard({ step, running }: { step: number; running: boolean }) {
  const steps = ["Language", "Intent", "Scam DNA", "Knowledge match", "Verdict", "Explain"];
  return (
    <div className="gov-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">AI pipeline</div>
        {running && <StatusPill tone="info">Running · on-device</StatusPill>}
      </div>
      <div className="mt-4 grid grid-cols-6 gap-2">
        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step - 1;
          return (
            <div key={s} className="text-center">
              <div className={`mx-auto h-7 w-7 rounded-full grid place-items-center text-[11px] font-mono ${done ? "bg-navy text-primary-foreground" : active ? "bg-navy/20 text-navy animate-pulse" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
              <div className={`mt-1.5 text-[10px] font-mono uppercase tracking-widest ${done ? "text-navy" : "text-muted-foreground"}`}>{s}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function highlight(text: string, spans: string[]) {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length) {
    const hits = spans.map(s => ({ s, i: remaining.indexOf(s) })).filter(h => h.i >= 0).sort((a, b) => a.i - b.i);
    if (!hits.length) { nodes.push(remaining); break; }
    const h = hits[0];
    if (h.i > 0) nodes.push(remaining.slice(0, h.i));
    nodes.push(<mark key={key++} className="bg-destructive/15 text-destructive px-0.5 rounded">{h.s}</mark>);
    remaining = remaining.slice(h.i + h.s.length);
  }
  return nodes;
}
