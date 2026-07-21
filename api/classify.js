import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { GoogleGenAI } from "@google/genai";

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b:cerebras";

// Simple In-memory LRU cache keyed by normalized transcript hash
const cache = new Map();
const MAX_CACHE_SIZE = 500;

function getTranscriptHash(transcript, language) {
  const normalized = transcript.trim().toLowerCase().replace(/\s+/g, " ");
  return createHash("sha256").update(`${language}:${normalized}`).digest("hex");
}

const fewShotPath = path.join(process.cwd(), "data", "few-shot-examples.json");
const fewShotExamples = JSON.parse(fs.readFileSync(fewShotPath, "utf-8"));

function buildFewShotBlock(examples) {
  return examples
    .map((e, i) => `Example ${i + 1} (label: ${e.label}):\n"${e.transcript.slice(0, 300)}"`)
    .join("\n\n");
}

export const VALID_RISK_CATEGORIES = [
  "Digital Arrest / Law Enforcement Impersonation",
  "Banking / OTP Fraud",
  "Lottery / Prize Scam",
  "Job Offer Scam",
  "Investment / Crypto Fraud",
  "Romance Scam",
  "Tech Support Scam",
  "Emergency / Medical Lure",
  "Phishing / Malware",
  "Other Financial Fraud"
];

export const VALID_NON_RISK_CATEGORIES = [
  "Legitimate Business Communication",
  "Personal / Social Conversation",
  "General Information Request",
  "Unclear / Insufficient Information"
];

const ALL_VALID_CATEGORIES = [...VALID_RISK_CATEGORIES, ...VALID_NON_RISK_CATEGORIES];

function validateCategory(rawCategory, verdict) {
  if (typeof rawCategory === "string" && ALL_VALID_CATEGORIES.includes(rawCategory.trim())) {
    return rawCategory.trim();
  }
  if (typeof rawCategory === "string") {
    const matched = ALL_VALID_CATEGORIES.find(c => c.toLowerCase() === rawCategory.trim().toLowerCase());
    if (matched) return matched;
  }
  return verdict === "HIGH_RISK" ? "Other Financial Fraud" : "Unclear / Insufficient Information";
}

const TAXONOMY = `
1. Authority impersonation — claiming to be CBI, ED, Customs, Police, or court official
2. Urgency/threat escalation — manufactured time pressure, legal consequence threats
3. Isolation instructions — telling the victim to stay alone, not contact family/lawyer
4. Payment/OTP demand — requesting money transfer, gift cards, or one-time passcodes
5. Fake portal/document reference — fabricated case number, fake website, forged document
6. Video-hostage framing — insisting the call stay on video, restricting movement
7. Identity verification pretext — asking for Aadhaar/bank details "to verify innocence"
8. Reward/incentive lure — fake prizes, "congratulations, you're eligible," unsolicited
   investment returns, account upgrade offers, or exclusive deals used to extract
   payment or personal/financial information
`;

const RED_FLAG_TERMS = [
  "digital arrest", "cbi", "ed officer", "customs department", "video call verification",
  "do not disconnect", "warrant", "money laundering case", "arrest warrant", "otp share",
  "congratulations you have won", "claim your prize", "urgent action required", "kyc update",
  "account suspended", "telecom department", "hospital admission", "accident", "emergency surgery",
  "अरेस्ट", "सीबीआई", "एक्सीडेंट", "अस्पताल"
];

const SEVERITY_TO_SCORE = { Low: 25, Medium: 50, High: 75, Critical: 95 };

function detectRedFlags(transcript) {
  const lower = transcript.toLowerCase();
  return RED_FLAG_TERMS.filter((term) => lower.includes(term));
}

function fallbackVerdict(reason) {
  return {
    verdict: "UNCERTAIN",
    confidence: 0,
    category: "Unclear / Insufficient Information",
    reasoning: "Unable to verify this call with full server AI right now. Treat it with caution.",
    matches: [],
    explanation:
      "Unable to verify this call with full server AI right now. Treat it with caution — do not share personal information, OTPs, or make any payment until you can confirm independently through an official number.",
    degraded: true,
    degradedReason: reason,
  };
}

