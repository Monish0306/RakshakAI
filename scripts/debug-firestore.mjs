import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function getDb() {
  if (!getApps().length) {
    const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

function cos_sim(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function run() {
  const db = getDb();
  const snapshot = await db.collection("citizenReports").orderBy("timestamp", "asc").get();
  
  const reports = [];
  console.log("=== ALL STORED REPORTS ===");
  snapshot.forEach(doc => {
    const data = doc.data();
    reports.push(data);
    const excerpt = data.transcript.length > 50 ? data.transcript.slice(0, 50) + "..." : data.transcript;
    console.log(`[${data.timestamp}] Session: ${data.sessionId} | Campaign: ${data.campaignId || 'None'} | Excerpt: "${excerpt}"`);
  });

  console.log("\n=== PARAPHRASED TRANSCRIPT COMPARISONS ===");
  // Find the paraphrased transcript
  const paraphraseReport = reports.find(r => r.transcript.includes("Central Bureau of Investigation"));
  const originalReport = reports.find(r => r.transcript.includes("Officer Sharma"));

  if (!paraphraseReport) {
    console.log("Could not find the paraphrased report in DB.");
    return;
  }

  reports.forEach(r => {
    if (r.sessionId === paraphraseReport.sessionId) return;
    if (r.transcriptEmbedding && paraphraseReport.transcriptEmbedding) {
      const sim = cos_sim(paraphraseReport.transcriptEmbedding, r.transcriptEmbedding);
      console.log(`Vs Session ${r.sessionId} (Campaign: ${r.campaignId}): ${sim}`);
      
      if (originalReport && r.sessionId === originalReport.sessionId) {
        console.log(`   -> THIS IS THE ORIGINAL REPORT COMPARISON! Similarity = ${sim}`);
      }
    }
  });

}

run();
