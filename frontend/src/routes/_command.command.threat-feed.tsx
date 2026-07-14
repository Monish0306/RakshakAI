import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { threatFeed } from "@/lib/mock/data";

export const Route = createFileRoute("/_command/command/threat-feed")({
  head: () => ({ meta: [{ title: "Threat Feed · Command Centre" }, { name: "description", content: "Live inter-agency threat feed." }] }),
  component: Feed,
});

const extended = [
  ...threatFeed,
  { time: "09:22", severity: "medium" as const, title: "New UPI collect-request cluster", detail: "82 flagged VPAs sharing device fingerprint · NPCI notified" },
  { time: "08:44", severity: "high"   as const, title: "TG channel \"nifty-vip-2025\" · 12k members", detail: "3rd rebrand this month · pattern matches pump-and-dump cluster" },
  { time: "08:11", severity: "low"    as const, title: "SIM box seizure · Nashik rural", detail: "142 SIMs, 3 GSM boxes · caller-ID spoof gateway" },
];

function Feed() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Threat Feed" title="Now"
        description="Live cross-agency threat intelligence stream."
        actions={<StatusPill tone="success">connected · 7 sources</StatusPill>} />

      <div className="gov-card divide-y">
        {extended.map(t => (
          <div key={t.time} className="p-4 flex gap-4">
            <div className="text-xs font-mono text-muted-foreground w-14 pt-0.5">{t.time}</div>
            <div className="flex-1">
              <StatusPill tone={t.severity === "critical" ? "danger" : t.severity === "high" ? "warning" : t.severity === "medium" ? "info" : "neutral"}>{t.severity}</StatusPill>
              <div className="mt-1.5 font-medium">{t.title}</div>
              <div className="text-sm text-muted-foreground">{t.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
