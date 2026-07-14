import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { FileText, Download, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_command/command/reports")({
  head: () => ({ meta: [{ title: "Court-ready Reports · Command Centre" }, { name: "description", content: "Generate digitally signed, court-admissible evidence bundles." }] }),
  component: Reports,
});

const bundles = [
  { id: "RPT-2025-0142", case: "CB-2025-0142 · Op. Nightshade", pages: 87, generated: "10:41 IST", signed: true, size: "12.4 MB" },
  { id: "RPT-2025-0128", case: "CB-2025-0128 · Jamtara mules",  pages: 63, generated: "09:12 IST", signed: true, size: "8.1 MB" },
  { id: "RPT-2025-0117", case: "CB-2025-0117 · IRCTC refund",   pages: 41, generated: "07:38 IST", signed: false, size: "4.7 MB" },
];

function Reports() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Reports" title="Court-ready evidence bundles"
        description="One-click generation. Includes evidence, AI verdicts, chain-of-custody, and digital signature."
        actions={<Button>Generate new bundle</Button>} />

      <div className="gov-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-xs font-mono uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Bundle</th>
              <th className="text-left p-3">Case</th>
              <th className="text-left p-3">Pages</th>
              <th className="text-left p-3">Generated</th>
              <th className="text-left p-3">Size</th>
              <th className="text-left p-3">Signature</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bundles.map(b => (
              <tr key={b.id} className="hover:bg-canvas/60">
                <td className="p-3 font-mono flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-navy" />{b.id}</td>
                <td className="p-3">{b.case}</td>
                <td className="p-3">{b.pages}</td>
                <td className="p-3 text-muted-foreground">{b.generated}</td>
                <td className="p-3 font-mono">{b.size}</td>
                <td className="p-3">
                  {b.signed
                    ? <StatusPill tone="success"><ShieldCheck className="h-3 w-3" /> Signed</StatusPill>
                    : <StatusPill tone="warning">Pending signature</StatusPill>}
                </td>
                <td className="p-3 text-right"><Button size="sm" variant="outline"><Download className="h-3.5 w-3.5" /> Download</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
