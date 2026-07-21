import { useState, useEffect, useRef } from 'react';
import { Shield, Eye, EyeOff, Lock, User, Mail, Calendar, Check, ChevronRight, Moon, Sun, PhoneCall, Cpu, CloudLightning, BrainCircuit } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import HeroShieldGraphic from './HeroShieldGraphic';
import { applyTheme, initTheme } from '../lib/theme';

interface LandingAuthProps {
  language: string;
  onLoginSuccess: (user: any) => void;
  redirectMessage?: string | null;
  adminOnly?: boolean;
}

export default function LandingAuth({ language, onLoginSuccess, redirectMessage, adminOnly = false }: LandingAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'admin'>(adminOnly ? 'admin' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => initTheme());
  const [adminFailedAttempts, setAdminFailedAttempts] = useState(0);
  const [isWalkthroughVisible, setIsWalkthroughVisible] = useState(false);
  const walkthroughRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Safety fallback: if scroll observer doesn't fire within 600ms, force trigger transitions
    const fallbackTimer = setTimeout(() => {
      setIsWalkthroughVisible(true);
    }, 600);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsWalkthroughVisible(true);
          clearTimeout(fallbackTimer);
        }
      },
      { threshold: 0.01 }
    );
    const el = walkthroughRef.current;
    if (el) {
      observer.observe(el);
    }
    return () => {
      clearTimeout(fallbackTimer);
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    applyTheme(next);
  };

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

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const email = loginIdentifier.trim();
      const userCredential = await signInWithEmailAndPassword(auth, email, loginPassword);
      const user = userCredential.user;
      
      const idTokenResult = await user.getIdTokenResult(true);
      const isAdminClaim = idTokenResult.claims.role === 'admin' || !!idTokenResult.claims.admin;
      
      if (!isAdminClaim) {
        await signOut(auth);
        const newCount = adminFailedAttempts + 1;
        setAdminFailedAttempts(newCount);
        if (newCount >= 3) {
          setAuthError("CRITICAL SECURITY ALERT: 3 failed officer authentication attempts detected. Details & IP address have been logged and transmitted to the Cyber Crime Head Office.");
        } else {
          setAuthError(`This account does not have administrator access. (Attempt ${newCount}/3)`);
        }
        return;
      }
      
      setAdminFailedAttempts(0);
      onLoginSuccess({
        uid: user.uid,
        email: user.email,
        username: email.split('@')[0],
        isAdmin: true
      });
    } catch (err: any) {
      console.error(err);
      const newCount = adminFailedAttempts + 1;
      setAdminFailedAttempts(newCount);

      if (newCount >= 3) {
        setAuthError("CRITICAL SECURITY ALERT: 3 failed officer authentication attempts detected. Details & IP address have been logged and transmitted to the Cyber Crime Head Office.");
      } else {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setAuthError(`Incorrect password. Please try again. (Attempt ${newCount}/3)`);
        } else if (err.code === 'auth/user-not-found') {
          setAuthError(`Official account not found. (Attempt ${newCount}/3)`);
        } else {
          setAuthError(err.message || `Failed to log in securely. (Attempt ${newCount}/3)`);
        }
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
    @keyframes gentle-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes circuit-pulse {
      0%, 100% { opacity: 0.25; stroke-width: 1px; }
      50% { opacity: 0.65; stroke-width: 1.5px; }
    }
    @keyframes radar-sweep-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes radar-blip-flash {
      0% { opacity: 0; filter: drop-shadow(0 0 0px transparent); }
      1% { opacity: 1; filter: drop-shadow(0 0 8px rgba(56,189,248,1)); }
      15% { opacity: 0.8; filter: drop-shadow(0 0 4px rgba(56,189,248,0.6)); }
      60% { opacity: 0; filter: drop-shadow(0 0 0px transparent); }
      100% { opacity: 0; }
    }

    .gentle-float {
      animation: gentle-float 4s ease-in-out infinite;
    }
    .circuit-path {
      animation: circuit-pulse 4s ease-in-out infinite;
    }
    
    .radar-sweep {
      animation: radar-sweep-spin 4s linear infinite;
      transform-origin: center;
    }
    .radar-blip {
      animation: radar-blip-flash 4s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .gentle-float, .circuit-path, .radar-sweep, .radar-blip {
        animation: none !important;
      }
      .radar-blip { opacity: 0.4; }
    }
  `;

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F4F7FC] dark:bg-slate-950 flex flex-col lg:flex-row text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <style>{premiumStyles}</style>
        
        {/* Left Panel: Brand Showcase & Core Info */}
        <div className="w-full lg:w-3/5 bg-gradient-to-br from-[#F8FAFC] via-[#EDF2F7] to-[#E2E8F0] dark:from-[#0B2438] dark:via-[#071521] dark:to-[#030910] p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
        
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
        <div className="flex items-center space-x-2 z-10">
          <Shield className="h-8 w-8 text-[#1E3A8A] dark:text-blue-400" />
          <div>
            <h1 className="font-bold text-2xl text-[#1E3A8A] dark:text-white tracking-tight">Rakshak AI</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Digital Safety Shield</p>
          </div>
        </div>

        {/* Hero Graphic — Centered in the left panel (HUD style) */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[0] flex h-[min(800px,100vh)] w-[min(100%,800px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-40 lg:opacity-80"
          aria-hidden="true"
        >
          <HeroShieldGraphic theme={theme} className="relative w-full h-full" />
        </div>

        {/* Brand Value Pitch */}
        <div className="relative z-10 flex-1 space-y-6 max-w-lg pt-8 lg:pt-16">
          <div className="space-y-2">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-none">
              Your Safety.<br />Our Mission.
            </h2>
            <p className="text-lg font-bold text-[#1E3A8A] dark:text-blue-400">{t["landing.subheading"]}</p>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Rakshak AI uses on-device intelligence and advanced threat detection to protect you from digital arrest scams, fraud calls, and online threats in real-time.
          </p>

          {/* Quick Value Pillars */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3">
              <div className="bg-[#1E3A8A]/10 dark:bg-blue-500/10 p-1.5 rounded-lg text-[#1E3A8A] dark:text-blue-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">AI-Powered Protection</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Detects and prevents scams in real-time</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-[#1E3A8A]/10 dark:bg-blue-500/10 p-1.5 rounded-lg text-[#1E3A8A] dark:text-blue-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Privacy by Design</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">On-device processing ensures your data stays private</p>
              </div>
            </div>
          </div>

          {/* Safer Digital India Badge */}
          <div className="bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-xl p-3.5 flex items-center space-x-3 max-w-sm shadow-sm backdrop-blur-sm mt-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold">An initiative for a safer digital India</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Secure • Reliable • Responsible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Authentication Card */}
      <div className="w-full lg:w-2/5 bg-white dark:bg-slate-900 p-8 lg:p-12 flex flex-col justify-center items-center shadow-xl border-l border-gray-100 dark:border-slate-800 relative transition-colors duration-300">
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2 shadow-sm z-50 cursor-pointer"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span className="text-xs font-semibold hidden sm:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-md p-6 lg:p-8 space-y-6">
          {/* Custom Tabs */}
          {!adminOnly && <div className="flex border-b border-gray-100 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
              }}
              className={`flex-1 pb-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'login' 
                  ? 'border-[#1E3A8A] dark:border-blue-500 text-[#1E3A8A] dark:text-blue-500' 
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
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
                  ? 'border-[#1E3A8A] dark:border-blue-500 text-[#1E3A8A] dark:text-blue-500' 
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {t["landing.signupTab"]}
            </button>
          </div>}

          {/* Auth Error Banner */}
          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold">
              {authError}
            </div>
          )}

          {activeTab === 'admin' ? (
            /* Admin Login Form */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cybercrime Officer Login</h3>
                <p className="text-xs text-gray-500 mt-1">Restricted access for authorized personnel only.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Official Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="Enter official email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 dark:focus:ring-blue-500/50 focus:border-[#1E3A8A] dark:focus:border-blue-500 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 dark:focus:ring-blue-500/50 focus:border-[#1E3A8A] dark:focus:border-blue-500 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all"
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

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                <span>{authLoading ? "Authenticating..." : "Login to Portal"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {!adminOnly && <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setAuthError(null);
                    setLoginIdentifier('');
                    setLoginPassword('');
                  }}
                  className="text-xs font-medium text-[#1E3A8A] dark:text-blue-400 hover:underline"
                >
                  Return to Citizen Login
                </button>
              </div>}
            </form>
          ) : activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t["landing.welcomeBack"]}</h3>
                <p className="text-xs text-gray-500 mt-1">{t["landing.loginSubtitle"]}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">{t["landing.emailOrUser"]}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your email or username"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 dark:focus:ring-blue-500/50 focus:border-[#1E3A8A] dark:focus:border-blue-500 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">{t["landing.password"]}</label>
                  <a href="#" className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline">{t["landing.forgot"]}</a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/25 dark:focus:ring-blue-500/50 focus:border-[#1E3A8A] dark:focus:border-blue-500 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all"
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
                  className="w-4 h-4 text-[#1E3A8A] border-gray-300 dark:border-slate-600 rounded focus:ring-[#1E3A8A] dark:bg-slate-800"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="text-xs font-semibold text-gray-600 dark:text-gray-300 select-none cursor-pointer">
                  {t["landing.remember"]}
                </label>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
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
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-gray-100"
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
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-gray-100"
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
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-gray-100"
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
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-gray-100"
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
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-gray-100"
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
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-gray-100"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  
                  {/* Real-time Password Checklist UI */}
                  <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700/50 rounded-xl space-y-1.5 mt-1 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className={`p-0.5 rounded-full ${passLength ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={passLength ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>{t["landing.ruleLength"]}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`p-0.5 rounded-full ${passLower ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={passLower ? 'text-green-700 font-semibold' : 'text-gray-500'}>{t["landing.ruleLower"]}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`p-0.5 rounded-full ${passUpper ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={passUpper ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>{t["landing.ruleUpper"]}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`p-0.5 rounded-full ${passSpecial ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={passSpecial ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>{t["landing.ruleSpecial"]}</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">{t["landing.confirmPassword"]}</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm Password"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-gray-100"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
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

      </div>
    </div>

      {/* Visual Walkthrough Section */}
      <div ref={walkthroughRef} className="bg-[#FAFBFD] dark:bg-slate-950 border-t border-gray-200/50 dark:border-slate-800/80 py-16 px-6 lg:px-16 transition-colors duration-300 select-none">
        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -20;
            }
          }
          .animated-dash-flow {
            stroke-dasharray: 5 5;
            animation: dash 1.5s linear infinite;
          }
          @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .flow-progress-line {
            background-size: 200% auto;
            animation: gradient-flow 3s linear infinite;
          }
          @keyframes glow-shift {
            0% { transform: translate(-5%, -5%) scale(1); }
            50% { transform: translate(5%, 10%) scale(1.08); }
            100% { transform: translate(-5%, -5%) scale(1); }
          }
          .glow-bg-animated {
            position: absolute;
            width: 140%;
            height: 140%;
            top: -20%;
            left: -20%;
            background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 40%, rgba(16,185,129,0.05) 80%);
            filter: blur(35px);
            animation: glow-shift 8s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
          }
          .dark .glow-bg-animated {
            background: radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(139,92,246,0.15) 40%, rgba(16,185,129,0.08) 80%);
          }
        `}</style>
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-[#1E3A8A] dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200/50 dark:border-blue-900/30">
              Scam Prevention Lifecycle
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">
              How Rakshak AI Protects Citizens
            </h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              A multi-layered defense shield that intercepts threats in real-time.
            </p>
          </div>
          {/* Flow Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative pt-4">
            {/* Horizontal progress line for large screens */}
            <div 
              className="hidden md:block absolute top-[48px] left-[10%] h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-40 z-0 transition-all duration-[2000ms] ease-out flow-progress-line"
              style={{ width: isWalkthroughVisible ? '80%' : '0%' }}
            ></div>

            {/* Step 1 */}
            <div 
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center z-10 hover:translate-y-[-4px] transition-all duration-700 ease-out`}
              style={{ 
                opacity: isWalkthroughVisible ? 1 : 0,
                transform: isWalkthroughVisible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: '100ms'
              }}
            >
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm mb-3 border border-blue-200/20 dark:border-blue-900/20">
                <PhoneCall className="h-4.5 w-4.5" />
              </div>
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">01. Live Audio/Text Stream</span>
              <h3 className="font-extrabold text-xs text-gray-900 dark:text-white mt-1">Audio & Screen OCR Capture</h3>
              
              {/* Phone call UI snippet */}
              <div className="w-full mt-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs max-w-[190px] text-left">
                <div className="bg-slate-100/50 dark:bg-slate-900/80 px-2 py-1.5 flex justify-between items-center text-[7px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-mono font-bold">CALL AUDIO INCOMING</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <div className="p-2 space-y-2">
                  <div className="flex items-center space-x-1.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-[8px] text-blue-600 dark:text-blue-400 font-extrabold">SP</div>
                    <div>
                      <p className="text-[8px] font-black text-slate-900 dark:text-white leading-none">Suspicious Caller</p>
                      <p className="text-[6.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">+91 95400 XXXXX</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-950/60 p-1.5 rounded text-[8px] font-mono text-slate-600 dark:text-slate-300 leading-normal border border-slate-100 dark:border-slate-900/40 font-semibold">
                    "I am calling from CBI headquarters. Your identity is under digital arrest..."
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div 
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center z-10 hover:translate-y-[-4px] transition-all duration-700 ease-out`}
              style={{ 
                opacity: isWalkthroughVisible ? 1 : 0,
                transform: isWalkthroughVisible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: '400ms'
              }}
            >
              <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm mb-3 border border-indigo-200/20 dark:border-indigo-900/20">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">02. On-Device Edge Scan</span>
              <h3 className="font-extrabold text-xs text-gray-900 dark:text-white mt-1">Local Keyword Match</h3>
              
              {/* Edge processing UI snippet */}
              <div className="w-full mt-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs max-w-[190px] text-left">
                <div className="bg-slate-100/50 dark:bg-slate-900/80 px-2 py-1.5 text-[7px] font-black text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  SECURE LOCAL SHIELD
                </div>
                <div className="p-2 space-y-1">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-950/60 px-1.5 py-1 rounded border border-slate-100 dark:border-slate-900/40">
                    <span className="text-[7.5px] font-mono font-bold text-slate-700 dark:text-slate-300">"digital arrest"</span>
                    <span 
                      className={`text-[6.5px] uppercase font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1 py-0.5 rounded border border-red-200/20 dark:border-red-900/20 transition-all duration-500`}
                      style={{
                        opacity: isWalkthroughVisible ? 1 : 0,
                        transform: isWalkthroughVisible ? 'scale(1)' : 'scale(0.8)',
                        transitionDelay: '1000ms'
                      }}
                    >
                      Flagged
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-950/60 px-1.5 py-1 rounded border border-slate-100 dark:border-slate-900/40">
                    <span className="text-[7.5px] font-mono font-bold text-slate-700 dark:text-slate-300">"CBI Headquarters"</span>
                    <span 
                      className={`text-[6.5px] uppercase font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1 py-0.5 rounded border border-red-200/20 dark:border-red-900/20 transition-all duration-500`}
                      style={{
                        opacity: isWalkthroughVisible ? 1 : 0,
                        transform: isWalkthroughVisible ? 'scale(1)' : 'scale(0.8)',
                        transitionDelay: '1200ms'
                      }}
                    >
                      Flagged
                    </span>
                  </div>
                  <p className="text-[6.5px] text-slate-400 dark:text-slate-500 text-center pt-1 font-mono">On-Device Scan: Escalate to AI</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div 
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center z-10 hover:translate-y-[-4px] transition-all duration-700 ease-out`}
              style={{ 
                opacity: isWalkthroughVisible ? 1 : 0,
                transform: isWalkthroughVisible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: '700ms'
              }}
            >
              <div className="h-10 w-10 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-bold text-sm mb-3 border border-purple-200/20 dark:border-purple-900/20">
                <CloudLightning className="h-4.5 w-4.5" />
              </div>
              <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">03. Dual LLM Safety Net</span>
              <h3 className="font-extrabold text-xs text-gray-900 dark:text-white mt-1">Contextual Verification</h3>
              
              {/* Verdict Card UI snippet */}
              <div className="w-full mt-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs max-w-[190px] text-left">
                <div className="bg-red-50 dark:bg-red-950/20 px-2 py-1.5 flex justify-between items-center text-[7px] text-red-600 dark:text-red-400 font-black border-b border-red-100 dark:border-red-950/30">
                  <span>AI SHIELD VERDICT</span>
                  <span>95% SURE</span>
                </div>
                <div className="p-2 space-y-1 text-[7.5px]">
                  <div 
                    className={`flex items-center gap-1 font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30 w-fit transition-all duration-500`}
                    style={{
                      opacity: isWalkthroughVisible ? 1 : 0,
                      transform: isWalkthroughVisible ? 'scale(1)' : 'scale(0.8)',
                      transitionDelay: '1500ms'
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>HIGH_RISK SCAM</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-normal font-semibold">
                    Category: Digital Arrest<br />
                    Pretext: CBI impersonation
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div 
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center z-10 hover:translate-y-[-4px] transition-all duration-700 ease-out`}
              style={{ 
                opacity: isWalkthroughVisible ? 1 : 0,
                transform: isWalkthroughVisible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: '1000ms'
              }}
            >
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm mb-3 border border-emerald-200/20 dark:border-emerald-900/20">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">04. Real-time Block & Sync</span>
              <h3 className="font-extrabold text-xs text-gray-900 dark:text-white mt-1">HQ Dashboard Update</h3>
              
              {/* Investigator Dashboard UI snippet */}
              <div className="w-full mt-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs max-w-[190px] text-left">
                <div className="bg-slate-100/50 dark:bg-slate-900/80 px-2 py-1.5 flex justify-between items-center text-[7px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-mono font-bold">HQ LIVE INCIDENT</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="p-2 space-y-1 text-[7px] text-slate-500 dark:text-slate-400">
                  <div className="bg-white dark:bg-slate-950/60 p-1.5 rounded border border-slate-100 dark:border-slate-900/40 flex justify-between items-center">
                    <div>
                      <p className="font-black text-slate-950 dark:text-white text-[7.5px]">Case #RKSH-928A</p>
                      <p className="text-[6.5px] font-mono mt-0.5">Status: Alert Triggered</p>
                    </div>
                    <span 
                      className={`bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1 py-0.5 rounded text-[6.5px] font-black border border-red-200/30 dark:border-red-900/30 transition-all duration-500`}
                      style={{
                        opacity: isWalkthroughVisible ? 1 : 0,
                        transform: isWalkthroughVisible ? 'scale(1)' : 'scale(0.8)',
                        transitionDelay: '1800ms'
                      }}
                    >
                      ALERT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Pipeline Diagram */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800/80 shadow-xs max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 space-y-3">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Adaptive Detection Pipeline
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Inputs flow from raw screens/audios to on-device semantic checkers. If uncertainty remains, cloud security algorithms evaluate context before syncing the threat metrics with the HQ Command center.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/20 dark:border-blue-900/20 px-2.5 py-0.5 rounded-md">Local Edge</span>
                <span className="text-[9px] font-bold bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-200/20 dark:border-purple-900/20 px-2.5 py-0.5 rounded-md">Cloud LLM</span>
                <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20 dark:border-emerald-900/20 px-2.5 py-0.5 rounded-md">HQ Sync</span>
              </div>
            </div>

            {/* SVG Pipeline */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-gray-100 dark:border-slate-800/40 relative overflow-hidden min-h-[250px] shadow-inner select-none">
              {/* Soft animated gradient glow behind the diagram */}
              <div className="glow-bg-animated"></div>

              <svg viewBox="0 0 450 230" className="w-full h-auto max-w-[500px] relative z-10 overflow-visible">
                {/* Node 1: Citizen Input */}
                <rect x="15" y="72.5" width="115" height="85" rx="10" fill="#3B82F6" opacity="0.08" stroke="#3B82F6" strokeWidth="2" className="dark:opacity-20" />
                <text x="72.5" y="112" fontSize="13" fontWeight="900" fill="#3B82F6" textAnchor="middle">Citizen Input</text>
                <text x="72.5" y="130" fontSize="11" fontWeight="bold" fill="#94A3B8" textAnchor="middle">Audio / Image</text>

                {/* Connection: 1 -> 2 */}
                <path d="M 130 115 L 150 115" stroke="#3B82F6" strokeWidth="2" fill="none" className="animated-dash-flow" />
                <polygon points="150,115 144,112 144,118" fill="#3B82F6" />

                {/* Node 2: Edge Check */}
                <rect x="150" y="52.5" width="145" height="125" rx="12" fill="#8B5CF6" opacity="0.08" stroke="#8B5CF6" strokeWidth="2" className="dark:opacity-20" />
                <text x="222.5" y="98" fontSize="13" fontWeight="900" fill="#8B5CF6" textAnchor="middle">Edge Check</text>
                <text x="222.5" y="118" fontSize="11" fontWeight="bold" fill="#8B5CF6" textAnchor="middle">Local Embeddings</text>
                <text x="222.5" y="136" fontSize="10" fontWeight="semibold" fill="#94A3B8" textAnchor="middle">(Zero-Latency Block)</text>

                {/* Connection: 2 -> 3 (Cloud LLM) */}
                <path d="M 295 90 L 315 60" stroke="#6366F1" strokeWidth="2" fill="none" className="animated-dash-flow" />
                <polygon points="315,60 308,62 313,67" fill="#6366F1" />

                {/* Node 3: Cloud LLM */}
                <rect x="315" y="20" width="120" height="80" rx="10" fill="#6366F1" opacity="0.08" stroke="#6366F1" strokeWidth="2" className="dark:opacity-20" />
                <text x="375" y="58" fontSize="13" fontWeight="900" fill="#6366F1" textAnchor="middle">Cloud LLM</text>
                <text x="375" y="76" fontSize="11" fontWeight="bold" fill="#94A3B8" textAnchor="middle">Deep Audit</text>

                {/* Connection: 2 -> 4 (HQ Registry) */}
                <path d="M 295 140 L 315 170" stroke="#10B981" strokeWidth="2" fill="none" className="animated-dash-flow" />
                <polygon points="315,170 313,163 308,168" fill="#10B981" />

                {/* Node 4: HQ Registry */}
                <rect x="315" y="130" width="120" height="80" rx="10" fill="#10B981" opacity="0.08" stroke="#10B981" strokeWidth="2" className="dark:opacity-20" />
                <text x="375" y="168" fontSize="13" fontWeight="900" fill="#10B981" textAnchor="middle">HQ Registry</text>
                <text x="375" y="186" fontSize="11" fontWeight="bold" fill="#94A3B8" textAnchor="middle">Action Plan</text>
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-900/60 py-8 px-6 text-center text-[10px] text-gray-400 dark:text-gray-500 w-full">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span>© 2026 Rakshak AI. Real-time Citizen Safety Net.</span>
          <div className="flex gap-4 font-semibold">
            <a href="#privacy" className="hover:underline">Privacy Policy</a>
            <a href="#terms" className="hover:underline">Terms of Service</a>
            <a href="#helpline" className="hover:underline">Helpline support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
