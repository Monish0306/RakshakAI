import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { Lock, Smartphone, Server, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Centre · Suraksha Bharat" }, { name: "description", content: "On-device processing, DPDP-Act alignment and citizen data controls." }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="mx-auto max-w-[1200px] px-4 lg:px-8 py-10 flex-1 w-full space-y-8">
        <SectionHeader eyebrow="Privacy Centre" title="Your data. Your device. Your choice."
          description="Suraksha Bharat is built privacy-first. The most sensitive computations happen on your device — not on our servers."
          actions={<StatusPill tone="success"><ShieldCheck className="h-3 w-3" /> DPDP Act 2023 aligned</StatusPill>} />

        <div className="grid md:grid-cols-3 gap-4">
          <Card icon={<Smartphone className="h-5 w-5" />} title="On-device inference"
            desc="Chat, voice, screenshot and currency analyzers run entirely on your phone. Nothing personal leaves it." />
          <Card icon={<Lock className="h-5 w-5" />} title="Encrypted by default"
            desc="Any data you choose to share is TLS-1.3 encrypted in transit and AES-256 at rest." />
          <Card icon={<Server className="h-5 w-5" />} title="Data minimisation"
            desc="Only anonymised signal fingerprints leave the device to help protect other citizens." />
        </div>

        <div className="gov-card p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Data flow visualisation</div>
          <div className="font-display text-lg font-semibold mt-0.5">Where your data goes (and doesn't)</div>
          <div className="mt-6 grid md:grid-cols-5 gap-3">
            {[
              { name: "Your device",       leaves: "—", body: "AI runs locally. Text, audio, images never leave unless you tap Share." },
              { name: "Anonymised signal", leaves: "hash-only", body: "A one-way fingerprint helps flag similar scams for other citizens." },
              { name: "Intelligence layer", leaves: "aggregated", body: "Only cluster-level intel — never your identity — enters the layer." },
              { name: "Consented reports", leaves: "when you file", body: "NCRB, bank and TRAI receive what you approved, and only that." },
              { name: "Analytics",         leaves: "differentially private", body: "National dashboards see counts, never individuals." },
            ].map((c, i) => (
              <div key={c.name} className="border rounded p-3 bg-canvas relative">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Node {i + 1}</div>
                <div className="font-medium mt-1">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.body}</div>
                <div className="mt-2"><StatusPill tone="navy">{c.leaves}</StatusPill></div>
              </div>
            ))}
          </div>
        </div>

        <div className="gov-card p-6">
          <div className="font-display text-lg font-semibold">Retention policy</div>
          <table className="w-full text-sm mt-3">
            <thead className="bg-canvas text-xs font-mono uppercase text-muted-foreground">
              <tr><th className="text-left p-2">Data type</th><th className="text-left p-2">Retention</th><th className="text-left p-2">Purpose</th></tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="p-2">Citizen analyzer inputs</td><td className="p-2">0 days · on-device only</td><td className="p-2">Local inference</td></tr>
              <tr><td className="p-2">Anonymised scam fingerprints</td><td className="p-2">180 days</td><td className="p-2">Cluster detection</td></tr>
              <tr><td className="p-2">Reported evidence (opt-in)</td><td className="p-2">7 years</td><td className="p-2">Investigation & prosecution</td></tr>
              <tr><td className="p-2">Audit logs</td><td className="p-2">10 years</td><td className="p-2">Compliance</td></tr>
              <tr><td className="p-2">Dashboards / analytics</td><td className="p-2">Aggregated only</td><td className="p-2">National intelligence</td></tr>
            </tbody>
          </table>
        </div>

        <div className="text-xs text-muted-foreground">
          This is a prototype. In production, all policies above are governed under the Digital Personal Data Protection Act 2023 and reviewed annually by the Data Protection Board of India.
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Card({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="gov-card p-5">
      <div className="h-10 w-10 rounded bg-navy-soft text-navy grid place-items-center">{icon}</div>
      <div className="mt-3 font-display font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}
