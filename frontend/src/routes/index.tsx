import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import {
  Shield, Users, Building2, Landmark, ArrowRight, PhoneCall, ScanLine, MessageSquare,
  Mic, Image as ImageIcon, Fingerprint, Network, Map, Lock, Eye, GitBranch, Activity, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { STATS, trendingScripts, weeklyThreatSeries, threatFeed } from "@/lib/mock/data";
import { SectionHeader, StatCard, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Suraksha Bharat — Digital Public Safety Intelligence Platform" },
      { name: "description", content: "AI-powered national platform to detect and disrupt digital arrest scams, fraud networks and counterfeit currency across India." },
      { property: "og:title", content: "Suraksha Bharat — Digital Public Safety Intelligence Platform" },
      { property: "og:description", content: "AI-powered national platform to detect and disrupt digital arrest scams, fraud networks and counterfeit currency across India." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main>
        <Hero />
        <TrustStrip />
        <DualAudience />
        <LiveIntel />
        <Pillars />
        <Architecture />
        <CTABand />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="border-b bg-background">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-14 lg:py-20 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border bg-navy-soft px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-navy">
            <span className="h-1.5 w-1.5 rounded-full bg-navy animate-pulse" />
            National prototype · AI for Digital Public Safety
          </div>
          <h1 className="mt-5 font-display text-4xl md:text-5xl lg:text-[56px] leading-[1.05] font-semibold tracking-tight text-foreground">
            Detect. Disrupt. Defend.<br />
            <span className="text-navy">A safer digital India, together.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Suraksha Bharat is a National Digital Public Safety Intelligence Platform that equips
            citizens, law enforcement, banks and telecoms with proactive AI to defeat digital arrest
            scams, fraud networks and counterfeit currency — <em className="not-italic text-foreground">before</em> mass victimisation.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-5">
              <Link to="/citizen">
                <Shield className="h-4 w-4" /> I'm a Citizen · Check a scam
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5">
              <Link to="/command">
                <Landmark className="h-4 w-4" /> Enter Command Centre
              </Link>
            </Button>
            <Link to="/demo" className="text-sm text-navy underline underline-offset-4 hover:opacity-80">
              Take the 90-second tour →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl">
            <MiniStat label="Scams blocked" value={fmt(STATS.scamsBlocked)} />
            <MiniStat label="Citizens protected" value={fmt(STATS.citizensProtected)} />
            <MiniStat label="Losses prevented" value={`₹${STATS.moneySavedCr} Cr`} />
          </div>
        </div>
        <div className="lg:col-span-5">
          <HeroDeviceCard />
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function HeroDeviceCard() {
  return (
    <div className="gov-card overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground ml-2">suraksha-bharat.gov.in · live analysis</span>
        </div>
        <StatusPill tone="success">Secure · TLS 1.3</StatusPill>
      </div>
      <div className="p-5 space-y-4 bg-canvas">
        <div className="flex items-start gap-3">
          <PhoneCall className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-mono text-muted-foreground">Incoming call analysis · +91 87XX XXXXXX</div>
            <div className="mt-0.5 text-sm">"Main CBI Mumbai se Officer Sharma bol raha hoon..."</div>
          </div>
        </div>
        <div className="gov-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">On-device verdict</div>
            <StatusPill tone="danger">HIGH RISK · 96</StatusPill>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-destructive" style={{ width: "96%" }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <SignalRow icon={<Fingerprint className="h-3.5 w-3.5" />} label="Authority impersonation" val={98} />
            <SignalRow icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Legal threat" val={93} />
            <SignalRow icon={<Activity className="h-3.5 w-3.5" />} label="Urgency" val={89} />
            <SignalRow icon={<Lock className="h-3.5 w-3.5" />} label="Isolation demand" val={91} />
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Processed on-device · 210 ms</span>
          <span>Model: sd-arrest-v3.2.1</span>
        </div>
      </div>
    </div>
  );
}

function SignalRow({ icon, label, val }: { icon: React.ReactNode; label: string; val: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      <span className="font-mono text-muted-foreground">{val}</span>
    </div>
  );
}

function TrustStrip() {
  const items = ["Ministry of Home Affairs", "Reserve Bank of India", "CERT-In", "I4C · NCRB", "NPCI", "TRAI", "CDAC"];
  return (
    <div className="border-b bg-navy-soft/40">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] font-mono uppercase tracking-widest text-navy/80">
        <span className="text-muted-foreground">Coordinated with</span>
        {items.map(i => <span key={i}>· {i}</span>)}
      </div>
    </div>
  );
}

function DualAudience() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 lg:px-6 py-16">
      <SectionHeader
        eyebrow="Two portals · One mission"
        title="Built for every citizen. Trusted by every agency."
        description="A privacy-first citizen fraud shield paired with a mission-critical command centre for law enforcement, banks and telecoms."
      />
      <div className="grid md:grid-cols-2 gap-6">
        <AudienceCard
          icon={<Users className="h-5 w-5" />}
          tag="Citizen Portal"
          title="Check any call, message or note in seconds."
          points={[
            "Paste a suspicious chat, forward a voice note, or scan a currency note.",
            "AI runs on-device — nothing personal leaves your phone.",
            "Guided reporting to NCRB · 1930 · your bank, in 12 Indian languages.",
          ]}
          cta={{ to: "/citizen", label: "Open Citizen Portal" }}
        />
        <AudienceCard
          icon={<Landmark className="h-5 w-5" />}
          tag="Command Centre"
          title="Predictive intelligence for law enforcement & banks."
          points={[
            "Live map of active scam sessions, mule networks and FICN hotspots.",
            "Investigation workspace with court-ready evidence packages.",
            "Role-based access for LEA, banks, telecoms and administrators.",
          ]}
          cta={{ to: "/command", label: "Enter Command Centre" }}
          dark
        />
      </div>
    </section>
  );
}

