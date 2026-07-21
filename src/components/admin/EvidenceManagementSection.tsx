import { useState, useEffect } from 'react';
import { 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  RefreshCw, 
  Search, 
  Tag
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

interface EvidenceManagementSectionProps {
  user: any;
}

export default function EvidenceManagementSection({ user }: EvidenceManagementSectionProps) {
  const [evidenceItems, setEvidenceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvidence = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin-insights?type=evidence', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      setEvidenceItems(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvidence();
    }
  }, [user]);

  const filteredItems = evidenceItems.filter((item: any) => 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.threatLevel && item.threatLevel.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.assignedOfficer && item.assignedOfficer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-red-600" />
            Evidence Repository & Sanitized Artifacts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Redacted transcript snippets, threat classifications, and evidence chain records.
          </p>
        </div>
        <button
          onClick={fetchEvidence}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh Evidence Repository
        </button>
      </div>

      {/* Redaction Guarantee Banner */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-indigo-400 shrink-0" />
          <div>
            <span className="font-bold text-indigo-400">Server-Side PII Redaction Active:</span> All transcript snippets undergo automated PII redaction on the server before transmission (<code className="text-slate-300 font-mono">[REDACTED_PHONE], [REDACTED_ACCOUNT], [REDACTED_EMAIL], [REDACTED_UPI]</code>).
          </div>
        </div>
        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold uppercase shrink-0">
          PII Sanitized
        </span>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Case ID, Threat, or Officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Evidence Cards */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
          <p className="text-sm font-medium">Fetching sanitized evidence artifacts...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item: any) => {
            const isHighRisk = item.verdict === 'HIGH_RISK' || item.threatLevel === 'HIGH_RISK';

            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-900">Case #{item.id.substring(0, 10)}</span>
                    <span className={cn(
                      "px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1",
                      isHighRisk ? "bg-red-100 text-red-800 border border-red-200" :
                      item.verdict === 'UNCERTAIN' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                      "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    )}>
                      {isHighRisk ? <ShieldAlert className="h-3 w-3" /> :
                       item.verdict === 'UNCERTAIN' ? <AlertTriangle className="h-3 w-3" /> :
                       <CheckCircle2 className="h-3 w-3" />}
                      {item.verdict || item.threatLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Assigned Officer: <strong className="text-gray-800">{item.assignedOfficer}</strong></span>
                    <span>Status: <strong className="uppercase text-gray-700">{item.caseStatus}</strong></span>
                  </div>
                </div>

                {/* Sanitized Redacted Snippet */}
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Sanitized Evidence Transcript Snippet</div>
                  <p className="text-slate-200 leading-relaxed">"{item.redactedSnippet || 'No transcript text associated with case.'}"</p>
                </div>

                {/* Red Flags detected */}
                {Array.isArray(item.redFlagsDetected) && item.redFlagsDetected.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Tag className="h-3.5 w-3.5 text-red-500" />
                    {item.redFlagsDetected.map((flag: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 text-[11px] font-medium rounded">
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500">
              No evidence artifacts found for the current search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
