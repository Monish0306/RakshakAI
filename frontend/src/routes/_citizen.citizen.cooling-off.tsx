import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { PhoneCall, Users, Ban, PauseCircle, PlayCircle, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_citizen/citizen/cooling-off")({
  head: () => ({ meta: [{ title: "Cooling-off Timer · Suraksha Bharat" }, { name: "description", content: "Ten calm minutes to help you avoid a costly scam decision." }] }),
  component: CoolingOff,
});

function CoolingOff() {
  const total = 10 * 60;
  const [remain, setRemain] = useState(total);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemain(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  const pct = (remain / total) * 100;
  const mm = String(Math.floor(remain / 60)).padStart(2, "0");
  const ss = String(remain % 60).padStart(2, "0");

  const steps = [
    { icon: <Ban className="h-4 w-4" />,      title: "Hang up. Right now.",                 desc: "Government agencies never demand money over a call. Ending the call has no legal consequence." },
    { icon: <Users className="h-4 w-4" />,    title: "Tell one trusted person.",             desc: "Call a family member, neighbour or colleague. Say the caller's claim out loud. Almost no scam survives being repeated." },
    { icon: <PhoneCall className="h-4 w-4" />, title: "Call 1930 to verify.",                desc: "24×7 national cyber helpline. They can confirm in seconds whether a threat is real." },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Citizen · Cooling-off" title="Take a breath. You are safe."
        description="Almost every scam depends on panic and speed. Give yourself 10 calm minutes." />
      <div className="gov-card p-8 md:p-12 text-center">
        <div className="mx-auto relative h-56 w-56">
          <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
            <circle cx="50" cy="50" r="46" stroke="var(--border)" strokeWidth="4" fill="none" />
            <circle cx="50" cy="50" r="46" stroke="var(--navy)" strokeWidth="4" fill="none"
              strokeDasharray={`${(pct / 100) * 289} 289`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div>
              <div className="font-display text-5xl font-semibold tabular-nums">{mm}:{ss}</div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-1">calm minutes remaining</div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => setRunning(!running)}>
            {running ? <><PauseCircle className="h-4 w-4" /> Pause</> : <><PlayCircle className="h-4 w-4" /> Resume</>}
          </Button>
          <Button variant="ghost" onClick={() => { setRemain(total); setRunning(true); }}><RotateCcw className="h-4 w-4" /> Restart</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="gov-card p-5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              STEP {i + 1}
            </div>
            <div className="mt-2 flex items-center gap-2 font-display font-semibold">
              <span className="text-navy">{s.icon}</span> {s.title}
            </div>
            <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="gov-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="font-display font-semibold">Feeling calmer?</div>
          <div className="text-sm text-muted-foreground">If you'd already transferred money, report to NCRP now to freeze the funds.</div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><a href="tel:1930">Call 1930</a></Button>
          <Button asChild><Link to="/citizen/report">File a report</Link></Button>
        </div>
      </div>
    </div>
  );
}
