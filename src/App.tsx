import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import Sidebar from './components/Sidebar.tsx';
import CitizenShield from './components/CitizenShield.tsx';
import Dashboard from './components/Dashboard.tsx';
import HowItWorks from './components/HowItWorks.tsx';
import About from './components/About.tsx';
import BusinessImpact from './components/BusinessImpact.tsx';
import CommandCenter from './components/CommandCenter.tsx';
import LandingAuth from './components/LandingAuth.tsx';
import GuardianCenter from './components/GuardianCenter.tsx';
import AdminPortal from './components/AdminPortal.tsx';
import AnnouncementBar from './components/AnnouncementBar.tsx';
import UserProfileModal from './components/UserProfileModal.tsx';
import { useClassifier } from './hooks/useClassifier.ts';
import { cn } from './lib/utils';
import { initTheme, applyTheme } from './lib/theme';

export default function App() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => initTheme());
  
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    applyTheme(next);
  };

  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname === '/admin');
  const [activeTab, setActiveTab] = useState<'home' | 'how' | 'dashboard' | 'impact' | 'about' | 'command' | 'guardian' | 'admin'>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [language, setLanguage] = useState('en');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [redirectMsg, setRedirectMsg] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const adminRoute = window.location.pathname === '/admin';
      setIsAdminRoute(adminRoute);
      if (adminRoute) setShowLanding(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const combinedUser = userAuth ? { ...userAuth, ...userProfile } : null;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          setIsAdmin(idTokenResult.claims.role === 'admin' || !!idTokenResult.claims.admin);
        } catch (err) {
          console.error("Error fetching token result", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (userAuth?.uid) {

      const unsub = onSnapshot(doc(db, "users", userAuth.uid), (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      });
      return () => unsub();
    } else {
      setUserProfile(null);
    }
  }, [userAuth]);

  const classifier = useClassifier();

  // The model loads lazily when first used, or we could trigger a pre-load here if needed.
  useEffect(() => {
    const timer = setTimeout(() => setModelLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showLanding) {
    return (
      <LandingAuth
        language={language}
        adminOnly={isAdminRoute}
        onLoginSuccess={(loggedInUser) => {
          setUserAuth(loggedInUser);
          setShowLanding(false);
          setRedirectMsg(null);
          if (loggedInUser.isAdmin) {
            setIsAdmin(true);
            setActiveTab('admin');
          }
        }}
        redirectMessage={redirectMsg}
      />
    );
  }

  const handleLogout = () => {
    setUserAuth(null);
    setShowLanding(true);
  };

  if (activeTab === 'admin' && isAdmin) {
    return <AdminPortal user={firebaseUser} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-200 flex pt-7 transition-colors duration-300">
      <AnnouncementBar />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if ((tab === 'command' || tab === 'guardian') && !combinedUser) {
            setRedirectMsg(`Sign in to access the ${tab === 'command' ? 'Investigator Command Center' : 'Family Guardian Settings'}`);
            setShowLanding(true);
          } else {
            setActiveTab(tab);
          }
        }}
        language={language}
        setLanguage={setLanguage}
        modelLoaded={modelLoaded}
        user={combinedUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onSignInClick={() => {
          setRedirectMsg(null);
          setShowLanding(true);
        }}
        onToggleCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)}
        theme={theme}
        toggleTheme={toggleTheme}
        onProfileClick={() => setIsProfileOpen(true)}
      />

      <div className={cn("flex-1 transition-[margin] duration-300", isSidebarCollapsed ? "ml-16" : "ml-[240px]")}>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && <CitizenShield classifier={classifier} language={language} user={combinedUser} />}
        {activeTab === 'how' && <HowItWorks language={language} />}
        {activeTab === 'dashboard' && <Dashboard language={language} />}
        {activeTab === 'impact' && <BusinessImpact language={language} />}
        {activeTab === 'about' && <About language={language} />}
        {activeTab === 'command' && <CommandCenter language={language} />}
        {activeTab === 'guardian' && <GuardianCenter user={combinedUser} language={language} />}
      </main>
      </div>

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={combinedUser} 
        onLogout={handleLogout} 
      />
    </div>
  );
}
