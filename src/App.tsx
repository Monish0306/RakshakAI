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
import { useClassifier } from './hooks/useClassifier.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'how' | 'dashboard' | 'impact' | 'about' | 'command' | 'guardian' | 'admin'>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [language, setLanguage] = useState('en');
  const [simpleView, setSimpleView] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [redirectMsg, setRedirectMsg] = useState<string | null>(null);

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
        onLoginSuccess={(loggedInUser) => {
          setUserAuth(loggedInUser);
          setShowLanding(false);
          setRedirectMsg(null);
          if (loggedInUser.isAdmin) {
            setActiveTab('admin');
          }
        }}
        redirectMessage={redirectMsg}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-200 flex">
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
        simpleView={simpleView}
        setSimpleView={setSimpleView}
        modelLoaded={modelLoaded}
        user={combinedUser}
        isAdmin={isAdmin}
        onLogout={() => {
          setUserAuth(null);
          setShowLanding(true);
        }}
        onSignInClick={() => {
          setRedirectMsg(null);
          setShowLanding(true);
        }}
      />

      <div className="flex-1 ml-[240px] transition-[margin] duration-300">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && <CitizenShield classifier={classifier} language={language} simpleView={simpleView} user={combinedUser} />}
        {activeTab === 'how' && <HowItWorks language={language} />}
        {activeTab === 'dashboard' && <Dashboard language={language} />}
        {activeTab === 'impact' && <BusinessImpact language={language} />}
        {activeTab === 'about' && <About language={language} />}
        {activeTab === 'command' && <CommandCenter language={language} />}
        {activeTab === 'guardian' && <GuardianCenter user={combinedUser} language={language} />}
        {activeTab === 'admin' && isAdmin && <AdminPortal user={firebaseUser} />}
      </main>
      </div>
    </div>
  );
}
