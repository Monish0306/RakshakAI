import { pipeline, cos_sim, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.allowRemoteModels = true;

const REFERENCE_SENTENCES = [
  "This is an officer from CBI, ED, or Customs calling about a case against you",
  "You are under digital arrest and must stay on video call",
  "Transfer money immediately or a warrant will be issued",
  "Do not tell anyone about this call, it is confidential",
  "Provide your Aadhaar or bank details to verify your identity",
  "Congratulations, you have won a prize, claim it now",
  // New emergency / medical / accident / SIM block reference sentences:
  "Your relative or child was in an urgent accident and needs money for emergency hospital treatment",
  "Your son or daughter has been arrested or hospitalized, send money immediately",
  "Urgent emergency medical funds required right now, do not contact family",
  "Your mobile number will be disconnected due to illegal SIM activities"
];

const RED_FLAG_TERMS = [
  "digital arrest", "cbi", "ed officer", "customs department", "video call verification",
  "do not disconnect", "warrant", "money laundering case", "arrest warrant", "otp share",
  "congratulations you have won", "claim your prize", "urgent action required", "kyc update",
  "account suspended", "telecom department", "hospital admission", "accident", "emergency surgery",
  "अरेस्ट", "सीबीआई", "एक्सीडेंट", "अस्पताल"
];

const TEST_TRANSCRIPTS = [
  {
    id: 1,
    type: "High-Risk Digital Arrest",
    text: "Hello, this is Inspector Sharma from the CBI. We have intercepted a package in your name containing illegal passports. You are under digital arrest and must remain on this video call. Do not disconnect or a warrant will be issued immediately. For verification of your innocence, transfer a refundable deposit of Rs. 50,000 to the RBI secure account."
  },
  {
    id: 2,
    type: "High-Risk Prize / Reward Lure",
    text: "Congratulations, you have won 25 lakh rupees in KBC lucky draw! To claim your cash prize immediately, pay a processing fee of Rs. 5,000 to this UPI ID."
  },
  {
    id: 3,
    type: "Medium-Risk / Vague Pressure",
    text: "Your mobile number will be blocked within 2 hours due to illegal activities reported against your SIM. Press 9 to speak with telecom department officer."
  },
  {
    id: 4,
    type: "Medium-Risk Bank Pretext",
    text: "Sir your account ending in 4092 is suspended due to missing KYC update. Click the link sent on SMS to update your Aadhaar and PAN immediately."
  },
  {
    id: 5,
    type: "Safe Legitimate Delivery",
    text: "Hi, your Flipkart order delivery agent is at your door. Please share the 4-digit PIN sent to your phone to accept the package."
  },
  {
    id: 6,
    type: "Safe Casual Chat",
    text: "Hey, are we still meeting for lunch today at 1:30 PM? Let me know if you want to invite Rahul as well."
  },
  {
    id: 7,
    type: "Multilingual Hindi Scam (Digital Arrest)",
    text: "नमस्ते, मैं सीबीआई पुलिस अफसर बोल रहा हूँ। आपके आधार कार्ड से अवैध सामान मिला है। आप डिजिटल अरेस्ट में हैं, फोन मत काटिए।"
  },
  {
    id: 8,
    type: "Multilingual Hinglish Scam",
    text: "Aapka courier hold par hai CBI inquiry ke wajah se. Instantly fine pay karein varna arrest warrant ready hai."
  },
  {
    id: 9,
    type: "Borderline Emergency Hospital Lure",
    text: "Hello uncle, I am friend of your son. He got into an accident in college and urgently needs 10000 rupees for hospital admission."
  },
  {
    id: 10,
    type: "Safe Bank Transaction Alert",
    text: "Dear Customer, Rs 450.00 debited from A/C XX1049 on 21-Jul-26 towards SWIGGY. If not done by you, report to bank customer care."
  }
];

function detectRedFlags(transcript) {
  const lower = transcript.toLowerCase();
  return RED_FLAG_TERMS.filter((term) => lower.includes(term));
}

async function run() {
  console.log("Loading Xenova/all-MiniLM-L6-v2...");
  const model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  const refEmbeddings = await Promise.all(
    REFERENCE_SENTENCES.map(async (s) => {
      const output = await model(s, { pooling: "mean", normalize: true });
      return output.data;
    })
  );

  console.log("\n--- RE-EVALUATED RESULTS WITH EXPANDED REFERENCES & ASYNC SAFETY NET ---");
  for (const t of TEST_TRANSCRIPTS) {
    const output = await model(t.text, { pooling: "mean", normalize: true });
    const emb = output.data;
    const sims = refEmbeddings.map((ref) => cos_sim(emb, ref));
    const maxSim = Math.max(...sims);
    const bestMatchIdx = sims.indexOf(maxSim);
    const flags = detectRedFlags(t.text);

    let bucket = "";
    let asyncVerification = false;

    if (flags.length >= 2 || maxSim >= 0.50) {
      bucket = "Instant HIGH_RISK";
      asyncVerification = true;
    } else if (flags.length === 0 && maxSim < 0.15) {
      bucket = "Instant Deep SAFE (No LLM)";
      asyncVerification = false;
    } else if (flags.length === 0 && maxSim >= 0.15 && maxSim < 0.25) {
      bucket = "Instant Shallow SAFE (with Async LLM Safety Net)";
      asyncVerification = true;
    } else {
      bucket = "Escalate to LLM (Stage 2 Ambiguous)";
      asyncVerification = true;
    }

    console.log(`[ID ${t.id}] ${t.type}`);
    console.log(`     MaxSim: ${maxSim.toFixed(4)} (Best ref #${bestMatchIdx + 1}) | RedFlags: [${flags.join(", ")}]`);
    console.log(`     => Bucket: ${bucket}`);
    console.log(`     => Async Verification Fired?: ${asyncVerification ? "YES" : "NO"}\n`);
  }
}

run().catch(console.error);
