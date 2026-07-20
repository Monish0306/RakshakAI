import { getFirebase, verifyAdminAuth, setCorsHeaders } from './_admin-utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Use GET" });
  }

  const { db, auth } = getFirebase();

  try {
    await verifyAdminAuth(req, auth);
  } catch (err) {
    return res.status(403).json({ success: false, error: err.message });
  }

  try {
    // Only return escalated HIGH_RISK cases
    const snapshot = await db.collection("citizenReports")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
      
    const cases = [];
    snapshot.forEach(doc => {
      cases.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ success: true, cases });
  } catch (err) {
    console.error("Admin cases error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch cases" });
  }
}
