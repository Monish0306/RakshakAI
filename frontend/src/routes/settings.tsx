import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SectionHeader } from "@/components/primitives";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/app-providers";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Suraksha Bharat" }, { name: "description", content: "Personal preferences and privacy controls." }] }),
  component: Settings,
});

function Settings() {
  const { senior, setSenior, dark, setDark } = useApp();
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="mx-auto max-w-[900px] px-4 lg:px-8 py-10 flex-1 w-full space-y-8">
        <SectionHeader eyebrow="Settings" title="Your preferences" description="Personalise the platform to how you work." />

        <Section title="Profile">
          <Row label="Name"><Input defaultValue="R. Kulkarni" /></Row>
          <Row label="Agency email"><Input defaultValue="kulkarni@mh.gov.in" /></Row>
          <Row label="Phone"><Input defaultValue="+91 98XX XXXX21" /></Row>
        </Section>

        <Section title="Appearance">
          <Row label="Dark mode"><Switch checked={dark} onCheckedChange={setDark} /></Row>
          <Row label="Grandparent Mode (larger text)"><Switch checked={senior} onCheckedChange={setSenior} /></Row>
          <Row label="Reduce motion"><Switch defaultChecked={false} /></Row>
        </Section>

        <Section title="Privacy">
          <Row label="Share anonymised scam fingerprints"><Switch defaultChecked /></Row>
          <Row label="Show trust score on dashboard"><Switch defaultChecked /></Row>
          <Row label="Two-step verification"><Switch defaultChecked /></Row>
        </Section>

        <Section title="Notifications">
          <Row label="Critical threat alerts (SMS + email)"><Switch defaultChecked /></Row>
          <Row label="Weekly intelligence digest"><Switch defaultChecked /></Row>
          <Row label="Model update notices"><Switch defaultChecked={false} /></Row>
        </Section>

        <div className="flex justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="gov-card p-6 space-y-4">
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-3 items-center">
      <Label className="text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  );
}
