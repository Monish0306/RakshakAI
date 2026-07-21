import { pipeline, cos_sim, env } from "@xenova/transformers";

// Force loading models from the Hugging Face CDN, never from a local /models/ path
env.allowLocalModels = false;
env.allowRemoteModels = true;

let embedder = null;
let referenceEmbeddings = null;


const REFERENCE_SENTENCES = [
  "This is an officer from CBI, ED, or Customs calling about a case against you",
  "You are under digital arrest and must stay on video call",
  "Transfer money immediately or a warrant will be issued",
  "Do not tell anyone about this call, it is confidential",
  "Provide your Aadhaar or bank details to verify your identity",
  "Congratulations, you have won a prize, claim it now",
  "Your relative or child was in an urgent accident and needs money for emergency hospital treatment",
  "Your son or daughter has been arrested or hospitalized, send money immediately",
  "Urgent emergency medical funds required right now, do not contact family",
  "Your mobile number will be disconnected due to illegal SIM activities",
];

const RED_FLAG_TERMS = [
  "digital arrest", "cbi", "ed officer", "customs department", "video call verification",
  "do not disconnect", "warrant", "money laundering case", "arrest warrant", "otp share",
  "congratulations you have won", "claim your prize", "urgent action required", "kyc update",
  "account suspended", "telecom department", "hospital admission", "accident", "emergency surgery",
  "अरेस्ट", "सीबीआई", "एक्सीडेंट", "अस्पताल"
];

function detectRedFlags(transcript) {
  const lower = transcript.toLowerCase();
  return RED_FLAG_TERMS.filter((term) => lower.includes(term));
}

// Loads the model once, caches it in the browser after first load
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

async function getReferenceEmbeddings() {
  if (!referenceEmbeddings) {
    const model = await getEmbedder();
    referenceEmbeddings = await Promise.all(
      REFERENCE_SENTENCES.map(async (s) => {
        const output = await model(s, { pooling: "mean", normalize: true });
        return output.data;
      })
    );
  }
  return referenceEmbeddings;
}

export async function checkOnDevice(transcript) {
  const model = await getEmbedder();
  const refs = await getReferenceEmbeddings();

  const output = await model(transcript, { pooling: "mean", normalize: true });
  const transcriptEmbedding = output.data;

  const similarities = refs.map((ref) => cos_sim(transcriptEmbedding, ref));
  const maxSimilarity = Math.max(...similarities);
  const redFlags = detectRedFlags(transcript);

  let bucket = "AMBIGUOUS";
  let escalate = true;
  let needsAsyncCheck = true;

  if (redFlags.length >= 2 || maxSimilarity >= 0.50) {
    bucket = "INSTANT_HIGH_RISK";
    escalate = false; // Fast local resolution
    needsAsyncCheck = true; // Safety net LLM verification in background
  } else if (redFlags.length === 0 && maxSimilarity < 0.15) {
    bucket = "DEEP_SAFE";
    escalate = false; // Resolved on-device
    needsAsyncCheck = false; // Highly confident safe, skip LLM
  } else if (redFlags.length === 0 && maxSimilarity >= 0.15 && maxSimilarity < 0.25) {
    bucket = "SHALLOW_SAFE";
    escalate = false; // Fast local resolution
    needsAsyncCheck = true; // Shallow safe safety net LLM check in background
  } else {
    bucket = "AMBIGUOUS";
    escalate = true; // Escalate immediately to LLM
    needsAsyncCheck = false;
  }

  return {
    bucket,
    escalate,
    needsAsyncCheck,
    maxSimilarity,
    redFlagsDetected: redFlags,
    ranOnDevice: true,
    transcriptEmbedding: Array.from(transcriptEmbedding),
  };
}

