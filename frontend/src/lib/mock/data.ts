// Mock data for the Digital Public Safety Intelligence prototype.
// Everything here is fictional and generated for demo purposes only.

export const STATS = {
  scamsBlocked: 1_284_573,
  activeDigitalArrestSessions: 47,
  ficnSeized: 2_341,
  fraudRingsMapped: 189,
  citizensProtected: 47_820_193,
  moneySavedCr: 1876,
};

export const scamCategories = [
  { name: "Digital Arrest", value: 34, color: "var(--destructive)" },
  { name: "UPI Fraud", value: 27, color: "var(--warning)" },
  { name: "Investment Scam", value: 18, color: "var(--info)" },
  { name: "KYC / Bank OTP", value: 12, color: "var(--navy)" },
  { name: "Job / Task", value: 9, color: "var(--success)" },
];

export const weeklyThreatSeries = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  detections: 340 + Math.round(Math.sin(i / 2) * 90 + i * 12 + Math.random() * 40),
  blocks: 210 + Math.round(Math.cos(i / 2) * 60 + i * 8 + Math.random() * 30),
}));

export type Incident = {
  id: string;
  time: string;
  type: string;
  channel: "call" | "sms" | "whatsapp" | "email" | "web" | "upi";
  origin: string;
  target: string;
  risk: number;
  status: "active" | "contained" | "escalated" | "closed";
  amount?: number;
};

export const incidents: Incident[] = [
  { id: "INC-2025-088412", time: "just now",   type: "Digital Arrest (CBI impersonation)", channel: "call",     origin: "+91-8712-XXXXXX", target: "Bengaluru, KA",  risk: 94, status: "active",    amount: 480000 },
  { id: "INC-2025-088411", time: "2m ago",     type: "UPI collect-request fraud",           channel: "upi",      origin: "vpa:rahul@axl",    target: "Pune, MH",       risk: 87, status: "active",    amount: 24999 },
  { id: "INC-2025-088410", time: "6m ago",     type: "Fake courier / FedEx parcel scam",    channel: "whatsapp", origin: "+91-9021-XXXXXX", target: "Kolkata, WB",    risk: 78, status: "contained", amount: 12500 },
  { id: "INC-2025-088404", time: "18m ago",    type: "Deepfake voice (family emergency)",   channel: "call",     origin: "+91-7688-XXXXXX", target: "Chennai, TN",    risk: 91, status: "escalated", amount: 210000 },
  { id: "INC-2025-088397", time: "34m ago",    type: "Investment (Telegram pump)",          channel: "web",      origin: "t.me/nifty_signals", target: "Ahmedabad, GJ", risk: 62, status: "contained" },
  { id: "INC-2025-088388", time: "1h ago",     type: "KYC re-verify SMS",                   channel: "sms",      origin: "VM-SBIUPD",       target: "Lucknow, UP",    risk: 55, status: "closed",    amount: 8900 },
  { id: "INC-2025-088375", time: "1h ago",     type: "Fake police FIR PDF",                 channel: "email",    origin: "cybercrime@gov-in.co", target: "Jaipur, RJ", risk: 71, status: "active",    amount: 0 },
  { id: "INC-2025-088352", time: "2h ago",     type: "Digital Arrest (ED impersonation)",   channel: "call",     origin: "+91-9932-XXXXXX", target: "Hyderabad, TS",  risk: 96, status: "escalated", amount: 1250000 },
];

export const trendingScripts = [
  { title: "\"Aapke Aadhaar se ek parcel pakda gaya hai...\"", channel: "WhatsApp call", uses: 4218, delta: "+38%" },
  { title: "\"Sir, main CBI Mumbai se Officer Sharma bol raha hoon\"", channel: "Voice call", uses: 3120, delta: "+27%" },
  { title: "\"KYC pending — 24 ghante mein account block ho jayega\"", channel: "SMS", uses: 2870, delta: "+12%" },
  { title: "\"Nifty guaranteed 3x — VIP group free join\"", channel: "Telegram", uses: 2104, delta: "+9%" },
  { title: "\"Ola/Uber task complete karke ₹500 kamayein\"", channel: "WhatsApp", uses: 1988, delta: "-4%" },
];

export type Investigation = {
  id: string;
  title: string;
  lead: string;
  agency: string;
  status: "open" | "under_review" | "court_ready" | "closed";
  severity: "critical" | "high" | "medium" | "low";
  updated: string;
  victims: number;
  loss: number;
  scamType: string;
  district: string;
  state: string;
};

