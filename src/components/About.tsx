import { useState, useEffect } from 'react';
import { ArrowDown, Cpu, ShieldAlert, Brain, Calculator, FileText, Download, Target, Network, Map, Activity, Shield, Flame } from 'lucide-react';
import { fetchPulseStats, type PulseStats } from '../lib/api';
import { TRANSLATIONS } from '../lib/translations';

interface AboutProps {
  language: string;
}

export default function About({ language }: AboutProps) {
  const [stats, setStats] = useState<PulseStats | null>(null);
  const [loading, setLoading] = useState(true);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    fetchPulseStats()
      .then(res => {
        if (res.success) {
          setStats(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const LOCALIZED_PIPELINE: Record<string, Array<{ name: string; desc: string }>> = {
    en: [
      { name: "On-Device Privacy Filter", desc: "Xenova/all-MiniLM-L6-v2 embedding cosine similarity check." },
      { name: "Rule-Based Red Flags", desc: "Deterministic matching for known scam terminology." },
      { name: "Cloud LLM Reasoning", desc: "Few-shot prompting over a structured 8-point scam taxonomy." },
      { name: "Risk Scoring", desc: "Evidence-weighted severity aggregation." },
      { name: "Plain-Language Explanation", desc: "Translating AI output into actionable citizen advisories." },
      { name: "NCRP Report Generation", desc: "Audit-ready PDF generation for law enforcement." }
    ],
    hi: [
      { name: "ऑन-डिवाइस प्राइवेसी फ़िल्टर", desc: "Xenova/all-MiniLM-L6-v2 एम्बेडिंग कोसाइन सिमिलैरिटी जांच।" },
      { name: "नियम-आधारित रेड फ्लैग्स", desc: "जानी-मानी घोटाला शब्दावली के लिए निर्धारित मिलान।" },
      { name: "क्लाउड एलएलएम रीजनिंग", desc: "एक संरचित 8-बिंदु घोटाला वर्गीकरण पर फ़्यू-शॉट प्रॉम्प्टिंग।" },
      { name: "जोखिम स्कोरिंग", desc: "साक्ष्य-भारित गंभीरता एकत्रीकरण।" },
      { name: "सरल भाषा में व्याख्या", desc: "एआई आउटपुट को नागरिकों के लिए उपयोगी सलाह में बदलना।" },
      { name: "एनसीआरपी रिपोर्ट जनरेशन", desc: "कानून प्रवर्तन के लिए ऑडिट-तैयार पीडीएफ रिपोर्ट बनाना।" }
    ],
    ta: [
      { name: "சாதனத்தின் தனியுரிமை வடிகட்டி", desc: "Xenova/all-MiniLM-L6-v2 உட்பொதிவு கோசைன் ஒத்தத்தன்மை சரிபார்ப்பு." },
      { name: "விதி அடிப்படையிலான சிவப்பு எச்சரிக்கைகள்", desc: "அறியப்பட்ட மோசடி சொற்களுக்கான திட்டவட்டமான பொருத்தம்." },
      { name: "கிளவுட் எல்எல்எம் பகுப்பாய்வு", desc: "8-புள்ளி மோசடி கட்டமைப்பின் கீழ் மேம்பட்ட மொழி மாதிரியின் பகுப்பாய்வு." },
      { name: "ஆபத்து மதிப்பீடு", desc: "ஆதாரங்களின் அடிப்படையிலான தீவிரத்தன்மை மதிப்பீடு." },
      { name: "எளிய மொழி விளக்கம்", desc: "AI முடிவுகளை குடிமக்களுக்கான எளிய ஆலோசனையாக மாற்றுதல்." },
      { name: "NCRP அறிக்கை உருவாக்கம்", desc: "சட்ட அமலாக்கத்திற்கான தணிக்கைக்குத் தயாரான PDF உருவாக்கம்." }
    ],
    kn: [
      { name: "ಸಾಧನದಲ್ಲೇ ಗೌಪ್ಯತೆ ಫಿಲ್ಟರ್", desc: "Xenova/all-MiniLM-L6-v2 ಎಂಬೆಡಿಂಗ್ ಕೊಸೈನ್ ಹೋಲಿಕೆ ತಪಾಸಣೆ." },
      { name: "ನಿಯಮ ಆಧಾರಿತ ರೆಡ್ ಫ್ಲ್ಯಾಗ್ಸ್", desc: "ತಿಳಿದಿರುವ ವಂಚನೆ ಪದಗಳಿಗಾಗಿ ನಿಖರವಾದ ಹೊಂದಾಣಿಕೆ." },
      { name: "ಕ್ಲೌಡ್ ಎಲ್‌ಎಲ್‌ಎಮ್ ವಿಶ್ಲೇಷಣೆ", desc: "8-ಅಂಶದ ವಂಚನೆ ವರ್ಗೀಕರಣದ ಅಡಿಯಲ್ಲಿ ಸುಧಾರಿತ ಭಾಷಾ ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ." },
      { name: "ಅಪಾಯದ ಅಂಕಗಳಿಕೆ", desc: "ಆಧಾರಗಳ ತೂಕದ ಆಧಾರದ ಮೇಲೆ ತೀವ್ರತೆಯ ಕ್ರೋಡೀಕರಣ." },
      { name: "ಸರಳ ಭಾಷೆಯ ವಿವರಣೆ", desc: "AI ತೀರ್ಪನ್ನು ನಾಗರಿಕರಿಗೆ ತಿಳಿಯುವ ಸಲಹೆಗಳಾಗಿ ಪರಿವರ್ತಿಸುವುದು." },
      { name: "NCRP ವರದಿ ಸೃಷ್ಟಿ", desc: "ಕಾನೂನು ಜಾರಿಗಾಗಿ ಸಿದ್ಧಪಡಿಸಿದ ಆಡಿಟ್ ವರದಿ PDF ಸೃಷ್ಟಿ." }
    ],
    te: [
      { name: "డివైస్ గోప్యతా ఫిల్టర్", desc: "Xenova/all-MiniLM-L6-v2 ఎంబెడ్డింగ్ కొసైన్ సిమిలారిటీ తనిఖీ." },
      { name: "నియమ ఆధారిత రెడ్ ఫ్లాగ్స్", desc: "తెలిసిన మోసపూరిత పదాల కోసం ఖచ్చితమైన సరిపోలిక." },
      { name: "క్లౌడ్ ఎల్‌ఎల్‌ఎమ్ విశ్లేషణ", desc: "8-పాయింట్ మోసపూరిత వర్గీకరణ ఆధారంగా సుదీర్ఘ విశ్లేషణ." },
      { name: "ప్రమాద తీవ్రత అంచనా", desc: "ఆధారాల బరువు ఆధారంగా ప్రమాద తీవ్రతను లెక్కించడం." },
      { name: "సరళమైన భాషా వివరణ", desc: "AI అవుట్‌పుట్‌ను పౌరులకు ఉపయోగపడే సలహాలుగా మార్చడం." },
      { name: "NCRP నివేదిక రూపకల్పన", desc: "పోలీసుల కోసం ఆడిట్-సిద్ధంగా ఉన్న PDF నివేదిక రూపకల్పన." }
    ]
  };

  const LOCALIZED_ROADMAP: Record<string, Array<{ name: string; desc: string }>> = {
    en: [
      { name: "Counterfeit Currency Detection", desc: "Mobile-deployable computer vision for microprint and UV feature analysis across all denominations." },
      { name: "Fraud Network Graph Intelligence", desc: "Clustering victim reports, scammer infrastructure, and mule networks into actionable legal intelligence." },
      { name: "Geospatial Crime Mapping", desc: "Mapping cybercrime hotspots for patrol prioritization and inter-district intelligence sharing." }
    ],
    hi: [
      { name: "जाली मुद्रा की पहचान", desc: "सभी संप्रदायों में माइक्रोप्रिंट और यूवी विशेषता विश्लेषण के लिए मोबाइल-तैनाती योग्य कंप्यूटर विज़न।" },
      { name: "धोखाधड़ी नेटवर्क ग्राफ़ इंटेलिजेंस", desc: "पीड़ितों की रिपोर्ट, स्कैमर के बुनियादी ढांचे और खच्चर (mule) नेटवर्क को कानूनी खुफिया जानकारी में एकीकृत करना।" },
      { name: "भौगोलिक अपराध मैपिंग", desc: "गश्त प्राथमिकता और अंतर-जिला खुफिया जानकारी साझा करने के लिए साइबर अपराध हॉटस्पॉट का मानचित्रण करना।" }
    ],
    ta: [
      { name: "கள்ள ரூபாய் நோட்டு கண்டறிதல்", desc: "நுண்ணிய அச்சு மற்றும் புற ஊதா (UV) அம்சங்களை பகுப்பாய்வு செய்வதற்கான மொபைல் கணினி பார்வை தொழில்நுட்பம்." },
      { name: "மோசடி நெட்வொர்க் வரைபட நுண்ணறிவு", desc: "பாதிக்கப்பட்டவர்களின் புகார்கள், மோசடி செய்பவர்களின் உட்கட்டமைப்பு மற்றும் முள் (mule) நெட்வொர்க்குகளை ஒருங்கிணைந்த சட்ட நுண்ணறிவாக மாற்றுதல்." },
      { name: "புவியியல் குற்ற வரைபடம்", desc: "ரோந்து முன்னுరిமை மற்றும் மாவட்டங்களுக்கு இடையேயான உளவுத்துறை பகிர்வுக்காக சைபர் குற்றங்கள் அதிகம் நடக்கும் இடங்களை வரைபடமாக்குதல்." }
    ],
    kn: [
      { name: "ನಕಲಿ ನೋಟು ಪತ್ತೆ ಹಚ್ಚುವಿಕೆ", desc: "ಎಲ್ಲಾ ಮುಖಬೆಲೆಯ ನೋಟುಗಳ ಸೂಕ್ಷ್ಮ ಮುದ್ರಣ ಮತ್ತು ಯುವಿ (UV) ವೈಶಿಷ್ಟ್ಯಗಳ ವಿಶ್ಲೇಷಣೆಗಾಗಿ ಮೊಬೈಲ್ ಕಂಪ್ಯೂಟರ್ ದೃಷ್ಟಿ ತಂತ್ರಜ್ಞಾನ." },
      { name: "ವಂಚನೆ ಜಾಲದ ಗ್ರಾಫ್ ಇಂಟೆಲಿಜೆನ್ಸ್", desc: "ಸಂತ್ರಸ್ತರ ವರದಿಗಳು, ವಂಚಕರ ಮೂಲಸೌಕರ್ಯ ಮತ್ತು ಮ್ಯೂಲ್ (mule) ಜಾಲಗಳನ್ನು ಕ್ರಿಯಾತ್ಮక ಕಾನೂನು ಇಂಟೆಲಿಜೆನ್ಸ್ ಆಗಿ ಸಂಘಟಿಸುವುದು." },
      { name: "ಭೌಗೋಳಿಕ ಅಪರಾಧ ಮ್ಯಾಪಿಂಗ್", desc: "ಗಸ್ತು ಆದ್ಯತೆ ಮತ್ತು ಜಿಲ್ಲೆಗಳ ನಡುವೆ ಮಾಹಿತಿ ವಿನಿಮಯಕ್ಕಾಗಿ ಸೈಬರ್ ಅಪರಾಧದ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳನ್ನು ನಕ್ಷೆ ಮಾಡುವುದು." }
    ],
    te: [
      { name: "నకిలీ కరెన్సీ గుర్తింపు", desc: "అన్ని ముఖవిలువల కరెన్సీల మైక్రోప్రింట్ మరియు UV ఫీచర్ల విశ్లేషణ కోసం మొబైల్ కంప్యూటర్ విజన్ సాంకేతికత." },
      { name: "మోసపూరిత నెట్‌వర్క్ గ్రాఫ్ ఇంటెలిజెన్స్", desc: "బాధితుల నివేదికలు, మోసగాళ్ల మౌలిక సదుపాయాలు మరియు మ్యూల్ (mule) నెట్‌వర్క్‌లను సమన్వయం చేసి చట్టపరమైన ఇంటెలిజెన్స్‌గా మార్చడం." },
      { name: "భౌగోళిక నేర మ్యాపింగ్", desc: "గస్తీ ప్రాధాన్యత మరియు జిల్లాల మధ్య సమాచార మార్పిడి కోసం సైబర్ నేరాల హాట్‌స్పాట్‌లను మ్యాప్ చేయడం." }
    ]
  };

  const pipe = LOCALIZED_PIPELINE[language] || LOCALIZED_PIPELINE.en;
  const road = LOCALIZED_ROADMAP[language] || LOCALIZED_ROADMAP.en;

  const pipelineIcons = [Cpu, ShieldAlert, Brain, Calculator, FileText, Download];
  const roadmapIcons = [Target, Network, Map];

  // Helper to format date
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isFreshState = !stats || (stats.totalChecksToday === 0 && stats.activeCampaigns === 0);

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-12">
      
      {/* Live National Pulse */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#1E3A8A] mb-4">
          <Activity className="w-4 h-4 animate-pulse text-[#1E3A8A]" />
          <span>{t["about.pulseTitle"]}</span>
        </div>
        
        {loading ? (
          <div className="text-center py-6 text-gray-500 text-sm font-medium">
            {t["about.pulseFetching"]}
          </div>
        ) : isFreshState ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 text-gray-500 font-medium">
            {t["about.pulseFresh"]}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start text-gray-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">{t["about.pulseChecks"]}</span>
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-gray-900">{stats.totalChecksToday}</span>
                <span className="block text-[10px] text-gray-400 mt-1">{t["about.pulseChecksDesc"]}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start text-gray-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">{t["about.pulseDeviceVsCloud"]}</span>
                <Cpu className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-gray-900">
                  {stats.onDeviceCount} <span className="text-xs text-gray-400 font-normal">vs</span> {stats.cloudCount}
                </span>
                <span className="block text-[10px] text-gray-400 mt-1">{t["about.pulseDeviceVsCloudDesc"]}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start text-gray-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">{t["about.pulseGenomes"]}</span>
                <Network className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-gray-900">{stats.activeCampaigns}</span>
                <span className="block text-[10px] text-gray-400 mt-1">{t["about.pulseGenomesDesc"]}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start text-gray-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">{t["about.pulseLastHit"]}</span>
                <Flame className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-gray-900">{formatTime(stats.mostRecentHighRiskTime)}</span>
                <span className="block text-[10px] text-gray-400 mt-1">{t["about.pulseLastHitDesc"]}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Architecture Section */}
      <section>
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t["about.title"]}</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t["about.subtitle"]}
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {pipe.map((step, idx) => {
            const Icon = pipelineIcons[idx] || Cpu;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 text-[#1E3A8A] rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{step.name}</h3>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </div>
                </div>
                
                {idx < pipe.length - 1 && (
                  <div className="py-2 text-gray-300">
                    <ArrowDown className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="border-t border-gray-200 pt-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t["about.roadmapTitle"]}</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t["about.roadmapSubtitle"]}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {road.map((item, idx) => {
            const Icon = roadmapIcons[idx] || Target;
            return (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-6 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-not-allowed">
                <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
                <div className="mt-4 inline-block px-2.5 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded uppercase tracking-wider">
                  {t["about.devBadge"]}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
