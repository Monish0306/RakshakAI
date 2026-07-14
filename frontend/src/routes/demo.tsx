import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Guided Tour · Suraksha Bharat" }, { name: "description", content: "See the full platform in 90 seconds." }] }),
  component: Demo,
});

const steps = [
  { to: "/",                         title: "Landing & national posture",     time: "0:00", desc: "See live scams-blocked counter, trust markers, dual-audience entry points." },
  { to: "/citizen",                  title: "Citizen protection portal",       time: "0:12", desc: "Emergency banner, four analyzer tiles, recent checks, trust score." },
  { to: "/citizen/analyze/chat",     title: "Chat Analyzer · digital arrest",  time: "0:22", desc: "Load sample → animated pipeline → risk 96 → Scam DNA + explainability." },
  { to: "/citizen/cooling-off",      title: "Cooling-off timer",                time: "0:38", desc: "10 calm minutes with 3 concrete steps." },
  { to: "/citizen/report",           title: "Guided NCRB report",               time: "0:44", desc: "One form → NCRB + your bank + TRAI, all at once." },
  { to: "/command",                  title: "Command Centre dashboard",         time: "0:54", desc: "Live incidents, 14-day trend, category mix, hotspots." },
  { to: "/command/investigations",   title: "Investigation workspace",          time: "1:04", desc: "Master-detail with timeline, evidence, suspects, court-ready report." },
  { to: "/command/network",          title: "Fraud network graph",              time: "1:14", desc: "Op. Nightshade cluster · nodes, edges, cluster actions." },
  { to: "/command/geo",              title: "Geospatial intelligence",          time: "1:22", desc: "National heatmap and top-district list, patrol dispatch." },
  { to: "/transparency",             title: "AI Transparency + Privacy",       time: "1:30", desc: "Model cards, dataset provenance, DPDP-aligned data flow." },
];

function Demo() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="mx-auto max-w-[1200px] px-4 lg:px-8 py-10 flex-1 w-full space-y-8">
        <SectionHeader eyebrow="Guided tour · for judges" title="The whole platform in 90 seconds."
          description="Follow the numbered steps below — each is a link to the exact screen we'd show live."
          actions={
            <div className="flex gap-2">
              <StatusPill tone="navy">Prototype · mock data</StatusPill>
              <Button asChild><Link to="/">Start from the top <PlayCircle className="h-4 w-4" /></Link></Button>
            </div>
          }
        />

        <ol className="grid md:grid-cols-2 gap-4">
          {steps.map((s, i) => (
            <li key={s.to}>
              <Link to={s.to} className="gov-card p-5 flex gap-4 items-start hover:border-navy/40 hover:shadow-elev-2 transition-all">
                <div className="h-10 w-10 rounded-full bg-navy text-primary-foreground grid place-items-center font-display font-semibold">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-display font-semibold">{s.title}</div>
                    <span className="text-[11px] font-mono text-muted-foreground">{s.time}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground mt-3" />
              </Link>
            </li>
          ))}
        </ol>

        <div className="gov-card p-6 bg-navy text-primary-foreground">
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary-foreground/70">Judging criteria coverage</div>
          <div className="grid md:grid-cols-5 gap-3 mt-3 text-sm">
            {[
              ["Innovation · 25%", "Scam DNA, on-device pipeline, cooling-off timer, dual audience"],
              ["Business Impact · 25%", "₹796 Cr loss prevented (proj.) · 47M citizens protected"],
              ["Technical · 25%",  "Federated intel fabric, 5 model cards, explainable AI"],
              ["Scalability · 20%",  "Federated architecture, role-based multi-agency access"],
              ["UX · 15%",           "12 languages, Grandparent Mode, WCAG 2.2 AA"],
            ].map(([k, v]) => (
              <div key={k as string}>
                <div className="text-[11px] font-mono uppercase tracking-widest text-primary-foreground/70">{k}</div>
                <div className="text-sm mt-1">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
