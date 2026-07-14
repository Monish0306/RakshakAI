import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SectionHeader, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/app-providers";
import { Type, Contrast, Volume2, Languages, KeyboardIcon } from "lucide-react";

export const Route = createFileRoute("/accessibility")({
  head: () => ({ meta: [{ title: "Accessibility · Suraksha Bharat" }, { name: "description", content: "Grandparent mode, keyboard-only navigation, screen-reader labels and 12 Indian languages." }] }),
  component: A11y,
});

function A11y() {
  const { senior, setSenior, dark, setDark } = useApp();
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="mx-auto max-w-[1000px] px-4 lg:px-8 py-10 flex-1 w-full space-y-8">
        <SectionHeader eyebrow="Accessibility Centre" title="A platform every citizen can use."
          description="Designed to WCAG 2.2 AA — with special care for elderly users and low-vision needs." />

        <div className="grid md:grid-cols-2 gap-4">
          <Card icon={<Type className="h-5 w-5" />} title="Grandparent Mode"
            desc="Larger type, calmer layout, plain-language guidance, single-step actions."
            action={<Button size="sm" variant={senior ? "secondary" : "default"} onClick={() => setSenior(!senior)}>{senior ? "On" : "Turn on"}</Button>}
          />
          <Card icon={<Contrast className="h-5 w-5" />} title="High-contrast dark theme"
            desc="Reduce glare and improve legibility in low light."
            action={<Button size="sm" variant={dark ? "secondary" : "default"} onClick={() => setDark(!dark)}>{dark ? "On" : "Turn on"}</Button>}
          />
          <Card icon={<Volume2 className="h-5 w-5" />} title="Voice guidance"
            desc="Every analyzer and report step can be read aloud in your language."
            action={<StatusPill tone="navy">Available</StatusPill>}
          />
          <Card icon={<Languages className="h-5 w-5" />} title="12 Indian languages"
            desc="English, हिन्दी, தமிழ், తెలుగు, বাংলা, मराठी, ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া."
            action={<StatusPill tone="navy">Switch in top bar</StatusPill>}
          />
        </div>

        <div className="gov-card p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Keyboard shortcuts</div>
          <div className="font-display font-semibold text-lg mt-0.5">Get around without a mouse</div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 mt-3 text-sm">
            {[
              ["g h", "Go to Home"],
              ["g c", "Go to Citizen Portal"],
              ["g x", "Go to Command Centre"],
              ["g d", "Guided demo tour"],
              ["/", "Search cases / entities"],
              ["? ", "Show shortcuts"],
            ].map(([k, l]) => (
              <div key={k} className="flex items-center justify-between border-b border-dashed py-1.5">
                <span>{l}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded border bg-canvas">{k}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2"><KeyboardIcon className="h-3.5 w-3.5" /> Full ARIA landmarks, focus rings and skip-links throughout.</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Card({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="gov-card p-5 flex items-start gap-4">
      <div className="h-10 w-10 rounded bg-navy-soft text-navy grid place-items-center">{icon}</div>
      <div className="flex-1">
        <div className="font-display font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{desc}</div>
      </div>
      {action}
    </div>
  );
}
