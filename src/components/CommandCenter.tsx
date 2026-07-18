import { useState, useEffect } from 'react';
import { fetchCampaigns, type Campaign } from '../lib/api';
import { Shield, Users, Calendar, ArrowRight, AlertTriangle, RefreshCw, Layers, Download } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';

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

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t["command.verificationTitle"]}</h2>
          <p className="text-sm text-gray-600 mb-6">
            {t["command.verificationSubtitle"]}
          </p>
          <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 font-medium">
            Form UI implementation in progress...
          </div>
        </div>
      )}
    </div>
  );
}
