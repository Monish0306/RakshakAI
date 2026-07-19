
import { PhoneCall, Smartphone, ShieldCheck, Cloud, BrainCircuit, Activity, AlertTriangle, FileCheck2, Lock } from 'lucide-react';

const NODES = [
  { id: 'n1', label: 'Call Received', icon: PhoneCall, color: 'text-blue-600', ping: 'border-blue-500', 
    desktop: { x: '5.71%', y: '51.43%' }, mobile: { x: '50%', y: '6.81%' } },
  { id: 'n2', label: 'On-Device Scan', icon: Smartphone, color: 'text-blue-700', ping: 'border-blue-500',
    desktop: { x: '20.0%', y: '51.43%' }, mobile: { x: '50%', y: '20.45%' } },
  { id: 'n3', label: 'Resolved Safe', icon: ShieldCheck, color: 'text-green-600', ping: 'border-green-500',
    desktop: { x: '32.38%', y: '74.28%' }, mobile: { x: '70%', y: '30.0%' } },
  { id: 'n4', label: 'Cloud Escalation', icon: Cloud, color: 'text-amber-600', ping: 'border-amber-500',
    desktop: { x: '36.19%', y: '28.57%' }, mobile: { x: '50%', y: '38.63%' } },
  { id: 'n5', label: 'AI Reasoning', icon: BrainCircuit, color: 'text-amber-600', ping: 'border-amber-500',
    desktop: { x: '52.38%', y: '28.57%' }, mobile: { x: '50%', y: '54.09%' } },
  { id: 'n6', label: 'Risk Scoring', icon: Activity, color: 'text-amber-600', ping: 'border-amber-500',
    desktop: { x: '68.57%', y: '28.57%' }, mobile: { x: '50%', y: '69.54%' } },
  { id: 'n7', label: 'Verdict', icon: AlertTriangle, color: 'text-red-600', ping: 'border-red-500',
    desktop: { x: '80.0%', y: '51.43%' }, mobile: { x: '50%', y: '84.09%' } },
  { id: 'n8', label: 'Evidence Report', icon: FileCheck2, color: 'text-gray-700', ping: 'border-gray-500',
    desktop: { x: '94.28%', y: '51.43%' }, mobile: { x: '50%', y: '97.72%' } },
];

const generateNodeKeyframes = (id: string, pct: number) => {
  if (pct === 0) return '';
  const start = Math.max(0, pct - 1.5);
  const peak = pct;
  const end = pct + 2.5;
  return `
    @keyframes scale-${id} { 0%, ${start}%, ${end}%, 100% { transform: scale(1); } ${peak}% { transform: scale(1.08); } }
    @keyframes ping-${id} { 0%, ${start}%, 100% { transform: scale(0.8); opacity: 0; } ${peak}% { transform: scale(1.2); opacity: 0.6; } ${end}% { transform: scale(1.8); opacity: 0; } }
    @keyframes icon-${id} { 0%, ${start}%, ${end}%, 100% { filter: saturate(1) brightness(1); } ${peak}% { filter: saturate(1.5) brightness(1.2); } }
    .node-${id} { animation: scale-${id} 14s ease-in-out infinite; }
    .node-${id} .sonar-ping { animation: ping-${id} 14s ease-out infinite; }
    .node-${id} svg { animation: icon-${id} 14s ease-in-out infinite; }
  `;
};

