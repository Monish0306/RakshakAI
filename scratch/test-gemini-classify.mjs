import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// Auto-load .env and .env.local
const rootDir = process.cwd();
[".env", ".env.local"].forEach((file) => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        process.env[match[1]] = match[2].trim();
      }
    });
  }
});

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const TEST_TRANSCRIPTS = [
  {
    id: 1,
    name: "ID 1 — High-Risk Digital Arrest",
    text: "Hello, this is Inspector Sharma from the CBI. We have intercepted a package in your name containing illegal passports. You are under digital arrest and must remain on this video call. Do not disconnect or a warrant will be issued immediately. For verification of your innocence, transfer a refundable deposit of Rs. 50,000 to the RBI secure account."
  },
  {
    id: 3,
    name: "ID 3 — Medium-Risk Telecom SIM Block Threat",
    text: "Your mobile number will be blocked within 2 hours due to illegal activities reported against your SIM. Press 9 to speak with telecom department officer."
  },
  {
    id: 5,
    name: "ID 5 — Courier PIN / Flipkart Delivery",
    text: "Hi, your Flipkart order delivery agent is at your door. Please share the 4-digit PIN sent to your phone to accept the package."
  },
  {
    id: 9,
    name: "ID 9 — Borderline Emergency Hospital Lure",
    text: "Hello uncle, I am friend of your son. He got into an accident in college and urgently needs 10000 rupees for hospital admission."
  }
];

const PROMPT_TEMPLATE = (transcriptText) => `You are an expert scam-detection classifier for cyber fraud and impersonation scams in India.

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

CRITICAL INSTRUCTIONS FOR DYNAMIC CONFIDENCE SCORE:
Calculate a genuinely DYNAMIC confidence score (0-100) reflecting your exact certainty:
- 94-98%: Explicit multi-indicator scams with unambiguous legal/arrest/payment demands.
- 78-91%: Single indicator / moderate risk scams (e.g. SIM block threat, urgent hospital fee).
- 60-75%: Ambiguous / vague pretexts.
- 92-98%: Legitimate business notifications (e.g. valid delivery OTP requests) or personal social conversation.

Analyze this transcript carefully:
"${transcriptText}"

Respond ONLY with this exact JSON shape:
{
  "verdict": "SAFE" | "UNCERTAIN" | "HIGH_RISK",
  "confidence": <0-100 dynamic certainty score>,
  "category": "<one of the 14 whitelisted category strings>",
  "reasoning": "<2-3 sentence plain language explanation citing specific evidence>",
  "matches": [{"indicatorType": <1-8>, "evidence": "<exact quote>", "reason": "<why this indicates pattern>", "severity": "Low" | "Medium" | "High" | "Critical"}],
  "explanation": "<short overall localized message>"
}`;

async function run() {
  console.log("=== GEMINI RAW LLM CLASSIFICATION TEST ===\n");

  for (const t of TEST_TRANSCRIPTS) {
    console.log(`\n======================================================`);
    console.log(`[${t.name}]`);
    console.log(`Input Text: "${t.text}"`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: PROMPT_TEMPLATE(t.text) }] }],
      config: { responseMimeType: "application/json" }
    });

    const rawText = response.text?.trim() || "";
    console.log(`\nRAW LLM OUTPUT:\n${rawText}`);
  }
}

run().catch(console.error);