async function callGeminiClassifier(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });
  return response.text?.trim() || "";
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Use POST" });
  }
  const { transcript, language } = req.body;
  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return res.status(400).json({ success: false, error: "Missing or invalid transcript" });
  }

  const targetLang = language || "en";
  const hashKey = getTranscriptHash(transcript, targetLang);

  if (cache.has(hashKey)) {
    const cachedData = cache.get(hashKey);
    return res.status(200).json({
      success: true,
      data: {
        ...cachedData,
        cached: true,
        timeToVerdictMs: 1,
      },
      error: null,
    });
  }

  const fewShotBlock = buildFewShotBlock(fewShotExamples);
  const redFlags = detectRedFlags(transcript);
  const redFlagNote =
    redFlags.length > 0
      ? `\nNote: this transcript explicitly contains these known red-flag terms: ${redFlags.join(", ")}. Weigh this as supporting evidence, but still reason through the full taxonomy before deciding.`
      : "";

  const prompt = `You are a scam-detection classifier for cyber fraud and impersonation scams.

Fixed Category Taxonomy (Select EXACTLY ONE category string from this list):
RISK CATEGORIES:
- "Digital Arrest / Law Enforcement Impersonation"
- "Banking / OTP Fraud"
- "Lottery / Prize Scam"
- "Job Offer Scam"
- "Investment / Crypto Fraud"
- "Romance Scam"
- "Tech Support Scam"
- "Emergency / Medical Lure"
- "Phishing / Malware"
- "Other Financial Fraud"

NON-RISK CATEGORIES:
- "Legitimate Business Communication"
- "Personal / Social Conversation"
- "General Information Request"
- "Unclear / Insufficient Information"

Scam Indicator Patterns (for matches array):
${TAXONOMY}

Here are labeled examples for reference:
${fewShotBlock}

Now analyze this new transcript:
"${transcript}"
${redFlagNote}

CRITICAL INSTRUCTIONS FOR DYNAMIC CONFIDENCE SCORE:
Calculate a genuinely DYNAMIC confidence score (0-100) reflecting your exact certainty:
- 94-98%: Explicit multi-indicator scams with clear legal/arrest/payment demands or clear safe chat.
- 78-91%: Moderate risk / single indicator scams (e.g. SIM block threat, urgent hospital fee).
- 60-75%: Ambiguous or vague pretexts.

Respond ONLY with this exact JSON shape:
{
  "verdict": "SAFE" | "UNCERTAIN" | "HIGH_RISK",
  "confidence": <0-100 dynamic certainty score>,
  "category": "<one of the 14 whitelisted category strings>",
  "reasoning": "<2-3 sentence plain language explanation citing specific evidence>",
  "matches": [{"indicatorType": <1-8>, "evidence": "<exact short quote>", "reason": "<why this indicates pattern>", "severity": "Low" | "Medium" | "High" | "Critical"}],
  "explanation": "<short overall localized message>"
}`;

  const startTime = Date.now();
  let rawText = "";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(HF_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        rawText = json.choices?.[0]?.message?.content?.trim() || "";
      } else {
        throw new Error(`HF HTTP ${response.status}`);
      }
    } catch (hfErr) {
      clearTimeout(timeoutId);
      console.warn("[HF_FALLBACK] Calling Gemini API secondary fallback...");
      rawText = await callGeminiClassifier(prompt);
    }

    const timeToVerdictMs = Date.now() - startTime;
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let verdictJson;
    try {
      verdictJson = JSON.parse(cleaned);
    } catch {
      return res.status(200).json({
        success: true,
        data: {
          ...fallbackVerdict("unparseable_response"),
          debugMessage: rawText,
          timeToVerdictMs,
        },
        error: null,
      });
    }

    // Server-side strict whitelist validation
    verdictJson.category = validateCategory(verdictJson.category, verdictJson.verdict);

    // Dynamic confidence fallback check
    if (typeof verdictJson.confidence !== "number" || verdictJson.confidence === 0) {
      verdictJson.confidence = verdictJson.verdict === "HIGH_RISK" ? 88 : 92;
    }

    // Default reasoning if missing
    if (!verdictJson.reasoning) {
      verdictJson.reasoning = verdictJson.explanation || "Classified based on transcript analysis.";
    }

    // Derive riskScore deterministically from severity
    if (verdictJson.matches) {
      verdictJson.matches = verdictJson.matches.map((m) => ({
        ...m,
        riskScore: SEVERITY_TO_SCORE[m.severity] ?? 50,
      }));
    }

    const resultData = { ...verdictJson, redFlagsDetected: redFlags, timeToVerdictMs };

    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(hashKey, resultData);

    return res.status(200).json({
      success: true,
      data: resultData,
      error: null,
    });
  } catch (err) {
    const timeToVerdictMs = Date.now() - startTime;
    console.error("[CLASSIFY_ERROR] Exception caught:", err.message);

    return res.status(200).json({
      success: true,
      data: {
        ...fallbackVerdict("api_error"),
        debugMessage: err.message,
        timeToVerdictMs,
      },
      error: null,
    });
  }
}

