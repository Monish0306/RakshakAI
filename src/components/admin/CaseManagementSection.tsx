import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Edit3, 
  RefreshCw, 
  Percent,
  Clock,
  Shield
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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

interface CaseManagementSectionProps {
  user: any;
}

export default function CaseManagementSection({ user }: CaseManagementSectionProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'closed'>('all');
  const [threatFilter, setThreatFilter] = useState<string>('all');
  
  // Case Update Modal State
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateOfficer, setUpdateOfficer] = useState('');
  const [updateRecovery, setUpdateRecovery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Real-time sync via Firestore onSnapshot + REST fallback
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Primary: Firestore onSnapshot for real-time live updates
    const reportsQuery = query(
      collection(db, "citizenReports"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const liveCases = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            sessionId: data.sessionId,
            timestamp: data.timestamp,
            verdict: data.verdict,
            threatLevel: data.threatLevel || 'UNKNOWN',
            confidence: data.confidence,
            campaignId: data.campaignId,
            caseStatus: data.caseStatus || 'pending',
            assignedOfficer: data.assignedOfficer || '',
            recoveryPercent: data.recoveryPercent ?? null,
            closedAt: data.closedAt || null,
            transcript: data.transcriptSnippet || data.transcript || ''
          };
        });
        setCases(liveCases);
        setLoading(false);
      },
      (err) => {
        console.warn("Real-time Firestore snapshot warning, falling back to REST API:", err);
        fetchCasesFallback();
      }
    );

    return () => unsubscribe();
  }, []);

  const fetchCasesFallback = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/admin-cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      setCases(data.cases || []);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpdateCase = async () => {
    if (!selectedCase) return;
    setIsUpdating(true);
    setUpdateSuccess(null);
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Authentication token required");

      const body: any = { caseId: selectedCase.id };
      if (updateStatus) body.caseStatus = updateStatus;
      if (updateOfficer !== undefined) body.assignedOfficer = updateOfficer;
      if (updateRecovery !== '') body.recoveryPercent = Number(updateRecovery);
      
      if (updateStatus === 'closed' && selectedCase.caseStatus !== 'closed') {
        body.closedAt = new Date().toISOString();
      }

      const res = await fetch('/api/admin-update-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      await readApiJson(res);
      setUpdateSuccess(`Case #${selectedCase.id.substring(0, 8)} updated successfully.`);
      setTimeout(() => {
        setSelectedCase(null);
        setUpdateSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update case");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered cases list
  const filteredCases = cases.filter((c) => {
    const matchesSearch = 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.assignedOfficer && c.assignedOfficer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.threatLevel && c.threatLevel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.verdict && c.verdict.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.caseStatus === statusFilter;
    const matchesThreat = threatFilter === 'all' || c.threatLevel === threatFilter;

    return matchesSearch && matchesStatus && matchesThreat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FolderKanban className="h-7 w-7 text-red-600" />
            Case Management Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time incident tracking, investigation assignment, and resolution logging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Real-Time Sync Active
          </span>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Case ID, Officer, Threat, or Verdict..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Threat:</span>
            <select
              value={threatFilter}
              onChange={(e: any) => setThreatFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Threat Levels</option>
              <option value="HIGH_RISK">HIGH_RISK</option>
              <option value="MEDIUM_RISK">MEDIUM_RISK</option>
              <option value="LOW_RISK">LOW_RISK</option>
              <option value="SAFE">SAFE</option>
            </select>
          </div>

          <button
            onClick={() => fetchCasesFallback()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Cases Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
          <p className="text-sm font-medium">Loading incidents & cases...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold">Failed to load case data: {error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-200 uppercase font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Case Reference</th>
                  <th className="px-6 py-3.5">Threat Level / Verdict</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Assigned Officer</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Recovery %</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCases.map((c) => {
                  const isClosed = c.caseStatus === 'closed';
                  const isActive = c.caseStatus === 'active';
                  
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-600 shrink-0" />
                          <span>#{c.id.substring(0, 10)}</span>
                        </div>
                        {c.campaignId && (
                          <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            Campaign: {c.campaignId.substring(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold",
                          c.verdict === 'HIGH_RISK' || c.threatLevel === 'HIGH_RISK' ? "bg-red-100 text-red-800 border border-red-200" :
                          c.verdict === 'UNCERTAIN' || c.threatLevel === 'MEDIUM_RISK' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        )}>
                          {c.verdict === 'HIGH_RISK' || c.threatLevel === 'HIGH_RISK' ? <ShieldAlert className="h-3 w-3" /> :
                           c.verdict === 'UNCERTAIN' ? <AlertTriangle className="h-3 w-3" /> :
                           <CheckCircle2 className="h-3 w-3" />}
                          {c.verdict || c.threatLevel || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{c.timestamp ? new Date(c.timestamp).toLocaleString() : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {c.assignedOfficer ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                            <span>{c.assignedOfficer}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide",
                          isClosed ? "bg-emerald-100 text-emerald-800" :
                          isActive ? "bg-blue-100 text-blue-800" :
                          "bg-amber-100 text-amber-800"
                        )}>
                          {c.caseStatus ? c.caseStatus : 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {c.recoveryPercent !== null && c.recoveryPercent !== undefined ? (
                          <span className="text-emerald-700 font-mono">{c.recoveryPercent}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCase(c);
                            setUpdateStatus(c.caseStatus || 'pending');
                            setUpdateOfficer(c.assignedOfficer || '');
                            setUpdateRecovery(c.recoveryPercent !== null && c.recoveryPercent !== undefined ? String(c.recoveryPercent) : '');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No matching cases found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Update Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FolderKanban className="h-5 w-5 text-red-500" />
                <h3 className="text-base font-bold">Manage Case #{selectedCase.id.substring(0, 10)}</h3>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {updateSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {updateSuccess}
                </div>
              )}

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Reported:</span>
                  <span>{new Date(selectedCase.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Threat Verdict:</span>
                  <span className="font-bold text-red-600">{selectedCase.verdict || selectedCase.threatLevel}</span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Investigation Status</label>
                  <select 
                    value={updateStatus} 
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="active">Active Investigation</option>
                    <option value="closed">Case Closed & Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assigned Officer</label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Inspector R. Sharma"
                      value={updateOfficer}
                      onChange={(e) => setUpdateOfficer(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                {updateStatus === 'closed' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Financial Recovery Percentage (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 85"
                        value={updateRecovery}
                        onChange={(e) => setUpdateRecovery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setSelectedCase(null)} 
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateCase} 
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isUpdating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
