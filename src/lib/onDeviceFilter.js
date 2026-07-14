import { pipeline, cos_sim } from "@xenova/transformers";

let embedder = null;
let referenceEmbeddings = null;

const REFERENCE_SENTENCES = [
  "This is an officer from CBI, ED, or Customs calling about a case against you",
  "You are under digital arrest and must stay on video call",
  "Transfer money immediately or a warrant will be issued",
  "Do not tell anyone about this call, it is confidential",
  "Provide your Aadhaar or bank details to verify your identity",
  "Congratulations, you have won a prize, claim it now",
];

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

  const THRESHOLD = 0.45;
  return {
    escalate: maxSimilarity >= THRESHOLD,
    maxSimilarity,
    ranOnDevice: true,
  };
}