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
    const todayStr = new Date().toISOString().substring(0, 10); // YYYY-MM-DD

    // Fetch stats from dailyStats counter
    let totalChecksToday = 0;
    let onDeviceCount = 0;
    let cloudCount = 0;

    const statsDoc = await db.collection("dailyStats").doc(todayStr).get();
    if (statsDoc.exists) {
      const statsData = statsDoc.data();
      totalChecksToday = statsData.totalChecks || 0;
      onDeviceCount = statsData.onDeviceResolved || 0;
      cloudCount = statsData.cloudEscalated || 0;
    }

    // Now gather campaign count and last detection time from citizenReports
    const snapshot = await db.collection("citizenReports").get();
    const campaignIds = new Set();
    let mostRecentHighRiskTime = null;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.isTestData) return; // Exclude test data from aggregates
      if (data.campaignId) {
        campaignIds.add(data.campaignId);
      }
      if (data.verdict === "HIGH_RISK") {
        if (!mostRecentHighRiskTime || new Date(data.timestamp) > new Date(mostRecentHighRiskTime)) {
          mostRecentHighRiskTime = data.timestamp;
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalChecksToday,
        onDeviceCount,
        cloudCount,
        activeCampaigns: campaignIds.size,
        mostRecentHighRiskTime
      }
    });
  } catch (err) {
    console.error("Error generating pulse stats:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
