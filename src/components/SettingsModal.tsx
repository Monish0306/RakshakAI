import { useState } from 'react';
import { X, ShieldAlert, Save, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TRANSLATIONS } from '../lib/translations';

interface SettingsModalProps {
  user: any;
  language: string;
  onClose: () => void;
}

export default function SettingsModal({ user, language, onClose }: SettingsModalProps) {
  const [enabled, setEnabled] = useState(!!user.guardianEnabled);
  const [name, setName] = useState(user.guardianName || '');
  const [mobile, setMobile] = useState(user.guardianMobile || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleSave = async () => {
    if (enabled) {
      if (!name.trim()) {
        setError(t["settings.errorName"] || "Please enter a guardian name.");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(mobile.replace(/^\+91/, '').trim())) {
        setError(t["settings.errorMobile"] || "Please enter a valid 10-digit Indian mobile number.");
        return;
      }
    }
    
    setSaving(true);
    setError(null);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        guardianEnabled: enabled,
        guardianName: enabled ? name.trim() : null,
        guardianMobile: enabled ? mobile.replace(/^\+91/, '').trim() : null,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(t["settings.saveError"] || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-[#1E3A8A]">
            <ShieldAlert className="w-6 h-6" />
            <h2 className="text-xl font-bold">{t["settings.title"] || "Account Settings"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm font-semibold rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">{t["settings.guardianTitle"] || "Family Guardian Mode"}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {t["settings.guardianDesc"] || "Automatically prompt to alert a trusted family member if a high-risk scam is detected."}
              </p>
            </div>
            
            <label className="flex items-center cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <div className={\`block w-12 h-7 rounded-full transition-colors \${enabled ? "bg-[#1E3A8A]" : "bg-gray-300"}\`}></div>
                <div className={\`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform \${enabled ? "transform translate-x-5" : ""}\`}></div>
              </div>
              <span className="ml-4 font-semibold text-gray-800">
                {t["settings.enableGuardian"] || "Enable Guardian Alerts"}
              </span>
            </label>

            {enabled && (
              <div className="space-y-4 p-5 bg-gray-50 border border-gray-200 rounded-xl animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["settings.guardianName"] || "Guardian Name"}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Papa, Ravi"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">{t["settings.guardianMobile"] || "Guardian Mobile Number"}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {t["settings.privacyNote"] || "This is stored securely and only accessible by you. We do not share this number with anyone."}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{t["settings.save"] || "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
