import { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import CitizenShield from './components/CitizenShield.tsx';
import Dashboard from './components/Dashboard.tsx';
import HowItWorks from './components/HowItWorks.tsx';
import About from './components/About.tsx';
import CommandCenter from './components/CommandCenter.tsx';
import LandingAuth from './components/LandingAuth.tsx';
import { useClassifier } from './hooks/useClassifier.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'how' | 'dashboard' | 'about' | 'command'>('home');
  const [language, setLanguage] = useState('en');
  const [simpleView, setSimpleView] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [redirectMsg, setRedirectMsg] = useState<string | null>(null);

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
        onEnterApp={() => setShowLanding(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setShowLanding(false);
          setRedirectMsg(null);
        }}
        redirectMessage={redirectMsg}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-200">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'command' && !user) {
            setRedirectMsg("Sign in to access the Investigator Command Center");
            setShowLanding(true);
          } else {
            setActiveTab(tab);
          }
        }}
        language={language}
        setLanguage={setLanguage}
        simpleView={simpleView}
        setSimpleView={setSimpleView}
        modelLoaded={modelLoaded}
        user={user}
        onLogout={() => {
          setUser(null);
          setShowLanding(true);
        }}
        onSignInClick={() => {
          setRedirectMsg(null);
          setShowLanding(true);
        }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && <CitizenShield classifier={classifier} language={language} simpleView={simpleView} />}
        {activeTab === 'how' && <HowItWorks language={language} />}
        {activeTab === 'dashboard' && <Dashboard language={language} />}
        {activeTab === 'about' && <About language={language} />}
        {activeTab === 'command' && <CommandCenter language={language} />}
      </main>
    </div>
  );
}