import { useState, useEffect } from 'react';
import { Download, PhoneCall, Loader2, PlayCircle, Info } from 'lucide-react';
import VerdictCard from './VerdictCard';
import ReasoningPanel from './ReasoningPanel';
// @ts-ignore
import { generateReportPDF, generateSessionId } from '../lib/reportGenerator';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { TRANSLATIONS } from '../lib/translations';

interface CitizenShieldProps {
  classifier: any;
  language: string;
  simpleView: boolean;
  user?: any;
}

const SAMPLE_SCAM_TRANSCRIPT = 
  "Hello, this is Inspector Sharma from the CBI. We have intercepted a package in your name containing illegal passports. You are under digital arrest and must remain on this video call. Do not disconnect or a warrant will be issued immediately. For verification of your innocence, transfer a refundable deposit of Rs. 50,000 to the RBI secure account.";

export default function CitizenShield({ classifier, language, simpleView, user }: CitizenShieldProps) {
  const [transcript, setTranscript] = useState('');
  const [coolingTimer, setCoolingTimer] = useState(0);
  const { loading, result, advisory, error, runClassification } = classifier;
  const [isSimulating, setIsSimulating] = useState(false);
  const [moneySent, setMoneySent] = useState<boolean | null>(null);
  const [evidenceChecked, setEvidenceChecked] = useState<Record<string, boolean>>({
    screenshot: false,
    phone: false,
    time: false,
    transaction: false,
    notDeleted: false,
    notTold: false
  });
  const [alertGuardianPrompt, setAlertGuardianPrompt] = useState<'pending' | 'yes' | 'no'>('pending');

  const resetState = () => {
    setMoneySent(null);
    setAlertGuardianPrompt('pending');
    setEvidenceChecked({
      screenshot: false,
      phone: false,
      time: false,
      transaction: false,
      notDeleted: false,
      notTold: false
    });
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleCheck = () => {
    if (!transcript.trim()) return;
    resetState();
    runClassification(transcript, language);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setTranscript('');
    resetState();
    let currentText = '';
    const words = SAMPLE_SCAM_TRANSCRIPT.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      setTranscript(currentText);
      await new Promise(r => setTimeout(r, 80)); // Typewriter effect
    }
    
    setIsSimulating(false);
    runClassification(SAMPLE_SCAM_TRANSCRIPT, language);
  };

  useEffect(() => {
    if (result && result.verdict === 'HIGH_RISK') {
      setCoolingTimer(15);
    } else {
      setCoolingTimer(0);
    }
  }, [result]);

  useEffect(() => {
    if (coolingTimer > 0) {
      const timer = setTimeout(() => setCoolingTimer(coolingTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [coolingTimer]);

  const handleGenerateReport = async () => {
    if (!result) return;
    
    const session = {
      sessionId: generateSessionId(),
      transcript: transcript,
      verdict: result.verdict,
      confidence: result.confidence,
      matches: result.matches || [],
      redFlagsDetected: result.redFlagsDetected || [],
      timestamp: new Date().toISOString(),
      evidenceStatus: evidenceChecked
    };

    const doc = await generateReportPDF(session);
    doc.save(`RakshakAI_Report_${session.sessionId}.pdf`);
  };

  const showActions = result && coolingTimer === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Input Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-1">
          <textarea
            className={cn(
              "w-full min-h-[160px] p-5 focus:outline-none resize-none placeholder-gray-400 bg-transparent text-gray-800",
              simpleView ? "text-2xl" : "text-lg"
            )}
            placeholder={t["shield.textareaPlaceholder"]}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={loading || isSimulating}
          />
        </div>
        <div className="bg-gray-50 border-t border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleSimulate}
            disabled={loading || isSimulating}
            className="text-[#1E3A8A] font-medium text-sm flex items-center hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            {t["shield.liveSimulatedCall"]}
          </button>
          
          <button
            onClick={handleCheck}
            disabled={loading || isSimulating || !transcript.trim()}
            className={cn(
              "w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white transition-all shadow-sm flex items-center justify-center",
              (loading || isSimulating || !transcript.trim()) 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 hover:shadow-md",
              simpleView ? "text-xl py-4" : "text-base"
            )}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t["shield.analyzing"]}</>
            ) : (
              t["shield.checkThisNow"]
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mt-4 shadow-sm" role="alert">
          <strong className="font-bold mr-2">{t["shield.error"]}</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          <VerdictCard result={result} simpleView={simpleView} language={language} />
          
          {!simpleView && <ReasoningPanel result={result} simpleView={simpleView} language={language} />}

          {/* Cooling Off Timer */}
          {result.verdict === 'HIGH_RISK' && coolingTimer > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-gray-200" strokeWidth="4" fill="none" />
                  <circle 
                    cx="32" cy="32" r="28" 
                    className="stroke-[#1E3A8A]" 
                    strokeWidth="4" fill="none" 
                    strokeDasharray={28 * 2 * Math.PI}
                    strokeDashoffset={(28 * 2 * Math.PI) * (1 - coolingTimer / 15)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className="absolute text-xl font-bold text-[#1E3A8A]">{coolingTimer}</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{t["shield.takeMoment"]}</h4>
              <p className="text-gray-600">{t["shield.takeMomentDesc"]}</p>
            </motion.div>
          )}

          {/* Post-Verdict Actions */}
          {showActions && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
            >
              {/* Advisory Box */}
              <div className={cn(
                "col-span-1 md:col-span-2 p-6 rounded-xl border shadow-sm",
                result.verdict === 'SAFE' ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
              )}>
                <div className="flex items-start space-x-3">
                  <Info className={cn("w-6 h-6 shrink-0 mt-0.5", result.verdict === 'SAFE' ? "text-green-600" : "text-blue-600")} />
                  <div>
                    <h3 className={cn(
                      "font-semibold mb-2",
                      result.verdict === 'SAFE' ? "text-green-900" : "text-blue-900",
                      simpleView ? "text-2xl" : "text-lg"
                    )}>
                      {t["shield.officialAdvisory"]}
                    </h3>
                    <p className={cn(
                      "font-medium leading-relaxed",
                      result.verdict === 'SAFE' ? "text-green-800" : "text-blue-800",
                      simpleView ? "text-xl" : "text-base"
                    )}>
                      {advisory || result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Golden Hour Assistant - High Risk Only */}
              {result.verdict === 'HIGH_RISK' && (
                <div className="col-span-1 md:col-span-2 mt-2">
                  {moneySent === null ? (
                    <div className="bg-orange-50 border border-orange-200 p-6 lg:p-8 rounded-xl shadow-sm text-center">
                      <h3 className="text-xl lg:text-2xl font-bold text-orange-900 mb-6">{t["shield.goldenHourQuestion"]}</h3>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => setMoneySent(true)} className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm">{t["common.yes"]}</button>
                        <button onClick={() => setMoneySent(false)} className="px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm">{t["common.no"]}</button>
                      </div>
                    </div>
                  ) : moneySent === true ? (
                    <div className="bg-red-50 border-2 border-red-500 p-6 lg:p-8 rounded-xl shadow-sm">
                      <h3 className="text-2xl lg:text-3xl font-extrabold text-red-700 mb-3">{t["shield.goldenHourUrgentTitle"]}</h3>
                      <p className="text-red-900 font-medium text-lg mb-6 leading-relaxed">{t["shield.goldenHourUrgentDesc"]}</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <a href="tel:1930" className="flex-1 bg-red-600 hover:bg-red-700 text-white text-center py-4 font-bold rounded-lg flex items-center justify-center gap-2 text-lg shadow-sm transition-colors">
                          <PhoneCall className="w-5 h-5" /> {t["shield.call1930Now"]}
                        </a>
                        <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="flex-1 bg-red-800 hover:bg-red-900 text-white text-center py-4 font-bold rounded-lg text-lg shadow-sm transition-colors">
                          {t["shield.fileComplaint"]}
                        </a>
                      </div>
                      
                      <div className="bg-white/80 p-5 rounded-lg border border-red-100">
                        <ul className="space-y-3 text-red-900 font-semibold list-none">
                          <li>{t["shield.urgentStep1"]}</li>
                          <li>{t["shield.urgentStep2"]}</li>
                          <li>{t["shield.urgentStep3"]}</li>
                          <li>{t["shield.urgentStep4"]}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 p-6 lg:p-8 rounded-xl shadow-sm flex items-start gap-4">
                      <Info className="w-8 h-8 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-blue-900 font-medium text-lg lg:text-xl leading-relaxed">{t["shield.goldenHourCalmMessage"]}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Find Nearest Help - Only for Uncertain */}
              {result.verdict === 'UNCERTAIN' && (
                <div className="bg-red-50 p-6 rounded-xl border border-red-200 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <PhoneCall className="w-6 h-6 text-red-600" />
                  </div>
                  <h4 className="font-bold text-red-900 text-lg mb-1">{t["shield.helplineTitle"]}</h4>
                  <p className="text-4xl font-extrabold text-red-700 my-2">{t["shield.helplineNumber"]}</p>
                  <p className="text-red-800 text-sm font-medium">{t["shield.helplineDesc"]}</p>
                </div>
              )}

              {/* Family Guardian Alert Prompt */}
              {result.verdict === 'HIGH_RISK' && user?.guardianEnabled && user?.guardianMobile && (
                <div className="col-span-1 md:col-span-2 mt-4">
                  {alertGuardianPrompt === 'pending' ? (
                    <div className="bg-indigo-50 border border-indigo-200 p-6 lg:p-8 rounded-xl shadow-sm text-center">
                      <h3 className="text-xl lg:text-2xl font-bold text-indigo-900 mb-6">
                        {t["shield.guardianAlertPrompt"] ? t["shield.guardianAlertPrompt"].replace("{name}", user.guardianName) : `Alert ${user.guardianName} about this?`}
                      </h3>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => setAlertGuardianPrompt('yes')} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm">{t["common.yes"]}</button>
                        <button onClick={() => setAlertGuardianPrompt('no')} className="px-8 py-3.5 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors shadow-sm">{t["common.no"]}</button>
                      </div>
                    </div>
                  ) : alertGuardianPrompt === 'yes' ? (
                    <div className="bg-indigo-50 border-2 border-indigo-500 p-6 lg:p-8 rounded-xl shadow-sm animate-in slide-in-from-top-2 fade-in duration-200">
                      <h3 className="text-xl lg:text-2xl font-bold text-indigo-900 mb-2">
                        {t["shield.guardianAlertReady"] ? t["shield.guardianAlertReady"].replace("{name}", user.guardianName) : `Alert ${user.guardianName}`}
                      </h3>
                      <p className="text-indigo-800 text-sm lg:text-base mb-6 font-medium">
                        {t["shield.guardianAlertDesc"] || "Tap the button below to send an emergency alert via SMS or WhatsApp. The message is pre-filled, but you must hit send."}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a 
                          href={`sms:+91${user.guardianMobile}?body=${encodeURIComponent(t["shield.guardianAlertMessage"] || "URGENT: I'm dealing with a suspected scam call right now (possible digital arrest fraud). I have NOT sent any money. Please call me immediately if you can.")}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-4 font-bold rounded-lg shadow-sm transition-colors text-lg"
                        >
                          Send via SMS
                        </a>
                        <a 
                          href={`https://wa.me/91${user.guardianMobile}?text=${encodeURIComponent(t["shield.guardianAlertMessage"] || "URGENT: I'm dealing with a suspected scam call right now (possible digital arrest fraud). I have NOT sent any money. Please call me immediately if you can.")}`}
                          target="_blank" rel="noreferrer"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-4 font-bold rounded-lg shadow-sm transition-colors text-lg"
                        >
                          Send via WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Evidence Completeness & Generate Report - High Risk */}
              {result.verdict === 'HIGH_RISK' && (
                <div className="col-span-1 md:col-span-2 bg-white p-6 lg:p-8 rounded-xl border border-gray-200 shadow-sm mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900 text-lg lg:text-xl">{t["shield.evidenceTitle"]}</h4>
                    <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full whitespace-nowrap">
                      {Object.values(evidenceChecked).filter(Boolean).length} {t["shield.ofCompleted"]}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">{t["shield.evidenceDesc"]}</p>
                  
                  <div className="space-y-4 mb-8">
                    {['screenshot', 'phone', 'time', 'transaction', 'notDeleted', 'notTold'].map((key) => (
                      <label key={key} className="flex items-start space-x-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border-2 rounded shrink-0 transition-colors border-gray-300 group-hover:border-[#1E3A8A]">
                          <input 
                            type="checkbox" 
                            className="absolute opacity-0 w-full h-full cursor-pointer"
                            checked={evidenceChecked[key]}
                            onChange={(e) => setEvidenceChecked(prev => ({ ...prev, [key]: e.target.checked }))}
                          />
                          {evidenceChecked[key] && <div className="w-2.5 h-2.5 bg-[#1E3A8A] rounded-sm" />}
                        </div>
                        <span className="text-sm lg:text-base text-gray-700 select-none group-hover:text-gray-900 font-medium">
                          {t[`shield.evidence_${key}`]}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">{t["shield.legalAction"]}</h4>
                    <p className="text-gray-600 text-sm mb-4">{t["shield.legalActionDesc"]}</p>
                    <button 
                      onClick={handleGenerateReport}
                      className="w-full flex items-center justify-center py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-lg transition-colors shadow-sm text-lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {t["shield.downloadPDF"]}
                    </button>
                  </div>
                </div>
              )}

              {/* Generate Report - Only for Uncertain */}
              {result.verdict === 'UNCERTAIN' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-center shadow-sm">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">{t["shield.legalAction"]}</h4>
                  <p className="text-gray-600 text-sm mb-4">{t["shield.legalActionDesc"]}</p>
                  <button 
                    onClick={handleGenerateReport}
                    className="w-full flex items-center justify-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors border border-gray-300 shadow-sm"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {t["shield.downloadPDF"]}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
