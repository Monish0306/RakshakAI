import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, RiskMeter, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Sparkles, ExternalLink } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_citizen/citizen/analyze/image")({
  head: () => ({ meta: [{ title: "Screenshot & OCR · Suraksha Bharat" }, { name: "description", content: "Drop a screenshot to extract text and verify UPI IDs, URLs and phone numbers." }] }),
  component: ImageAnalyzer,
});

function ImageAnalyzer() {
  const [done, setDone] = useState(false);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Citizen · Screenshot & OCR" title="What does this screenshot really say?"
        description="Extract text, verify UPI VPAs, URLs and phone numbers against the national blocklist."
        actions={<StatusPill tone="navy">On-device OCR · 12 languages</StatusPill>} />

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className="gov-card p-6">
          <div className="rounded-lg border-2 border-dashed bg-canvas p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-navy-soft text-navy grid place-items-center"><ImageIcon className="h-5 w-5" /></div>
            <div className="mt-3 font-medium">Drop an image or PDF</div>
            <div className="text-xs text-muted-foreground mt-1">.jpg / .png / .pdf · up to 15 MB</div>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline"><Upload className="h-4 w-4" /> Upload</Button>
              <Button variant="ghost" onClick={() => setDone(true)}><Sparkles className="h-4 w-4" /> Load sample</Button>
            </div>
          </div>

          {done && (
            <div className="mt-6">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Extracted text</div>
              <div className="font-mono text-sm bg-canvas border rounded p-4 leading-relaxed whitespace-pre-wrap">
{`URGENT — Your KYC is expiring today.
To keep your bank account active, complete verification via:
https://sbi-kyc-verify.online/
Or transfer ₹1 to VPA: sbi.verify@upi
Support: +91 90XX-XX3341`}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {done ? <RiskMeter score={83} /> : <div className="gov-card p-6 text-center text-sm text-muted-foreground">Upload or load a sample to begin.</div>}
          {done && (
            <div className="gov-card p-5">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Detected artefacts</div>
              <ul className="divide-y">
                <ArtefactRow type="URL" value="sbi-kyc-verify.online" tone="danger" note="Typosquat · created 3 days ago · not owned by SBI" />
                <ArtefactRow type="UPI VPA" value="sbi.verify@upi" tone="danger" note="Unverified handle · not on NPCI verified list" />
                <ArtefactRow type="Phone" value="+91 90XX-XX3341" tone="warning" note="Reported 47 times in last 30 days" />
                <ArtefactRow type="Amount" value="₹1 (test)" tone="info" note="Common scam pattern — test then re-authorise" />
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtefactRow({ type, value, tone, note }: { type: string; value: string; tone: "danger" | "warning" | "info"; note: string }) {
  return (
    <li className="py-3 flex items-start gap-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-16 pt-1">{type}</div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm flex items-center gap-1">{value} <ExternalLink className="h-3 w-3 text-muted-foreground" /></div>
        <div className="text-xs text-muted-foreground mt-0.5">{note}</div>
      </div>
      <StatusPill tone={tone}>{tone === "danger" ? "Block" : tone === "warning" ? "Caution" : "Info"}</StatusPill>
    </li>
  );
}
