import { useState, useEffect } from 'react';
import { ArrowDown, Cpu, ShieldAlert, Brain, Calculator, FileText, Download, Target, Network, Map, Activity, Shield, Flame } from 'lucide-react';
import { fetchPulseStats, type PulseStats } from '../lib/api';

export default function About() {
  const [stats, setStats] = useState<PulseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPulseStats()
      .then(res => {
        if (res.success) {
          setStats(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const pipeline = [
    { name: "On-Device Privacy Filter", icon: Cpu, desc: "Xenova/all-MiniLM-L6-v2 embedding cosine similarity check." },
    { name: "Rule-Based Red Flags", icon: ShieldAlert, desc: "Deterministic matching for known scam terminology." },
    { name: "Cloud LLM Reasoning", icon: Brain, desc: "Few-shot prompting over a structured 8-point scam taxonomy." },
    { name: "Risk Scoring", icon: Calculator, desc: "Evidence-weighted severity aggregation." },
    { name: "Plain-Language Explanation", icon: FileText, desc: "Translating AI output into actionable citizen advisories." },
    { name: "NCRP Report Generation", icon: Download, desc: "Audit-ready PDF generation for law enforcement." },
  ];

  const roadmap = [
    { name: "Counterfeit Currency Detection", icon: Target, desc: "Mobile-deployable computer vision for microprint and UV feature analysis across all denominations." },
    { name: "Fraud Network Graph Intelligence", icon: Network, desc: "Clustering victim reports, scammer infrastructure, and mule networks into actionable legal intelligence." },
    { name: "Geospatial Crime Mapping", icon: Map, desc: "Mapping cybercrime hotspots for patrol prioritization and inter-district intelligence sharing." },
  ];

  // Helper to format date
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isFreshState = !stats || (stats.totalChecksToday === 0 && stats.activeCampaigns === 0);

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-12">
      
      {/* Live National Pulse */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#1E3A8A] mb-4">
          <Activity className="w-4 h-4 animate-pulse text-[#1E3A8A]" />
          <span>Live National Pulse</span>
        </div>
        
        {loading ? (
          <div className="text-center py-6 text-gray-500 text-sm font-medium">
            Fetching system telemetry...
          </div>
        ) : isFreshState ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 text-gray-500 font-medium">
            No activity yet today (fresh state)
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start text-gray-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Checks Today</span>
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-gray-900">{stats.totalChecksToday}</span>
                <span className="block text-[10px] text-gray-400 mt-1">Total citizen evaluations</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start text-gray-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Device Vs Cloud</span>
                <Cpu className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-gray-900">
                  {stats.onDeviceCount} <span className="text-xs text-gray-400 font-normal">vs</span> {stats.cloudCount}
                </span>
                <span className="block text-[10px] text-gray-400 mt-1">On-Device vs Cloud logs</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start text-gray-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Scam Genomes</span>
                <Network className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-gray-900">{stats.activeCampaigns}</span>
                <span className="block text-[10px] text-gray-400 mt-1">Coordinated clusters</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start text-gray-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Last Risk Hit</span>
                <Flame className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-gray-900">{formatTime(stats.mostRecentHighRiskTime)}</span>
                <span className="block text-[10px] text-gray-400 mt-1">Most recent HIGH_RISK incident</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Architecture Section */}
      <section>
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Architecture</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Rakshak AI utilizes a hybrid Edge-to-Cloud architecture to optimize for both citizen privacy and detection accuracy.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {pipeline.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-50 text-[#1E3A8A] rounded-lg flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{step.name}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </div>
              
              {idx < pipeline.length - 1 && (
                <div className="py-2 text-gray-300">
                  <ArrowDown className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="border-t border-gray-200 pt-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Future Roadmap</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            The complete Digital Public Safety Intelligence Platform encompasses more than just digital arrest mitigation. These modules are planned for future phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmap.map((item, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-6 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-not-allowed">
              <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
              <div className="mt-4 inline-block px-2.5 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded uppercase tracking-wider">
                In Development
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