export const investigations: Investigation[] = [
  { id: "CB-2025-0142", title: "Op. Nightshade — cross-border digital arrest ring", lead: "Insp. R. Kulkarni", agency: "MH Cyber Cell",   status: "under_review", severity: "critical", updated: "12m", victims: 143, loss: 87_500_000, scamType: "Digital Arrest", district: "Pune", state: "Maharashtra" },
  { id: "CB-2025-0139", title: "FICN circulation — Rs 500 series 4KA",              lead: "SI M. Banerjee",   agency: "WB CID",          status: "open",         severity: "high",     updated: "1h",  victims: 0,   loss: 3_240_000,  scamType: "Counterfeit",    district: "Malda",  state: "West Bengal" },
  { id: "CB-2025-0128", title: "Mule cluster — Jamtara 47 accounts",                lead: "Insp. A. Sinha",   agency: "JH Cyber",        status: "court_ready",  severity: "high",     updated: "3h",  victims: 89,  loss: 41_200_000, scamType: "UPI Fraud",       district: "Jamtara", state: "Jharkhand" },
  { id: "CB-2025-0117", title: "Fake IRCTC refund portal",                          lead: "ASI P. Nair",      agency: "KL Cyberdome",    status: "open",         severity: "medium",   updated: "5h",  victims: 214, loss: 6_800_000,  scamType: "Phishing",        district: "Kochi",  state: "Kerala" },
  { id: "CB-2025-0104", title: "Deepfake CFO — corporate wire fraud",               lead: "DySP S. Iyer",     agency: "KA CID",          status: "under_review", severity: "critical", updated: "8h",  victims: 3,   loss: 128_000_000,scamType: "Deepfake",        district: "Bengaluru Urban", state: "Karnataka" },
  { id: "CB-2025-0091", title: "Investment ring — Telegram \"Nifty VIP\"",          lead: "Insp. V. Rao",     agency: "TS CCS",          status: "open",         severity: "medium",   updated: "1d",  victims: 512, loss: 22_600_000, scamType: "Investment",      district: "Hyderabad", state: "Telangana" },
  { id: "CB-2025-0080", title: "Job task scam — WhatsApp cluster",                  lead: "SI D. Shah",       agency: "GJ Cyber",        status: "closed",       severity: "low",      updated: "3d",  victims: 71,  loss: 1_900_000,  scamType: "Task Scam",       district: "Surat",  state: "Gujarat" },
];

export const stateHotspots = [
  { state: "Maharashtra", district: "Pune",          count: 4218, delta: "+18%", tone: "danger"  as const },
  { state: "Karnataka",   district: "Bengaluru Urban", count: 3980, delta: "+22%", tone: "danger" as const },
  { state: "Delhi",       district: "New Delhi",     count: 3411, delta: "+9%",   tone: "warning" as const },
  { state: "Telangana",   district: "Hyderabad",     count: 3122, delta: "+14%",  tone: "warning" as const },
  { state: "West Bengal", district: "Kolkata",       count: 2870, delta: "+6%",   tone: "warning" as const },
  { state: "Tamil Nadu",  district: "Chennai",       count: 2418, delta: "-3%",   tone: "info" as const },
  { state: "Jharkhand",   district: "Jamtara",       count: 2091, delta: "+31%",  tone: "danger" as const },
  { state: "Uttar Pradesh", district: "Lucknow",     count: 1988, delta: "+11%",  tone: "warning" as const },
];

export const modelCards = [
  {
    id: "sd-arrest-v3",
    name: "Digital Arrest Classifier",
    version: "v3.2.1",
    purpose: "Real-time detection of digital arrest scam patterns in calls & chats.",
    accuracy: 96.4,
    fpr: 0.9,
    latencyMs: 84,
    dataset: "182k labelled Indian scam transcripts (12 languages)",
    audit: "2025-09-14 · CDAC & IIT-B fairness review",
    onDevice: true,
  },
  {
    id: "cv-ficn-v2",
    name: "FICN Counterfeit Detector",
    version: "v2.4.0",
    purpose: "Computer vision detection of fake Indian currency across all denominations.",
    accuracy: 98.1,
    fpr: 0.4,
    latencyMs: 220,
    dataset: "RBI-provided reference + 34k field seizure images",
    audit: "2025-08-02 · RBI DPSS",
    onDevice: true,
  },
  {
    id: "nlp-scamdna-v4",
    name: "Scam DNA Extractor",
    version: "v4.0.0",
    purpose: "Extracts scam intent signals (urgency, impersonation, payment demand).",
    accuracy: 94.2,
    fpr: 1.4,
    latencyMs: 60,
    dataset: "410k conversations across 12 Indian languages",
    audit: "2025-10-01 · CERT-In",
    onDevice: true,
  },
  {
    id: "graph-mule-v1",
    name: "Mule Network Graph Model",
    version: "v1.6.3",
    purpose: "Graph clustering of accounts, devices, phone numbers to surface fraud rings.",
    accuracy: 91.7,
    fpr: 2.1,
    latencyMs: 1800,
    dataset: "Anonymised NPCI + banking-consortium transaction metadata",
    audit: "2025-07-19 · NPCI Fraud Analytics",
    onDevice: false,
  },
  {
    id: "speech-spoof-v2",
    name: "AI-Voice / Spoof Detector",
    version: "v2.1.0",
    purpose: "Identifies synthetic speech, voice clones, and known AI-voice signatures.",
    accuracy: 92.8,
    fpr: 1.7,
    latencyMs: 310,
    dataset: "88k real + 60k synthesised voice samples",
    audit: "2025-06-30 · IIIT-H Speech Lab",
    onDevice: false,
  },
];