function AudienceCard({
  icon, tag, title, points, cta, dark,
}: {
  icon: React.ReactNode; tag: string; title: string; points: string[]; cta: { to: string; label: string }; dark?: boolean;
}) {
  return (
    <div className={`gov-card p-8 ${dark ? "bg-navy text-primary-foreground border-navy" : ""}`}>
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-widest ${dark ? "bg-white/10" : "bg-navy-soft text-navy"}`}>
        {icon} {tag}
      </div>
      <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">{title}</h3>
      <ul className="mt-5 space-y-2.5">
        {points.map(p => (
          <li key={p} className="flex gap-2.5 text-sm leading-relaxed">
            <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${dark ? "text-primary-foreground/80" : "text-navy"}`} />
            <span className={dark ? "text-primary-foreground/85" : "text-foreground/80"}>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button asChild variant={dark ? "secondary" : "default"} size="lg" className="h-11">
          <Link to={cta.to}>{cta.label} <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}

function LiveIntel() {
  return (
    <section className="border-t bg-background">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-16">
        <SectionHeader
          eyebrow="Live intelligence · demo data"
          title="What the platform is seeing right now."
          description="A snapshot of nationwide scam activity across all channels — updated in real time in production deployments."
          actions={<StatusPill tone="navy">Simulated feed</StatusPill>}
        />
        <div className="grid lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Digital arrest sessions · live" value={STATS.activeDigitalArrestSessions} delta="+12" trend="up" hint="last 15 min" icon={<AlertTriangle className="h-4 w-4" />} />
          <StatCard label="Scams blocked · today"          value={fmt(4218)} delta="+38%" trend="up" hint="vs yesterday" icon={<Shield className="h-4 w-4" />} />
          <StatCard label="FICN notes flagged · today"     value={fmt(347)} delta="+7%"  trend="up" hint="across 84 branches" icon={<ScanLine className="h-4 w-4" />} />
          <StatCard label="Mule accounts identified"       value={fmt(1204)} delta="+22%" trend="up" hint="12 banks reporting" icon={<Network className="h-4 w-4" />} />
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 gov-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">14-day threat volume</div>
                <div className="font-display text-lg font-semibold mt-0.5">Detections vs blocked</div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Legend color="var(--navy)" label="Detections" />
                <Legend color="var(--success)" label="Blocked" />
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={weeklyThreatSeries}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--navy)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--navy)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--success)" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                  <Area type="monotone" dataKey="detections" stroke="var(--navy)" fill="url(#g1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="blocks" stroke="var(--success)" fill="url(#g2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="gov-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Threat feed</div>
                <div className="font-display text-lg font-semibold mt-0.5">Now</div>
              </div>
              <Link to="/command/threat-feed" className="text-xs text-navy hover:underline">View all</Link>
            </div>
            <ul className="space-y-3">
              {threatFeed.slice(0, 5).map(t => (
                <li key={t.time} className="flex gap-3 text-sm">
                  <div className="text-[11px] font-mono text-muted-foreground w-10 pt-0.5">{t.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={t.severity === "critical" ? "danger" : t.severity === "high" ? "warning" : t.severity === "medium" ? "info" : "neutral"}>
                        {t.severity}
                      </StatusPill>
                    </div>
                    <div className="mt-1 font-medium leading-snug">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 gov-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Trending scam scripts · 24h</div>
              <div className="font-display text-lg font-semibold mt-0.5">What scammers are saying, right now</div>
            </div>
            <StatusPill tone="warning">5 active clusters</StatusPill>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            {trendingScripts.map(s => (
              <div key={s.title} className="border rounded p-3 bg-canvas/60">
                <div className="text-sm leading-snug">{s.title}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted-foreground uppercase">{s.channel}</span>
                  <span className={s.delta.startsWith("+") ? "text-destructive" : "text-success"}>{s.delta}</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-muted-foreground">{fmt(s.uses)} uses</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</span>;
}

function Pillars() {
  const pillars = [
    { icon: <MessageSquare className="h-5 w-5" />, title: "Conversation Analyzer", desc: "Paste WhatsApp / SMS / call transcript — get an on-device verdict with Scam DNA breakdown.", to: "/citizen/analyze/chat" },
    { icon: <Mic className="h-5 w-5" />,           title: "Voice & Deepfake",       desc: "Detect AI-generated voices and known spoof signatures in real time.", to: "/citizen/analyze/voice" },
    { icon: <ImageIcon className="h-5 w-5" />,     title: "Screenshot & OCR",       desc: "Drop a screenshot — we extract text, verify UPI IDs, URLs and numbers against blocklists.", to: "/citizen/analyze/image" },
    { icon: <ScanLine className="h-5 w-5" />,      title: "Counterfeit Detector",   desc: "Point your camera at a note. All denominations. Field-officer and bank-teller ready.", to: "/citizen/analyze/currency" },
    { icon: <Network className="h-5 w-5" />,       title: "Fraud Network Graph",    desc: "Cluster accounts, devices, phone numbers and mules into court-admissible intelligence.", to: "/command/network" },
    { icon: <Map className="h-5 w-5" />,           title: "Geospatial Intel",       desc: "Live district-level heatmaps for patrol prioritisation and inter-agency coordination.", to: "/command/geo" },
    { icon: <Eye className="h-5 w-5" />,           title: "Explainable AI",         desc: "Every verdict shows evidence spans, model versions and confidence — auditable end-to-end.", to: "/transparency" },
    { icon: <Lock className="h-5 w-5" />,          title: "Privacy by Design",      desc: "On-device inference wherever possible. DPDP-Act aligned. Zero-knowledge citizen mode.", to: "/privacy" },
  ];
  return (
    <section className="border-t bg-canvas/50">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-16">
        <SectionHeader
          eyebrow="Platform capabilities"
          title="Eight AI agents. One coordinated defence."
          description="Every capability is explainable, auditable, and built to be deployed in the hands of citizens and officers alike."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map(p => (
            <Link key={p.title} to={p.to} className="gov-card p-5 hover:border-navy/40 hover:shadow-elev-2 transition-all group">
              <div className="h-9 w-9 rounded bg-navy-soft text-navy grid place-items-center">{p.icon}</div>
              <div className="mt-4 font-display font-semibold">{p.title}</div>
              <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.desc}</div>
              <div className="mt-4 text-xs font-mono text-navy inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Explore <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  const layers = [
    { name: "Signal ingestion", nodes: ["Citizen apps", "Bank APIs", "Telecom DLT", "Web crawlers", "Field devices"] },
    { name: "AI agent layer",    nodes: ["Scam Classifier", "Scam DNA", "Voice / Deepfake", "OCR", "FICN CV", "Graph Miner", "Geospatial"] },
    { name: "Intelligence fusion", nodes: ["Case correlation", "Cluster synthesis", "Threat scoring", "Explainability"] },
    { name: "Action & response", nodes: ["Citizen alerts", "Bank auto-block", "MHA / NCRB tickets", "Court-ready evidence", "Field bulletins"] },
  ];
  return (
    <section className="border-t bg-background">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-16">
        <SectionHeader
          eyebrow="System architecture"
          title="A federated intelligence fabric."
          description="Data stays where it belongs. Agents federate. Actions dispatch instantly across agencies."
        />
        <div className="gov-card p-6 space-y-4">
          {layers.map((layer, i) => (
            <div key={layer.name} className="grid md:grid-cols-[180px_1fr] gap-4 items-start">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Layer {i + 1}</div>
                <div className="font-display font-semibold mt-0.5">{layer.name}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {layer.nodes.map(n => (
                  <div key={n} className="rounded border bg-canvas px-3 py-2 text-sm">{n}</div>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Federated learning</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> On-device inference</span>
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Explainable outputs</span>
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Multi-agency access control</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTABand() {
  return (
    <section className="bg-navy text-primary-foreground">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-14 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary-foreground/70">Ready for judges</div>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold tracking-tight">See the full platform in 90 seconds.</h2>
          <p className="mt-2 text-primary-foreground/80 max-w-2xl">A guided demo walks through a live digital-arrest interception, from citizen alert to court-ready evidence bundle.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg" variant="secondary" className="h-11 px-5">
            <Link to="/demo">Start guided tour <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-5 bg-transparent text-primary-foreground border-white/25 hover:bg-white/10 hover:text-primary-foreground">
            <Link to="/command">Skip to Command Centre</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}
