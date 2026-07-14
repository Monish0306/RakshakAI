import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { scamLibrary } from "@/lib/mock/data";
import { useApp } from "@/components/app-providers";

export const Route = createFileRoute("/_citizen/citizen/learn")({
  head: () => ({ meta: [{ title: "Scam Library · Suraksha Bharat" }, { name: "description", content: "Learn the 6 most common scams in India — with Grandparent Mode for calm, large-type reading." }] }),
  component: Learn,
});

function Learn() {
  const { senior, setSenior } = useApp();
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Citizen · Awareness" title="Know the scam. Beat the scam."
        description="Six patterns account for over 80% of digital fraud in India."
        actions={
          <button onClick={() => setSenior(!senior)} className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded border hover:bg-accent">
            {senior ? "Turn off" : "Turn on"} Grandparent Mode
          </button>
        }
      />
      <div className="grid md:grid-cols-2 gap-4">
        {scamLibrary.map(s => (
          <div key={s.id} className="gov-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{s.hindi}</div>
                <div className="font-display text-lg font-semibold mt-0.5">{s.name}</div>
              </div>
              <StatusPill tone={s.risk >= 80 ? "danger" : s.risk >= 65 ? "warning" : "info"}>Risk {s.risk}</StatusPill>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{s.description}</p>
            <div className="mt-4 flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>Victims (12 mo): <span className="text-foreground">{s.victims_1yr.toLocaleString("en-IN")}</span></span>
              <span>Case pattern ID: <span className="text-foreground">{s.id.toUpperCase()}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