export const auditLog = [
  { time: "10:41:22", actor: "insp.kulkarni@mh.gov.in", action: "VIEW",     resource: "case/CB-2025-0142", ip: "10.14.22.8", hash: "0x8f22…a91c" },
  { time: "10:40:03", actor: "system",                   action: "AI-INFER", resource: "sd-arrest-v3/req/8821", ip: "-",         hash: "0x1120…f014" },
  { time: "10:38:57", actor: "si.banerjee@wb.gov.in",    action: "EXPORT",   resource: "evidence/EV-58210", ip: "10.14.24.19",  hash: "0x99a1…0182" },
  { time: "10:35:12", actor: "admin@surakshabharat.gov", action: "ROLE-GRANT", resource: "user/dysp.iyer",   ip: "10.14.20.1",   hash: "0xaa04…2019" },
  { time: "10:32:44", actor: "bank.hdfc.ops03",           action: "FLAG",     resource: "vpa/rahul@axl",     ip: "10.99.14.4",   hash: "0x71ee…8842" },
  { time: "10:29:11", actor: "system",                   action: "ALERT-MHA", resource: "cluster/OP-NIGHTSHADE", ip: "-",       hash: "0xfe33…09c1" },
];

export const evidenceItems = [
  { id: "EV-58210", type: "Audio · WAV", case: "CB-2025-0142", captured: "2025-10-12 14:22 IST", size: "4.2 MB", hash: "sha256:0xa8c3…19d2", custody: 3 },
  { id: "EV-58207", type: "Screenshot · PNG", case: "CB-2025-0142", captured: "2025-10-12 14:18 IST", size: "1.1 MB", hash: "sha256:0x11b0…7f42", custody: 3 },
  { id: "EV-58198", type: "Transcript · PDF", case: "CB-2025-0139", captured: "2025-10-12 12:04 IST", size: "212 KB", hash: "sha256:0x2c88…aa04", custody: 2 },
  { id: "EV-58187", type: "Video · MP4", case: "CB-2025-0104", captured: "2025-10-12 09:41 IST", size: "48.6 MB", hash: "sha256:0x9012…f7c8", custody: 4 },
  { id: "EV-58180", type: "Metadata · JSON", case: "CB-2025-0128", captured: "2025-10-12 08:57 IST", size: "18 KB",  hash: "sha256:0xd142…5a90", custody: 5 },
];

export const scamLibrary = [
  { id: "digital-arrest", name: "Digital Arrest", hindi: "डिजिटल अरेस्ट", risk: 96, victims_1yr: 42800, description: "Impersonation of CBI / ED / Customs officers over video call, holding victim in prolonged psychological hostage until money is transferred." },
  { id: "upi-collect",     name: "UPI Collect Request Fraud", hindi: "यूपीआई कलेक्ट फ्रॉड", risk: 82, victims_1yr: 214000, description: "Scammer sends a UPI collect request disguised as a payment; approving it debits the victim's account." },
  { id: "kyc-otp",         name: "KYC / Bank OTP Fraud", hindi: "केवाईसी ओटीपी", risk: 71, victims_1yr: 189000, description: "Fake KYC-expiry SMS or call convinces the victim to share OTP or install a screen-sharing app." },
  { id: "courier-parcel",  name: "Fake Courier / Parcel Scam", hindi: "पार्सल में ड्रग्स स्कैम", risk: 84, victims_1yr: 61200, description: "Caller claims a suspicious parcel in the victim's name is intercepted with drugs; then transfers to fake police." },
  { id: "job-task",        name: "Job / Task Scam", hindi: "टास्क स्कैम", risk: 62, victims_1yr: 96000, description: "Small paid tasks build trust; victim is asked to deposit money into a fake investment platform." },
  { id: "investment-tg",   name: "Investment (Telegram VIP)", hindi: "इन्वेस्टमेंट स्कैम", risk: 74, victims_1yr: 130000, description: "Fake stock/crypto tips group; screenshots of \"profits\" convince victim to fund a bogus trading portal." },
];

