import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import type { AdminTab } from './AdminSidebar';
import OverviewSection from './OverviewSection';
import CaseManagementSection from './CaseManagementSection';
import OfficerManagementSection from './OfficerManagementSection';
import NetworkAnalysisSection from './NetworkAnalysisSection';
import IntelligenceCenterSection from './IntelligenceCenterSection';
import LiveMonitoringSection from './LiveMonitoringSection';
import HeatmapSection from './HeatmapSection';
import EvidenceManagementSection from './EvidenceManagementSection';
import AnalyticsSection from './AnalyticsSection';
import SystemAdminSection from './SystemAdminSection';
import AnnouncementBar from '../AnnouncementBar';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  user: any;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function AdminLayout({ user, onLogout, theme, toggleTheme }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('cases');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans pt-7 transition-colors duration-300">
      <AnnouncementBar isAdmin={true} />
      {/* Admin Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={onLogout} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Workspace */}
      <div className={cn(
        "flex-1 p-8 min-h-screen overflow-y-auto transition-[margin] duration-300",
        isSidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === 'cases' && <CaseManagementSection user={user} />}
          {activeTab === 'officers' && <OfficerManagementSection user={user} />}
          {activeTab === 'overview' && <OverviewSection user={user} />}
          {activeTab === 'network' && <NetworkAnalysisSection />}
          {activeTab === 'ai-intel' && <IntelligenceCenterSection />}
          {activeTab === 'live-monitoring' && <LiveMonitoringSection />}
          {activeTab === 'heatmap' && <HeatmapSection user={user} />}
          {activeTab === 'evidence' && <EvidenceManagementSection user={user} />}
          {activeTab === 'analytics' && <AnalyticsSection user={user} />}
          {activeTab === 'system' && <SystemAdminSection user={user} />}
        </div>
      </div>
    </div>
  );
}
