const API_BASE = ""; // same domain now, no base URL needed

export interface ClassificationMatch {
  indicatorType?: number;
  category?: number; // legacy alias
  evidence: string;
  reason: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  riskScore: number;
}

export interface ClassificationResponse {
  success: boolean;
  data: {
    verdict: "SAFE" | "UNCERTAIN" | "HIGH_RISK";
    confidence: number;
    category?: string;
    reasoning?: string;
    matches: ClassificationMatch[];
    explanation: string;
    redFlagsDetected: string[];
    timeToVerdictMs: number;
    ranOnDevice?: boolean;
    verificationStatus?: "quick_check" | "ai_verified" | "degraded";
    degraded?: boolean;
    degradedReason?: string;
    cached?: boolean;
    matchCount?: number;
    campaignId?: string | null;
  };
  error: string | null;
}

export interface AdvisoryResponse {
  success: boolean;
  data: {
    text: string;
    lang: string;
  };
  error: string | null;
}

export async function classifyTranscript(transcript: string, language: string): Promise<ClassificationResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
  try {
    const res = await fetch(`${API_BASE}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, language }),
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Failed to load: Server returned a non-JSON response.");
    }
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function getAdvisory(verdict: string, lang: string = "en"): Promise<AdvisoryResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const res = await fetch(`${API_BASE}/api/advisory?verdict=${verdict}&lang=${lang}`, {
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Failed to load: Server returned a non-JSON response.");
    }
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export interface CampaignMatchResponse {
  success: boolean;
  data: {
    matchCount: number;
    campaignId: string | null;
  };
  error: string | null;
}

export async function matchCampaign(transcriptEmbedding: number[], sessionData: any, sessionId: string): Promise<CampaignMatchResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
  try {
    const res = await fetch(`${API_BASE}/api/campaign-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcriptEmbedding, sessionData, sessionId }),
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Failed to load: Server returned a non-JSON response.");
    }
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export interface CampaignReport {
  sessionId: string;
  timestamp: string;
  transcript: string;
  verdict: string;
  confidence: number;
}

export interface Campaign {
  campaignId: string;
  reportCount: number;
  firstSeen: string;
  lastSeen: string;
  detectionLeadTimeMs: number;
  representativeTranscript: string;
  dominantCategory: string;
  priority: boolean;
  reports: CampaignReport[];
}

export interface CampaignListResponse {
  success: boolean;
  data: Campaign[];
  error: string | null;
}

export async function fetchCampaigns(): Promise<CampaignListResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
  try {
    const res = await fetch(`${API_BASE}/api/campaign-list`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Failed to load campaigns: API route is not resolving correctly (received non-JSON response).");
    }
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export interface PulseStats {
  totalChecksToday: number;
  onDeviceCount: number;
  cloudCount: number;
  activeCampaigns: number;
  mostRecentHighRiskTime: string | null;
}

export interface PulseStatsResponse {
  success: boolean;
  data: PulseStats;
  error: string | null;
}

export async function fetchPulseStats(): Promise<PulseStatsResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
  try {
    const res = await fetch(`${API_BASE}/api/pulse-stats`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Failed to load stats: Server returned a non-JSON response.");
    }
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function recordTelemetry(outcome: "on-device" | "cloud"): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome })
    });
  } catch (err) {
    console.warn("Failed to record telemetry", err);
  }
}

export interface ImageAnalysisResponse {
  success: boolean;
  data: {
    isRelevant: boolean;
    detectedType: string;
    description: string;
    extractedText: string;
    degraded?: boolean;
    degradedReason?: string;
    timeToAnalyzeMs?: number;
  };
  error: string | null;
}

export async function analyzeImage(imageBase64: string, mimeType: string): Promise<ImageAnalysisResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 12000); // 12s client timeout

  try {
    const res = await fetch(`${API_BASE}/api/analyze-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export interface TranscribeAudioResponse {
  success: boolean;
  transcript: string;
  timeToTranscribeMs?: number;
  error?: string | null;
}

export async function transcribeAudio(audioBase64: string, mimeType: string, language: string): Promise<TranscribeAudioResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 20000); // 20s client timeout for audio

  try {
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: audioBase64, mimeType, language }),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}
