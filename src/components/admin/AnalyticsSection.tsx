import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Calendar, 
  RefreshCw, 
  AlertTriangle, 
  FolderKanban
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

interface AnalyticsSectionProps {
  user: any;
}

export default function AnalyticsSection({ user }: AnalyticsSectionProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'30days' | '7days'>('30days');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin-insights?type=analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      setAnalyticsData(data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const rawTimeSeries: any[] = analyticsData?.timeSeries || [];
  const timeSeries = granularity === '7days' ? rawTimeSeries.slice(-7) : rawTimeSeries;

  const maxDailyCount = Math.max(...timeSeries.map(d => d.count || 0), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-red-600" />
            Executive Reports & Historical Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Time-series incident velocity, resolution speed benchmarks, and financial recovery summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1 text-xs">
            <button
              onClick={() => setGranularity('7days')}
              className={cn("px-3 py-1.5 rounded font-semibold transition-colors", granularity === '7days' ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100")}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setGranularity('30days')}
              className={cn("px-3 py-1.5 rounded font-semibold transition-colors", granularity === '30days' ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100")}
            >
              Last 30 Days (Default)
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
          <p className="text-sm font-medium">Computing historical analytics & resolution velocity...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Resolution Speed</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {analyticsData?.avgResolutionHours > 0 ? `${analyticsData.avgResolutionHours.toFixed(1)} hrs` : 'N/A'}
              </div>
              <p className="text-xs text-gray-500">From citizen submission to case resolution</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Financial Recovery</span>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-700">
                {analyticsData?.avgRecoveryPercent > 0 ? `${analyticsData.avgRecoveryPercent.toFixed(1)}%` : 'N/A'}
              </div>
              <p className="text-xs text-gray-500">Across all closed financial recovery cases</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Selected Date Range</span>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{timeSeries.length} Days</div>
              <p className="text-xs text-gray-500">Daily breakdown trend analysis</p>
            </div>
          </div>

          {/* Time Series Histogram Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-red-600" />
                Daily Scam Report Frequency ({granularity === '7days' ? 'Last 7 Days' : 'Last 30 Days'})
              </h2>
              <span className="text-xs text-gray-500">Firestore Time-Series</span>
            </div>

            <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-gray-200 pb-2 overflow-x-auto">
              {timeSeries.map((item, idx) => {
                const heightPct = Math.max((item.count / maxDailyCount) * 100, 8);
                const dayLabel = item.date ? item.date.substring(5) : `D${idx+1}`;

                return (
                  <div key={idx} className="flex-1 min-w-[14px] flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </div>
                    <div 
                      className="w-full bg-slate-800 group-hover:bg-red-600 rounded-t transition-all duration-300 relative"
                      style={{ height: `${heightPct}%` }}
                    >
                      {item.highRisk > 0 && (
                        <div 
                          className="w-full bg-red-500 rounded-t absolute top-0 left-0" 
                          style={{ height: `${(item.highRisk / Math.max(item.count, 1)) * 100}%` }}
                          title={`${item.highRisk} High Risk`}
                        />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 -rotate-45 md:rotate-0">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
