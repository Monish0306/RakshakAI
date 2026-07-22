import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  TrendingUp, 
  FolderKanban, 
  Clock, 
  Activity, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

interface OverviewSectionProps {
  user?: any;
}

export default function OverviewSection({ user: _user }: OverviewSectionProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // 1. Real-time subscriber to citizenReports collection
    const reportsQuery = query(
      collection(db, "citizenReports"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubReports = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const liveCases = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })).filter((c: any) => !c.isTestData);
        setCases(liveCases);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore snapshot error in Overview:", err);
        setError("Failed to load live overview metrics.");
        setLoading(false);
      }
    );

    // 2. Fetch users count from users collection
    const fetchUsersCount = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnap.size);
      } catch (err) {
        console.warn("Failed to fetch users count:", err);
      }
    };

    fetchUsersCount();

    return () => unsubReports();
  }, []);

  // Compute Real Aggregate Data
  const totalCasesCount = cases.length;
  const pendingCasesCount = cases.filter(c => (c.caseStatus || 'pending') === 'pending').length;
  const activeCasesCount = cases.filter(c => c.caseStatus === 'active').length;
  const closedCasesCount = cases.filter(c => c.caseStatus === 'closed').length;

  // Time calculations for High-Risk cases
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();

  const highRiskToday = cases.filter(c => {
    const isHighRisk = c.verdict === 'HIGH_RISK' || c.threatLevel === 'HIGH_RISK';
    const ts = c.timestamp ? new Date(c.timestamp).getTime() : 0;
    return isHighRisk && ts >= startOfToday;
  }).length;

  const highRiskThisWeek = cases.filter(c => {
    const isHighRisk = c.verdict === 'HIGH_RISK' || c.threatLevel === 'HIGH_RISK';
    const ts = c.timestamp ? new Date(c.timestamp).getTime() : 0;
    return isHighRisk && ts >= startOfWeek;
  }).length;

  // Financial Recovery calculations
  const closedWithRecovery = cases.filter(c => c.caseStatus === 'closed' && typeof c.recoveryPercent === 'number');
  const avgRecoveryPercent = closedWithRecovery.length > 0
    ? closedWithRecovery.reduce((sum, c) => sum + c.recoveryPercent, 0) / closedWithRecovery.length
    : 0;

  // Recent activity feed (top 6 newest updates)
  const recentFeed = cases.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <LayoutDashboard className="h-7 w-7 text-red-600" />
            HQ Executive Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time operational overview aggregated directly from live citizen reports and system records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time Feed Synchronized
          </span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
          <p className="text-sm font-medium">Aggregating live HQ metrics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Cases Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Incident Cases</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FolderKanban className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{totalCasesCount}</div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">{pendingCasesCount} Pending</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">{activeCasesCount} Active</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">{closedCasesCount} Closed</span>
              </div>
            </div>

            {/* Total Registered Users Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered Users</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
              <p className="text-xs text-gray-500">Verified platform citizen profiles</p>
            </div>

            {/* High-Risk Detections Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">High-Risk Escalations</span>
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-red-600">{highRiskToday}</span>
                <span className="text-xs text-gray-500 font-medium">today</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                <span className="font-bold text-red-700">{highRiskThisWeek}</span> detected in last 7 days
              </p>
            </div>

            {/* Financial Asset Recovery Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Asset Recovery</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-700">
                {avgRecoveryPercent > 0 ? `${avgRecoveryPercent.toFixed(1)}%` : 'N/A'}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Across <span className="font-semibold text-gray-800">{closedWithRecovery.length}</span> resolved financial cases
              </p>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-600" />
                Recent Incident Activity Feed
              </h2>
              <span className="text-xs text-gray-500 font-medium">Live Stream</span>
            </div>

            <ul className="divide-y divide-gray-200">
              {recentFeed.map((item: any) => (
                <li key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900">Case #{item.id.substring(0, 10)}</span>
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase",
                        item.verdict === 'HIGH_RISK' || item.threatLevel === 'HIGH_RISK' ? "bg-red-100 text-red-800" :
                        item.verdict === 'UNCERTAIN' ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      )}>
                        {item.verdict || item.threatLevel || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now'}</span>
                      {item.assignedOfficer && (
                        <span>• Officer: <strong className="text-gray-700">{item.assignedOfficer}</strong></span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider",
                      item.caseStatus === 'closed' ? "bg-emerald-100 text-emerald-800" :
                      item.caseStatus === 'active' ? "bg-blue-100 text-blue-800" :
                      "bg-amber-100 text-amber-800"
                    )}>
                      {item.caseStatus || 'pending'}
                    </span>
                  </div>
                </li>
              ))}

              {recentFeed.length === 0 && (
                <li className="p-8 text-center text-xs text-gray-500">
                  No recent incident records found in Firestore.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
