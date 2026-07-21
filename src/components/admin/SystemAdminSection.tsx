import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Lock, 
  Settings, 
  RefreshCw, 
  Search, 
  CheckCircle2,
  Sliders
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

interface SystemAdminSectionProps {
  user: any;
}

export default function SystemAdminSection({ user }: SystemAdminSectionProps) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Feature Toggles / System Config
  const [realtimeSync, setRealtimeSync] = useState(true);
  const [edgeClassifier, setEdgeClassifier] = useState(true);
  const [customClaimAuth, setCustomClaimAuth] = useState(true);
  const [configSaved, setConfigSaved] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin-insights?type=system-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiJson(res);
      setUsersList(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const handleSaveConfig = () => {
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const filteredUsers = usersList.filter((u: any) => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ShieldAlert className="h-7 w-7 text-red-600" />
            System Administration & Security Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registered citizen profile directory, security claims status, and platform feature configuration.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh Users List
        </button>
      </div>

      {/* Allowlist Privacy Banner */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <span className="font-bold text-red-400">Strict Allowlist Security Pattern:</span> Only safe public profile fields (<code className="text-slate-300 font-mono">uid, email, displayName, createdAt, role</code>) are exposed over the admin API. Passwords, auth tokens, and raw credentials are NEVER transmitted.
          </div>
        </div>
        <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-[10px] font-bold uppercase shrink-0">
          Allowlisted Output
        </span>
      </div>

      {/* Platform System Toggles */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-red-600" />
            Platform System Settings & Feature Toggles
          </h2>
          {configSaved && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> System Settings Updated
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between font-semibold text-gray-900">
              <span>Firestore Real-Time Sync</span>
              <input
                type="checkbox"
                checked={realtimeSync}
                onChange={(e) => setRealtimeSync(e.target.checked)}
                className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
              />
            </div>
            <p className="text-gray-500">Enable instant onSnapshot updates across admin tabs.</p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between font-semibold text-gray-900">
              <span>Edge Classifier Pre-Filtering</span>
              <input
                type="checkbox"
                checked={edgeClassifier}
                onChange={(e) => setEdgeClassifier(e.target.checked)}
                className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
              />
            </div>
            <p className="text-gray-500">Run client-side transformer evaluation before cloud fallback.</p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between font-semibold text-gray-900">
              <span>Admin Custom Claim Auth</span>
              <input
                type="checkbox"
                checked={customClaimAuth}
                onChange={(e) => setCustomClaimAuth(e.target.checked)}
                className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
              />
            </div>
            <p className="text-gray-500">Require decodedToken.role === 'admin' on all /api endpoints.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveConfig}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Apply System Configuration</span>
          </button>
        </div>
      </div>

      {/* Registered Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-red-600" />
            Registered Users Directory ({filteredUsers.length})
          </h2>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-red-600 mb-2" />
            Loading system user directory...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center text-xs text-red-700 font-semibold">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 uppercase font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">User UID</th>
                  <th className="px-4 py-3">Display Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Registration Date</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u: any) => (
                  <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{u.uid}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{u.displayName}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        u.role === 'admin' ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"
                      )}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No user records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
