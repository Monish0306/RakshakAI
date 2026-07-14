import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { evidenceItems } from "@/lib/mock/data";
import { ShieldCheck, Download, Eye } from "lucide-react";

export const Route = createFileRoute("/_command/command/evidence")({
  head: () => ({ meta: [{ title: "Evidence Vault · Command Centre" }, { name: "description", content: "Chain-of-custody managed evidence vault with hash-verified exports." }] }),
  component: Evidence,
});

function Evidence() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Evidence Vault" title="Chain-of-custody managed evidence"
        description="Every item is hashed on ingestion; any modification breaks the chain. Exports include the full custody trail."
        actions={<StatusPill tone="success"><ShieldCheck className="h-3 w-3" /> All chains intact</StatusPill>} />

      <div className="gov-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-xs font-mono uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Evidence ID</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Case</th>
              <th className="text-left p-3">Captured</th>
              <th className="text-left p-3">Size</th>
              <th className="text-left p-3">SHA-256</th>
              <th className="text-left p-3">Custody</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {evidenceItems.map(e => (
              <tr key={e.id} className="hover:bg-canvas/60">
                <td className="p-3 font-mono">{e.id}</td>
                <td className="p-3">{e.type}</td>
                <td className="p-3 font-mono text-[11px]">{e.case}</td>
                <td className="p-3 text-muted-foreground">{e.captured}</td>
                <td className="p-3 font-mono">{e.size}</td>
                <td className="p-3 font-mono text-[11px] text-muted-foreground">{e.hash}</td>
                <td className="p-3"><StatusPill tone="navy">{e.custody} hops</StatusPill></td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
