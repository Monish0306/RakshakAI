import { useState, useEffect } from 'react';
import { ShieldAlert, Save, Loader2, Info } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TRANSLATIONS } from '../lib/translations';

interface GuardianCenterProps {
  user: any;
  language: string;
}

export default function GuardianCenter({ user, language }: GuardianCenterProps) {
  const [enabled, setEnabled] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Initialize state from user prop when it loads
  useEffect(() => {
    if (user) {
      setEnabled(!!user.guardianEnabled);
      setName(user.guardianName || '');
      setMobile(user.guardianMobile || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (enabled) {
      if (!name.trim()) {
        setError(t["settings.errorName"] || "Please enter a guardian name.");
        setSuccess(false);
        return;
      }
      if (!/^[6-9]\d{9}$/.test(mobile.replace(/^\+91/, '').trim())) {
        setError(t["settings.errorMobile"] || "Please enter a valid 10-digit Indian mobile number.");
        setSuccess(false);
        return;
      }
    }
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        guardianEnabled: enabled,
        guardianName: enabled ? name.trim() : null,
        guardianMobile: enabled ? mobile.replace(/^\+91/, '').trim() : null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(t["settings.saveError"] || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900 to-[#1E3A8A] p-8 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-indigo-300" />
            <h1 className="text-3xl font-bold">{t["settings.title"] || "Family Guardian Mode"}</h1>
          </div>
          <p className="text-indigo-100 max-w-xl">
            {t["settings.guardianDesc"] || "Automatically prompt to alert a trusted family member if a high-risk scam is detected."}
          </p>
        </div>

        <div className="p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm font-semibold rounded-xl border border-red-200 flex items-center">
              <Info className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-50 text-green-700 text-sm font-semibold rounded-xl border border-green-200 flex items-center">
              <Info className="w-5 h-5 mr-2 flex-shrink-0" />
              {t["settings.saveSuccess"] || "Settings saved successfully!"}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <label className="flex items-center cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${enabled ? "bg-indigo-600" : "bg-gray-300"}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm ${enabled ? "transform translate-x-6" : ""}`}></div>
              </div>
              <span className="ml-4 text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                {t["settings.enableGuardian"] || "Enable Guardian Alerts"}
              </span>
            </label>
          </div>

          {enabled && (
            <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t["settings.guardianName"] || "Guardian Name"}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Papa, Ravi"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm transition-shadow"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t["settings.guardianMobile"] || "Guardian Mobile Number"}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-bold text-sm bg-gray-50 border-r border-gray-300 rounded-l-xl">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full pl-16 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm transition-shadow"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-start text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Info className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="font-medium text-blue-900">
                  {t["settings.privacyNote"] || "This is stored securely and only accessible by you. We do not share this number with anyone."}
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 text-lg"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{t["settings.save"] || "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
