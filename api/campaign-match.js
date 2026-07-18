import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin lazily
function getDb() {
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        // Vercel / Production environment using env vars
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        });
      } else {
        // For local development
        const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
          initializeApp({ credential: cert(serviceAccount) });
        } else {
          initializeApp();
        }
      }
    } catch (err) {
      console.warn("Failed to initialize Firebase Admin automatically, falling back to default:", err);
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

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Use POST" });
  }

  const { transcriptEmbedding, sessionData, sessionId } = req.body;
  
  if (!transcriptEmbedding || !Array.isArray(transcriptEmbedding) || transcriptEmbedding.length === 0) {
    return res.status(400).json({ success: false, error: "Missing or invalid transcriptEmbedding" });
  }
  if (!sessionData || sessionData.verdict !== "HIGH_RISK") {
    return res.status(400).json({ success: false, error: "Invalid sessionData. Only HIGH_RISK allowed." });
  }

  if (!sessionData.transcript) {
    return res.status(400).json({ success: false, error: "Missing required field: sessionData.transcript" });
  }
  
  if (sessionData.confidence === undefined || sessionData.confidence === null) {
    return res.status(400).json({ success: false, error: "Missing required field: sessionData.confidence" });
  }

  try {
    const db = getDb();
    const collectionRef = db.collection("citizenReports");

    // Fetch recent reports to compare against
    const snapshot = await collectionRef
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    let matchCount = 0;
    let campaignId = null;
    let oldestMatchedSessionId = null;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.transcriptEmbedding && Array.isArray(data.transcriptEmbedding)) {
        const similarity = cos_sim(transcriptEmbedding, data.transcriptEmbedding);
        if (similarity >= 0.60) {
          matchCount++;
          // Track the oldest matched session to use as a deterministic Campaign ID
          // Since we ordered by timestamp desc, the last one we see that matches might not be the absolute oldest
          // but we can just use the oldest one in the current batch of matches.
          if (!oldestMatchedSessionId || new Date(data.timestamp) < new Date(oldestMatchedSessionId.timestamp)) {
            oldestMatchedSessionId = { id: data.sessionId, timestamp: data.timestamp };
          }
        }
      }
    });

    if (matchCount > 0 && oldestMatchedSessionId) {
      campaignId = `CAMPAIGN-${oldestMatchedSessionId.id.replace('RKSH-', '')}`;
    }

    const sanitizedTranscript = (sessionData.transcript || "")
      .trim()
      .replace(/\r?\n\s*\r?\n/g, '\n');

    // Write the new session securely
    await collectionRef.add({
      sessionId: sessionId || `RKSH-${Date.now()}`,
      transcript: sanitizedTranscript,
      verdict: sessionData.verdict,
      confidence: sessionData.confidence,
      matches: sessionData.matches,
      redFlagsDetected: sessionData.redFlagsDetected,
      timestamp: new Date().toISOString(),
      transcriptEmbedding: transcriptEmbedding,
      campaignId: campaignId, // Associate it with the campaign
      ranOnDevice: false
    });

    return res.status(200).json({
      success: true,
      data: {
        matchCount,
        campaignId
      }
    });
  } catch (err) {
    console.error("Campaign match error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
