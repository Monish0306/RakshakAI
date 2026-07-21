import { ShieldAlert, Radio } from 'lucide-react';

interface AnnouncementBarProps {
  isAdmin?: boolean;
}

export default function AnnouncementBar({ isAdmin = false }: AnnouncementBarProps) {
  const citizenMessages = [
    "Stay alert: Never share OTPs or PINs over calls",
    "Report suspicious calls instantly on 1930 or cybercrime.gov.in",
    "Rakshak AI: Government-aligned privacy-first digital safety initiative",
    "If money was transferred, call 1930 within the Golden Hour for immediate freezing",
  ];

  const adminMessages = [
    "RAKSHAK HQ Live Telemetry Online",
    "Evaluation Precision: 93% • Recall: 88%",
    "Active Scam Genomes Monitored across 5 Indian Languages",
    "I4C Helpline Protocol Sync Active",
  ];

  const messages = isAdmin ? adminMessages : citizenMessages;
  const fullMarqueeText = messages.join("  •  ") + "  •  " + messages.join("  •  ");

  return (
    <div className={`fixed top-0 left-0 right-0 h-7 z-[60] text-xs font-semibold flex items-center overflow-hidden border-b select-none ${
      isAdmin 
        ? "bg-slate-900 text-red-400 border-slate-800" 
        : "bg-[#1E3A8A] text-white border-blue-900"
    }`}>
      {/* Badge on left */}
      <div className={`px-3 h-full flex items-center shrink-0 z-10 font-bold uppercase tracking-wider text-[10px] space-x-1.5 shadow-md ${
        isAdmin ? "bg-red-600 text-white" : "bg-blue-950 text-amber-300 border-r border-blue-900"
      }`}>
        {isAdmin ? <Radio className="w-3 h-3 animate-pulse" /> : <ShieldAlert className="w-3 h-3 text-amber-300" />}
        <span>{isAdmin ? "HQ LIVE PULSE" : "PUBLIC ADVISORY"}</span>
      </div>

      {/* Marquee Track */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="animate-marquee whitespace-nowrap inline-block hover:[animation-play-state:paused] cursor-default font-medium text-xs py-0.5">
          <span className="px-4">{fullMarqueeText}</span>
          <span className="px-4">{fullMarqueeText}</span>
        </div>
      </div>
    </div>
  );
}
