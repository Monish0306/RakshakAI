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

import handler from "../api/classify.js";

const TEST_TRANSCRIPTS = [
  {
    id: 1,
    type: "High-Risk Digital Arrest",
    lang: "en",
    text: "Hello, this is Inspector Sharma from the CBI. We have intercepted a package in your name containing illegal passports. You are under digital arrest and must remain on this video call. Do not disconnect or a warrant will be issued immediately. For verification of your innocence, transfer a refundable deposit of Rs. 50,000 to the RBI secure account."
  },
  {
    id: 2,
    type: "High-Risk Prize / Reward Lure",
    lang: "en",
    text: "Congratulations, you have won 25 lakh rupees in KBC lucky draw! To claim your cash prize immediately, pay a processing fee of Rs. 5,000 to this UPI ID."
  },
  {
    id: 3,
    type: "Medium-Risk Telecom SIM Block Threat",
    lang: "en",
    text: "Your mobile number will be blocked within 2 hours due to illegal activities reported against your SIM. Press 9 to speak with telecom department officer."
  },
  {
    id: 4,
    type: "Medium-Risk Bank Pretext",
    lang: "en",
    text: "Sir your account ending in 4092 is suspended due to missing KYC update. Click the link sent on SMS to update your Aadhaar and PAN immediately."
  },
  {
    id: 5,
    type: "Safe Legitimate Delivery",
    lang: "en",
    text: "Hi, your Flipkart order delivery agent is at your door. Please share the 4-digit PIN sent to your phone to accept the package."
  },
  {
    id: 6,
    type: "Safe Casual Chat",
    lang: "en",
    text: "Hey, are we still meeting for lunch today at 1:30 PM? Let me know if you want to invite Rahul as well."
  },
  {
    id: 7,
    type: "Multilingual Hindi Scam (Digital Arrest)",
    lang: "hi",
    text: "नमस्ते, मैं सीबीआई पुलिस अफसर बोल रहा हूँ। आपके आधार कार्ड से अवैध सामान मिला है। आप डिजिटल अरेस्ट में हैं, फोन मत काटिए।"
  },
  {
    id: 8,
    type: "Multilingual Hinglish Scam",
    lang: "en",
    text: "Aapka courier hold par hai CBI inquiry ke wajah se. Instantly fine pay karein varna arrest warrant ready hai."
  },
  {
    id: 9,
    type: "Borderline Emergency Hospital Lure",
    lang: "en",
    text: "Hello uncle, I am friend of your son. He got into an accident in college and urgently needs 10000 rupees for hospital admission."
  },
  {
    id: 10,
    type: "Safe Bank Transaction Alert",
    lang: "en",
    text: "Dear Customer, Rs 450.00 debited from A/C XX1049 on 21-Jul-26 towards SWIGGY. If not done by you, report to bank customer care."
  }
];

class MockRes {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this._data = null;
  }
  setHeader(k, v) { this.headers[k] = v; }
  status(code) { this.statusCode = code; return this; }
  json(data) { this._data = data; return this; }
  end() { return this; }
}

async function run() {
  console.log("=== RUNNING CATEGORY CLASSIFICATION & REASONING BENCHMARK ===\n");
  console.log(`HF_API_TOKEN loaded: ${process.env.HF_API_TOKEN ? "YES (" + process.env.HF_API_TOKEN.slice(0, 7) + "...)" : "NO"}\n`);

  for (const item of TEST_TRANSCRIPTS) {
    const req = {
      method: "POST",
      body: { transcript: item.text, language: item.lang }
    };
    const res = new MockRes();

    await handler(req, res);
    const output = res._data?.data || {};

    console.log(`[ID ${item.id}] ${item.type} (Lang: ${item.lang})`);
    console.log(`  - Verdict:     ${output.verdict} (Confidence: ${output.confidence}%)`);
    console.log(`  - Category:    ${output.category}`);
    console.log(`  - Reasoning:   "${output.reasoning}"`);
    console.log(`  - Explanation: "${output.explanation}"`);
    console.log(`----------------------------------------------------------------------\n`);
  }
}

run().catch(console.error);
