import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_command/command/admin")({
  head: () => ({ meta: [{ title: "Administration · Command Centre" }, { name: "description", content: "Role-based access control, agency onboarding, integrations." }] }),
  component: Admin,
});

const users = [
  { name: "Insp. R. Kulkarni",   email: "kulkarni@mh.gov.in",     role: "LEA · Investigator",   status: "active" as const },
  { name: "SI M. Banerjee",       email: "banerjee@wb.gov.in",     role: "LEA · Field Officer",  status: "active" as const },
  { name: "DySP S. Iyer",         email: "iyer@ka.gov.in",         role: "LEA · Senior",         status: "active" as const },
  { name: "HDFC · Ops03",         email: "ops03@fraud.hdfc",       role: "Bank · Fraud desk",    status: "active" as const },
  { name: "NPCI · Analyst",       email: "analyst@npci",           role: "NPCI · Analyst",       status: "invited" as const },
  { name: "MHA · Coordinator",    email: "coord@mha.gov.in",       role: "Administrator",        status: "active" as const },
];

const roleMatrix: { capability: string; citizen: boolean; lea: boolean; bank: boolean; admin: boolean }[] = [
  { capability: "Run citizen analyzers",           citizen: true,  lea: true,  bank: true,  admin: true },
  { capability: "View case workspace",             citizen: false, lea: true,  bank: false, admin: true },
  { capability: "Freeze mule accounts",            citizen: false, lea: true,  bank: true,  admin: true },
  { capability: "Export court-ready bundles",     citizen: false, lea: true,  bank: false, admin: true },
  { capability: "Access national analytics",       citizen: false, lea: true,  bank: true,  admin: true },
  { capability: "Manage roles & agencies",         citizen: false, lea: false, bank: false, admin: true },
  { capability: "Read audit logs",                 citizen: false, lea: false, bank: false, admin: true },
];

function Admin() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Administration" title="Access & agencies"
        description="Manage users, roles and inter-agency integrations."
        actions={<Button>Invite user</Button>} />

      <div className="gov-card overflow-hidden">
        <div className="p-4 hairline"><div className="font-display font-semibold">Users</div></div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-xs font-mono uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Role</th><th className="text-right p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.email}>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 font-mono text-[11px] text-muted-foreground">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3 text-right"><StatusPill tone={u.status === "active" ? "success" : "warning"}>{u.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="p-4 hairline"><div className="font-display font-semibold">Role matrix</div></div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-xs font-mono uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Capability</th>
              <th className="p-3 text-center">Citizen</th>
              <th className="p-3 text-center">LEA</th>
              <th className="p-3 text-center">Bank</th>
              <th className="p-3 text-center">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {roleMatrix.map(r => (
              <tr key={r.capability}>
                <td className="p-3">{r.capability}</td>
                {[r.citizen, r.lea, r.bank, r.admin].map((v, i) => (
                  <td key={i} className="p-3 text-center">{v ? <Check className="h-4 w-4 text-success inline" /> : <span className="text-muted-foreground/40">—</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
