import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { auditLog } from "@/lib/mock/data";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_command/command/audit")({
  head: () => ({ meta: [{ title: "Audit Logs · Command Centre" }, { name: "description", content: "Immutable audit trail of all platform actions." }] }),
  component: Audit,
});

function Audit() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Audit" title="Immutable audit trail"
        description="Every read, write, export and role change is hashed and appended. Exportable for compliance."
        actions={<StatusPill tone="navy">3.2M events · rolling 30d</StatusPill>} />

      <div className="gov-card p-4">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input className="h-8 pl-8 text-sm" placeholder="Filter by actor, action, or resource…" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-xs font-mono uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">Actor</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Resource</th>
              <th className="text-left p-3">IP</th>
              <th className="text-left p-3">Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {auditLog.map((l, i) => (
              <tr key={i} className="hover:bg-canvas/60">
                <td className="p-3 font-mono">{l.time}</td>
                <td className="p-3">{l.actor}</td>
                <td className="p-3"><StatusPill tone={l.action === "EXPORT" || l.action === "ROLE-GRANT" ? "warning" : "info"}>{l.action}</StatusPill></td>
                <td className="p-3 font-mono text-[11px]">{l.resource}</td>
                <td className="p-3 font-mono text-[11px] text-muted-foreground">{l.ip}</td>
                <td className="p-3 font-mono text-[11px] text-muted-foreground">{l.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
