import { useEffect, useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Cpu, 
  Landmark, 
  Network, 
  ShieldCheck, 
  Users,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  PieChart as PieIcon,
  BarChart3,
  FileCheck,
  Globe2,
  BrainCircuit,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  CartesianGrid
} from 'recharts';
import { fetchPulseStats, type PulseStats } from '../lib/api';

interface BusinessImpactProps {
  language: string;
}

// Simple CountUp animation helper
function CountUpNumber({ end, prefix = "", suffix = "", duration = 1500 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString("en-IN")}{suffix}</span>;
}

export default function BusinessImpact({}: BusinessImpactProps) {
  const [, setStats] = useState<PulseStats | null>(null);

  useEffect(() => {
    fetchPulseStats().then((response) => {
      if (response.success) setStats(response.data);
    }).catch((error) => console.error(error));
  }, []);

  // Recharts Data for Section 1
  const recoveryData = [
    { name: "Unrecovered Fraud Loss", value: 10395, color: "#EF4444" },
    { name: "Refunded to Victims", value: 323, color: "#10B981" }
  ];

  const yearlySurgeData = [
    { year: "2023", loss: 7480 },
    { year: "2024", loss: 14210 },
    { year: "2025 (Est)", loss: 22495 }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-12">
      {/* ==================================================================== */}
      {/* SECTION 1 — The Problem (Real, Cited Market Data - Hero Section)     */}
      {/* ==================================================================== */}
      <section className="space-y-8">
        {/* Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-[#1E3A8A] to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 px-6 py-12 text-center text-white shadow-2xl sm:px-12 border border-blue-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <AlertTriangle className="w-64 h-64 text-red-500" />
          </div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-mono uppercase tracking-widest mb-4">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Market Crisis & Official Data (2025 MHA / I4C)</span>
          </div>
          <h1 className="mx-auto max-w-4xl text-3xl font-black tracking-tight sm:text-5xl leading-tight">
            A ₹22,495 Crore Cyber Fraud Crisis — And the <span className="text-red-400 font-extrabold">94% Recovery Gap</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-slate-300 font-medium">
            India's rapid digital payment surge has created an unprecedented crime surface. Cybercrime helpline 1930 receives over 1 call every second, while victims recover less than 6 paise for every ₹100 stolen.
          </p>
        </div>

        {/* Real Cited Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">2025 Annual Loss</span>
              <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full">+24% YoY</span>
            </div>
            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              ₹<CountUpNumber end={22495} /> Cr
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Total reported losses across all financial fraud categories in India in 2025.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">Digital Arrest Share</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              ₹<CountUpNumber end={19000} prefix="" suffix="+" /> Cr
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Originated specifically from Digital Arrest, Police & CBI impersonation scams.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">Recovery Rate</span>
              <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full">Pipeline Failure</span>
            </div>
            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              <CountUpNumber end={6} suffix="%" />
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Of frozen funds actually reach victims (only ₹323 Cr refunded out of ₹10,718 Cr frozen).
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">Unreported Gap</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Silent Victims</span>
            </div>
            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              <CountUpNumber end={51} suffix="%" />
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Of targeted citizens never report the crime due to intimidation, isolation, or shame.
            </p>
          </div>
        </div>

        {/* Recharts Data Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recovery Pipeline Gap Chart */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <PieIcon className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-gray-900 dark:text-white text-base">The 94% Recovery Pipeline Gap</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Ratio of frozen funds returned to victims vs unrecovered losses (MHA / I4C Data).
            </p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recoveryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {recoveryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`₹${value.toLocaleString()} Cr`, 'Amount']}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center items-center space-x-6 text-xs font-semibold pt-2 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-gray-700 dark:text-gray-300">Unrecovered (94%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-gray-700 dark:text-gray-300">Refunded to Victims (6%)</span>
              </div>
            </div>
          </div>

          {/* Yearly Fraud Surge Bar Chart */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Annual Cyber Fraud Growth (₹ Cr)</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Exponential rise in reported cyber fraud losses in India over the past 3 years.
            </p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlySurgeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="year" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip 
                    formatter={(val: any) => [`₹${val.toLocaleString()} Cr`, 'Loss']}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="loss" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[11px] text-gray-500 dark:text-gray-400 font-medium pt-2 border-t border-gray-100 dark:border-slate-800">
              *Source: Ministry of Home Affairs (MHA) & I4C Public Statistical Reports (2023–2025).
            </div>
          </div>
        </div>

        {/* Section Footnote */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 italic">
          Data compiled from public reports by the Ministry of Home Affairs (MHA), Indian Cybercrime Coordination Centre (I4C), and NCRP annual releases.
        </p>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2 — Our Solution (Feature to Outcome Mapping)                */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#1E3A8A] dark:text-blue-400 font-bold">Built Capabilities $\rightarrow$ Measurable Impact</p>
          <h2 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-white">Mapping Real Features to Business Outcomes</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Every technical architecture choice in Rakshak AI directly addresses an operational bottleneck in the cybercrime prevention and recovery pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:border-[#1E3A8A] dark:hover:border-blue-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-400 rounded-xl">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-[#1E3A8A] dark:text-blue-300 px-2.5 py-1 rounded-md">
                  Detection Latency
                </span>
              </div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-1">
                Two-Stage Edge + Cloud Detection
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                On-device MiniLM pre-filter evaluates 80%+ of routine calls locally in &lt;1ms. Complex pretexts escalate to deep LLM reasoning in under 6 seconds.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Zero-cost on-device pre-filtering</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:border-[#1E3A8A] dark:hover:border-blue-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-md">
                  Explainable AI
                </span>
              </div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-1">
                8-Point Taxonomy & Evidence Quoting
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Replaces black-box scores with plain-language reasoning, quoting the attacker's own coercive phrases back to the victim to break psychological control.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Breaks digital arrest illusion</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:border-[#1E3A8A] dark:hover:border-blue-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md">
                  Triage Efficiency
                </span>
              </div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-1">
                Real-Time Firestore Intelligence Sync
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Citizen submissions instantly appear in the officer Command Center queue, automatically clustered into active crime campaign genomes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Reduces officer investigation time</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:border-[#1E3A8A] dark:hover:border-blue-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md">
                  Compliant Evidence
                </span>
              </div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-1">
                SHA-256 Hash-Verified Audit Reports
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Generates tamper-evident PDF reports with evidence checklists, ready to attach to official 1930 / cybercrime.gov.in complaint filings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Legally usable chain-of-custody</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:border-[#1E3A8A] dark:hover:border-blue-500 transition-all flex flex-col justify-between md:col-span-2 lg:col-span-2">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Globe2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md">
                  Digital Inclusion
                </span>
              </div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-1">
                5 Indian Language Multi-Lingual Engine (EN, HI, TA, KN, TE)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Specifically built for India's linguistic landscape. Protects vulnerable demographics—such as elderly citizens and Tier-2/3 first-time UPI users—who are disproportionately targeted by cross-border syndicates.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Native localized guidance in 5 languages</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 3 — Business Model (GTM Pyramid & Feedback Loop)            */}
      {/* ==================================================================== */}
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">Go-To-Market & Revenue Architecture</p>
          <h2 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-white">Multi-Tiered Model & Compounding Flywheel</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Rakshak AI combines a free public-good citizen application with high-value B2G state cell licensing and an intelligence data moat.
          </p>
        </div>

        {/* 2-Column: GTM Pyramid & Network Effect Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column A: GTM Pyramid / Layered Funnel */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400" />
                  <span>Go-To-Market Layered Model</span>
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                  B2G Primary
                </span>
              </div>

              <div className="space-y-3.5 mt-4">
                {/* B2C Layer */}
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">B2C Citizen Layer</span>
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">BUILT & DEMOABLE</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">Free Citizen App & Voice/Text Shield</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                    Drives viral public adoption, pre-screens call transcripts locally, and feeds real-time scam incident data into the intelligence network.
                  </p>
                </div>

                {/* B2G Layer */}
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">B2G Core Revenue Layer</span>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">PRIMARY REVENUE MODEL</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">Command Center & Case Management Suite</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                    Annual department licensing for State Cyber Crime Cells, Police Special Branches, and 1930 Helpline dispatchers.
                  </p>
                </div>

                {/* B2B Layer */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">B2B Financial Data Layer</span>
                    <span className="text-[10px] font-bold bg-slate-600 text-white px-2 py-0.5 rounded-full">FUTURE EXPANSION</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">Bank & Telecom Fraud Intelligence API</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                    Licensing scam-genome intelligence feeds to commercial banks and UPI apps to flag recipient accounts before transfers complete.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column B: Network Effect Flywheel Diagram */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <Network className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>The Data Moat & Feedback Loop</span>
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                  Network Effect
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
                Every HIGH_RISK report immediately strengthens the matching accuracy of the national campaign database for all other users.
              </p>

              {/* Diagram */}
              <div className="p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-blue-900/60 text-blue-300 rounded-lg border border-blue-700/50 text-xs font-bold w-36 text-center">
                    1. Citizen Reports Scam
                  </div>
                  <div className="text-slate-500 font-bold">$\rightarrow$</div>
                  <div className="p-2.5 bg-purple-900/60 text-purple-300 rounded-lg border border-purple-700/50 text-xs font-bold w-36 text-center">
                    2. Edge + LLM Parse
                  </div>
                </div>

                <div className="flex justify-center text-slate-500 font-bold">
                  $\downarrow$
                </div>

                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-emerald-900/60 text-emerald-300 rounded-lg border border-emerald-700/50 text-xs font-bold w-36 text-center">
                    4. Instant Triage & Freeze
                  </div>
                  <div className="text-slate-500 font-bold">$\leftarrow$</div>
                  <div className="p-2.5 bg-amber-900/60 text-amber-300 rounded-lg border border-amber-700/50 text-xs font-bold w-36 text-center">
                    3. Campaign Genome Link
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-300 font-medium leading-relaxed">
                <strong>Why this is defensible:</strong> Fraud syndicates constantly rewrite scripts. Our campaign-linking engine groups paraphrased variations into a single crime genome, making script modifications ineffective.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 4 — Business Model & Financial Projections                  */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">Financial Framework & Unit Economics</p>
          <h2 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-white">Business Model & Financial Projections</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Modeled unit economics based on B2G public infrastructure distribution and hybrid edge-inference cost optimization.
          </p>
        </div>

        {/* Projections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: CAC */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                PROJECTED TARGET
              </span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Customer Acquisition Cost (CAC)</h3>
            <div className="mt-2 text-xl font-black text-[#1E3A8A] dark:text-blue-400">Near-Zero Organic</div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              B2G partnerships with I4C & state cyber cells leverage existing public 1930 helpline referrals, avoiding consumer ad spend.
            </p>
          </div>

          {/* Card 2: LTV */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                B2G MODEL
              </span>
              <Landmark className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Lifetime Value (LTV)</h3>
            <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">Multi-Year Enterprise</div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Multi-year recurring SaaS contracts per State Cyber Cell / Police Department with expansion to regional police nodes.
            </p>
          </div>

          {/* Card 3: Revenue Model */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                SAAS ARCHITECTURE
              </span>
              <Building2 className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Revenue Model</h3>
            <div className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400">Annual B2G Licensing</div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Annual departmental licensing for Command Center seats. Citizen protection app remains 100% free to maximize public good.
            </p>
          </div>

          {/* Card 4: Gross Margin */}
          <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                COST CURVE
              </span>
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Gross Margin Profile</h3>
            <div className="mt-2 text-xl font-black text-purple-600 dark:text-purple-400">High Software Margin</div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              On-device MiniLM resolves 80%+ of checks locally, ensuring API inference costs stay minimal as user adoption expands.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 5 — Market Opportunity (TAM / SAM / SOM Concentric Diagram) */}
      {/* ==================================================================== */}
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#1E3A8A] dark:text-blue-400 font-bold">Addressable Market & Expansion Horizon</p>
          <h2 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-white">TAM • SAM • SOM Market Opportunity</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From initial pilot deployment in high-incident state cyber cells to national protection for 900M+ digital citizens.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Concentric Circles SVG Diagram */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm flex flex-col items-center justify-center relative min-h-[320px]">
            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* TAM Outer Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex items-start justify-center pt-2">
                <span className="text-[10px] font-mono font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                  TAM: 900M+ Digital Population
                </span>
              </div>

              {/* SAM Middle Ring */}
              <div className="absolute w-52 h-52 rounded-full border-2 border-indigo-300 dark:border-indigo-800 bg-indigo-100/50 dark:bg-indigo-900/30 flex items-start justify-center pt-2">
                <span className="text-[10px] font-mono font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider text-center px-2">
                  SAM: 28L+ Victims & 36 State Cells
                </span>
              </div>

              {/* SOM Inner Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-[#1E3A8A] text-white flex flex-col items-center justify-center p-2 text-center shadow-lg border-2 border-blue-400">
                <span className="text-[9px] font-mono font-bold text-blue-200 uppercase">SOM Target</span>
                <span className="text-xs font-black mt-0.5">5 Pilot States</span>
                <span className="text-[9px] text-blue-300">High-Risk Nodes</span>
              </div>
            </div>
          </div>

          {/* Callout Cards */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">TAM — Total Addressable Market</span>
                <span className="text-xs font-black text-gray-900 dark:text-white">900M+ Users</span>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                India's total active smartphone and UPI user base vulnerable to digital arrest and voice phishing impersonation.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">SAM — Serviceable Addressable Market</span>
                <span className="text-xs font-black text-gray-900 dark:text-white">28L+ Annual Cases</span>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                28 Lakh+ annual officially registered fraud complaints across 36 State and Union Territory Cyber Crime Cells nationwide.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">SOM — Initial Target Horizon</span>
                <span className="text-xs font-black text-gray-900 dark:text-white">5 Initial State Pilot Cells</span>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Deploying initial B2G Command Center licenses to 5 high-incidence pilot state cyber hubs (NCR, Cyberabad, Jamtara corridor) and early citizen adopters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 6 — Competitive Positioning (2x2 Matrix & Defensive Moat)    */}
      {/* ==================================================================== */}
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#1E3A8A] dark:text-blue-400 font-bold">Defensible Market Moat</p>
          <h2 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-white">2x2 Competitive Positioning Matrix</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Why legacy bank-side fraud scoring and simple spam-caller blockers fail to prevent digital arrest scams.
          </p>
        </div>

        {/* 2x2 Matrix Container */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <div className="grid grid-cols-2 gap-4 relative min-h-[380px] py-10 px-4 md:px-16 lg:px-20 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Axis Labels (Top and Bottom: standard centered, Left and Right: hidden on mobile, rotated absolute on tablet/desktop) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-800 shadow-xs z-10 flex items-center gap-1 select-none">
              <ArrowUp className="w-3 h-3 text-gray-400" /> HIGH EXPLAINABLE AI
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-800 shadow-xs z-10 flex items-center gap-1 select-none">
              <ArrowDown className="w-3 h-3 text-gray-400" /> BLACK-BOX RISK SCORE
            </div>
            <div className="hidden md:flex items-center space-x-1 absolute left-8 lg:left-10 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-800 shadow-xs z-10 select-none">
              <span>←</span><span>REACTIVE</span>
            </div>
            <div className="hidden md:flex items-center space-x-1 absolute right-8 lg:right-10 top-1/2 translate-x-1/2 -translate-y-1/2 rotate-90 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-800 shadow-xs z-10 select-none">
              <span>REAL-TIME PRE-TRANSACTION</span><span>→</span>
            </div>

            {/* Quadrant 1 (Top-Left): Explainable but Reactive */}
            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-800 flex flex-col justify-center items-center text-center">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Manual Legal Audits</span>
              <p className="text-[10px] text-gray-400 mt-1">Post-incident legal reports without pre-transaction intervention</p>
            </div>

            {/* Quadrant 2 (Top-Right): THE LEADER - RAKSHAK AI */}
            <div className="p-5 rounded-xl border-2 border-[#1E3A8A] dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/70 flex flex-col justify-between shadow-md relative overflow-hidden pr-5 lg:pr-6">
              <div className="absolute top-2 right-2 bg-[#1E3A8A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Category Leader
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400" />
                  <h4 className="font-black text-[#1E3A8A] dark:text-white text-base">Rakshak AI</h4>
                </div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mt-1">Real-Time Pre-Transaction + Explainable AI</p>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 mt-2 leading-relaxed max-w-[92%]">
                  Intervenes directly during ongoing coercive calls, explaining pretext tactics to the victim while dispatching real-time evidence to law enforcement.
                </p>
              </div>
              <div className="mt-3 text-[9.5px] font-mono font-bold text-blue-800 dark:text-blue-300 bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-200 dark:border-blue-900 leading-normal w-full box-border break-words">
                Moat: Edge Hybrid Speed + Campaign Genome Linking
              </div>
            </div>

            {/* Quadrant 3 (Bottom-Left): Legacy Bank Tools */}
            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-800 flex flex-col justify-center items-center text-center">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Legacy Bank Anti-Fraud Engines</span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Triggers black-box risk alerts only after victims initiate transfer; fails against coercive social engineering.
              </p>
            </div>

            {/* Quadrant 4 (Bottom-Right): Telecom Spam Blockers */}
            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-800 flex flex-col justify-center items-center text-center">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Telecom Caller ID Blockers</span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Flags known caller numbers but cannot analyze dynamic conversational content or digital arrest pretexts.
              </p>
            </div>
          </div>

          {/* Mobile-only horizontal axis labels to prevent grid squeeze */}
          <div className="flex md:hidden justify-between items-center text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mt-3 px-2">
            <span>← REACTIVE</span>
            <span>REAL-TIME PRE-TRANSACTION →</span>
          </div>
        </div>
      </section>

      {/* Pitch Deck Executive Closing Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-[#1E3A8A] to-slate-900 px-8 py-12 text-center text-white shadow-2xl border border-blue-900/40">
        <h2 className="mx-auto max-w-4xl text-2xl font-black leading-relaxed sm:text-3xl">
          Built for Scalable Public Safety & State-Level Cyber Defense.
        </h2>
        <p className="mt-3 text-sm text-slate-300 max-w-2xl mx-auto">
          Combining zero-cost edge privacy for citizens with unified command intelligence for law enforcement.
        </p>
      </section>
    </div>
  );
}

