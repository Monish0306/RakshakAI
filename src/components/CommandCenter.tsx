import { useState, useEffect, useRef } from 'react';
import { fetchCampaigns, type Campaign } from '../lib/api';
import { Shield, Users, Calendar, ArrowRight, AlertTriangle, RefreshCw, Layers, Download, CheckCircle2, XCircle, UploadCloud, AlertCircle, Loader2, FileText, Search } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';
import { cn } from '../lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  "1": "Authority Impersonation",
  "2": "Urgency/Threat Escalation",
  "3": "Isolation Instructions",
  "4": "Payment/OTP Demand",
  "5": "Fake Portal/Document Reference",
  "6": "Video-Hostage Framing",
  "7": "Identity Verification Pretext",
  "8": "Reward/Incentive Lure"
};

interface CommandCenterProps {
  language: string;
}

export default function CommandCenter({ language }: CommandCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'evidence'>('queue');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  const [verifyMode, setVerifyMode] = useState<'upload' | 'manual'>('upload');
  const [verifySessionId, setVerifySessionId] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'verified' | 'tampered' | 'not_found' | 'error';
    message?: string;
    details?: any;
  }>({ status: 'idle' });
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const calculateSHA256 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleVerify = async (sessionId: string, hashToCompare: string) => {
    if (!sessionId.trim()) {
      setVerificationResult({
        status: 'error',
        message: 'Please enter a valid Complaint Reference ID.'
      });
      return;
    }

    setVerifying(true);
    setVerificationResult({ status: 'idle' });

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      const q = query(collection(db, "citizenReports"), where("sessionId", "==", sessionId.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setVerificationResult({
          status: 'not_found',
          message: `No matching record found for Reference ID: ${sessionId}.`
        });
        return;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      // Recalculate deterministic hash
      const coreData = JSON.stringify({
        transcript: data.transcript,
        verdict: data.verdict,
        timestamp: data.timestamp,
        matches: data.matches || [],
      });

      const fullHash = await calculateSHA256(coreData);
      const calculatedShortHash = fullHash.substring(0, 16);

      const cleanCompareHash = hashToCompare.replace(/\.\.\./g, '').trim();

      if (calculatedShortHash === cleanCompareHash) {
        setVerificationResult({
          status: 'verified',
          message: 'Report integrity verified successfully. Document matches database record exactly.',
          details: {
            id: data.sessionId,
            timestamp: data.timestamp,
            verdict: data.verdict,
            confidence: data.confidence,
            caseStatus: data.caseStatus || 'pending',
            assignedOfficer: data.assignedOfficer || 'Unassigned',
            recoveryPercent: data.recoveryPercent
          }
        });
      } else {
        setVerificationResult({
          status: 'tampered',
          message: `Hash mismatch! The PDF report hash (${cleanCompareHash}) does not match the database integrity hash (${calculatedShortHash}). The document content may have been altered.`,
          details: {
            id: data.sessionId,
            dbHash: calculatedShortHash,
            pdfHash: cleanCompareHash
          }
        });
      }
    } catch (err: any) {
      console.error(err);
      setVerificationResult({
        status: 'error',
        message: `Verification failed: ${err.message || 'Unknown database error'}`
      });
    } finally {
      setVerifying(false);
    }
  };

  const processPDFFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Invalid file format. Please upload a PDF report.');
      return;
    }

    setFileError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const content = reader.result as string;

        const sessionIdMatch = content.match(/RKSH-\d+-[a-z0-9]+/);
        const hashMatch = content.match(/Integrity Hash \\\(SHA-256\\\):\s*([a-f0-9]+)/i);

        if (!sessionIdMatch) {
          setFileError('Could not locate a valid Complaint Reference ID in the PDF metadata. Ensure this is an authentic Rakshak AI report.');
          return;
        }

        const extractedSessionId = sessionIdMatch[0];
        const extractedHash = hashMatch ? hashMatch[1] : '';

        setVerifySessionId(extractedSessionId);
        setVerifyHash(extractedHash);

        await handleVerify(extractedSessionId, extractedHash);
      } catch (err: any) {
        console.error(err);
        setFileError('Failed to read the PDF file contents.');
      }
    };
    reader.readAsText(file);
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const formatDetectionLeadTime = (milliseconds: number) => {
    const totalMinutes = Math.floor(milliseconds / 60000);
    if (totalMinutes < 1) return t["command.lessThanMinute"];

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (hours) parts.push(`${hours} ${t[hours === 1 ? "command.hour" : "command.hours"]}`);
    if (minutes) parts.push(`${minutes} ${t[minutes === 1 ? "command.minute" : "command.minutes"]}`);
    return parts.join(' ');
  };

  const getCategoryLabel = (catNum: string | number) => {
    const labels: Record<string, Record<string, string>> = {
      en: CATEGORY_LABELS,
      hi: {
        "1": "अधिकारी का स्वांग रचना",
        "2": "जल्दबाजी/खतरे को बढ़ाना",
        "3": "अलगाव के निर्देश",
        "4": "भुगतान/ओटीपी की मांग",
        "5": "फर्जी पोर्टल/दस्तावेज़ संदर्भ",
        "6": "वीडियो-बंधक बनाना",
        "7": "पहचान सत्यापन का बहाना",
        "8": "पुरस्कार/प्रलोभन का लालच"
      },
      ta: {
        "1": "அதிகாரியைப் போல நடித்தல்",
        "2": "அவசரம்/அச்சுறுத்தலை அதிகரித்தல்",
        "3": "தனிமைப்படுத்துவதற்கான அறிவுறுத்தல்கள்",
        "4": "பணம்/OTP கோருதல்",
        "5": "போலி போர்டல்/ஆவணக் குறிப்பு",
        "6": "வீடியோ-பிணை கைதி கட்டமைப்பு",
        "7": "அடையாள சரிபார்ப்பு சாக்கு",
        "8": "விருது/ஊக்கத்தொகை தூண்டில்"
      },
      kn: {
        "1": "ಅಧಿಕಾರಿಯಂತೆ ನಟಿಸುವುದು",
        "2": "ತುರ್ತು/ಬೆದರಿಕೆಯನ್ನು ಹೆಚ್ಚಿಸುವುದು",
        "3": "ಪ್ರತ್ಯೇಕವಾಗಿರಲು ಸೂಚನೆಗಳು",
        "4": "ಪಾವತಿ/OTP ಗಾಗಿ ಬೇಡಿಕೆ",
        "5": "ನಕಲಿ ಪೋರ್ಟಲ್/ದಾಖಲೆ ಉಲ್ಲೇಖ",
        "6": "ವಿಡಿಯೋ-ಬಂಧನ ರೂಪಿಸುವುದು",
        "7": "ಗುರುತು ಪರಿಶೀಲನೆಯ ನೆಪ",
        "8": "ಪ್ರಶಸ್ತಿ/ಪ್ರಲೋಭನೆಯ ಆಮಿಷ"
      },
      te: {
        "1": "అధికార ప్రతినిధిగా నటించడం",
        "2": "అత్యవసరం/బెదిరింపులను పెంచడం",
        "3": "ఐసోలేషన్ సూచనలు",
        "4": "చెల్లింపు/OTP డిమాండ్",
        "5": "నకిలీ పోర్టల్/డాక్యుమెంట్ ప్రస్తావన",
        "6": "వీడియో-హోస్టేజ్ ఫ్రేమింగ్",
        "7": "గుర్తింపు ధృవీకరణ సాకు",
        "8": "బహుమతి/ప్రోత్సాహక ఎర"
      }
    };
    const langLabels = labels[language] || labels.en;
    const catStr = String(catNum);
    return langLabels[catStr] || `Pattern ${catStr}`;
  };

  const exportCampaignToCSV = (e: React.MouseEvent, campaign: Campaign) => {
    e.stopPropagation();
    const headers = ["Campaign ID", "Session ID", "Timestamp", "Verdict", "Confidence", "Dominant Category", "Transcript"];
    const rows = campaign.reports.map(r => [
      campaign.campaignId,
      r.sessionId,
      r.timestamp,
      r.verdict,
      `${r.confidence}%`,
      getCategoryLabel(campaign.dominantCategory),
      `"${r.transcript.trim().replace(/\r?\n\s*\r?\n/g, '\n').replace(/"/g, '""')}"`
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${campaign.campaignId}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCampaigns();
      if (res.success) {
        setCampaigns(res.data);
      } else {
        setError(res.error || "Failed to load campaigns.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while fetching campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'queue') {
      loadCampaigns();
    }
  }, [activeSubTab]);

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1.5 flex items-center">
            <span className="h-2 w-2 rounded-full bg-[#1E3A8A] mr-2"></span>
            {t["command.eyebrow"]}
          </div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A]">{t["command.title"]}</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            {t["command.subtitle"]}
          </p>
        </div>

        {/* Sub-navigation */}
        <div className="flex space-x-2 mt-4 md:mt-0 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'queue'
                ? 'bg-white text-[#1E3A8A] shadow-sm'
                : 'text-gray-600 hover:text-[#1E3A8A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t["command.tabQueue"]}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('evidence')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'evidence'
                ? 'bg-white text-[#1E3A8A] shadow-sm'
                : 'text-gray-600 hover:text-[#1E3A8A]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t["command.tabEvidence"]}</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{t["command.feedTitle"]}</h2>
            <button
              onClick={loadCampaigns}
              disabled={loading}
              className="flex items-center space-x-2 bg-white border border-gray-200 hover:border-[#1E3A8A] text-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t["command.feedRefresh"]}</span>
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin mb-4" />
              <p className="text-gray-600 text-sm font-medium">{t["command.feedLoading"]}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-xl shadow-sm text-sm">
              {error}
            </div>
          )}

          {!loading && !error && campaigns.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">{t["command.feedEmpty"]}</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                {t["command.feedEmptyDesc"]}
              </p>
            </div>
          )}

          {!loading && !error && campaigns.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {campaigns.map((c) => {
                const isExpanded = expandedCampaignId === c.campaignId;
                return (
                  <div
                    key={c.campaignId}
                    onClick={() => setExpandedCampaignId(isExpanded ? null : c.campaignId)}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#1E3A8A] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header info */}
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-gray-500 tracking-wider">
                          {c.campaignId}
                        </span>
                        <div className="flex items-center space-x-2">
                          {c.priority && (
                            <span className="bg-red-600 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-ping"></span>
                              {t["command.priorityInvestigation"]}
                            </span>
                          )}
                          <span className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold border border-red-200 flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{c.reportCount} {t["command.reportsCount"]}</span>
                          </span>
                        </div>
                      </div>

                      {/* Scam Category */}
                      <h3 className="text-lg font-extrabold text-[#1E3A8A] mb-3">
                        {getCategoryLabel(c.dominantCategory)}
                      </h3>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4 border-y border-gray-100 py-2.5">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {t["command.first"]} <strong className="text-gray-900">{new Date(c.firstSeen).toLocaleDateString()}</strong>
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {t["command.last"]} <strong className="text-gray-900">{new Date(c.lastSeen).toLocaleDateString()}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#1E3A8A]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{t["command.detectedAfterFirstReport"].replace('{time}', formatDetectionLeadTime(c.detectionLeadTimeMs))}</span>
                      </div>

                      {/* Excerpt */}
                      <div className="text-sm text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100 font-medium">
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                          {t["command.genomeExcerpt"]}
                        </div>
                        <p className={`italic ${isExpanded ? '' : 'line-clamp-2'}`}>
                          "{c.representativeTranscript}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#1E3A8A]">
                      <button
                        onClick={(event) => exportCampaignToCSV(event, c)}
                        className="flex items-center space-x-1.5 text-gray-500 hover:text-[#1E3A8A] bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t["command.exportCase"]}</span>
                      </button>
                      <div className="flex items-center">
                        <span>{isExpanded ? t["command.collapse"] : t["command.expand"]}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5 animate-pulse" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'evidence' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-100 mb-2 font-serif">{t["command.verificationTitle"]}</h2>
            <p className="text-sm text-gray-600 dark:text-slate-450">
              {t["command.verificationSubtitle"]}
            </p>
          </div>

          {/* Mode switch */}
          <div className="flex bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800 max-w-sm">
            <button
              onClick={() => {
                setVerifyMode('upload');
                setVerificationResult({ status: 'idle' });
                setFileError(null);
              }}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                verifyMode === 'upload' ? "bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-[#1E3A8A]"
              )}
            >
              Upload PDF Report
            </button>
            <button
              onClick={() => {
                setVerifyMode('manual');
                setVerificationResult({ status: 'idle' });
                setFileError(null);
              }}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                verifyMode === 'manual' ? "bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-[#1E3A8A]"
              )}
            >
              Manual Key Entry
            </button>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-6 space-y-4">
              {verifyMode === 'upload' ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processPDFFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 min-h-[220px]",
                    dragActive 
                      ? "border-[#1E3A8A] bg-blue-50/20" 
                      : "border-gray-200 dark:border-slate-800 hover:border-[#1E3A8A] hover:bg-slate-50/50 dark:hover:bg-slate-950"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processPDFFile(file);
                    }}
                  />
                  <UploadCloud className="w-10 h-10 text-indigo-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Drag & drop report PDF file here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse local files</p>
                  </div>
                  <div className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-550 px-2 py-0.5 rounded font-bold uppercase tracking-wider">PDF format only</div>
                </div>
              ) : (
                <div className="space-y-4 border border-gray-200 dark:border-slate-850 p-5 rounded-2xl bg-gray-50/30 dark:bg-slate-950/20">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-750 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-405" />
                      Complaint Reference ID
                    </label>
                    <input
                      type="text"
                      value={verifySessionId}
                      onChange={(e) => setVerifySessionId(e.target.value)}
                      placeholder="e.g. RKSH-1784717903815-u6vwy0"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-[#1E3A8A] transition-colors text-gray-800 dark:text-slate-200 placeholder-gray-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-750 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-gray-450" />
                      Integrity Hash (SHA-256)
                    </label>
                    <input
                      type="text"
                      value={verifyHash}
                      onChange={(e) => setVerifyHash(e.target.value)}
                      placeholder="e.g. 23eaae3b3501935c"
                      maxLength={16}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-[#1E3A8A] transition-colors text-gray-800 dark:text-slate-200 placeholder-gray-400"
                    />
                  </div>

                  <button
                    onClick={() => handleVerify(verifySessionId, verifyHash)}
                    disabled={verifying || !verifySessionId.trim() || !verifyHash.trim()}
                    className="w-full py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    Verify Report Integrity
                  </button>
                </div>
              )}

              {fileError && (
                <div className="bg-amber-50 dark:bg-slate-950 border border-amber-200 dark:border-slate-850 p-4 rounded-xl text-xs text-amber-800 flex items-start gap-2 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="md:col-span-6 flex flex-col justify-center min-h-[220px]">
              {verifying ? (
                <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-slate-100">Verifying Integrity Signature</h4>
                    <p className="text-xs text-gray-400 mt-1">Checking secure ledger index and running hash confirmation...</p>
                  </div>
                </div>
              ) : verificationResult.status === 'verified' ? (
                <div className="border border-emerald-250 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-400 font-serif">Document Authenticated</h3>
                      <p className="text-xs text-emerald-800 dark:text-emerald-500 font-medium">{verificationResult.message}</p>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200/50 dark:border-emerald-900/30 pt-4 grid grid-cols-2 gap-y-4 gap-x-2 text-xs font-medium">
                    <div>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-550 block mb-0.5">Reference ID</span>
                      <strong className="text-gray-900 dark:text-slate-200 font-mono">{verificationResult.details?.id}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-550 block mb-0.5">AI Verdict</span>
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]",
                        verificationResult.details?.verdict === 'HIGH_RISK' ? "bg-red-100 text-red-700" :
                        verificationResult.details?.verdict === 'SAFE' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {verificationResult.details?.verdict}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-550 block mb-0.5">Incident Time</span>
                      <span className="text-gray-800 dark:text-slate-350">{new Date(verificationResult.details?.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-550 block mb-0.5">Chain of Custody</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">SECURE & UNALTERED</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-550 block mb-0.5">Case Status</span>
                      <span className="text-gray-800 dark:text-slate-350 capitalize">{verificationResult.details?.caseStatus}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-550 block mb-0.5">Assigned Officer</span>
                      <span className="text-gray-800 dark:text-slate-350">{verificationResult.details?.assignedOfficer}</span>
                    </div>
                  </div>
                </div>
              ) : verificationResult.status === 'tampered' ? (
                <div className="border border-red-200 dark:border-red-950 bg-red-50/30 dark:bg-red-950/10 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-8 h-8 text-red-650 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-bold text-red-950 dark:text-red-400 font-serif">Integrity Verification Failed</h3>
                      <p className="text-xs text-red-800 dark:text-red-500 font-medium">{verificationResult.message}</p>
                    </div>
                  </div>

                  <div className="border-t border-red-200/50 dark:border-red-900/30 pt-4 space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-red-700/70 dark:text-red-500/50 uppercase tracking-widest block mb-0.5">Reference ID</span>
                      <strong className="text-gray-900 dark:text-slate-200 font-mono">{verificationResult.details?.id}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[9px] text-gray-400 block mb-0.5 font-sans uppercase">Database Hash</span>
                        <span className="text-emerald-700 dark:text-emerald-500 font-bold">{verificationResult.details?.dbHash}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block mb-0.5 font-sans uppercase">Uploaded Hash</span>
                        <span className="text-red-650 dark:text-red-550 font-bold">{verificationResult.details?.pdfHash}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : verificationResult.status === 'not_found' ? (
                <div className="border border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-955/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px] animate-in zoom-in-95 duration-200">
                  <AlertCircle className="w-10 h-10 text-amber-500 animate-bounce" />
                  <div>
                    <h3 className="text-base font-bold text-gray-950 dark:text-slate-100 font-serif">Reference Case Not Found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mt-1">{verificationResult.message}</p>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-8 text-center text-gray-550 dark:text-slate-500 font-semibold text-sm flex flex-col items-center justify-center min-h-[220px]">
                  <FileText className="w-8 h-8 text-gray-300 dark:text-slate-800 mb-2 animate-pulse" />
                  <p>Awaiting report selection or key entry</p>
                  <p className="text-[10px] font-normal text-gray-450 max-w-xs mt-1">Upload a citizen-generated PDF report or enter its integrity fields manually to verify chain of custody.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
