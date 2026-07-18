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
      console.warn("Failed to initialize Firebase Admin, falling back to default:", err);
      initializeApp();
    }
  }
  return getFirestore();
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Use GET" });
  }

  try {
    const db = getDb();
    const snapshot = await db.collection("citizenReports").get();
    
    const allReports = [];
    snapshot.forEach(doc => {
      allReports.push(doc.data());
    });

    // Grouping logic
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

    // Second pass: Find original seeding reports (which had campaignId = null but their sessionId matches a campaign suffix)
    allReports.forEach(report => {
      if (!report.campaignId) {
        const potentialCampaignId = `CAMPAIGN-${report.sessionId.replace('RKSH-', '')}`;
        if (campaignsMap[potentialCampaignId]) {
          // This report is the root seed of an active campaign!
          campaignsMap[potentialCampaignId].push(report);
        }
      }
    });

    const campaignsList = Object.keys(campaignsMap).map(campaignId => {
      const reports = campaignsMap[campaignId];
      
      // Sort reports by timestamp to find first/last seen and oldest transcript
      const sortedReports = [...reports].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const firstSeen = sortedReports[0].timestamp;
      const lastSeen = sortedReports[sortedReports.length - 1].timestamp;
      
      // Oldest transcript snippet
      const representativeTranscript = sortedReports[0].transcript || "";
      
      // Determine dominant category from matches
      const categoryCounts = {};
      reports.forEach(r => {
        if (Array.isArray(r.matches)) {
          r.matches.forEach(m => {
            const cat = m.category || "Unknown Scam";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          });
        }
      });
      
      let dominantCategory = "Authority Impersonation"; // fallback
      let maxCount = 0;
      Object.keys(categoryCounts).forEach(cat => {
        if (categoryCounts[cat] > maxCount) {
          maxCount = categoryCounts[cat];
          dominantCategory = cat;
        }
      });

      return {
        campaignId,
        reportCount: reports.length,
        firstSeen,
        lastSeen,
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

    // Sort by priority first (true before false), then by count descending
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
}
