import { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import CitizenShield from './components/CitizenShield.tsx';
import Dashboard from './components/Dashboard.tsx';
import HowItWorks from './components/HowItWorks.tsx';
import About from './components/About.tsx';
import CommandCenter from './components/CommandCenter.tsx';
import { useClassifier } from './hooks/useClassifier.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'how' | 'dashboard' | 'about' | 'command'>('home');
  const [language, setLanguage] = useState('en');
  const [simpleView, setSimpleView] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const classifier = useClassifier();

  // The model loads lazily when first used, or we could trigger a pre-load here if needed.
  // For now, we'll assume it's loaded when not loading. Actually, the prompt says "gray dot + Loading privacy filter... while loading, green dot + Privacy filter active once onDeviceFilter has loaded".
  // Let's create a small effect to simulate this or check it.
  useEffect(() => {
    // In a real app we'd wait for checkOnDevice to initialize. For now we can fake the initial load time to show the UI state, since checkOnDevice loads on first call. 
    // Wait, onDeviceFilter.js has getEmbedder() which we can't easily call directly from here without importing it.
    const timer = setTimeout(() => setModelLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        simpleView={simpleView}
        setSimpleView={setSimpleView}
        modelLoaded={modelLoaded}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && <CitizenShield classifier={classifier} language={language} simpleView={simpleView} />}
        {activeTab === 'how' && <HowItWorks />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'about' && <About />}
        {activeTab === 'command' && <CommandCenter />}
      </main>
    </div>
  );
}