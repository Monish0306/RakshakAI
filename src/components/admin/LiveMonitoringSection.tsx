import { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  ArrowUpRight,
  Radio
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export default function LiveMonitoringSection() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastIncidentId, setLastIncidentId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "citizenReports"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter((c: any) => !c.isTestData);

        if (liveList.length > 0) {
          const newest = liveList[0];
          if (lastIncidentId && newest.id !== lastIncidentId && soundEnabled) {
            // Play subtle audio alert for new incoming threat if enabled
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.15);
            } catch (e) {
              console.warn("Audio playback notice:", e);
            }
          }
          setLastIncidentId(newest.id);
        }

        setIncidents(liveList);
        setLoading(false);
      },
      (err) => {
        console.warn("Live monitoring snapshot error:", err);
        setError("Failed to establish live threat monitoring connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [lastIncidentId, soundEnabled]);

  // Aggregate stream metrics
  const totalStream = incidents.length;
  const highRiskStream = incidents.filter(i => i.verdict === 'HIGH_RISK' || i.threatLevel === 'HIGH_RISK');
  const uncertainStream = incidents.filter(i => i.verdict === 'UNCERTAIN' || i.threatLevel === 'MEDIUM_RISK');
  const safeStream = incidents.filter(i => i.verdict === 'SAFE' || i.threatLevel === 'LOW_RISK' || i.threatLevel === 'SAFE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-red-600 animate-pulse" />
            Live Threat Monitoring Radar
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time Firestore stream pushing incoming citizen scam reports instantly as they occur.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
              soundEnabled ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-100 text-gray-700 border-gray-300"
            )}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{soundEnabled ? "Audio Alerts On" : "Mute Alerts"}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            Live Stream Active
          </span>
        </div>
      </div>

      {/* Stream Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Stream Volume</p>
          <p className="text-3xl font-extrabold text-white">{totalStream}</p>
          <p className="text-[11px] text-slate-400">Incoming report events buffered</p>
        </div>

        <div className="bg-red-950/40 border border-red-900/40 p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> High-Risk Escalations
          </p>
          <p className="text-3xl font-extrabold text-red-400">{highRiskStream.length}</p>
          <p className="text-[11px] text-red-300/80">Requires officer review</p>
        </div>

        <div className="bg-amber-950/40 border border-amber-900/40 p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Warning / Uncertain
          </p>
          <p className="text-3xl font-extrabold text-amber-400">{uncertainStream.length}</p>
          <p className="text-[11px] text-amber-300/80">Secondary evaluation</p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-900/40 p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Verified Safe
          </p>
          <p className="text-3xl font-extrabold text-emerald-400">{safeStream.length}</p>
          <p className="text-[11px] text-emerald-300/80">Low risk checks</p>
        </div>
      </div>

      {/* Live Stream List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Activity className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
          <p className="text-sm font-medium">Connecting to real-time incident radar...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-600" />
              Incoming Threat Stream (onSnapshot Active)
            </h2>
            <span className="text-xs font-mono text-gray-500">Showing 50 most recent events</span>
          </div>

          <div className="divide-y divide-gray-200">
            {incidents.map((item, idx) => {
              const isHighRisk = item.verdict === 'HIGH_RISK' || item.threatLevel === 'HIGH_RISK';
              const isUncertain = item.verdict === 'UNCERTAIN' || item.threatLevel === 'MEDIUM_RISK';
              const isFirst = idx === 0;

              return (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300",
                    isFirst ? "bg-red-50/40 border-l-4 border-l-red-600 animate-pulse" : "hover:bg-slate-50"
                  )}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900 flex items-center gap-1">
                        Report ID #{item.id.substring(0, 10)}
                      </span>

                      <span className={cn(
                        "px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1",
                        isHighRisk ? "bg-red-600 text-white shadow-sm" :
                        isUncertain ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      )}>
                        {isHighRisk ? <ShieldAlert className="h-3 w-3" /> :
                         isUncertain ? <AlertTriangle className="h-3 w-3" /> :
                         <CheckCircle2 className="h-3 w-3" />}
                        {item.verdict || item.threatLevel || 'UNKNOWN'}
                      </span>

                      {item.ranOnDevice && (
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-white rounded font-mono">
                          Edge On-Device
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-1 italic">
                      "{item.transcriptSnippet || item.transcript || 'Live text evaluation snippet'}"
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now'}
                      </span>

                      {item.confidence && (
                        <span>Confidence: <strong className="text-gray-800 font-mono">{item.confidence}%</strong></span>
                      )}

                      {item.assignedOfficer && (
                        <span>Assigned: <strong className="text-gray-800">{item.assignedOfficer}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider",
                      item.caseStatus === 'closed' ? "bg-emerald-100 text-emerald-800" :
                      item.caseStatus === 'active' ? "bg-blue-100 text-blue-800" :
                      "bg-amber-100 text-amber-800"
                    )}>
                      {item.caseStatus || 'pending'}
                    </span>

                    <button
                      onClick={() => alert(`Opening Investigation Case #${item.id}`)}
                      className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Inspect incident details"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {incidents.length === 0 && (
              <div className="p-12 text-center text-xs text-gray-500">
                No threat stream incidents recorded yet. Submit a test report in Live Check to see instant real-time synchronization!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
