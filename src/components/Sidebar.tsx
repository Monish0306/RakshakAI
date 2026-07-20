import { 
  Shield, 
  ShieldCheck, 
  BookOpen, 
  LayoutDashboard, 
  TrendingUp, 
  Info, 
  ShieldAlert, 
  Users, 
  Lock
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { TRANSLATIONS } from '../lib/translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'home' | 'how' | 'dashboard' | 'impact' | 'about' | 'command' | 'guardian') => void;
  language: string;
  setLanguage: (lang: string) => void;
  simpleView: boolean;
  setSimpleView: (val: boolean) => void;
  modelLoaded: boolean;
  user: any;
  isAdmin?: boolean;
  onLogout: () => void;
  onSignInClick: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  language, 
  setLanguage, 
  simpleView, 
  setSimpleView,
  modelLoaded,
  user,
  onLogout,
  onSignInClick
}: SidebarProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    tooltip: string;
    requiresAuth?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: t["header.liveCheck"], icon: ShieldCheck, tooltip: t["header.tooltip.home"] || "Simulate a live scam call to check safety." },
    { id: 'how', label: t["header.howItWorks"], icon: BookOpen, tooltip: t["header.tooltip.how"] || "Learn how Rakshak AI protects you." },
    { id: 'dashboard', label: t["header.dashboard"], icon: LayoutDashboard, tooltip: t["header.tooltip.dashboard"] || "View statistics and fraud trends." },
    { id: 'impact', label: t["header.businessImpact"], icon: TrendingUp, tooltip: t["header.tooltip.impact"] || "Explore Rakshak AI's business model and impact." },
    { id: 'about', label: t["header.about"], icon: Info, tooltip: t["header.tooltip.about"] || "Learn more about our mission." },
    { id: 'command', label: t["header.command"], icon: ShieldAlert, tooltip: t["header.tooltip.command"] || "Access the investigator control panel.", requiresAuth: true },
    { id: 'guardian', label: t["header.guardian"] || "Family Guardian", icon: Users, tooltip: t["header.tooltip.guardian"] || "Manage trusted contacts for emergency alerts.", requiresAuth: true },
  ];

  return (
    <aside className="bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50 shadow-sm w-[240px] flex flex-col transition-[width] duration-300">
      {/* Top: Logo */}
      <div className="flex items-center space-x-2 cursor-pointer p-4 shrink-0" onClick={() => setActiveTab('home')}>
        <Shield className="h-8 w-8 text-[#1E3A8A] shrink-0" />
        <span className="font-bold text-xl text-[#1E3A8A] tracking-tight whitespace-nowrap overflow-hidden">
          {t["header.logo"]}
        </span>
      </div>

      {/* Center: Tabs */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isLocked = item.requiresAuth && !user;
          return (
            <button
              key={item.id}
              title={item.tooltip}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                activeTab === item.id 
                  ? "bg-[#1E3A8A]/10 text-[#1E3A8A] border-l-4 border-[#1E3A8A] pl-2" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent pl-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 whitespace-nowrap overflow-hidden">{item.label}</span>
              {isLocked && <Lock className="h-4 w-4 shrink-0 text-gray-400" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Controls */}
      <div className="p-4 border-t border-gray-200 flex flex-col space-y-4 shrink-0">
        
        {/* Privacy Filter Status */}
        <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 w-fit">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {modelLoaded ? (
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-pulse"></span>
            ) : (
              <span className="absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              modelLoaded ? "bg-green-600" : "bg-gray-500"
            )}></span>
          </span>
          <span className="whitespace-nowrap overflow-hidden">
            {modelLoaded ? t["header.filterActive"] : t["header.filterLoading"]}
          </span>
        </div>

        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full px-2.5 py-1.5"
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="ta">தமிழ் (Tamil)</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
          <option value="te">తెలుగు (Telugu)</option>
        </select>

        {/* Grandparent Mode Toggle */}
        <label className="flex items-center cursor-pointer space-x-2">
          <div className="relative shrink-0">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={simpleView}
              onChange={(e) => setSimpleView(e.target.checked)}
            />
            <div className={cn("block w-10 h-6 rounded-full transition-colors", simpleView ? "bg-[#1E3A8A]" : "bg-gray-300")}></div>
            <div className={cn("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", simpleView ? "transform translate-x-4" : "")}></div>
          </div>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden">
            {t["header.simpleView"]}
          </span>
        </label>

        {/* Auth status and triggers */}
        <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
          {user ? (
            <>
              <span className="text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 w-full text-center truncate">
                Hi, {user.username}
              </span>
              <button
                onClick={onLogout}
                className="text-xs font-bold text-red-600 hover:underline bg-transparent border-none cursor-pointer text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={onSignInClick}
              className="text-sm font-bold text-[#1E3A8A] hover:underline bg-transparent border-none cursor-pointer w-full text-left"
            >
              Sign In
            </button>
          )}
        </div>
        
      </div>
    </aside>
  );
}
