import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Use POST" });
  }

  const { outcome } = req.body;
  if (outcome !== "on-device" && outcome !== "cloud") {
    return res.status(400).json({ success: false, error: "Invalid outcome type. Use 'on-device' or 'cloud'." });
  }

  try {
    const db = getDb();
    const todayStr = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const docRef = db.collection("dailyStats").doc(todayStr);

    const incrementVal = FieldValue.increment(1);
    
    const updateData = {
      totalChecks: incrementVal
    };

    if (outcome === "on-device") {
      updateData.onDeviceResolved = incrementVal;
    } else {
      updateData.cloudEscalated = incrementVal;
    }

    await docRef.set(updateData, { merge: true });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Telemetry error:", err);
    return res.status(500).json({ success: false, error: "Telemetry storage failed" });
  }
}
