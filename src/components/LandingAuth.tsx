import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, User, Mail, Calendar, Check, ChevronRight, Moon, Sun } from 'lucide-react';
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

interface LandingAuthProps {
  language: string;
  onLoginSuccess: (user: any) => void;
  redirectMessage?: string | null;
}

export default function LandingAuth({ language, onLoginSuccess, redirectMessage }: LandingAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'admin'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [adminFailedAttempts, setAdminFailedAttempts] = useState(0);

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
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          className="absolute top-6 right-6 p-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-2 shadow-sm z-50"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span className="text-xs font-semibold hidden sm:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-md p-6 lg:p-8 space-y-6">
          {/* Custom Tabs */}
          <div className="flex border-b border-gray-100 dark:border-slate-800">
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
          </div>

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
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-center">
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
              </div>
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

        {/* Removed Enter App Unauthenticated CTA */}

        {/* Cybercrime Officer Login Button (Emphasized Special Portal Entry) */}
        {activeTab !== 'admin' && (
          <div className="mt-6 w-full flex justify-center z-10">
            <button
              onClick={() => {
                setActiveTab('admin');
                setAuthError(null);
                setLoginIdentifier('');
                setLoginPassword('');
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center space-x-2 group cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Cybercrime Officer Login</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
