import { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  Zap, 
  RefreshCw, 
  Layers
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function IntelligenceCenterSection() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "citizenReports"),
      orderBy("timestamp", "desc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter((c: any) => !c.isTestData);
        setReports(liveData);
        setLoading(false);
      },
      (err) => {
        console.warn("Intelligence Center snapshot error:", err);
        setError("Failed to subscribe to live classification intelligence.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real Aggregation Computations
  const totalProcessed = reports.length;

  // 1. Verdict Distribution
  const highRiskCount = reports.filter(r => r.verdict === 'HIGH_RISK' || r.threatLevel === 'HIGH_RISK').length;
  const uncertainCount = reports.filter(r => r.verdict === 'UNCERTAIN' || r.threatLevel === 'MEDIUM_RISK').length;
  const safeCount = reports.filter(r => r.verdict === 'SAFE' || r.threatLevel === 'LOW_RISK' || r.threatLevel === 'SAFE').length;

  const highRiskPct = totalProcessed > 0 ? (highRiskCount / totalProcessed) * 100 : 0;
  const uncertainPct = totalProcessed > 0 ? (uncertainCount / totalProcessed) * 100 : 0;
  const safePct = totalProcessed > 0 ? (safeCount / totalProcessed) * 100 : 0;

  // 2. Red Flags Frequency
  const redFlagCounts: Record<string, number> = {};
  reports.forEach(r => {
    if (Array.isArray(r.redFlagsDetected)) {
      r.redFlagsDetected.forEach((flag: string) => {
        redFlagCounts[flag] = (redFlagCounts[flag] || 0) + 1;
      });
    }
    if (Array.isArray(r.matches)) {
      r.matches.forEach((m: any) => {
        const categoryName = m.reason || m.category || "Scam Pattern Detected";
        redFlagCounts[categoryName] = (redFlagCounts[categoryName] || 0) + 1;
      });
    }
  });

  const sortedRedFlags = Object.entries(redFlagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // 3. Confidence Range Buckets
  const confidenceBuckets = {
    high: reports.filter(r => (r.confidence || 0) >= 85).length,
    moderate: reports.filter(r => (r.confidence || 0) >= 70 && (r.confidence || 0) < 85).length,
    uncertain: reports.filter(r => (r.confidence || 0) >= 50 && (r.confidence || 0) < 70).length,
    low: reports.filter(r => (r.confidence || 0) < 50).length
  };

  // 4. On-Device vs Cloud Telemetry Split
  const onDeviceCount = reports.filter(r => r.ranOnDevice === true).length;
  const cloudCount = totalProcessed - onDeviceCount;
  const onDevicePct = totalProcessed > 0 ? (onDeviceCount / totalProcessed) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <BrainCircuit className="h-7 w-7 text-red-600" />
            AI Intelligence & Classifier Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time classification model analytics, red flag frequency vectors, and verdict confidence distributions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time AI Telemetry
          </span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
          <p className="text-sm font-medium">Aggregating AI classification model statistics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <>
          {/* Top Summary Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Evaluated</span>
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{totalProcessed}</div>
              <p className="text-xs text-gray-500 font-medium">Citizen scam reports processed</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">High Risk Share</span>
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600">{highRiskPct.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 font-medium">{highRiskCount} critical threats flagged</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">On-Device Ratio</span>
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-600">{onDevicePct.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 font-medium">{onDeviceCount} zero-latency edge checks</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">High Confidence (&gt;85%)</span>
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-indigo-600">
                {totalProcessed > 0 ? ((confidenceBuckets.high / totalProcessed) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-gray-500 font-medium">{confidenceBuckets.high} deterministic matches</p>
            </div>
          </div>

          {/* Two-Column Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Verdict Distribution Panel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                  Verdict Classification Distribution
                </h2>
                <span className="text-xs text-gray-500">Real Aggregate Data</span>
              </div>

              <div className="space-y-4">
                {/* HIGH RISK */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-red-700 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4" /> HIGH_RISK Escalations
                    </span>
                    <span className="text-gray-900">{highRiskCount} ({highRiskPct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${highRiskPct}%` }} />
                  </div>
                </div>

                {/* UNCERTAIN / MEDIUM RISK */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> UNCERTAIN / Warning
                    </span>
                    <span className="text-gray-900">{uncertainCount} ({uncertainPct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${uncertainPct}%` }} />
                  </div>
                </div>

                {/* SAFE */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> SAFE Verified
                    </span>
                    <span className="text-gray-900">{safeCount} ({safePct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${safePct}%` }} />
                  </div>
                </div>
              </div>

              {/* Model Execution Ratio Bar */}
              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-700 block mb-2">Model Execution Environment</span>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Edge On-Device: <strong>{onDeviceCount}</strong></span>
                  <span>Cloud API: <strong>{cloudCount}</strong></span>
                </div>
                <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${onDevicePct}%` }} title="On-Device" />
                  <div className="h-full bg-indigo-600" style={{ width: `${100 - onDevicePct}%` }} title="Cloud API" />
                </div>
              </div>
            </div>

            {/* 2. Most Frequently Detected Red Flags */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-red-600" />
                  Most Frequent Red Flags & Patterns
                </h2>
                <span className="text-xs text-gray-500">Ranked by Frequency</span>
              </div>

              <div className="space-y-3">
                {sortedRedFlags.map(([flag, count], index) => {
                  const maxFreq = sortedRedFlags[0]?.[1] || 1;
                  const barWidth = (count / maxFreq) * 100;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-gray-800">
                        <span className="truncate max-w-[260px] font-semibold">{flag}</span>
                        <span className="font-mono text-red-600 font-bold">{count} hits</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-800 rounded-full transition-all duration-500" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  );
                })}

                {sortedRedFlags.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-8">
                    No red flag patterns recorded in recent dataset.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Confidence Score Histogram Range Buckets */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <BarChart3 className="h-5 w-5 text-red-600" />
              Classifier Confidence Score Histogram Distribution
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-center space-y-1">
                <p className="text-2xl font-bold text-indigo-700">{confidenceBuckets.high}</p>
                <p className="text-xs font-semibold text-indigo-900">85% - 100% Confidence</p>
                <p className="text-[11px] text-indigo-600 font-medium">Deterministic Match</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center space-y-1">
                <p className="text-2xl font-bold text-blue-700">{confidenceBuckets.moderate}</p>
                <p className="text-xs font-semibold text-blue-900">70% - 84% Confidence</p>
                <p className="text-[11px] text-blue-600 font-medium">High Probability</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center space-y-1">
                <p className="text-2xl font-bold text-amber-700">{confidenceBuckets.uncertain}</p>
                <p className="text-xs font-semibold text-amber-900">50% - 69% Confidence</p>
                <p className="text-[11px] text-amber-600 font-medium">Moderate Indicator</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center space-y-1">
                <p className="text-2xl font-bold text-gray-700">{confidenceBuckets.low}</p>
                <p className="text-xs font-semibold text-gray-900">&lt; 50% Confidence</p>
                <p className="text-[11px] text-gray-500 font-medium">Low Signal</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
