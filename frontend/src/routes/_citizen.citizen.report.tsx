import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, FileText, Send, Shield } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_citizen/citizen/report")({
  head: () => ({ meta: [{ title: "Report to NCRB · Suraksha Bharat" }, { name: "description", content: "Guided cyber-crime reporting to NCRB, your bank and telecom regulator." }] }),
  component: Report,
});

const steps = ["What happened", "Evidence", "Your details", "Review & submit"];

function Report() {
  const [i, setI] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="gov-card p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-success/15 text-success grid place-items-center"><CheckCircle2 className="h-6 w-6" /></div>
          <h2 className="mt-4 font-display text-2xl font-semibold">Report filed · NCRB Ack #NCR-2025-8871204</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your report has been forwarded to NCRB, HDFC Bank fraud team, and TRAI DLT. You'll receive updates on the number you provided.</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-left">
            {[
              { name: "NCRB portal",     status: "Filed",   note: "Ack #NCR-2025-8871204" },
              { name: "Your bank",       status: "Notified", note: "Freeze request sent · 2m ago" },
              { name: "TRAI · DLT",      status: "Notified", note: "Header VM-SBIUPD flagged" },
            ].map(s => (
              <div key={s.name} className="border rounded p-3">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{s.name}</div>
                <div className="font-medium mt-1 text-sm">{s.status}</div>
                <div className="text-xs text-muted-foreground">{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SectionHeader eyebrow="Citizen · Guided report" title="File once. We route it everywhere."
        description="One form. Sends to NCRB, your bank, and the telecom regulator — with your evidence attached." />

      <ol className="grid grid-cols-4 gap-2">
        {steps.map((s, idx) => (
          <li key={s} className={`text-center rounded border p-2 text-xs ${idx === i ? "bg-navy text-primary-foreground border-navy" : idx < i ? "bg-navy-soft text-navy border-navy/20" : "bg-canvas text-muted-foreground"}`}>
            <div className="font-mono text-[10px] uppercase tracking-widest">Step {idx + 1}</div>
            <div className="text-xs mt-0.5 font-medium">{s}</div>
          </li>
        ))}
      </ol>

      <div className="gov-card p-6 space-y-4">
        {i === 0 && (
          <>
            <FormRow label="Scam type"><select className="w-full border rounded px-3 py-2 bg-background text-sm"><option>Digital Arrest</option><option>UPI Fraud</option><option>KYC / OTP</option><option>Investment Scam</option><option>Other</option></select></FormRow>
            <FormRow label="Channel"><select className="w-full border rounded px-3 py-2 bg-background text-sm"><option>Phone call</option><option>WhatsApp</option><option>SMS</option><option>Email</option><option>Web</option></select></FormRow>
            <FormRow label="Approximate loss (₹)"><Input placeholder="e.g. 480000" /></FormRow>
            <FormRow label="What happened, in your words"><Textarea rows={5} placeholder="Describe the incident. You can paste any conversation here." /></FormRow>
          </>
        )}
        {i === 1 && (
          <>
            <FormRow label="Attach evidence"><div className="border-2 border-dashed rounded p-6 text-center text-sm text-muted-foreground">Drop screenshots, audio, PDFs — encrypted end-to-end.</div></FormRow>
            <FormRow label="Scammer contact"><Input placeholder="Phone / VPA / email / URL" /></FormRow>
            <FormRow label="Bank account credited to (if known)"><Input placeholder="Account number or IFSC" /></FormRow>
          </>
        )}
        {i === 2 && (
          <>
            <FormRow label="Your name"><Input placeholder="As on ID" /></FormRow>
            <FormRow label="Phone (for updates)"><Input placeholder="+91" /></FormRow>
            <FormRow label="City / State"><Input placeholder="e.g. Bengaluru, Karnataka" /></FormRow>
            <div className="text-xs text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Your details go only to authorities you consent to.</div>
          </>
        )}
        {i === 3 && (
          <div className="space-y-3">
            <div className="text-sm">Please confirm your report will be sent to:</div>
            <ul className="space-y-2 text-sm">
              {["National Cyber Crime Reporting Portal (NCRB)", "Your bank's fraud response team", "TRAI · Do-Not-Disturb / DLT compliance"].map(x => (
                <li key={x} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-navy" /> {x}</li>
              ))}
            </ul>
            <div className="flex items-start gap-2 text-xs text-muted-foreground border-t pt-3">
              <FileText className="h-4 w-4" /> A signed PDF acknowledgement will be emailed and downloadable from your Evidence Vault.
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</Button>
          {i < steps.length - 1
            ? <Button onClick={() => setI(i + 1)}>Continue</Button>
            : <Button onClick={() => setSubmitted(true)}><Send className="h-4 w-4" /> Submit report</Button>}
        </div>
      </div>

      <div className="text-center text-xs font-mono text-muted-foreground flex items-center justify-center gap-2">
        <StatusPill tone="navy">Encrypted end-to-end</StatusPill>
        <span>· No data leaves your device without your consent</span>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[180px_1fr] gap-3 items-start">
      <Label className="pt-2 text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  );
}
