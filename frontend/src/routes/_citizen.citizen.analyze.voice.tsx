import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SectionHeader, RiskMeter, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Mic, Upload, PlayCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_citizen/citizen/analyze/voice")({
  head: () => ({ meta: [{ title: "Voice Analyzer · Suraksha Bharat" }, { name: "description", content: "Detect AI-generated voices and known scam-call signatures." }] }),
  component: VoiceAnalyzer,
});

function VoiceAnalyzer() {
  const [done, setDone] = useState(false);
  const bars = Array.from({ length: 64 }).map((_, i) => 20 + Math.round(Math.abs(Math.sin(i * 0.42) * 45) + Math.random() * 20));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Citizen · Voice & deepfake" title="Is this voice real, or AI?"
        description="Upload a recording of the call, or record live. We look for synthetic-voice artefacts and match against known scam signatures."
        actions={<StatusPill tone="navy">On-device · speech-spoof-v2.1</StatusPill>} />

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className="gov-card p-6">
          <div className="rounded-lg border-2 border-dashed bg-canvas p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-navy-soft text-navy grid place-items-center"><Upload className="h-5 w-5" /></div>
            <div className="mt-3 font-medium">Drop an audio file, or record</div>
            <div className="text-xs text-muted-foreground mt-1">.wav / .mp3 / .m4a · up to 5 minutes · processed on-device</div>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline"><Upload className="h-4 w-4" /> Upload</Button>
              <Button><Mic className="h-4 w-4" /> Record</Button>
              <Button variant="ghost" onClick={() => setDone(true)}><Sparkles className="h-4 w-4" /> Load sample</Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Waveform · 0:42</div>
            <div className="h-24 flex items-end gap-[3px] px-1 bg-canvas rounded border">
              {bars.map((h, i) => (
                <div key={i} className={`w-1.5 rounded-sm ${done && (i > 20 && i < 32) ? "bg-destructive" : done ? "bg-navy/70" : "bg-muted-foreground/40"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-mono text-muted-foreground">
              <Button size="sm" variant="ghost" onClick={() => setDone(true)}><PlayCircle className="h-3.5 w-3.5" /> Analyze</Button>
              <span>Red spans = suspected AI-voice segments</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {done ? <RiskMeter score={88} /> : <div className="gov-card p-6 text-center text-sm text-muted-foreground">Upload or load a sample to begin.</div>}
          {done && (
            <div className="gov-card p-5 space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Detected traits</div>
              {[
                { k: "Synthetic-voice probability", v: 88, tone: "danger" as const },
                { k: "Speaker consistency across segments", v: 34, tone: "warning" as const },
                { k: "Match to known scam signature (voice: veena-v2)", v: 74, tone: "warning" as const },
                { k: "Ambient noise consistency", v: 12, tone: "info" as const },
              ].map(r => (
                <div key={r.k}>
                  <div className="flex justify-between text-sm"><span>{r.k}</span><span className="font-mono">{r.v}%</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1"><div className="h-full" style={{ width: `${r.v}%`, background: r.tone === "danger" ? "var(--destructive)" : r.tone === "warning" ? "var(--warning)" : "var(--info)" }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {done && (
        <div className="gov-card p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Transcript · flagged phrases highlighted</div>
          <div className="mt-3 font-mono text-sm bg-canvas p-4 rounded border leading-relaxed">
            <span className="text-muted-foreground">[00:04]</span> Sir, main <mark className="bg-destructive/15 text-destructive px-0.5 rounded">CBI Delhi</mark> se bol raha hoon…
            {"\n"}<span className="text-muted-foreground">[00:12]</span> Aapke Aadhaar par ek <mark className="bg-destructive/15 text-destructive px-0.5 rounded">parcel</mark> pakda gaya hai…
            {"\n"}<span className="text-muted-foreground">[00:24]</span> Camera on rakhein, <mark className="bg-destructive/15 text-destructive px-0.5 rounded">digital arrest</mark> ki prakriya shuru ki jaa rahi hai…
            {"\n"}<span className="text-muted-foreground">[00:39]</span> Aapko <mark className="bg-destructive/15 text-destructive px-0.5 rounded">₹2,50,000 transfer</mark> karna hoga…
          </div>
        </div>
      )}
    </div>
  );
}
