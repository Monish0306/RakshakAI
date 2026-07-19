import { useState } from 'react';
import { Shield, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { TRANSLATIONS } from '../lib/translations';
import SettingsModal from './SettingsModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: 'home' | 'how' | 'dashboard' | 'about' | 'command') => void;
  language: string;
  setLanguage: (lang: string) => void;
  simpleView: boolean;
  setSimpleView: (val: boolean) => void;
  modelLoaded: boolean;
  user: any;
  onLogout: () => void;
  onSignInClick: () => void;
}

export default function Header({ 
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
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const navItems = [
    { id: 'home', label: t["header.liveCheck"] },
    { id: 'how', label: t["header.howItWorks"] },
    { id: 'dashboard', label: t["header.dashboard"] },
    { id: 'about', label: t["header.about"] },
    { id: 'command', label: t["header.command"] },
  ] as const;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <Shield className="h-8 w-8 text-[#1E3A8A]" />
            <span className="font-bold text-xl text-[#1E3A8A] tracking-tight">
              {t["header.logo"]}
            </span>
          </div>

          {/* Center: Tabs */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === item.id 
                    ? "bg-[#1E3A8A]/10 text-[#1E3A8A]" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Controls */}
          <div className="flex items-center space-x-4">
            
            {/* Privacy Filter Status */}
            <div className="hidden lg:flex items-center space-x-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <span className="relative flex h-2.5 w-2.5">
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
              <span>
                {modelLoaded ? t["header.filterActive"] : t["header.filterLoading"]}
              </span>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block px-2.5 py-1.5"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>

            {/* Grandparent Mode Toggle */}
            <label className="flex items-center cursor-pointer space-x-2">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={simpleView}
                  onChange={(e) => setSimpleView(e.target.checked)}
                />
                <div className={cn("block w-10 h-6 rounded-full transition-colors", simpleView ? "bg-[#1E3A8A]" : "bg-gray-300")}></div>
                <div className={cn("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", simpleView ? "transform translate-x-4" : "")}></div>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {t["header.simpleView"]}
              </span>
            </label>

            {/* Auth status and triggers */}
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4 ml-2">
              {user ? (
                <>
                  <span className="text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    Hi, {user.username}
                  </span>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onLogout}
                    className="text-xs font-bold text-red-600 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={onSignInClick}
                  className="text-xs font-bold text-[#1E3A8A] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {showSettings && user && (
        <SettingsModal 
          user={user} 
          language={language} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </header>
  );
}
