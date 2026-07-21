import { getFirebase, verifyAdminAuth, setCorsHeaders } from './_admin-utils.js';

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
    const snapshot = await db.collection("citizenReports").get();
    
    const officers = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const officer = data.assignedOfficer;
      if (!officer) return; 
      
      if (!officers[officer]) {
        officers[officer] = { 
          name: officer, 
          total: 0, 
          active: 0, 
          pending: 0, 
          closed: 0,
          sumTimeToClose: 0,
          sumRecoveryPercent: 0,
          closedCountWithRecovery: 0
        };
      }
      
      const stat = officers[officer];
      stat.total += 1;
      
      const status = data.caseStatus || 'pending';
      if (status === 'active') stat.active += 1;
      else if (status === 'pending') stat.pending += 1;
      else if (status === 'closed') {
        stat.closed += 1;
        
        // Calculate time to close if available (closedAt is expected to be a timestamp string or ISO)
        if (data.timestamp && data.closedAt) {
          const start = new Date(data.timestamp).getTime();
          const end = new Date(data.closedAt).getTime();
          if (!isNaN(start) && !isNaN(end) && end > start) {
            stat.sumTimeToClose += (end - start);
          }
        }
        
        if (typeof data.recoveryPercent === 'number') {
          stat.sumRecoveryPercent += data.recoveryPercent;
          stat.closedCountWithRecovery += 1;
        }
      }
    });

    const results = Object.values(officers).map(stat => {
      const avgTimeToCloseMs = stat.closed > 0 ? stat.sumTimeToClose / stat.closed : 0;
      const avgRecoveryPercent = stat.closedCountWithRecovery > 0 ? stat.sumRecoveryPercent / stat.closedCountWithRecovery : 0;
      
      return {
        name: stat.name,
        total: stat.total,
        active: stat.active,
        pending: stat.pending,
        closed: stat.closed,
        avgTimeToCloseMs,
        avgRecoveryPercent
      };
    });

    return res.status(200).json({ success: true, stats: results });
  } catch (err) {
    console.error("Admin officer stats error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.statusCode ? err.message : "Failed to fetch officer stats"
    });
  }
}
