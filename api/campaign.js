import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin lazily
function getDb() {
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        });
      } else {
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

const CATEGORY_LABELS = {
  1: "Authority Impersonation",
  2: "Urgency/Threat Escalation",
  3: "Isolation Instructions",
  4: "Payment/OTP Demand",
  5: "Fake Portal/Document Reference",
  6: "Video-Hostage Framing",
  7: "Identity Verification Pretext",
  8: "Reward/Incentive Lure"
};

function toTimestampMs(timestamp) {
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().getTime();
  }
  if (timestamp && typeof timestamp.seconds === "number") {
    return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1e6);
  }
  return new Date(timestamp).getTime();
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || 'list';

  if (action === 'list') {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: "Use GET for listing" });
    }

    try {
      const db = getDb();
      const snapshot = await db.collection("citizenReports").get();
      
      const allReports = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isTestData) return; // Exclude test data from aggregates
        allReports.push(data);
      });

      const campaignsMap = {};

      // First pass: Group reports that have a campaignId
      allReports.forEach(report => {
        if (report.campaignId) {
          if (!campaignsMap[report.campaignId]) {
            campaignsMap[report.campaignId] = [];
          }
          campaignsMap[report.campaignId].push(report);
        }
      });

      // Second pass: Find original seeding reports
      allReports.forEach(report => {
        if (!report.campaignId) {
          const potentialCampaignId = `CAMPAIGN-${report.sessionId.replace('RKSH-', '')}`;
          if (campaignsMap[potentialCampaignId]) {
            campaignsMap[potentialCampaignId].push(report);
          }
        }
      });

      const campaignsList = Object.keys(campaignsMap).map(campaignId => {
        const reports = campaignsMap[campaignId];
        const sortedReports = [...reports].sort((a, b) => toTimestampMs(a.timestamp) - toTimestampMs(b.timestamp));
        
        const firstSeen = sortedReports[0].timestamp;
        const lastSeen = sortedReports[sortedReports.length - 1].timestamp;
        const detectionLeadTimeMs = sortedReports.length >= 2
          ? Math.max(0, toTimestampMs(sortedReports[1].timestamp) - toTimestampMs(sortedReports[0].timestamp))
          : 0;
        
        const representativeTranscript = sortedReports[0].transcript || "";
        
        const categoryCounts = {};
        reports.forEach(r => {
          if (r.matches && Array.isArray(r.matches)) {
            r.matches.forEach(m => {
              const cat = CATEGORY_LABELS[m.category] || m.category || "Unknown Scam";
              categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
          }
        });
        
        let dominantCategory = "Authority Impersonation";
        let maxCount = 0;
        Object.keys(categoryCounts).forEach(cat => {
          if (categoryCounts[cat] > maxCount) {
            maxCount = categoryCounts[cat];
            dominantCategory = String(cat);
          }
        });

        return {
          campaignId,
          reportCount: reports.length,
          firstSeen,
          lastSeen,
          detectionLeadTimeMs,
          representativeTranscript,
          dominantCategory,
          priority: reports.length >= 3,
          reports: reports.map(r => ({
            sessionId: r.sessionId,
            timestamp: r.timestamp,
            transcript: r.transcript,
            verdict: r.verdict,
            confidence: r.confidence
          }))
        };
      });

      campaignsList.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority ? -1 : 1;
        }
        return b.reportCount - a.reportCount;
      });

      return res.status(200).json({
        success: true,
        data: campaignsList
      });
    } catch (err) {
      console.error("Error generating campaign list:", err);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  } else if (action === 'match') {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: "Use POST for matching" });
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

      const snapshot = await collectionRef
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      let matchCount = 0;
      let campaignId = null;
      let oldestMatchedSessionId = null;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isTestData) return; // Exclude test data from aggregates
        if (data.transcriptEmbedding && Array.isArray(data.transcriptEmbedding)) {
          const similarity = cos_sim(transcriptEmbedding, data.transcriptEmbedding);
          if (similarity >= 0.60) {
            matchCount++;
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

      await collectionRef.add({
        sessionId: sessionId || `RKSH-${Date.now()}`,
        transcript: sanitizedTranscript,
        verdict: sessionData.verdict,
        confidence: sessionData.confidence,
        matches: sessionData.matches,
        redFlagsDetected: sessionData.redFlagsDetected,
        timestamp: new Date().toISOString(),
        transcriptEmbedding: transcriptEmbedding,
        campaignId: campaignId,
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
  } else {
    return res.status(400).json({ success: false, error: "Invalid action parameter" });
  }
}
