import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { modelCards } from "@/lib/mock/data";
import { Eye, ShieldCheck, GitBranch } from "lucide-react";

export const Route = createFileRoute("/transparency")({
  head: () => ({ meta: [{ title: "AI Transparency · Suraksha Bharat" }, { name: "description", content: "Model cards, datasets, audits and explainability for every AI in the platform." }] }),
  component: Transparency,
});

function Transparency() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="mx-auto max-w-[1200px] px-4 lg:px-8 py-10 flex-1 w-full space-y-8">
        <SectionHeader eyebrow="AI Transparency Centre" title="Every model, on the record."
          description="Every AI in the platform is published as a model card — with dataset provenance, accuracy, false-positive rate, latency, and last audit date."
          actions={<StatusPill tone="navy"><Eye className="h-3 w-3" /> Public disclosure</StatusPill>} />

        <div className="grid md:grid-cols-3 gap-4">
          <Principle icon={<Eye className="h-4 w-4" />}      title="Explainable"   desc="Every verdict shows the exact evidence spans, model, version and confidence." />
          <Principle icon={<GitBranch className="h-4 w-4" />} title="Auditable"     desc="Every inference is hashed and appended to the audit log for after-the-fact review." />
          <Principle icon={<ShieldCheck className="h-4 w-4" />} title="Reviewed"    desc="Independent bias & fairness reviews by IIT-B, CDAC and CERT-In on published cadence." />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {modelCards.map(m => (
            <div key={m.id} className="gov-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{m.id} · {m.version}</div>
                  <div className="font-display text-lg font-semibold mt-0.5">{m.name}</div>
                </div>
                <StatusPill tone={m.onDevice ? "success" : "info"}>{m.onDevice ? "On-device" : "Cloud"}</StatusPill>
              </div>
              <p className="mt-2 text-sm">{m.purpose}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <MetricCell label="Accuracy" value={`${m.accuracy}%`} />
                <MetricCell label="FPR"      value={`${m.fpr}%`} />
                <MetricCell label="Latency"  value={`${m.latencyMs} ms`} />
              </div>
              <div className="mt-4 text-xs space-y-1">
                <div><span className="font-mono uppercase tracking-widest text-muted-foreground">Dataset · </span>{m.dataset}</div>
                <div><span className="font-mono uppercase tracking-widest text-muted-foreground">Audit · </span>{m.audit}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="gov-card p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">How a decision is made</div>
          <div className="font-display text-lg font-semibold mt-0.5">The 6-step decision pipeline</div>
          <ol className="mt-4 grid md:grid-cols-6 gap-3 text-sm">
            {["Ingest", "Language", "Intent", "Scam DNA", "Knowledge match", "Verdict + explain"].map((s, i) => (
              <li key={s} className="border rounded p-3 bg-canvas">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Step {i + 1}</div>
                <div className="font-medium mt-1">{s}</div>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono tabular-nums">{value}</div>
    </div>
  );
}

function Principle({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="gov-card p-5">
      <div className="h-9 w-9 rounded bg-navy-soft text-navy grid place-items-center">{icon}</div>
      <div className="mt-3 font-display font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}
