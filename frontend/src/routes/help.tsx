import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SectionHeader } from "@/components/primitives";
import { PhoneCall, MessageSquare, FileText, BookOpen } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help & Support · Suraksha Bharat" }, { name: "description", content: "Get help for citizens, banks and law enforcement." }] }),
  component: Help,
});

const faq = [
  { q: "Is this a real government service?", a: "This site is a prototype for the AI for Digital Public Safety hackathon. In production it would be operated by MHA / I4C with participating agencies." },
  { q: "Does my chat leave my phone?", a: "No. The citizen analyzers run on-device. Only if you file a report do you choose what to share with NCRP, your bank and TRAI." },
  { q: "How accurate are the AI models?", a: "Every model card publishes accuracy, false-positive rate and last audit date. See the AI Transparency Centre for full disclosures." },
  { q: "I'm a bank / LEA — how do I onboard?", a: "In production, agencies onboard through the MHA I4C administrator with signed MoUs and hardware-issued credentials." },
  { q: "What if I don't speak English?", a: "The platform supports 12 Indian languages, switchable from the top bar." },
];

function Help() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="mx-auto max-w-[1000px] px-4 lg:px-8 py-10 flex-1 w-full space-y-8">
        <SectionHeader eyebrow="Help & Support" title="We're here 24×7."
          description="Emergency? Call 1930. Not urgent? Browse the guides or send us a message." />

        <div className="grid md:grid-cols-3 gap-4">
          <Card icon={<PhoneCall className="h-5 w-5" />} title="Emergency helpline"      desc="1930 · National Cyber Crime Helpline · 24×7 · toll-free." />
          <Card icon={<MessageSquare className="h-5 w-5" />} title="Chat with support" desc="Non-urgent queries answered within 4 hours (business hours)." />
          <Card icon={<FileText className="h-5 w-5" />} title="Report abuse of platform" desc="If you believe an officer or bank misused this platform, tell us in confidence." />
        </div>

        <div className="gov-card p-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Frequently asked
          </div>
          <ul className="mt-3 divide-y">
            {faq.map(f => (
              <li key={f.q} className="py-4">
                <div className="font-medium">{f.q}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.a}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-sm text-muted-foreground">
          Looking for the <Link to="/accessibility" className="text-navy hover:underline">accessibility centre</Link> or <Link to="/transparency" className="text-navy hover:underline">AI transparency centre</Link>?
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
