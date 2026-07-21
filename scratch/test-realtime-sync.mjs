import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

console.log("Setting up Firestore onSnapshot real-time listener on 'citizenReports'...");

let receivedRealtimeDoc = false;
const testSessionId = "TEST-SYNC-" + Date.now();

const unsubscribe = db.collection("citizenReports")
  .orderBy("timestamp", "desc")
  .limit(10)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        if (data.sessionId === testSessionId) {
          console.log("✅ REAL-TIME SYNC SUCCESS: Received added document in real-time without polling!", {
            id: change.doc.id,
            sessionId: data.sessionId,
            verdict: data.verdict,
            threatLevel: data.threatLevel
          });
          receivedRealtimeDoc = true;
        }
      }
    });
  });

// Wait 1.5 seconds, then simulate a new citizen report insertion
setTimeout(async () => {
  console.log("Simulating new citizen scam report submission...");
  const newReportRef = await db.collection("citizenReports").add({
    sessionId: testSessionId,
    timestamp: new Date().toISOString(),
    verdict: "HIGH_RISK",
    threatLevel: "HIGH_RISK",
    confidence: 94.5,
    caseStatus: "pending",
    assignedOfficer: "",
    transcriptSnippet: "TEST REAL-TIME SCAM: Please verify your bank account details urgently."
  });
  console.log("Inserted test report with ID:", newReportRef.id);
}, 1500);

// Wait for verification and clean up test record
setTimeout(async () => {
  if (receivedRealtimeDoc) {
    console.log("Test Passed! Real-time Firestore sync confirmed.");
  } else {
    console.error("❌ Test Failed: Real-time update was not received within timeout.");
  }
  unsubscribe();
  process.exit(receivedRealtimeDoc ? 0 : 1);
}, 4000);