// Simulated conversation analysis result
export type ScamDnaSignal = { label: string; strength: number; explain: string };
export type ChatAnalysis = {
  score: number;
  verdict: "safe" | "low" | "suspicious" | "high";
  scamType: string;
  language: string;
  signals: ScamDnaSignal[];
  entities: { type: string; value: string; risk: "low" | "med" | "high" }[];
  timeline: { t: string; step: string; detail: string }[];
  highlights: { span: string; reason: string }[];
};

export const sampleTranscript = `Unknown (+91 87XX XXXXXX): Namaste sir. Main CBI Mumbai se Officer Rajeev Sharma bol raha hoon. Aapke Aadhaar card se ek parcel pakda gaya hai jisme MDMA drugs aur 2 passport hain.

Unknown: Aapke naam pe 27 shikayatein hain. Main abhi aapko digital arrest kar raha hoon. Video call par bane rahiye. Kisi ko batayenge to family ko bhi arrest karenge.

Unknown: Verification ke liye aapko RBI verified account 405218779301 par ₹4,80,000 transfer karna hoga. 2 ghante mein wapas aa jayega. Yeh confidential hai — kisi bank employee ko mat batana.`;

export const sampleAnalysis: ChatAnalysis = {
  score: 96,
  verdict: "high",
  scamType: "Digital Arrest — CBI Impersonation",
  language: "Hindi-Hinglish",
  signals: [
    { label: "Authority impersonation",   strength: 98, explain: "Claims to be a CBI officer with badge/name — pattern matches 4,218 known scripts." },
    { label: "Fabricated legal threat",   strength: 93, explain: "Alleges Aadhaar-linked contraband — no such CBI procedure exists." },
    { label: "Urgency / time pressure",   strength: 89, explain: "\"Digital arrest\" + 2 hour window designed to prevent verification." },
    { label: "Isolation demand",          strength: 91, explain: "\"Don't tell family / bank\" — classic hostage-control pattern." },
    { label: "Payment demand",            strength: 96, explain: "Transfer request to unverified account. RBI never accepts personal transfers." },
    { label: "False reassurance",         strength: 74, explain: "\"Money will return in 2 hours\" — no such refund mechanism exists." },
  ],
  entities: [
    { type: "Phone number", value: "+91 87XX XXXXXX", risk: "high" },
    { type: "Bank account", value: "405218779301",    risk: "high" },
    { type: "Amount",       value: "₹4,80,000",       risk: "high" },
    { type: "Agency name",  value: "CBI Mumbai",      risk: "med" },
  ],
  timeline: [
    { t: "0.02s", step: "Language detection",  detail: "Hindi-Hinglish · confidence 0.98" },
    { t: "0.08s", step: "Intent classification", detail: "authority_impersonation · confidence 0.96" },
    { t: "0.14s", step: "Scam DNA extraction",  detail: "6 signals extracted" },
    { t: "0.21s", step: "Cross-check knowledge base", detail: "Matches script cluster #DA-041 (4,218 uses)" },
    { t: "0.29s", step: "Verdict synthesis",    detail: "HIGH RISK · Digital Arrest" },
    { t: "0.31s", step: "Explainability generated", detail: "6 evidence spans · 4 entities · 2 recommended actions" },
  ],
  highlights: [
    { span: "CBI Mumbai se Officer Rajeev Sharma", reason: "Authority impersonation — CBI does not make cold calls" },
    { span: "digital arrest",                       reason: "\"Digital arrest\" is not a legal procedure anywhere in India" },
    { span: "Kisi ko batayenge to family ko bhi arrest karenge", reason: "Isolation coercion — classic scam pattern" },
    { span: "RBI verified account 405218779301",    reason: "RBI does not hold personal accounts for verification" },
    { span: "2 ghante mein wapas aa jayega",        reason: "False reassurance — no such refund exists" },
  ],
};

export const threatFeed = [
  { time: "10:44", severity: "critical" as const, title: "New digital-arrest script variant detected (Marathi)", detail: "Cluster DA-042 · 34 detections in last 15 min · Pune, Nashik" },
  { time: "10:39", severity: "high"     as const, title: "Fresh mule accounts flagged by 3 banks",              detail: "12 accounts, common device fingerprint · likely Jamtara ring" },
  { time: "10:24", severity: "medium"   as const, title: "Deepfake voice signature (family emergency)",         detail: "17 detections nationwide · voice model \"veena-v2\"" },
  { time: "09:58", severity: "high"     as const, title: "Fake IRCTC refund domain surge",                       detail: "irctc-refund[.]in and 8 typosquats · CERT-In notified" },
  { time: "09:41", severity: "low"      as const, title: "SMS header spoofing attempt (SBI-KYC)",                detail: "DLT header VM-SBIUPD flagged for reuse" },
];
