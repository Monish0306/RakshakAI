import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Edit2,
  FileText,
  Activity,
  LogOut,
  Save,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

export default function UserProfileModal({ isOpen, onClose, user, onLogout }: UserProfileModalProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [editingDob, setEditingDob] = useState(false);
  const [newDob, setNewDob] = useState(user?.dob || '');
  const [updatingDob, setUpdatingDob] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.uid) {
      setLoadingReports(true);
      const fetchUserReports = async () => {
        try {
          const reportsRef = collection(db, "citizenReports");
          const q = query(
            reportsRef,
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc")
          );
          const snap = await getDocs(q);
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReports(list);
        } catch (e) {
          console.error("Error fetching user reports:", e);
        } finally {
          setLoadingReports(false);
        }
      };
      fetchUserReports();
      setNewDob(user?.dob || '');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSaveDob = async () => {
    if (!newDob) {
      setUpdateError("Please select a valid date.");
      return;
    }
    setUpdatingDob(true);
    setUpdateError(null);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { dob: newDob });
      setEditingDob(false);
    } catch (e: any) {
      console.error(e);
      setUpdateError(e.message || "Failed to update date of birth.");
    } finally {
      setUpdatingDob(false);
    }
  };

  const totalScans = reports.length;
  const scamCount = reports.filter(r => r.verdict === 'HIGH_RISK').length;
  const safeCount = reports.filter(r => r.verdict === 'SAFE').length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row min-h-[480px]">
        
        {/* Left Side: User Profile Summary card */}
        <div className="bg-slate-50 dark:bg-slate-950 p-6 md:w-2/5 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-[#1E3A8A] dark:text-blue-400" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base">User Profile</h3>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Avatar block */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-16 w-16 bg-[#1E3A8A]/10 text-[#1E3A8A] dark:bg-blue-500/10 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl mb-3 shadow-xs">
                {user.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <h4 className="font-extrabold text-gray-900 dark:text-white text-lg">@{user.username}</h4>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#1E3A8A] dark:text-blue-400 mt-1">
                Citizen Account
              </span>
            </div>

            {/* Read-only details */}
            <div className="space-y-4 text-xs font-medium text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{user.mobile || 'No Mobile Added'}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <UserCheck className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="capitalize">{user.gender || 'Not Specified'}</span>
              </div>

              {/* DOB with inline editing */}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-800">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                {editingDob ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="date"
                        value={newDob}
                        onChange={(e) => setNewDob(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-md text-xs px-2.5 py-1.5 focus:ring-1 focus:ring-[#1E3A8A] flex-1"
                      />
                      <button 
                        onClick={handleSaveDob}
                        disabled={updatingDob}
                        className="p-1.5 bg-[#1E3A8A] text-white rounded hover:bg-[#1E3A8A]/90 transition-colors disabled:opacity-50"
                      >
                        {updatingDob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {updateError && <p className="text-[10px] text-red-500 font-semibold">{updateError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>{user.dob || 'Not Provided'}</span>
                    </div>
                    <button 
                      onClick={() => setEditingDob(true)}
                      className="text-xs text-[#1E3A8A] dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-6 border-t border-gray-200 dark:border-slate-800">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Side: Case history & statistics */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="hidden md:flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span>Detection Activity & History</span>
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Stat indicators */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 dark:bg-slate-950 border border-gray-200/60 dark:border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Runs</span>
                <p className="text-xl font-black text-gray-950 dark:text-white mt-1">{totalScans}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-900/20 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Scams Flagged</span>
                <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">{scamCount}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200/40 dark:border-green-900/20 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Safe Checks</span>
                <p className="text-xl font-black text-green-600 dark:text-green-400 mt-1">{safeCount}</p>
              </div>
            </div>

            {/* Scan History table */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Recent Scan Logs
              </h4>
              
              {loadingReports ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1E3A8A] mb-2" />
                  <p className="text-xs">Loading history...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-950/20">
                  <FileText className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">No calls scanned yet under this account.</p>
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
                  {reports.map((report) => (
                    <div 
                      key={report.id} 
                      className="p-3 border border-gray-100 dark:border-slate-800/60 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
                            report.verdict === 'HIGH_RISK' ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/30" :
                            report.verdict === 'UNCERTAIN' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30" :
                            "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/30"
                          )}>
                            {report.verdict}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {report.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mt-2 truncate font-mono italic">
                          "{report.transcript || 'No transcript text available.'}"
                        </p>
                      </div>

                      {/* Right Indicator Icon */}
                      <div className="shrink-0 pt-0.5">
                        {report.verdict === 'HIGH_RISK' ? <ShieldAlert className="h-4 w-4 text-red-500" /> :
                         report.verdict === 'UNCERTAIN' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                         <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
