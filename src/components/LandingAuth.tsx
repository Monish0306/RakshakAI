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
      
      // Access profile information via client profile document (read rule validates this UID)
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

    // Initial validations
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
      
      // Check if username is already taken via serverless lookup API to keep usernames private
      const res = await fetch("/api/username-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: signupUsername })
      });
      if (res.ok) {
        throw new Error("Username is already taken.");
      }

      // Create firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        signupEmail.trim(), 
        signupPassword
      );

      const uid = userCredential.user.uid;

      // Write user profile and register username in a batch
      const batch = writeBatch(db);
      
      // Write profile details to private "users" collection
      const userRef = doc(db, "users", uid);
      batch.set(userRef, {
        username: signupUsername.trim(),
        email: signupEmail.trim(),
        gender: signupGender,
        dob: signupDob,
        mobile: signupMobile.trim(),
        createdAt: new Date().toISOString()
      });

      // Register username map doc to mapping lookup (security rules confirm UID matches auth UID)
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

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col lg:flex-row">
      {/* Left Panel: Brand Showcase & Core Info */}
      <div className="w-full lg:w-3/5 bg-gradient-to-br from-[#F8FAFC] via-[#EDF2F7] to-[#E2E8F0] p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
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

        {/* Central Visual Showcase: Floating Shield on Rotating Disc */}
        <div className="my-12 lg:my-0 flex flex-col items-center justify-center flex-1 relative min-h-[350px]">
          {/* Animated Glow Disc underneath */}
          <div className="absolute w-[300px] h-[80px] lg:w-[400px] lg:h-[100px] bg-[#1E3A8A]/10 rounded-[100%] blur-xl animate-pulse"></div>
          
          {/* Concentric rotating discs representing perspective */}
          <div className="absolute w-[240px] h-[70px] lg:w-[320px] lg:h-[90px] border border-blue-500/20 rounded-[100%] animate-[spin_10s_linear_infinite] flex items-center justify-center">
            <div className="w-[180px] h-[55px] border border-blue-600/30 border-dashed rounded-[100%]"></div>
          </div>
          <div className="absolute w-[280px] h-[80px] lg:w-[360px] lg:h-[100px] border border-blue-600/10 rounded-[100%] animate-[spin_15s_linear_infinite_reverse]"></div>

          {/* Floating Shield and India Map */}
          <div className="relative z-10 animate-[bounce_4s_ease-in-out_infinite] flex flex-col items-center">
            <div className="relative bg-gradient-to-b from-[#2B6CB0] to-[#1E3A8A] w-[200px] h-[240px] lg:w-[240px] lg:h-[288px] rounded-[30%/10%] shadow-2xl flex items-center justify-center border-4 border-white/90 overflow-hidden">
              {/* Glossy overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>

              {/* Glowing Outline Map of India */}
              <svg viewBox="0 0 1000 1000" className="absolute w-4/5 h-4/5 opacity-40 text-blue-200 fill-current drop-shadow-[0_0_12px_rgba(147,197,253,0.6)]">
                <path d="M 250 200 Q 320 130, 460 150 T 700 180 Q 820 220, 850 320 T 880 480 Q 830 560, 720 610 T 620 780 Q 560 880, 470 880 T 340 780 Q 260 690, 240 560 T 200 380 Q 220 260, 250 200 Z" />
              </svg>

              {/* Padlock Icon Center */}
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-xl z-20">
                <Lock className="w-12 h-12 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]" />
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
