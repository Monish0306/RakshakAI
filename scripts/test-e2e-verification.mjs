import { getFirebase } from "../api/_admin-utils.js";
import { generateReportPDF } from "../src/lib/reportGenerator.ts";
import crypto from "crypto";

function calculateSHA256Node(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function runTest() {
  console.log("=== STARTING E2E VERIFICATION TEST ===");
  
  // 1. Initialize Firebase Admin
  let db;
  try {
    const firebase = getFirebase();
    db = firebase.db;
    console.log("Firebase database connected successfully.");
  } catch (err) {
    console.error("Firebase initialization failed:", err.message);
    process.exit(1);
  }

  // 2. Generate E2E test report data
  const testSessionId = `RKSH-E2E-${Date.now()}`;
  const testTimestamp = new Date().toISOString();
  
  const testReport = {
    sessionId: testSessionId,
    transcript: "Attention. This is a CBI verification check. A digital arrest warrant has been processed for your identification details. You must immediately connect to verify your clearance status.",
    verdict: "HIGH_RISK",
    confidence: 98,
    matches: [
      {
        category: 1,
        evidence: "CBI verification check",
        reason: "Impersonates a central government security agency",
        severity: "Critical",
        riskScore: 98
      },
      {
        category: 2,
        evidence: "warrant has been processed",
        reason: "Falsely manufactures legal action threat",
        severity: "High",
        riskScore: 85
      }
    ],
    redFlagsDetected: ["cbi", "arrest"],
    timestamp: testTimestamp,
    isTestData: true // Mark as test data so it doesn't inflate metrics!
  };

  // 3. Write test report to Firestore citizenReports
  console.log(`Writing test case to database: ${testSessionId}...`);
  let docRef;
  try {
    docRef = await db.collection("citizenReports").add(testReport);
    console.log("Database write successful. Document ID:", docRef.id);
  } catch (err) {
    console.error("Failed to write test case to database:", err.message);
    process.exit(1);
  }

  try {
    // 4. Generate the PDF report using jsPDF generator
    console.log("Generating report PDF document...");
    const doc = await generateReportPDF({
      sessionId: testSessionId,
      transcript: testReport.transcript,
      verdict: testReport.verdict,
      confidence: testReport.confidence,
      matches: testReport.matches,
      redFlagsDetected: testReport.redFlagsDetected,
      timestamp: testReport.timestamp
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const pdfText = pdfBuffer.toString("utf-8");

    // 5. Run regex extraction on the PDF text stream
    console.log("Extracting verification parameters from PDF text stream...");
    const sessionIdMatch = pdfText.match(/RKSH-E2E-\d+/);
    // Double escaped parens inside raw PDF text stream: Integrity Hash \(SHA-255\): ...
    const hashMatch = pdfText.match(/Integrity Hash \\\(SHA-256\\\):\s*([a-f0-9]+)/i);

    if (!sessionIdMatch) {
      throw new Error("E2E Test Failed: Could not locate Complaint Reference ID in PDF text.");
    }
    if (!hashMatch) {
      throw new Error("E2E Test Failed: Could not locate Integrity Hash in PDF text.");
    }

    const extractedSessionId = sessionIdMatch[0];
    const extractedHash = hashMatch[1];

    console.log("Extracted Reference ID:", extractedSessionId);
    console.log("Extracted Short Hash :", extractedHash);

    // 6. Query Firestore for the extracted Reference ID
    console.log(`Searching Firestore citizenReports for sessionId: ${extractedSessionId}...`);
    const querySnapshot = await db.collection("citizenReports")
      .where("sessionId", "==", extractedSessionId)
      .get();

    if (querySnapshot.empty) {
      throw new Error(`E2E Test Failed: No database record matches the extracted Reference ID: ${extractedSessionId}`);
    }

    const dbDoc = querySnapshot.docs[0];
    const dbData = dbDoc.data();
    console.log("Matching document found in database.");

    // 7. Calculate integrity hash of database data
    console.log("Calculating database record integrity signature...");
    const coreData = JSON.stringify({
      transcript: dbData.transcript,
      verdict: dbData.verdict,
      timestamp: dbData.timestamp,
      matches: dbData.matches || [],
    });

    const fullHash = calculateSHA256Node(coreData);
    const calculatedShortHash = fullHash.substring(0, 16);
    console.log("Calculated database short hash:", calculatedShortHash);

    // 8. Assert comparison match
    if (calculatedShortHash === extractedHash) {
      console.log("\n=================================");
      console.log(" E2E INTEGRITY VERIFIED: SUCCESS ");
      console.log("=================================\n");
    } else {
      throw new Error(`E2E Test Failed: Hash mismatch! Expected ${calculatedShortHash} but PDF hash was ${extractedHash}`);
    }

  } catch (testErr) {
    console.error("\n[E2E_TEST_FAILURE]", testErr.message);
  } finally {
    // 9. Clean up test document from Firestore
    console.log("Cleaning up E2E test database records...");
    try {
      await docRef.delete();
      console.log("Clean up successful.");
    } catch (err) {
      console.warn("Failed to delete E2E test record:", err.message);
    }
  }
}

runTest();
