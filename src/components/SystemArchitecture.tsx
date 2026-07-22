import { useRef, useState, useEffect } from 'react';
import { 
  ShieldAlert, Key, FileText, 
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

const Layer = ({ id, title, color, children }: { id?: string, title: string, color: 'blue' | 'amber' | 'green' | 'purple', children: React.ReactNode }) => (
  <div id={id} className={`p-4 rounded-2xl border-2 flex flex-col space-y-3 shadow-sm ${colorMap[color]}`}>
    <h3 className={`text-xs font-black tracking-widest text-center uppercase ${textMap[color]} mb-1 opacity-80`}>{title}</h3>
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
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  midX: number;
  midY: number;
  label?: string;
  badge?: number;
  isReturn?: boolean;
}

interface ConnectionItem {
  id: string;
  fromId: string;
  toId?: string;
  label?: string;
  badge?: number;
  pct?: number;
  isReturn?: boolean;
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

      const connections: ConnectionItem[] = [
        { id: 'c1', fromId: 'layer-col-1', toId: 'layer-col-2', label: 'CALLS /api/classify', pct: 0.35 },
        { id: 'c2', fromId: 'layer-col-2', toId: 'layer-col-1', label: 'RETURNS ADVISORY', pct: 0.75, isReturn: true },
        { id: 'c3', fromId: 'layer-col-2', toId: 'layer-col-3', label: 'LOGS THREAT TELEMETRY', pct: 0.5 },
        { id: 'c4', fromId: 'layer-col-3', toId: 'layer-col-4', label: 'POWERS CAMPAIGN QUEUE', pct: 0.55 }
      ];

      const newLines: RenderedLine[] = [];
      let allValid = true;

      const l1 = getRect('layer-col-1');
      const l2 = getRect('layer-col-2');
      
      if (!l1 || !l2) {
        setLines([]);
        setSvgReady(false);
        return;
      }

      const isHorizontal = Math.abs(l2.cx - l1.cx) > Math.abs(l2.cy - l1.cy);

      for (const conn of connections) {
        const from = getRect(conn.fromId);
        const to = getRect(conn.toId!);
        if (!from || !to) { allValid = false; break; }

        let startX, startY, endX, endY;
        const pct = conn.pct || 0.5;

        if (isHorizontal) {
          const movingRight = to.cx > from.cx;
          
          startX = movingRight ? (from.x + from.w) : from.x;
          endX = movingRight ? to.x : (to.x + to.w);
          
          const topMargin = 45;
          const bottomMargin = 30;
          
          const safeMinY = Math.max(from.y + topMargin, to.y + topMargin);
          const safeMaxY = Math.min(from.y + from.h - bottomMargin, to.y + to.h - bottomMargin);
          
          let desiredY = from.y + from.h * pct;
          if (desiredY < safeMinY) desiredY = safeMinY;
          if (desiredY > safeMaxY) desiredY = safeMaxY;
          
          startY = endY = desiredY;
        } else {
          const movingDown = to.cy > from.cy;
          
          startY = movingDown ? (from.y + from.h) : from.y;
          endY = movingDown ? to.y : (to.y + to.h);
          
          const sideMargin = 20;
          
          const safeMinX = Math.max(from.x + sideMargin, to.x + sideMargin);
          const safeMaxX = Math.min(from.x + from.w - sideMargin, to.x + to.w - sideMargin);
          
          let desiredX = from.x + from.w * pct;
          if (desiredX < safeMinX) desiredX = safeMinX;
          if (desiredX > safeMaxX) desiredX = safeMaxX;
          
          startX = endX = desiredX;
        }

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        newLines.push({
          id: conn.id,
          startX,
          startY,
          endX,
          endY,
          midX,
          midY,
          label: conn.label,
          badge: conn.badge,
          isReturn: !!conn.isReturn
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
      
      <div className="text-center mb-6 max-w-lg mx-auto bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
        <span className="font-semibold">Legend:</span> Follow the paths to see how threat checks flow from Client devices to Serverless AI endpoints, database telemetry logs, and investigator tools.
      </div>
      
      <div ref={containerRef} className="relative w-full">
        <svg 
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${svgReady ? 'opacity-100' : 'opacity-0'}`} 
          style={{ width: '100%', height: '100%', zIndex: 0, overflow: 'visible' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            <marker id="arrowhead-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
            </marker>
          </defs>

          {lines.map((line) => (
            <g key={line.id}>
              <line
                x1={line.startX}
                y1={line.startY}
                x2={line.endX}
                y2={line.endY}
                stroke={line.isReturn ? "#6366f1" : "#94a3b8"} 
                strokeWidth="2" 
                strokeDasharray={line.isReturn ? "4 4" : undefined}
                markerEnd={line.isReturn ? "url(#arrowhead-blue)" : "url(#arrowhead)"} 
              />
            </g>
          ))}

          {lines.map((line) => {
            if (!line.label) return null;
            
            const isHoriz = line.startY === line.endY;
            const labelX = line.midX;
            const labelY = isHoriz ? line.midY - 8 : line.midY;
            
            return (
              <g key={`label-${line.id}`}>
                <rect
                  x={labelX - 65}
                  y={labelY - 7}
                  width="130"
                  height="14"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  className="shadow-xs dark:fill-slate-900 dark:stroke-slate-800"
                />
                <text 
                  x={labelX} 
                  y={labelY + 3} 
                  textAnchor="middle" 
                  fill={line.isReturn ? "#6366f1" : "#475569"} 
                  className="dark:fill-slate-300 text-[7px] font-sans font-black tracking-wider uppercase"
                >
                  {line.label}
                </text>
              </g>
            );
          })}
        </svg>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-24 xl:gap-28">
          
          <Layer id="layer-col-1" title="Client (Browser)" color="blue">
            <Node id="l1-rules" icon={ShieldAlert} text="Rule-Based Red Flags" />
            <Node id="l1-auth" icon={Key} text="Firebase Auth (SDK)" />
            <Node id="l1-pdf" icon={FileText} text="PDF Report Generator" />
          </Layer>

          <Layer id="layer-col-2" title="Serverless API" color="amber">
            <Node id="l2-classify" icon={Server} text="/api/classify" />
            <Node id="l2-advisory" icon={Route} text="/api/advisory" />
            <Node id="l2-match" icon={Server} text="/api/campaign?action=match" />
            <Node id="l2-list" icon={Route} text="/api/campaign?action=list" />
            <Node id="l2-lookup" icon={Server} text="/api/username-lookup" />
            <Node id="l2-pulse" icon={Activity} text="/api/pulse-stats" />
            <Node id="l2-telemetry" icon={BarChart} text="/api/telemetry" />
          </Layer>

          <Layer id="layer-col-3" title="Data Layer" color="green">
            <Node id="l3-reports" icon={Database} text="Firestore: citizenReports" />
            <Node id="l3-users" icon={Database} text="Firestore: users" />
            <Node id="l3-eval" icon={Database} text="Firestore: evaluationResults" />
            <Node id="l3-stats" icon={Database} text="Firestore: dailyStats" />
            <Node id="l3-rules" icon={Lock} text="Security Rules (owner-scoped)" />
          </Layer>

          <Layer id="layer-col-4" title="Investigator Tools" color="purple">
            <Node id="l4-queue" icon={LayoutDashboard} text="Campaign Queue" />
            <Node id="l4-verify" icon={CheckCircle} text="Evidence Verification" />
            <Node id="l4-flag" icon={Flag} text="Priority Flagging" />
            <Node id="l4-export" icon={Download} text="CSV Export" />
          </Layer>

        </div>
      </div>

      {/* Built With Strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-8 border-t border-gray-100 dark:border-slate-800">
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
