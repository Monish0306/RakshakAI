const fs = require('fs');

const code = `import { useRef, useState, useEffect } from 'react';
import { 
  Smartphone, ShieldAlert, Key, FileText, 
  Server, Route, Activity, BarChart, 
  Database, Lock, 
  LayoutDashboard, CheckCircle, Flag, Download 
} from 'lucide-react';

const colorMap = {
  blue: 'bg-blue-50/50 border-blue-200',
  amber: 'bg-amber-50/50 border-amber-200',
  green: 'bg-green-50/50 border-green-200',
  purple: 'bg-purple-50/50 border-purple-200'
};

const textMap = {
  blue: 'text-blue-800',
  amber: 'text-amber-800',
  green: 'text-green-800',
  purple: 'text-purple-800'
};

const Layer = ({ title, color, children }: { title: string, color: 'blue' | 'amber' | 'green' | 'purple', children: React.ReactNode }) => (
  <div className={\`p-4 rounded-2xl border-2 flex flex-col space-y-3 shadow-sm \${colorMap[color]}\`}>
    <h3 className={\`text-xs font-black tracking-widest text-center uppercase \${textMap[color]} mb-1 opacity-80\`}>{title}</h3>
    {children}
  </div>
);

const Node = ({ id, icon: Icon, text }: { id: string, icon: any, text: string }) => (
  <div id={id} className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm relative transition-shadow hover:shadow-md z-10">
    <Icon className="w-5 h-5 text-slate-500 mb-1.5" />
    <span className="text-[10px] font-bold text-slate-700 leading-tight">{text}</span>
  </div>
);

const TechBadge = ({ text }: { text: string }) => (
  <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
    {text}
  </div>
);

interface RenderedLine {
  id: string;
  pathD: string;
  animated: boolean;
  isDeadEnd?: boolean;
  midX: number;
  midY: number;
  label?: string;
  badge?: number;
  startX: number;
  startY: number;
}

export default function SystemArchitecture() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<RenderedLine[]>([]);
  const [svgReady, setSvgReady] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let fallbackTimeoutId: number;

    const updateLines = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) {
        setLines([]);
        setSvgReady(false);
        return;
      }
      
      const getRect = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        return {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          w: rect.width,
          h: rect.height,
          cx: rect.left - containerRect.left + rect.width / 2,
          cy: rect.top - containerRect.top + rect.height / 2,
        };
      };

      const connections = [
        { id: 'c1', fromId: 'l1-privacy', toId: 'l2-classify', label: 'if suspicious', badge: 1, animated: true },
        { id: 'c2', fromId: 'l1-privacy', isDeadEnd: true, label: 'resolved on-device' },
        { id: 'c3', fromId: 'l2-classify', toId: 'l3-reports', label: 'writes HIGH_RISK results', badge: 2, animated: true },
        { id: 'c4', fromId: 'l3-reports', toId: 'l4-queue', label: 'powers', badge: 3, animated: true },
        { id: 'c5', fromId: 'l2-match', toId: 'l3-reports', label: 'reads + writes for matching' },
        { id: 'c6', fromId: 'l2-list', toId: 'l3-reports', label: 'reads for investigator queue' },
        { id: 'c7', fromId: 'l1-auth', toId: 'l3-users', label: 'reads/writes profile' }
      ];

      const newLines: RenderedLine[] = [];
      let allValid = true;

      // Determine orientation based on container width. LG breakpoint in tailwind is 1024px.
      // But we can just use the relative positions of layer 1 and layer 2.
      const l1 = getRect('l1-privacy');
      const l2 = getRect('l2-classify');
      
      if (!l1) {
        setLines([]);
        setSvgReady(false);
        return;
      }

      // If l2 exists, we can figure out horizontal vs vertical. If l1 is above l2, it's vertical.
      const isHorizontal = l2 ? (Math.abs(l2.cx - l1.cx) > Math.abs(l2.cy - l1.cy)) : true;

      for (const conn of connections) {
        const from = getRect(conn.fromId);
        if (!from) { allValid = false; break; }

        let startX, startY, endX, endY, cp1X, cp1Y, cp2X, cp2Y;

        if (conn.isDeadEnd) {
          if (isHorizontal) {
            startX = from.cx;
            startY = from.cy + from.h / 2;
            endX = startX;
            endY = startY + 45;
            cp1X = startX; cp1Y = startY + 15;
            cp2X = endX; cp2Y = endY - 15;
          } else {
            startX = from.cx - from.w / 2;
            startY = from.cy;
            endX = startX - 45;
            endY = startY;
            cp1X = startX - 15; cp1Y = startY;
            cp2X = endX + 15; cp2Y = endY;
          }
        } else {
          const to = getRect(conn.toId!);
          if (!to) { allValid = false; break; }

          if (isHorizontal) {
            const movingRight = to.cx > from.cx;
            startX = from.cx + (movingRight ? from.w / 2 : -from.w / 2);
            startY = from.cy;
            endX = to.cx + (movingRight ? -to.w / 2 : to.w / 2);
            endY = to.cy;
            // Add a small offset to the end point so the marker arrow doesn't overlap the box border
            const arrowOffset = 6; 
            endX += movingRight ? -arrowOffset : arrowOffset;
            
            const dist = Math.abs(endX - startX) * 0.4;
            cp1X = movingRight ? startX + dist : startX - dist;
            cp1Y = startY;
            cp2X = movingRight ? endX - dist : endX + dist;
            cp2Y = endY;
          } else {
            const movingDown = to.cy > from.cy;
            startX = from.cx;
            startY = from.cy + (movingDown ? from.h / 2 : -from.h / 2);
            endX = to.cx;
            endY = to.cy + (movingDown ? -to.h / 2 : to.h / 2);
            const arrowOffset = 6;
            endY += movingDown ? -arrowOffset : arrowOffset;
            
            const dist = Math.abs(endY - startY) * 0.4;
            cp1X = startX;
            cp1Y = movingDown ? startY + dist : startY - dist;
            cp2X = endX;
            cp2Y = movingDown ? endY - dist : endY + dist;
          }
        }
        
        const pathD = \`M \${startX} \${startY} C \${cp1X} \${cp1Y}, \${cp2X} \${cp2Y}, \${endX} \${endY}\`;
        
        newLines.push({
          id: conn.id,
          pathD,
          animated: !!conn.animated,
          isDeadEnd: conn.isDeadEnd,
          midX: (startX + endX) / 2,
          midY: (startY + endY) / 2,
          label: conn.label,
          badge: conn.badge,
          startX,
          startY
        });
      }
      
      if (allValid && newLines.length > 0) {
        setLines(newLines);
        setSvgReady(true);
      } else {
        setLines([]);
        setSvgReady(false);
      }
    };

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateLines);
    };

    updateLines();

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);
    fallbackTimeoutId = window.setTimeout(updateLines, 500);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(fallbackTimeoutId);
    };
  }, []);

  return (
    <div className="w-full mt-8 mb-16 space-y-6">
      <style>{\`
        @keyframes arch-pulse {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        .arch-pulse-anim {
          animation: arch-pulse 6s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .arch-pulse-anim { display: none !important; }
        }
      \`}</style>
      
      <div className="text-center mb-6 max-w-lg mx-auto bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
        <span className="font-semibold">Legend:</span> Follow the numbered path (1, 2, 3) to see how a single scam check flows through the system, from device to investigator.
      </div>
      
      <div ref={containerRef} className="relative w-full">
        {/* Dynamic SVG Connection Overlay */}
        <svg 
          className={\`absolute inset-0 pointer-events-none transition-opacity duration-300 \${svgReady ? 'opacity-100' : 'opacity-0'}\`} 
          style={{ width: '100%', height: '100%', zIndex: 0, overflow: 'visible' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            <marker id="arrowhead-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
            </marker>
            <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3">
              <circle cx="3" cy="3" r="3" fill="#ef4444" />
            </marker>
          </defs>

          {lines.map((line) => (
            <g key={line.id}>
              <path 
                d={line.pathD} 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="2" 
                markerEnd={line.isDeadEnd ? "url(#dot)" : "url(#arrowhead)"} 
              />
              {line.animated && (
                <path 
                  d={line.pathD} 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className="arch-pulse-anim drop-shadow-md" 
                  strokeDasharray="6 94" 
                />
              )}
            </g>
          ))}

          {/* Render Labels on top of paths */}
          {lines.map((line) => {
            if (!line.label && !line.badge) return null;
            
            // Offset the label slightly above the midpoint
            const labelY = line.midY - 12;
            
            return (
              <g key={\`label-\${line.id}\`}>
                {line.label && (
                  <text 
                    x={line.midX} 
                    y={labelY} 
                    textAnchor="middle" 
                    fill="#64748b" 
                    fontSize="9.5" 
                    fontWeight="600"
                    className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] bg-white"
                  >
                    {line.label}
                  </text>
                )}
                {line.badge && (
                  <g transform={\`translate(\${line.startX - 10}, \${line.startY - 20})\`}>
                    <circle cx="10" cy="10" r="8" fill="#1e3a8a" />
                    <text x="10" y="13.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      {line.badge}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* 4-Layer Grid */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-4 xl:gap-8">
          
          <Layer title="Client (Browser)" color="blue">
            <Node id="l1-privacy" icon={Smartphone} text="On-Device Privacy Filter" />
            <Node id="l1-rules" icon={ShieldAlert} text="Rule-Based Red Flags" />
            <Node id="l1-auth" icon={Key} text="Firebase Auth (SDK)" />
            <Node id="l1-pdf" icon={FileText} text="PDF Report Generator" />
          </Layer>

          <Layer title="Serverless API" color="amber">
            <Node id="l2-classify" icon={Server} text="/api/classify" />
            <Node id="l2-advisory" icon={Route} text="/api/advisory" />
            <Node id="l2-match" icon={Server} text="/api/campaign-match" />
            <Node id="l2-list" icon={Route} text="/api/campaign-list" />
            <Node id="l2-lookup" icon={Server} text="/api/username-lookup" />
            <Node id="l2-pulse" icon={Activity} text="/api/pulse-stats" />
            <Node id="l2-telemetry" icon={BarChart} text="/api/telemetry" />
          </Layer>

          <Layer title="Data Layer" color="green">
            <Node id="l3-reports" icon={Database} text="Firestore: citizenReports" />
            <Node id="l3-users" icon={Database} text="Firestore: users" />
            <Node id="l3-eval" icon={Database} text="Firestore: evaluationResults" />
            <Node id="l3-stats" icon={Database} text="Firestore: dailyStats" />
            <Node id="l3-rules" icon={Lock} text="Security Rules (owner-scoped)" />
          </Layer>

          <Layer title="Investigator Tools" color="purple">
            <Node id="l4-queue" icon={LayoutDashboard} text="Campaign Queue" />
            <Node id="l4-verify" icon={CheckCircle} text="Evidence Verification" />
            <Node id="l4-flag" icon={Flag} text="Priority Flagging" />
            <Node id="l4-export" icon={Download} text="CSV Export" />
          </Layer>

        </div>
      </div>

      {/* Built With Strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-8 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-2">Built With</span>
        <TechBadge text="React 18" />
        <TechBadge text="TypeScript" />
        <TechBadge text="Vite" />
        <TechBadge text="Tailwind CSS" />
        <TechBadge text="Firebase" />
        <TechBadge text="Vercel" />
        <TechBadge text="Hugging Face" />
        <TechBadge text="Transformers.js" />
        <TechBadge text="jsPDF" />
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/SystemArchitecture.tsx', code, 'utf8');
console.log('Fixed file.');
