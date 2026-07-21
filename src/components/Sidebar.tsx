import { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  BookOpen, 
  LayoutDashboard, 
  TrendingUp, 
  Info, 
  ShieldAlert, 
  Users, 
  User,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { TRANSLATIONS } from '../lib/translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'home' | 'how' | 'dashboard' | 'impact' | 'about' | 'command' | 'guardian') => void;
  language: string;
  setLanguage: (lang: string) => void;
  modelLoaded: boolean;
  user: any;
  isAdmin?: boolean;
  onLogout: () => void;
  onSignInClick: () => void;
  onToggleCollapse?: (collapsed: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onProfileClick: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  language, 
  setLanguage, 
  modelLoaded,
  user,
  onLogout,
  onSignInClick,
  onToggleCollapse,
  theme,
  toggleTheme,
  onProfileClick
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (onToggleCollapse) onToggleCollapse(nextState);
  };

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
    <aside className={cn(
      "bg-white border-r border-gray-200 fixed top-7 bottom-0 left-0 z-50 shadow-sm flex flex-col transition-[width] duration-300",
      "dark:bg-slate-900 dark:border-slate-800",
      isCollapsed ? "w-16" : "w-[240px]"
    )}>
      {/* Top: Logo & Collapse Toggle */}
      <div className="flex items-center justify-between p-4 shrink-0 border-b border-gray-100 dark:border-slate-850">
        <div 
          className="flex items-center space-x-2 cursor-pointer overflow-hidden" 
          onClick={() => setActiveTab('home')}
          title={t["header.logo"]}
        >
          <Shield className="h-8 w-8 text-[#1E3A8A] dark:text-blue-400 shrink-0" />
          {!isCollapsed && (
            <span className="font-bold text-xl text-[#1E3A8A] dark:text-blue-400 tracking-tight whitespace-nowrap overflow-hidden">
              {t["header.logo"]}
            </span>
          )}
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A8A] hover:bg-gray-100 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      {/* Center: Tabs */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isLocked = item.requiresAuth && !user;
          return (
            <button
              key={item.id}
              title={isCollapsed ? `${item.label} — ${item.tooltip}` : item.tooltip}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                activeTab === item.id 
                  ? "bg-[#1E3A8A]/10 text-[#1E3A8A] border-l-4 border-[#1E3A8A] pl-2 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent pl-2 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white",
                isCollapsed && "justify-center px-0 pl-0 border-l-0"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="flex-1 whitespace-nowrap overflow-hidden">{item.label}</span>}
              {!isCollapsed && isLocked && <Lock className="h-4 w-4 shrink-0 text-gray-400" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Controls */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-800 flex flex-col space-y-3 shrink-0">
        
        {/* Privacy Filter Status */}
        <div className={cn(
          "flex items-center space-x-2 text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-full border border-gray-200 w-fit dark:text-gray-400 dark:bg-slate-800 dark:border-slate-700",
          isCollapsed && "justify-center px-1.5"
        )}
        title={modelLoaded ? t["header.filterActive"] : t["header.filterLoading"]}
        >
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
          {!isCollapsed && (
            <span className="whitespace-nowrap overflow-hidden">
              {modelLoaded ? t["header.filterActive"] : t["header.filterLoading"]}
            </span>
          )}
        </div>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors w-full cursor-pointer",
            "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700",
            isCollapsed && "justify-center px-0"
          )}
          title="Toggle Theme (Dark / Light)"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-slate-700 shrink-0" />}
          {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Language Selector */}
        {!isCollapsed && (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-sm rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full px-2.5 py-1.5"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="te">తెలుగు (Telugu)</option>
          </select>
        )}



        {/* Auth status and triggers */}
        <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
          {user ? (
            <>
              {!isCollapsed ? (
                <button
                  onClick={onProfileClick}
                  className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 w-full text-center truncate cursor-pointer transition-colors"
                  title="View Profile & Cases"
                >
                  Hi, {user.username}
                </button>
              ) : (
                <button
                  onClick={onProfileClick}
                  className="p-2 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center transition-colors mx-auto"
                  title="View Profile & Cases"
                >
                  <User className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onLogout}
                className={cn(
                  "text-xs font-bold text-red-600 hover:underline bg-transparent border-none cursor-pointer mt-1",
                  isCollapsed ? "text-center" : "text-left"
                )}
                title="Logout"
              >
                {isCollapsed ? "Exit" : "Logout"}
              </button>
            </>
          ) : (
            <button
              onClick={onSignInClick}
              className={cn(
                "text-sm font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline bg-transparent border-none cursor-pointer w-full",
                isCollapsed ? "text-center" : "text-left"
              )}
              title="Sign In"
            >
              {isCollapsed ? "In" : "Sign In"}
            </button>
          )}
        </div>
        
      </div>
    </aside>
  );
}

