import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-background">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-10 grid gap-8 md:grid-cols-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-navy text-primary-foreground grid place-items-center">
              <Shield className="h-4 w-4" />
            </div>
            <div className="font-display font-semibold">Suraksha Bharat</div>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">
            A prototype National Digital Public Safety Intelligence Platform — built for the
            AI for Digital Public Safety challenge.
          </p>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-2">
            Prototype · Not deployed in production
          </div>
        </div>
        <FooterCol title="Citizens" links={[
          ["/citizen", "Citizen Portal"],
          ["/citizen/analyze/chat", "Chat Analyzer"],
          ["/citizen/analyze/voice", "Voice Analyzer"],
          ["/citizen/analyze/currency", "Currency Check"],
          ["/citizen/report", "Report a Scam"],
        ]} />
        <FooterCol title="Command Centre" links={[
          ["/command", "Threat Dashboard"],
          ["/command/investigations", "Investigations"],
          ["/command/network", "Fraud Network"],
          ["/command/geo", "Geospatial Intel"],
          ["/command/evidence", "Evidence Vault"],
        ]} />
        <FooterCol title="Trust & Compliance" links={[
          ["/transparency", "AI Transparency"],
          ["/privacy", "Privacy Center"],
          ["/accessibility", "Accessibility"],
          ["/status", "System Status"],
          ["/help", "Help & Support"],
        ]} />
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-4 flex flex-col md:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Suraksha Bharat · A prototype in service of the citizens of India</div>
          <div className="flex gap-4">
            <span>DPDP Act 2023 aligned</span>
            <span>CERT-In coordinated</span>
            <span>Cyber helpline · 1930</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">{title}</div>
      <ul className="space-y-2 text-sm">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="text-foreground/80 hover:text-navy">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
