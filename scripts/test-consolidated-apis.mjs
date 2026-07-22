import { getFirebase } from "../api/_admin-utils.js";
import adminInsightsHandler from "../api/admin-insights.js";
import adminCasesHandler from "../api/admin-cases.js";
import campaignHandler from "../api/campaign.js";

// Setup authentication stub on Firebase Auth singleton
const { db, auth } = getFirebase();
auth.verifyIdToken = async (token) => {
  return { role: 'admin' };
};

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
}

async function testAll() {
  console.log("=== STARTING CONSOLIDATED API TESTS ===");

  // Test 1: GET /api/admin-insights?type=officer-stats
  console.log("Test 1: GET /api/admin-insights?type=officer-stats");
  const req1 = {
    method: 'GET',
    query: { type: 'officer-stats' },
    headers: { authorization: 'Bearer mock-token' }
  };
  const res1 = createMockRes();
  await adminInsightsHandler(req1, res1);
  if (res1.statusCode === 200 && res1.body.success && Array.isArray(res1.body.stats)) {
    console.log("  Success: Officer stats returned successfully. Count:", res1.body.stats.length);
  } else {
    console.error("  Failed:", res1.body);
  }

  // Test 2: GET /api/admin-cases
  console.log("Test 2: GET /api/admin-cases");
  const req2 = {
    method: 'GET',
    headers: { authorization: 'Bearer mock-token' }
  };
  const res2 = createMockRes();
  await adminCasesHandler(req2, res2);
  if (res2.statusCode === 200 && res2.body.success && Array.isArray(res2.body.cases)) {
    console.log("  Success: Cases list returned successfully. Count:", res2.body.cases.length);
  } else {
    console.error("  Failed:", res2.body);
  }

  // Test 3: POST /api/admin-cases (update case)
  const casesSnapshot = await db.collection("citizenReports").limit(1).get();
  if (!casesSnapshot.empty) {
    const testCase = casesSnapshot.docs[0];
    const originalData = testCase.data();
    console.log(`Test 3: POST /api/admin-cases (update case: ${testCase.id})`);
    
    const req3 = {
      method: 'POST',
      headers: { authorization: 'Bearer mock-token' },
      body: {
        caseId: testCase.id,
        assignedOfficer: originalData.assignedOfficer || "Test Officer"
      }
    };
    const res3 = createMockRes();
    await adminCasesHandler(req3, res3);
    if (res3.statusCode === 200 && res3.body.success) {
      console.log("  Success: Case updated successfully.");
    } else {
      console.error("  Failed:", res3.body);
    }
  } else {
    console.log("Test 3: Skipped (no cases in database)");
  }

  // Test 4: GET /api/campaign?action=list
  console.log("Test 4: GET /api/campaign?action=list");
  const req4 = {
    method: 'GET',
    query: { action: 'list' }
  };
  const res4 = createMockRes();
  await campaignHandler(req4, res4);
  if (res4.statusCode === 200 && res4.body.success && Array.isArray(res4.body.data)) {
    console.log("  Success: Campaigns list returned successfully. Count:", res4.body.data.length);
  } else {
    console.error("  Failed:", res4.body);
  }

  // Test 5: POST /api/campaign?action=match
  console.log("Test 5: POST /api/campaign?action=match");
  const req5 = {
    method: 'POST',
    query: { action: 'match' },
    body: {
      transcriptEmbedding: Array(1536).fill(0.1),
      sessionId: `RKSH-MATCH-TEST`,
      sessionData: {
        verdict: "HIGH_RISK",
        confidence: 90,
        transcript: "Mock high risk transcript for matching.",
        matches: [],
        redFlagsDetected: []
      }
    }
  };
  const res5 = createMockRes();
  await campaignHandler(req5, res5);
  if (res5.statusCode === 200 && res5.body.success) {
    console.log("  Success: Campaign match ran successfully.", res5.body.data);
    // Cleanup the match test case
    const matchSnapshot = await db.collection("citizenReports").where("sessionId", "==", "RKSH-MATCH-TEST").get();
    for (const doc of matchSnapshot.docs) {
      await doc.ref.delete();
    }
    console.log("  Cleanup: Deleted match test case.");
  } else {
    console.error("  Failed:", res5.body);
  }

  console.log("=== ALL CONSOLIDATED API TESTS COMPLETED ===");
}

testAll();
