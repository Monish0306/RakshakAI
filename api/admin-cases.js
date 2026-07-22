import { getFirebase, verifyAdminAuth, setCorsHeaders, toSafeAdminCase } from './_admin-utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Use GET" });
  }

  try {
    const { db, auth } = getFirebase();
    await verifyAdminAuth(req, auth);
    const snapshot = await db.collection("citizenReports")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
      
    const cases = snapshot.docs.filter(doc => !doc.data().isTestData).map(toSafeAdminCase);

    return res.status(200).json({ success: true, cases });
  } catch (err) {
    console.error("Admin cases error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.statusCode ? err.message : "Failed to fetch cases"
    });
  }
}
