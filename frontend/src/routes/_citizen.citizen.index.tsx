import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionHeader, StatCard, StatusPill } from "@/components/primitives";
import { MessageSquare, Mic, Image as ImageIcon, ScanLine, PhoneCall, Timer, FileText, BookOpen, ShieldCheck, ArrowRight, AlertTriangle, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_citizen/citizen/")({
  head: () => ({ meta: [{ title: "Citizen Protection Portal · Suraksha Bharat" }, { name: "description", content: "Check any suspicious call, message, screenshot or currency note in seconds." }] }),
  component: CitizenHome,
});

function CitizenHome() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-navy text-primary-foreground p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary-foreground/70">Emergency</div>
          <div className="mt-1 font-display text-xl md:text-2xl font-semibold">If you've already paid — call 1930 now.</div>
          <div className="text-primary-foreground/80 text-sm mt-1">National Cyber Crime Helpline · 24×7 · toll-free. Every minute counts.</div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="lg" variant="secondary" className="h-11"><a href="tel:1930"><PhoneCall className="h-4 w-4" /> Call 1930</a></Button>
          <Button asChild size="lg" variant="outline" className="h-11 bg-transparent text-primary-foreground border-white/25 hover:bg-white/10 hover:text-primary-foreground">
            <Link to="/citizen/report">File a report</Link>
          </Button>
        </div>
      </div>

      <SectionHeader eyebrow="Choose what to check" title="What worried you?" description="All checks run privately on your device. Nothing personal leaves your phone unless you choose to report it." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Action to="/citizen/analyze/chat"     icon={<MessageSquare className="h-5 w-5" />} title="A suspicious message" desc="WhatsApp · SMS · Telegram · email" />
        <Action to="/citizen/analyze/voice"    icon={<Mic className="h-5 w-5" />}           title="A suspicious call"    desc="Recording or a live conversation" />
        <Action to="/citizen/analyze/image"    icon={<ImageIcon className="h-5 w-5" />}     title="A screenshot"          desc="OCR + link & UPI verification" />
        <Action to="/citizen/analyze/currency" icon={<ScanLine className="h-5 w-5" />}      title="A currency note"       desc="Detects FICN across all denominations" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <StatCard label="Your trust score"       value="92" hint="stronger than 84% of users" icon={<HeartPulse className="h-4 w-4" />} />
        <StatCard label="Checks this month"      value="7"  hint="6 safe · 1 high risk"  icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="National scams blocked" value="4,218" delta="today" trend="up" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="gov-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Recent checks</div>
              <div className="font-display text-lg font-semibold mt-0.5">Your activity</div>
            </div>
            <StatusPill tone="navy">On-device</StatusPill>
          </div>
          <ul className="divide-y">
            {[
              { t: "Just now", type: "Chat", label: "WhatsApp from +91 87XX…", tone: "danger" as const, verdict: "HIGH · Digital Arrest" },
              { t: "Yesterday", type: "Voice", label: "Call from +91 90XX…", tone: "warning" as const, verdict: "Suspicious · KYC scam" },
              { t: "3 days ago", type: "Image", label: "Screenshot — Nifty VIP invite", tone: "warning" as const, verdict: "Suspicious · Investment" },
              { t: "1 week ago", type: "Currency", label: "₹500 note · Series 4KA", tone: "success" as const, verdict: "Safe · genuine" },
            ].map((r, i) => (
              <li key={i} className="py-3 flex items-center gap-3">
                <div className="text-[11px] font-mono w-16 text-muted-foreground">{r.t}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{r.label}</div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase">{r.type}</div>
                </div>
                <StatusPill tone={r.tone}>{r.verdict}</StatusPill>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-rows-2 gap-4">
          <Link to="/citizen/cooling-off" className="gov-card p-5 hover:border-navy/40 hover:shadow-elev-2 transition-all">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded bg-navy-soft text-navy grid place-items-center"><Timer className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="font-display font-semibold">Cooling-off Safety Timer</div>
                <div className="text-sm text-muted-foreground">Feel pressured to send money? Take 10 calm minutes with guided steps.</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
          <Link to="/citizen/learn" className="gov-card p-5 hover:border-navy/40 hover:shadow-elev-2 transition-all">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded bg-navy-soft text-navy grid place-items-center"><BookOpen className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="font-display font-semibold">Scam library · Grandparent mode</div>
                <div className="text-sm text-muted-foreground">The 6 most common scams in India, explained in your language.</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>

      <div className="gov-card p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded bg-navy-soft text-navy grid place-items-center"><FileText className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="font-display font-semibold">Guided reporting</div>
            <div className="text-sm text-muted-foreground">If you've been scammed, we'll walk you through reporting to NCRB, your bank and the telecom regulator in one flow — with your evidence attached.</div>
          </div>
          <Button asChild variant="outline"><Link to="/citizen/report">Start report</Link></Button>
        </div>
      </div>
    </div>
  );
}

function Action({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="gov-card p-5 hover:border-navy/40 hover:shadow-elev-2 transition-all block">
      <div className="h-10 w-10 rounded bg-navy-soft text-navy grid place-items-center">{icon}</div>
      <div className="mt-4 font-display font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{desc}</div>
      <div className="mt-4 text-xs font-mono text-navy inline-flex items-center gap-1">Open <ArrowRight className="h-3 w-3" /></div>
    </Link>
  );
}
