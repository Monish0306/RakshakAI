import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  UserCheck, 
  Network, 
  BrainCircuit, 
  Activity, 
  MapPin, 
  FileText, 
  BarChart3, 
  ShieldAlert, 
  LogOut,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type AdminTab = 
  | 'overview' 
  | 'cases' 
  | 'officers' 
  | 'network' 
  | 'ai-intel' 
  | 'live-monitoring' 
  | 'heatmap' 
  | 'evidence' 
  | 'analytics' 
  | 'system';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  user: any;
  onLogout: () => void;
}

export const ADMIN_NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Case Management', icon: FolderKanban },
  { id: 'officers', label: 'Officer Management', icon: UserCheck },
  { id: 'network', label: 'Criminal Network', icon: Network },
  { id: 'ai-intel', label: 'AI Intelligence Center', icon: BrainCircuit },
  { id: 'live-monitoring', label: 'Live Threat Monitoring', icon: Activity },
  { id: 'heatmap', label: 'National Heatmap', icon: MapPin },
  { id: 'evidence', label: 'Evidence Management', icon: FileText },
  { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'system', label: 'System Administration', icon: ShieldAlert },
];

export default function AdminSidebar({ activeTab, setActiveTab, user, onLogout }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-slate-950 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-40 select-none shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
              RAKSHAK <span className="text-xs px-1.5 py-0.5 bg-red-600/30 text-red-400 border border-red-500/30 rounded font-semibold uppercase tracking-wider">HQ</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Command Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Operations
        </div>
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group",
                isActive
                  ? "bg-red-600/90 text-white shadow-md shadow-red-900/30 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80" />}
            </button>
          );
        })}
      </nav>

      {/* User / Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-red-400 shrink-0">
            {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.displayName || user?.email || 'Admin User'}</p>
            <p className="text-[10px] text-slate-400 truncate">Clearance Level 5</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-md text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
