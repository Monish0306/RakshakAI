import fs from "fs";
import path from "path";

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b:cerebras";

const fewShotPath = path.join(process.cwd(), "data", "few-shot-examples.json");
const fewShotExamples = JSON.parse(fs.readFileSync(fewShotPath, "utf-8"));

function buildFewShotBlock(examples) {
  return examples
    .map((e, i) => `Example ${i + 1} (label: ${e.label}):\n"${e.transcript.slice(0, 300)}"`)
    .join("\n\n");
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
  "congratulations you have won", "claim your prize", "urgent action required",
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
    matches: [],
    explanation:
      "Unable to verify this call right now. Treat it with caution — do not share personal information, OTPs, or make any payment until you can confirm independently through an official number.",
    degraded: true,
    degradedReason: reason,
  };
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
  const fewShotBlock = buildFewShotBlock(fewShotExamples);
  const redFlags = detectRedFlags(transcript);
  const redFlagNote =
    redFlags.length > 0
      ? `\nNote: this transcript explicitly contains these known red-flag terms: ${redFlags.join(", ")}. Weigh this as supporting evidence, but still reason through the full taxonomy before deciding.`
      : "";

  const prompt = `You are a scam-detection classifier for Indian "digital arrest" and impersonation scams.

Taxonomy of scam patterns:
${TAXONOMY}

Here are labeled examples for reference:
${fewShotBlock}

Now analyze this new transcript. Think step by step through each of the 8 taxonomy categories, noting which ones (if any) are present. Then give a final verdict.

Transcript to analyze:
"${transcript}"
${redFlagNote}

CRITICAL LOCALIZATION REQUIREMENT:
You MUST write the "explanation" string and the "reason" string for each matched category in the target language: "${targetLang}" (e.g. Hindi, Tamil, Kannada, Telugu, or English).
- For Hindi (hi): Use Hindi language written in Devanagari script.
- For Tamil (ta): Use Tamil language written in Tamil script.
- For Kannada (kn): Use Kannada language written in Kannada script.
- For Telugu (te): Use Telugu language written in Telugu script.
- For English (en): Use English.
Note: The "verdict" and "severity" field values MUST remain in English uppercase/titlecase (e.g. "SAFE", "HIGH_RISK", "Critical", etc.). The "evidence" field must be the exact quote matching the transcript.

Respond ONLY with this exact JSON shape, no markdown, no extra text, no explanation outside the JSON:
{"verdict": "SAFE" | "UNCERTAIN" | "HIGH_RISK", "confidence": <0-100>, "matches": [{"category": <number>, "evidence": "<exact short quote>", "reason": "<why this indicates the category, written in the target language>", "severity": "Low" | "Medium" | "High" | "Critical"}], "explanation": "<short overall reason, written in the target language>"}`;

  const startTime = Date.now();

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
    });

    const timeToVerdictMs = Date.now() - startTime;
    const json = await response.json();
    const rawText = json.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let verdictJson;
    try {
      verdictJson = JSON.parse(cleaned);
    } catch {
      return res.status(200).json({
        success: true,
        data: {
          ...fallbackVerdict("unparseable_response"),
          rawResponse: json,
          debugMessage: rawText,
          timeToVerdictMs,
        },
        error: null,
      });
    }

    // Derive riskScore deterministically from severity — never let the model invent both
    if (verdictJson.matches) {
      verdictJson.matches = verdictJson.matches.map((m) => ({
        ...m,
        riskScore: SEVERITY_TO_SCORE[m.severity] ?? 50,
      }));
    }

    return res.status(200).json({
      success: true,
      data: { ...verdictJson, redFlagsDetected: redFlags, timeToVerdictMs },
      error: null,
    });
  } catch (err) {
    const timeToVerdictMs = Date.now() - startTime;
    return res.status(200).json({
      success: true,
      data: { ...fallbackVerdict("hf_error"), debugMessage: err.message, timeToVerdictMs },
      error: null,
    });
  }
}