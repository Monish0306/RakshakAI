import { getFirebase, verifyAdminAuth, setCorsHeaders, toSafeAdminCase } from './_admin-utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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
  } else if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const { db, auth } = getFirebase();
      await verifyAdminAuth(req, auth);
      const { caseId, caseStatus, assignedOfficer, recoveryPercent, closedAt } = req.body || {};
      if (!caseId) return res.status(400).json({ success: false, error: "caseId is required" });
      const updateData = {};
      if (caseStatus !== undefined) updateData.caseStatus = caseStatus;
      if (assignedOfficer !== undefined) updateData.assignedOfficer = assignedOfficer;
      if (recoveryPercent !== undefined) updateData.recoveryPercent = recoveryPercent;
      if (closedAt !== undefined) updateData.closedAt = closedAt;

      await db.collection("citizenReports").doc(caseId).update(updateData);

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Admin case update error:", err);
      return res.status(err.statusCode || 500).json({
        success: false,
        error: err.statusCode ? err.message : "Failed to update case"
      });
    }
  } else {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
}
