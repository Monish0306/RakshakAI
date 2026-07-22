import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Briefcase
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

interface OfficerManagementSectionProps {
  user: any;
}

export default function OfficerManagementSection({ user }: OfficerManagementSectionProps) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin-insights?type=officer-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      setStats(data.stats || []);
    } catch (err: any) {
      console.error("Fetch officer stats error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  // Aggregate Metrics
  const totalOfficers = stats.length;
  const totalAssignedCases = stats.reduce((acc, curr) => acc + (curr.total || 0), 0);
  
  const validTimes = stats.filter(s => s.avgTimeToCloseMs > 0);
  const avgResolutionHours = validTimes.length > 0
    ? (validTimes.reduce((acc, curr) => acc + curr.avgTimeToCloseMs, 0) / validTimes.length) / (1000 * 60 * 60)
    : 0;

  const validRecoveries = stats.filter(s => s.avgRecoveryPercent > 0);
  const avgOverallRecovery = validRecoveries.length > 0
    ? validRecoveries.reduce((acc, curr) => acc + curr.avgRecoveryPercent, 0) / validRecoveries.length
    : 0;

  const filteredStats = stats.filter((stat) => 
    stat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <UserCheck className="h-7 w-7 text-red-600" />
            Officer Performance & Workload Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor officer case distribution, resolution velocity, and financial recovery metrics.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Refresh Performance Data</span>
        </button>
      </div>

      {/* Aggregate Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Officers</p>
            <p className="text-2xl font-bold text-gray-900">{totalOfficers}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assigned Cases</p>
            <p className="text-2xl font-bold text-gray-900">{totalAssignedCases}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Resolution Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {avgResolutionHours > 0 ? `${avgResolutionHours.toFixed(1)} hrs` : '-'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Asset Recovery</p>
            <p className="text-2xl font-bold text-emerald-700">
              {avgOverallRecovery > 0 ? `${avgOverallRecovery.toFixed(1)}%` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search officer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Officers Performance Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
          <p className="text-sm font-medium">Fetching officer analytics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold">Error: {error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-200 uppercase font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Officer Name</th>
                  <th className="px-6 py-3.5">Total Assigned</th>
                  <th className="px-6 py-3.5">Active Cases</th>
                  <th className="px-6 py-3.5">Pending Cases</th>
                  <th className="px-6 py-3.5">Closed Cases</th>
                  <th className="px-6 py-3.5">Avg Time to Close</th>
                  <th className="px-6 py-3.5">Avg Recovery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStats.map((stat) => {
                  const hoursToClose = stat.avgTimeToCloseMs > 0 ? (stat.avgTimeToCloseMs / (1000 * 60 * 60)).toFixed(1) : null;
                  
                  return (
                    <tr key={stat.name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                            {stat.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{stat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{stat.total}</td>
                      <td className="px-6 py-4 font-semibold text-blue-700">{stat.active}</td>
                      <td className="px-6 py-4 font-semibold text-amber-700">{stat.pending}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">{stat.closed}</td>
                      <td className="px-6 py-4">
                        {hoursToClose ? (
                          <span className="font-mono text-gray-700">{hoursToClose} hrs</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {stat.avgRecoveryPercent > 0 ? (
                          <span className="font-semibold text-emerald-700 font-mono">
                            {stat.avgRecoveryPercent.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredStats.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No officer records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
