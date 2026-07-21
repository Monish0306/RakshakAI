import { useState, useEffect } from 'react';
import { 
  MapPin, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Building2,
  Lock
} from 'lucide-react';
import { cn } from '../../lib/utils';

async function readApiJson(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Admin request failed (${res.status}); server returned non-JSON response.`);
  }
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Admin request failed (${res.status})`);
  }
  return data;
}

interface HeatmapSectionProps {
  user: any;
}

export default function HeatmapSection({ user }: HeatmapSectionProps) {
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHeatmap = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin-insights?type=heatmap', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      setRegions(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHeatmap();
    }
  }, [user]);

  const filteredRegions = regions.filter((r: any) => 
    r.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <MapPin className="h-7 w-7 text-red-600" />
            National Threat Heatmap & Regional Aggregations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Aggregated scam report counts and risk levels grouped strictly by region and metro area.
          </p>
        </div>
        <button
          onClick={fetchHeatmap}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh Heatmap Data
        </button>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-emerald-400">Strict Privacy Design Guarantee:</span> Data is aggregated server-side at the regional/city level. Zero exact GPS coordinates, user addresses, or personal location pins are requested or transmitted.
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold uppercase shrink-0">
          Server-Side Aggregated
        </span>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search region or metro area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Region Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
          <p className="text-sm font-medium">Aggregating regional threat density...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegions.map((reg: any, idx: number) => {
            const isHigh = reg.highRiskCount > 20 || reg.riskLevel === 'HIGH';
            const isMedium = reg.highRiskCount > 10 || reg.riskLevel === 'MEDIUM';

            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{reg.region}</h3>
                      <p className="text-xs text-gray-500">{reg.count} Total Incident Reports</p>
                    </div>
                  </div>

                  <span className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider",
                    isHigh ? "bg-red-100 text-red-800 border border-red-200" :
                    isMedium ? "bg-amber-100 text-amber-800 border border-amber-200" :
                    "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  )}>
                    {isHigh ? 'High Risk' : isMedium ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                    <span className="font-bold text-red-700 flex items-center justify-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {reg.highRiskCount}
                    </span>
                    <span className="text-[10px] text-red-600 font-medium">Critical</span>
                  </div>

                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <span className="font-bold text-amber-700 flex items-center justify-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {reg.mediumRiskCount}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">Warning</span>
                  </div>

                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <span className="font-bold text-emerald-700 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {reg.safeCount}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">Safe</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