export default function WorkflowDiagram() {
  const styles = `
    /* Main Packet Flow (Blue -> Amber -> Red/Green is handled by branch) */
    @keyframes main-packet-move {
      0%, 100% { stroke-dashoffset: 1000; opacity: 0; }
      1% { opacity: 1; }
      12% { stroke-dashoffset: 850; }
      15% { stroke-dashoffset: 850; }
      21% { stroke-dashoffset: 780; }
      26% { stroke-dashoffset: 715; }
      32% { stroke-dashoffset: 650; }
      35% { stroke-dashoffset: 650; }
      48% { stroke-dashoffset: 480; }
      51% { stroke-dashoffset: 480; }
      65% { stroke-dashoffset: 310; }
      68% { stroke-dashoffset: 310; }
      81% { stroke-dashoffset: 150; }
      84% { stroke-dashoffset: 150; }
      96% { stroke-dashoffset: 0; opacity: 1; }
      98% { opacity: 0; stroke-dashoffset: -20; }
    }

    /* Safe Packet Flow */
    @keyframes safe-packet-move {
      0%, 100% { stroke-dashoffset: 320; opacity: 0; }
      1% { opacity: 1; }
      12% { stroke-dashoffset: 170; }
      15% { stroke-dashoffset: 170; }
      21% { stroke-dashoffset: 100; }
      29% { stroke-dashoffset: 0; opacity: 1; }
      32% { stroke-dashoffset: 0; opacity: 1; }
      34% { opacity: 0; stroke-dashoffset: -20; }
    }

    /* Color transition for main packet crossing boundary at 26% */
    @keyframes main-packet-color {
      0%, 24.5% { stroke: #3b82f6; }
      26%, 100% { stroke: #f59e0b; }
    }

    /* Continuous flowing texture on all paths */
    @keyframes flow-texture {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -16; }
    }
    .animated-flow {
      animation: flow-texture 1s linear infinite;
      opacity: 0.3;
    }

    /* Boundary box ripple at 26% */
    @keyframes boundary-ripple {
      0%, 24%, 30%, 100% { stroke: rgba(147, 197, 253, 0.4); filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
      26% { stroke: rgba(59, 130, 246, 1); filter: drop-shadow(0 0 8px rgba(59,130,246,0.8)); }
    }
    .boundary-box { animation: boundary-ripple 14s ease-in-out infinite; }

    /* Node Activations */
    ${generateNodeKeyframes('n2', 13.5)}
    ${generateNodeKeyframes('n3', 30.5)}
    ${generateNodeKeyframes('n4', 33.5)}
    ${generateNodeKeyframes('n5', 49.5)}
    ${generateNodeKeyframes('n6', 66.5)}
    ${generateNodeKeyframes('n7', 82.5)}
    ${generateNodeKeyframes('n8', 96.0)}

    /* Accessibility: Static Fallback */
    @media (prefers-reduced-motion: reduce) {
      .packet-glow, .sonar-ping, .animated-flow { display: none !important; }
      .boundary-box, [class^="node-"] { animation: none !important; transform: none !important; filter: none !important; }
      .boundary-box { stroke: rgba(147, 197, 253, 0.6) !important; }
    }
  `;

  // Desktop Path Definitions
  const desktopMainPath = "M 60 180 L 210 180 L 280 180 C 330 180, 330 100, 380 100 L 550 100 L 720 100 C 780 100, 780 180, 840 180 L 990 180";
  const desktopSafePath = "M 60 180 L 210 180 L 280 180 C 310 180, 310 260, 340 260";

  // Mobile Path Definitions
  const mobileMainPath = "M 500 150 L 500 2150";
  const mobileSafePath = "M 500 150 L 500 450 L 500 590 C 500 620, 700 620, 700 660";

  const PacketTrails = ({ pathD, pathLength, moveAnim, colorAnim = '', baseColor }: any) => {
    return (
      <>
        {[3, 2, 1, 0].map((i) => (
          <path
            key={i}
            d={pathD}
            pathLength={pathLength}
            className={`packet-glow ${colorAnim}`}
            style={{
              animation: `${moveAnim} 14s linear infinite`,
              stroke: baseColor,
              strokeWidth: i === 0 ? 6 : 4 + i * 2,
              opacity: i === 0 ? 1 : 0.4 - i * 0.1,
              animationDelay: `${i * 0.1}s`,
              filter: i === 0 ? 'url(#glow)' : 'none',
              strokeDasharray: `${i === 0 ? 12 : 8} ${pathLength}`,
            }}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </>
    );
  };

  return (
    <div className="w-full relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-white to-white rounded-2xl border border-gray-200 shadow-inner my-12" aria-hidden="true">
      <style>{styles}</style>
      
      {/* Universal SVG Definitions (Filters, Gradients, Background Grid) */}
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <pattern id="circuit-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(203, 213, 225, 0.2)" strokeWidth="1"/>
          </pattern>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>
      
      <div className="absolute inset-0 bg-[url(#circuit-grid)] pointer-events-none opacity-50" />

      {/* ----------------- DESKTOP LAYER ----------------- */}
      <div className="hidden lg:block relative w-full aspect-[1050/350]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1050 350">
          {/* Privacy Boundary */}
          <rect x="25" y="140" width="350" height="150" rx="20" className="boundary-box stroke-blue-300 fill-blue-50/30" strokeWidth="3" strokeDasharray="8 8" />
          <text x="200" y="275" textAnchor="middle" className="text-[10px] font-bold fill-blue-500 uppercase tracking-widest">On-Device Privacy Boundary</text>
          
          {/* Static Connector Paths */}
          <path d={desktopMainPath} className="stroke-gray-100" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={desktopSafePath} className="stroke-gray-100" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Animated Flow Texture */}
          <path d={desktopMainPath} className="animated-flow stroke-slate-400" strokeWidth="2" fill="none" strokeDasharray="4 12" />
          <path d={desktopSafePath} className="animated-flow stroke-slate-400" strokeWidth="2" fill="none" strokeDasharray="4 12" />

          {/* Traveling Packets */}
          <PacketTrails pathD={desktopMainPath} pathLength="1000" moveAnim="main-packet-move" colorAnim="packet-color" baseColor="#3b82f6" />
          <PacketTrails pathD={desktopSafePath} pathLength="320" moveAnim="safe-packet-move" baseColor="#22c55e" />
        </svg>

        {/* Desktop HTML Nodes */}
        {NODES.map((node) => (
          <div key={node.id} className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center node-${node.id}`} style={{ left: node.desktop.x, top: node.desktop.y }}>
            <div className="relative w-12 h-12 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center shadow-sm z-10">
              <div className={`absolute inset-0 rounded-xl border-2 ${node.ping} sonar-ping`} />
              <node.icon className={`w-6 h-6 ${node.color}`} />
              {node.id === 'n8' && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-gray-500 text-white p-1 rounded-full border-2 border-white">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <span className="absolute top-[110%] w-32 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">{node.label}</span>
          </div>
        ))}
      </div>

      {/* ----------------- MOBILE LAYER ----------------- */}
      <div className="block lg:hidden relative w-full aspect-[1000/2200]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 2200">
          {/* Privacy Boundary Mobile */}
          <rect x="180" y="50" width="640" height="670" rx="32" className="boundary-box stroke-blue-300 fill-blue-50/30" strokeWidth="5" strokeDasharray="16 16" />
          <text x="500" y="100" textAnchor="middle" className="text-xl font-bold fill-blue-500 uppercase tracking-widest">On-Device Privacy Boundary</text>
          
          {/* Static Connector Paths */}
          <path d={mobileMainPath} className="stroke-gray-100" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={mobileSafePath} className="stroke-gray-100" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Animated Flow Texture */}
          <path d={mobileMainPath} className="animated-flow stroke-slate-400" strokeWidth="4" fill="none" strokeDasharray="8 24" />
          <path d={mobileSafePath} className="animated-flow stroke-slate-400" strokeWidth="4" fill="none" strokeDasharray="8 24" />

          {/* Traveling Packets */}
          <PacketTrails pathD={mobileMainPath} pathLength="1000" moveAnim="main-packet-move" colorAnim="packet-color" baseColor="#3b82f6" />
          <PacketTrails pathD={mobileSafePath} pathLength="320" moveAnim="safe-packet-move" baseColor="#22c55e" />
        </svg>

        {/* Mobile HTML Nodes */}
        {NODES.map((node) => (
          <div key={node.id} className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center node-${node.id}`} style={{ left: node.mobile.x, top: node.mobile.y }}>
            <div className="relative w-14 h-14 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-md z-10">
              <div className={`absolute inset-0 rounded-2xl border-2 ${node.ping} sonar-ping`} />
              <node.icon className={`w-7 h-7 ${node.color}`} />
              {node.id === 'n8' && (
                <div className="absolute -bottom-2 -right-2 bg-gray-500 text-white p-1.5 rounded-full border-[3px] border-white shadow-sm">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <span className="absolute top-[115%] w-40 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
