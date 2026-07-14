import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, RiskMeter, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, ScanLine, Check, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_citizen/citizen/analyze/currency")({
  head: () => ({ meta: [{ title: "Counterfeit Currency Check · Suraksha Bharat" }, { name: "description", content: "Detect fake Indian currency notes across all denominations using computer vision." }] }),
  component: CurrencyCheck,
});

function CurrencyCheck() {
  const [done, setDone] = useState(false);

  const features = [
    { name: "Watermark of Mahatma Gandhi", ok: true,  conf: 0.97, note: "Multi-tone watermark detected" },
    { name: "Security thread (colour shift)", ok: false, conf: 0.62, note: "Colour shift absent; thread reads 'ЯBI' — mirrored" },
    { name: "Microprint · 'RBI' and '500'", ok: false, conf: 0.71, note: "Microprint blurred; edges rasterised" },
    { name: "Latent image (denomination)",   ok: true,  conf: 0.88, note: "Faint outline detected on tilt" },
    { name: "See-through register",           ok: false, conf: 0.55, note: "Register misaligned by 1.4mm" },
    { name: "Serial number pattern (4KA)",    ok: false, conf: 0.66, note: "Prefix 4KA matches known FICN batch reported by RBI (2025-08)" },
    { name: "UV features (simulated)",        ok: true,  conf: 0.83, note: "Fibres detected under simulated UV" },
    { name: "Intaglio (raised) print",        ok: false, conf: 0.49, note: "Tactile relief pattern flat — printed on offset press" },
  ];
  const failed = features.filter(f => !f.ok).length;
  const score = 34 + failed * 8;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Citizen · FICN detection" title="Is this note genuine?"
        description="Point your camera at the note (both sides). Works with all denominations. Deployable to bank counters and field devices."
        actions={<StatusPill tone="navy">On-device · cv-ficn-v2.4</StatusPill>} />

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="gov-card p-6">
          <div className="relative rounded-lg overflow-hidden bg-canvas border-2 border-dashed aspect-[16/9] grid place-items-center">
            <div className="absolute inset-6 border-2 border-navy/40 rounded-md" />
            <div className="absolute top-3 left-3 text-[11px] font-mono text-muted-foreground">SCAN FRAME · ALIGN NOTE</div>
            {done && <div className="absolute top-3 right-3 text-[11px] font-mono px-2 py-0.5 rounded bg-destructive text-primary-foreground">FICN suspected</div>}
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-navy-soft text-navy grid place-items-center"><ScanLine className="h-6 w-6" /></div>
              <div className="mt-3 font-medium">Place a ₹500 note within the frame</div>
              <div className="text-xs text-muted-foreground mt-1">Front side first · then flip when prompted</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-center">
            <Button variant="outline"><Camera className="h-4 w-4" /> Use camera</Button>
            <Button onClick={() => setDone(true)}><Sparkles className="h-4 w-4" /> Load sample</Button>
          </div>
        </div>

        <div className="space-y-4">
          {done ? <RiskMeter score={score} /> : <div className="gov-card p-6 text-center text-sm text-muted-foreground">Scan a note to see per-feature analysis.</div>}
          {done && (
            <div className="gov-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Denomination · ₹500 · series 4KA</div>
                <StatusPill tone="danger">{failed} of {features.length} failed</StatusPill>
              </div>
              <ul className="divide-y">
                {features.map(f => (
                  <li key={f.name} className="py-2.5 flex items-start gap-3">
                    <div className={`h-5 w-5 rounded-full grid place-items-center shrink-0 ${f.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {f.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-snug">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.note}</div>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground tabular-nums">{Math.round(f.conf * 100)}%</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
