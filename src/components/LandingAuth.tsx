import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, User, Mail, Calendar, Check, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  writeBatch 
} from 'firebase/firestore';

interface LandingAuthProps {
  language: string;
  onEnterApp: () => void;
  onLoginSuccess: (user: any) => void;
  redirectMessage?: string | null;
}

export default function LandingAuth({ language, onEnterApp, onLoginSuccess, redirectMessage }: LandingAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Login Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupGender, setSignupGender] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupMobile, setSignupMobile] = useState('');

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    if (redirectMessage) {
      setAuthError(redirectMessage);
    }
  }, [redirectMessage]);

  // Real-time password requirements validation
  const passLength = signupPassword.length >= 6;
  const passLower = /[a-z]/.test(signupPassword);
  const passUpper = /[A-Z]/.test(signupPassword);
  const passSpecial = /[@$#!%*?&]/.test(signupPassword);
  const isPasswordValid = passLength && passLower && passUpper && passSpecial;

  // Validate Indian mobile numbers
  const isMobileValid = /^[6-9]\d{9}$/.test(signupMobile.replace(/^\+91/, '').trim());

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      let email = loginIdentifier.trim();
      
      // If identifier doesn't look like an email, assume username and lookup email via serverless lookup API
      if (!email.includes('@')) {
        const res = await fetch("/api/username-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email })
        });
        if (!res.ok) {
          throw new Error("Username not found");
        }
        const data = await res.json();
        email = data.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, loginPassword);
      
      onLoginSuccess({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        username: email.split('@')[0],
      });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError("Incorrect password. Please try again.");
      } else if (err.message === 'Username not found' || err.code === 'auth/user-not-found') {
        setAuthError("Account not found. Please check your username or email.");
      } else {
        setAuthError(err.message || "Failed to log in securely. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (signupUsername.length < 3) {
      setAuthError("Username must be at least 3 characters long.");
      return;
    }
    if (!isPasswordValid) {
      setAuthError("Password does not meet all security requirements.");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    if (!isMobileValid) {
      setAuthError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setAuthLoading(true);

    try {
      const usernameKey = signupUsername.trim().toLowerCase();
      
      const res = await fetch("/api/username-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: signupUsername })
      });
      if (res.ok) {
        throw new Error("Username is already taken.");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        signupEmail.trim(), 
        signupPassword
      );

      const uid = userCredential.user.uid;
      const batch = writeBatch(db);
      
      const userRef = doc(db, "users", uid);
      batch.set(userRef, {
        username: signupUsername.trim(),
        email: signupEmail.trim(),
        gender: signupGender,
        dob: signupDob,
        mobile: signupMobile.trim(),
        createdAt: new Date().toISOString()
      });

      const usernameRef = doc(db, "usernames", usernameKey);
      batch.set(usernameRef, {
        email: signupEmail.trim(),
        uid: uid
      });

      await batch.commit();

      onLoginSuccess({
        uid,
        email: signupEmail.trim(),
        username: signupUsername.trim(),
      });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered.");
      } else {
        setAuthError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const premiumStyles = `
    @keyframes shield-breath {
      0%, 100% { 
        filter: drop-shadow(0 4px 20px rgba(30, 58, 138, 0.15)) drop-shadow(0 0 12px rgba(59, 130, 246, 0.1));
        transform: scale(1);
      }
      50% { 
        filter: drop-shadow(0 4px 30px rgba(30, 58, 138, 0.25)) drop-shadow(0 0 24px rgba(59, 130, 246, 0.25));
        transform: scale(1.01);
      }
    }
    @keyframes map-float {
      0%, 100% { transform: translateY(2px) scale(0.96); }
      50% { transform: translateY(-10px) scale(0.98); }
    }
    @keyframes holographic-pulse {
      0%, 100% {
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 16px rgba(59, 130, 246, 0.4));
        opacity: 0.85;
      }
      50% {
        filter: drop-shadow(0 0 18px rgba(59, 130, 246, 0.95)) drop-shadow(0 0 32px rgba(147, 197, 253, 0.8));
        opacity: 1;
      }
    }
    @keyframes rotate-clockwise-fast {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes rotate-clockwise-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes spark-rise {
      0% { transform: translateY(60px) translateX(0px) scale(0); opacity: 0; }
      50% { opacity: 0.8; }
      100% { transform: translateY(-100px) translateX(var(--x-offset, 20px)) scale(1); opacity: 0; }
    }
    @keyframes circuit-pulse {
      0%, 100% { opacity: 0.25; stroke-width: 1px; }
      50% { opacity: 0.65; stroke-width: 1.5px; }
    }

    .stationary-shield {
      animation: shield-breath 5s ease-in-out infinite;
    }
    .holographic-map-container {
      animation: map-float 3.5s ease-in-out infinite;
    }
    .holographic-map-glow {
      animation: holographic-pulse 2.5s ease-in-out infinite;
    }
    .pedestal-ring-fast {
      animation: rotate-clockwise-fast 12s linear infinite;
    }
    .pedestal-ring-slow {
      animation: rotate-clockwise-slow 20s linear infinite;
    }
    .spark-particle {
      animation: spark-rise 5s ease-in-out infinite;
    }
    .circuit-path {
      animation: circuit-pulse 4s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .stationary-shield, .holographic-map-container, .holographic-map-glow, .pedestal-ring-fast, .pedestal-ring-slow, .spark-particle, .circuit-path {
        animation: none !important;
      }
      .holographic-map-glow {
        filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8));
      }
    }
  `;

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col lg:flex-row">
      <style>{premiumStyles}</style>
      
      {/* Left Panel: Brand Showcase & Core Info */}
      <div className="w-full lg:w-3/5 bg-gradient-to-br from-[#F8FAFC] via-[#EDF2F7] to-[#E2E8F0] p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        
        {/* Animated Background Circuit Lines (Exact mock integration) */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-40 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#1E3A8A" strokeWidth="1" fill="none" opacity="0.15">
              {/* Circuit Path Left */}
              <path className="circuit-path" d="M 50 150 L 150 150 L 200 200 L 200 350 L 150 400 L 50 400" />
              <circle cx="50" cy="150" r="3" fill="#1E3A8A" />
              <circle cx="50" cy="400" r="3" fill="#1E3A8A" />
              
              {/* Circuit Path Right */}
              <path className="circuit-path" style={{ animationDelay: '1.5s' }} d="M 600 100 L 500 100 L 450 150 L 450 300 L 480 330 L 600 330" />
              <circle cx="600" cy="100" r="3" fill="#1E3A8A" />
              <circle cx="600" cy="330" r="3" fill="#1E3A8A" />
              
              {/* Circuit Center Connectors */}
              <path className="circuit-path" style={{ animationDelay: '0.8s' }} d="M 120 500 L 250 500 L 300 550 L 350 550" />
            </g>
          </svg>
        </div>

        {/* Header Logo */}
        <div className="flex items-center space-x-3 z-10">
          <div className="bg-[#1E3A8A] p-2.5 rounded-xl shadow-md flex items-center justify-center">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl text-[#1E3A8A] tracking-tight">Rakshak AI</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Digital Safety Shield</p>
          </div>
        </div>

        {/* Central Visual Showcase: Stationary Shield with Floating Holographic Map & Rotating Cylindrical Pedestal */}
        <div className="my-12 lg:my-0 flex flex-col items-center justify-center flex-1 relative min-h-[420px] [perspective:1200px] z-10">
          
          {/* Floating sparks and blue particles */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute spark-particle bg-blue-400 rounded-full w-1 h-1 blur-[0.5px]" style={{ left: '35%', bottom: '25%', '--x-offset': '25px', animationDelay: '0s', animationDuration: '4.5s' } as any}></div>
            <div className="absolute spark-particle bg-blue-300 rounded-full w-1.5 h-1.5 blur-[1px]" style={{ left: '42%', bottom: '22%', '--x-offset': '-30px', animationDelay: '1.2s', animationDuration: '5.5s' } as any}></div>
            <div className="absolute spark-particle bg-blue-500 rounded-full w-1 h-1" style={{ left: '55%', bottom: '28%', '--x-offset': '15px', animationDelay: '2.5s', animationDuration: '3.8s' } as any}></div>
            <div className="absolute spark-particle bg-blue-300 rounded-full w-2 h-2 blur-[1px]" style={{ left: '62%', bottom: '24%', '--x-offset': '-20px', animationDelay: '0.7s', animationDuration: '6s' } as any}></div>
          </div>

          {/* 3D Holographic Pedestal / Disc System (z-index back, aligned with the bottom of the shield) */}
          <div className="absolute w-[320px] h-[160px] lg:w-[400px] lg:h-[200px] [transform:rotateX(68deg)_translateY(220px)_translateZ(-40px)] flex items-center justify-center pointer-events-none select-none z-0">
            
            {/* Volumetric Blue Glow Core */}
            <div className="absolute w-[220px] h-[220px] bg-gradient-to-t from-blue-600/25 to-blue-400/5 rounded-full blur-2xl"></div>

            {/* Glowing base plate segment (Outer Ring - rotates slightly faster) */}
            <div className="absolute inset-0 border-4 border-double border-blue-500/35 rounded-full pedestal-ring-fast shadow-[0_0_25px_rgba(59,130,246,0.3)]"></div>
            
            {/* Inner Concentric Ring with energy marks (Rotates slightly slower) */}
            <div className="absolute w-4/5 h-4/5 border-2 border-dashed border-blue-400/30 rounded-full pedestal-ring-slow"></div>
            
            {/* Solid core platform ring with light emission */}
            <div className="absolute w-3/5 h-3/5 border border-blue-300/40 rounded-full bg-gradient-to-b from-blue-500/10 to-transparent shadow-[inset_0_0_20px_rgba(59,130,246,0.25)] flex items-center justify-center">
              {/* Core focal beam point */}
              <div className="w-1/2 h-1/2 border border-blue-300/60 rounded-full bg-blue-500/5 blur-[2px]"></div>
            </div>
            
            {/* Outer soft light wave reflections */}
            <div className="absolute w-[120%] h-[120%] border border-blue-500/5 rounded-full animate-pulse"></div>
          </div>

          {/* Stationary Shield (z-index middle, stays in place with breathing glow) */}
          <div className="relative z-10 stationary-shield flex flex-col items-center [transform-style:preserve-3d]">
            <div className="relative bg-gradient-to-b from-[#1E3A8A]/95 via-[#1E293B]/98 to-[#0F172A] w-[220px] h-[260px] lg:w-[260px] lg:h-[310px] rounded-[30%/10%] shadow-2xl flex items-center justify-center border-[5px] border-blue-900/60 overflow-hidden">
              
              {/* Glossy / metallic reflection pattern overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>
              
              {/* Deep blue inner glow grid */}
              <div className="absolute inset-2 bg-[linear-gradient(rgba(30,58,138,0.15)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(30,58,138,0.15)_1px,_transparent_1px)] bg-[size:16px_16px] rounded-[28%/8%]"></div>

              {/* Holographic India Map Container (Floats gently inside the shield) */}
              <div className="absolute inset-0 flex items-center justify-center holographic-map-container z-10 pointer-events-none">
                
                {/* Glowing Outline Map of India (Electric Blue Glowing Outline) */}
                <svg viewBox="0 0 1000 1000" className="w-[85%] h-[85%] text-blue-400 fill-blue-500/10 holographic-map-glow">
                  {/* Outer Glowing Path */}
                  <path 
                    stroke="#60A5FA" 
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M 250 200 Q 320 130, 460 150 T 700 180 Q 820 220, 850 320 T 880 480 Q 830 560, 720 610 T 620 780 Q 560 880, 470 880 T 340 780 Q 260 690, 240 560 T 200 380 Q 220 260, 250 200 Z" 
                  />
                  {/* Interconnected Holographic Network / Constellation Grid inside the map */}
                  <g stroke="#93C5FD" strokeWidth="2" opacity="0.45" fill="none">
                    <line x1="350" y1="280" x2="450" y2="240" />
                    <line x1="450" y1="240" x2="520" y2="300" />
                    <line x1="520" y1="300" x2="430" y2="400" />
                    <line x1="430" y1="400" x2="350" y2="280" />
                    <line x1="450" y1="240" x2="620" y2="220" />
                    <line x1="620" y1="220" x2="710" y2="320" />
                    <line x1="710" y1="320" x2="620" y2="420" />
                    <line x1="620" y1="420" x2="520" y2="300" />
                    <line x1="430" y1="400" x2="500" y2="520" />
                    <line x1="500" y1="520" x2="620" y2="420" />
                    
                    {/* Node points */}
                    <circle cx="350" cy="280" r="4" fill="#60A5FA" />
                    <circle cx="450" cy="240" r="4" fill="#93C5FD" />
                    <circle cx="520" cy="300" r="4" fill="#60A5FA" />
                    <circle cx="620" cy="220" r="4" fill="#93C5FD" />
                    <circle cx="710" cy="320" r="4" fill="#60A5FA" />
                    <circle cx="620" cy="420" r="4" fill="#93C5FD" />
                    <circle cx="430" cy="400" r="4" fill="#60A5FA" />
                    <circle cx="500" cy="520" r="4" fill="#93C5FD" />
                  </g>
                </svg>

                {/* Padlock Icon (Fixed in center of map and floats along with it) */}
                <div className="absolute bg-[#1E3A8A]/90 backdrop-blur-md p-4 rounded-xl border border-blue-400/40 shadow-xl z-20">
                  <Lock className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Brand Value Pitch */}
        <div className="space-y-6 z-10 max-w-lg">
          <div className="space-y-2">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-none">
              Your Safety.<br />Our Mission.
            </h2>
            <p className="text-lg font-bold text-[#1E3A8A]">{t["landing.subheading"]}</p>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Rakshak AI uses on-device intelligence and advanced threat detection to protect you from digital arrest scams, fraud calls, and online threats in real-time.
          </p>

          {/* Quick Value Pillars */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3">
              <div className="bg-[#1E3A8A]/10 p-1.5 rounded-lg text-[#1E3A8A]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">AI-Powered Protection</h4>
                <p className="text-[11px] text-gray-500">Detects and prevents scams in real-time</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-[#1E3A8A]/10 p-1.5 rounded-lg text-[#1E3A8A]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Privacy by Design</h4>
                <p className="text-[11px] text-gray-500">On-device processing ensures your data stays private</p>
              </div>
            </div>
          </div>

          {/* Safer Digital India Badge */}
          <div className="bg-white/80 border border-gray-200/50 rounded-xl p-3.5 flex items-center space-x-3 max-w-sm shadow-sm backdrop-blur-sm mt-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-900">An initiative for a safer digital India</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Secure • Reliable • Responsible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Authentication Card */}
      <div className="w-full lg:w-2/5 bg-white p-8 lg:p-12 flex flex-col justify-center items-center shadow-xl border-l border-gray-100">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-md p-6 lg:p-8 space-y-6">
          {/* Custom Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
              }}
              className={`flex-1 pb-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'login' 
                  ? 'border-[#1E3A8A] text-[#1E3A8A]' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t["landing.loginTab"]}
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setAuthError(null);
              }}
              className={`flex-1 pb-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'signup' 
                  ? 'border-[#1E3A8A] text-[#1E3A8A]' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t["landing.signupTab"]}
            </button>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold">
              {authError}
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t["landing.welcomeBack"]}</h3>
                <p className="text-xs text-gray-500 mt-1">{t["landing.loginSubtitle"]}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700">{t["landing.emailOrUser"]}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your email or username"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 focus:border-[#1E3A8A] text-sm text-gray-800 placeholder-gray-400 transition-all"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700">{t["landing.password"]}</label>
                  <a href="#" className="text-xs font-bold text-[#1E3A8A] hover:underline">{t["landing.forgot"]}</a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 focus:border-[#1E3A8A] text-sm text-gray-800 placeholder-gray-400 transition-all"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-[#1E3A8A] border-gray-300 rounded focus:ring-[#1E3A8A]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="text-xs font-semibold text-gray-600 select-none cursor-pointer">
                  {t["landing.remember"]}
                </label>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                <span>{authLoading ? t["landing.loggingIn"] : t["landing.loginBtn"]}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Sign Up Form with real-time requirements */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t["landing.createAccount"]}</h3>
                <p className="text-xs text-gray-500 mt-1">{t["landing.signupSubtitle"]}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["landing.username"]}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["landing.email"]}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="Email ID"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["landing.mobile"]}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number"
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={signupMobile}
                      onChange={(e) => setSignupMobile(e.target.value)}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["landing.gender"]}</label>
                  <select
                    required
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={signupGender}
                    onChange={(e) => setSignupGender(e.target.value)}
                  >
                    <option value="">{t["landing.selectGender"]}</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["landing.dob"]}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700"
                      value={signupDob}
                      onChange={(e) => setSignupDob(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["landing.password"]}</label>
                  <input
                    type="password"
                    required
                    placeholder="New Password"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  
                  {/* Real-time Password Checklist UI */}
                  <div className="p-3 bg-gray-50 border border-gray-200/50 rounded-xl space-y-1.5 mt-1 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className={`p-0.5 rounded-full ${passLength ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={passLength ? 'text-green-700 font-semibold' : 'text-gray-500'}>{t["landing.ruleLength"]}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`p-0.5 rounded-full ${passLower ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={passLower ? 'text-green-700 font-semibold' : 'text-gray-500'}>{t["landing.ruleLower"]}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`p-0.5 rounded-full ${passUpper ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={passUpper ? 'text-green-700 font-semibold' : 'text-gray-500'}>{t["landing.ruleUpper"]}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`p-0.5 rounded-full ${passSpecial ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={passSpecial ? 'text-green-700 font-semibold' : 'text-gray-500'}>{t["landing.ruleSpecial"]}</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["landing.confirmPassword"]}</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm Password"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                <span>{authLoading ? t["landing.signingUp"] : t["landing.signupBtn"]}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Secure Trust Badges */}
          <div className="pt-4 border-t border-gray-100 flex flex-col items-center justify-center space-y-1.5">
            <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>{t["landing.secureBadge"]}</span>
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              {t["landing.govAligned"]}
            </p>
          </div>
        </div>

        {/* Enter App Unauthenticated CTA */}
        <div className="mt-8 flex flex-col items-center space-y-3">
          <span className="text-xs text-gray-400 font-medium">{t["landing.orCheckAnonymously"]}</span>
          <button
            onClick={onEnterApp}
            className="px-6 py-2.5 border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/5 font-bold rounded-xl text-sm transition-all shadow-sm"
          >
            {t["landing.checkCallNow"]}
          </button>
        </div>
      </div>
    </div>
  );
}
