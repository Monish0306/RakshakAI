import { useState, useEffect } from 'react';
import { Users, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminPortal({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'feed' | 'campaigns' | 'officers'>('feed');
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected case for updating
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateOfficer, setUpdateOfficer] = useState('');
  const [updateRecovery, setUpdateRecovery] = useState('');

  const fetchCases = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin-cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCases(data.cases);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin-officer-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCases(), fetchStats()]);
      setLoading(false);
    };
    
    if (user) {
      loadData();
    }

    // Poll live feed every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === 'feed') fetchCases();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, activeTab]);

  const handleUpdateCase = async () => {
    if (!selectedCase) return;
    try {
      const token = await user?.getIdToken();
      if (!token) return;

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
      
      const data = await res.json();
      if (data.success) {
        setSelectedCase(null);
        fetchCases();
        fetchStats();
      } else {
        alert("Failed to update: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating case");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Admin Data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Control Portal</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('feed')}
            className={cn("px-4 py-2 rounded-md text-sm font-medium", activeTab === 'feed' ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700")}
          >
            Live Incident Feed
          </button>
          <button 
            onClick={() => setActiveTab('campaigns')}
            className={cn("px-4 py-2 rounded-md text-sm font-medium", activeTab === 'campaigns' ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700")}
          >
            Campaign Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('officers')}
            className={cn("px-4 py-2 rounded-md text-sm font-medium", activeTab === 'officers' ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700")}
          >
            Officer Performance
          </button>
        </div>
      </div>

      {activeTab === 'feed' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center text-red-700">
              <Activity className="h-5 w-5 mr-2 animate-pulse" /> Live HIGH_RISK Escalations
            </h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {cases.map((c: any) => (
              <li key={c.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer" onClick={() => {
                setSelectedCase(c);
                setUpdateStatus(c.caseStatus || 'pending');
                setUpdateOfficer(c.assignedOfficer || '');
                setUpdateRecovery(c.recoveryPercent?.toString() || '');
              }}>
                <div>
                  <div className="font-medium text-gray-900">Case #{c.id.substring(0, 8)}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(c.timestamp).toLocaleString()} • {c.threatLevel || 'Unknown Threat'}
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "inline-block px-2 py-1 text-xs font-semibold rounded-full",
                    c.caseStatus === 'closed' ? "bg-green-100 text-green-800" :
                    c.caseStatus === 'active' ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  )}>
                    {c.caseStatus ? c.caseStatus.toUpperCase() : 'PENDING'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    Officer: {c.assignedOfficer || 'Unassigned'}
                  </div>
                </div>
              </li>
            ))}
            {cases.length === 0 && <li className="p-8 text-center text-gray-500">No escalated cases found.</li>}
          </ul>
        </div>
      )}

      {activeTab === 'officers' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold flex items-center text-gray-900">
              <Users className="h-5 w-5 mr-2" /> Officer Performance
            </h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">Officer</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Total Assigned</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Active / Pending / Closed</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Avg Time to Close</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Avg Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.map((stat: any) => (
                <tr key={stat.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{stat.name}</td>
                  <td className="px-6 py-4">{stat.total}</td>
                  <td className="px-6 py-4">{stat.active} / {stat.pending} / {stat.closed}</td>
                  <td className="px-6 py-4">
                    {stat.avgTimeToCloseMs > 0 ? (stat.avgTimeToCloseMs / (1000 * 60 * 60)).toFixed(1) + ' hrs' : '-'}
                  </td>
                  <td className="px-6 py-4 text-green-600 font-semibold">
                    {stat.avgRecoveryPercent > 0 ? stat.avgRecoveryPercent.toFixed(1) + '%' : '-'}
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No officer statistics available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
          Campaign Dashboard integration pending data fetching logic.
          (In a complete implementation, this would aggregate `cases` by campaign signatures).
        </div>
      )}

      {/* Case Management Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Manage Case #{selectedCase.id.substring(0,8)}</h3>
            <div className="text-sm text-gray-600">
              <p>Reported: {new Date(selectedCase.timestamp).toLocaleString()}</p>
              <p>Risk Score: {selectedCase.riskScore}</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Officer</label>
                <input type="text" value={updateOfficer} onChange={e => setUpdateOfficer(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" placeholder="Officer Name" />
              </div>

              {updateStatus === 'closed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recovery Percent (%)</label>
                  <input type="number" min="0" max="100" value={updateRecovery} onChange={e => setUpdateRecovery(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" placeholder="e.g. 85" />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
              <button onClick={() => setSelectedCase(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
              <button onClick={handleUpdateCase} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
