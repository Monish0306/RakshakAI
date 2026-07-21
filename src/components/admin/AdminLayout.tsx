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

interface AdminLayoutProps {
  user: any;
  onLogout: () => void;
}

export default function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('cases');

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Admin Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={onLogout} 
      />

      {/* Main Workspace */}
      <div className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
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
