import fs from "fs";
import path from "path";

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

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b:cerebras";

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

const PROMPT_TEMPLATE = (transcript) => `You are a scam-detection classifier for cyber fraud and impersonation scams.

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

CRITICAL INSTRUCTIONS FOR DYNAMIC CONFIDENCE:
Calculate a genuinely dynamic confidence score (0-100) based on certainty and ambiguity:
- 92-100%: Explicit multi-indicator scams with unambiguous key terms (e.g. CBI, digital arrest, money transfer).
- 75-91%: Moderate risk / single indicator scams (e.g. SIM block threat, urgent accident fee).
- 60-74%: Ambiguous / vague pretexts.
- 90-100%: Completely normal safe personal conversation or clear business alert.

Respond ONLY with this exact JSON shape:
{
  "verdict": "SAFE" | "UNCERTAIN" | "HIGH_RISK",
  "confidence": <0-100 dynamic certainty score>,
  "category": "<one of the 14 whitelisted category strings>",
  "reasoning": "<2-3 sentence plain language explanation>",
  "matches": [{"indicatorType": <1-8>, "evidence": "<exact quote>", "reason": "<why this indicates pattern>", "severity": "Low" | "Medium" | "High" | "Critical"}],
  "explanation": "<short overall localized message>"
}`;

async function run() {
  console.log("=== RAW LLM RESPONSE INSPECTION ===\n");

  for (const t of TEST_TRANSCRIPTS) {
    console.log(`\n--- [${t.name}] ---`);
    console.log(`Input Text: "${t.text}"`);

    const response = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: PROMPT_TEMPLATE(t.text) }],
        temperature: 0.2,
      }),
    });

    console.log(`HTTP Status: ${response.status}`);
    const json = await response.json();
    console.log("FULL JSON OBJECT:");
    console.log(JSON.stringify(json, null, 2));
  }
}

run().catch(console.error);
