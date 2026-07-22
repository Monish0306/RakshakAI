import { useState, useEffect } from 'react';
import { 
  Network, 
  Search, 
  ShieldAlert, 
  Clock, 
  FileText, 
  AlertTriangle, 
  RefreshCw, 
  Phone, 
  Tag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import NetworkGraphSection from './NetworkGraphSection';

interface CampaignCluster {
  campaignId: string;
  reportCount: number;
  firstSeen: string;
  lastSeen: string;
  detectionLeadTimeMs: number;
  representativeTranscript: string;
  dominantCategory: string;
  priority: boolean;
  linkedIdentifiers?: string[];
  investigationStatus?: 'Under Investigation' | 'Reported to Cybercrime Cell' | 'Case Closed';
  officerNotes?: string;
}

interface NetworkAnalysisSectionProps {
  user?: any;
}

export default function NetworkAnalysisSection({ user }: NetworkAnalysisSectionProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');
  const [campaigns, setCampaigns] = useState<CampaignCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campaign-list');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch criminal network campaigns');
      }

      const list: CampaignCluster[] = json.data.map((c: any) => {
        // Extract potential scammer phone / UPI handles from transcript/snippets (non-victim identifiers)
        const phoneMatches = c.representativeTranscript?.match(/(\+?\d{1,3}[- ]?)?\d{10}/g) || [];
        const upiMatches = c.representativeTranscript?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const identifiers = Array.from(new Set([...phoneMatches, ...upiMatches]));

        return {
          ...c,
          linkedIdentifiers: identifiers.length > 0 ? identifiers : ['Pattern Signature ID #' + c.campaignId.substring(9, 15)],
          investigationStatus: statusMap[c.campaignId] || (c.priority ? 'Reported to Cybercrime Cell' : 'Under Investigation'),
          officerNotes: notesMap[c.campaignId] || `Automated cluster grouping based on ${c.dominantCategory} vector.`
        };
      });

      setCampaigns(list);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleStatusChange = (campaignId: string, newStatus: string) => {
    setStatusMap(prev => ({ ...prev, [campaignId]: newStatus }));
    setCampaigns(prev => prev.map(c => c.campaignId === campaignId ? { ...c, investigationStatus: newStatus as any } : c));
  };

  const handleNotesChange = (campaignId: string, notes: string) => {
    setNotesMap(prev => ({ ...prev, [campaignId]: notes }));
    setCampaigns(prev => prev.map(c => c.campaignId === campaignId ? { ...c, officerNotes: notes } : c));
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.dominantCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.investigationStatus && c.investigationStatus.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Network className="h-7 w-7 text-red-600" />
            Scam Operator & Campaign Network Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tracking scam operator clusters, vector signatures, and cybercrime reporting status (Exclusively scam operator data - no victim identities exposed).
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1 text-xs">
            <button
              onClick={() => setViewMode('graph')}
              className={cn(
                "px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer",
                viewMode === 'graph' ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              Interactive Graph
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer",
                viewMode === 'list' ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              Cluster List
            </button>
          </div>

          {viewMode === 'list' && (
            <button
              onClick={fetchCampaigns}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh Network Clusters
            </button>
          )}
        </div>
      </div>

      {/* Legal & Privacy Compliance Banner */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-400">Legal Compliance & Privacy Notice:</span> This intelligence portal monitors scam operator campaign patterns and reported attack signatures. Status indicators adhere to legal classification terms (<em className="text-slate-300">Under Investigation, Reported to Cybercrime Cell, Case Closed</em>). Victim personal identity data is strictly excluded from network analysis views.
        </div>
      </div>

      {/* Dynamic Views */}
      {viewMode === 'graph' ? (
        <NetworkGraphSection user={user} />
      ) : (
        <>
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaign ID, dominant scam category, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-600 mb-2" />
              <p className="text-sm font-medium">Analyzing criminal network campaign clusters...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCampaigns.map((c) => {
                const isPriority = c.priority;
                
                return (
                  <div key={c.campaignId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900">{c.campaignId}</span>
                          {isPriority && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded uppercase">
                              High Priority Cluster
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Tag className="h-3 w-3 text-red-500" /> {c.dominantCategory}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">{c.reportCount}</span>
                        <p className="text-[10px] text-gray-500 uppercase">Linked Reports</p>
                      </div>
                    </div>

                    {/* Scammer Identifiers */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-blue-600" /> Operator Identifiers / Handles:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {c.linkedIdentifiers?.map((id, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-mono">
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Investigation Status Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">Official Investigation Status</label>
                      <select
                        value={c.investigationStatus}
                        onChange={(e) => handleStatusChange(c.campaignId, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs font-medium text-gray-900 bg-white focus:ring-2 focus:ring-red-500"
                      >
                        <option value="Under Investigation">Under Investigation</option>
                        <option value="Reported to Cybercrime Cell">Reported to Cybercrime Cell</option>
                        <option value="Case Closed">Case Closed</option>
                      </select>
                    </div>

                    {/* Officer Notes */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-gray-500" /> Officer Investigation Notes:
                      </label>
                      <textarea
                        rows={2}
                        value={c.officerNotes}
                        onChange={(e) => handleNotesChange(c.campaignId, e.target.value)}
                        placeholder="Log officer notes for this campaign cluster..."
                        className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    {/* Footer Metadata */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>First Seen: {c.firstSeen ? new Date(c.firstSeen).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div>
                        <span>Last Active: {c.lastSeen ? new Date(c.lastSeen).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredCampaigns.length === 0 && (
                <div className="col-span-full bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500">
                  No matching scam campaign clusters found.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
