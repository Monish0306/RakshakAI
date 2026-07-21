import { getFirebase, verifyAdminAuth, setCorsHeaders } from './_admin-utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Use POST" });
  }

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
}
