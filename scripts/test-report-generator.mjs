// scripts/test-report-generator.mjs
import fs from "fs";
import { generateReportPDF, generateSessionId } from "../src/lib/reportGenerator.js";

const positiveCase = {
  sessionId: generateSessionId(),
  transcript: "This is Officer Sharma from CBI. Transfer money immediately or a warrant will be issued.",
  verdict: "HIGH_RISK",
  confidence: 95,
  matches: [
    { category: 1, evidence: "Officer Sharma from CBI", reason: "Impersonates a central investigative authority", severity: "Critical", riskScore: 95 },
    { category: 2, evidence: "warrant will be issued", reason: "Manufactures legal urgency to force quick action", severity: "High", riskScore: 75 },
    { category: 4, evidence: "Transfer money immediately", reason: "Direct payment demand under pressure", severity: "Critical", riskScore: 95 },
  ],
  redFlagsDetected: ["cbi"],
  timestamp: new Date().toISOString(),
};

const negativeCase = {
  sessionId: generateSessionId(),
  transcript: "Hello, this is your bank calling to confirm a recent transaction of 500 rupees. If this was you, no action needed.",
  verdict: "SAFE",
  confidence: 95,
  matches: [],
  redFlagsDetected: [],
  timestamp: new Date().toISOString(),
};

async function run() {
  for (const session of [positiveCase, negativeCase]) {
    const doc = await generateReportPDF(session);
    const filename = `Rakshak-Report-${session.sessionId}.pdf`;
    fs.writeFileSync(`./${filename}`, Buffer.from(doc.output("arraybuffer")));
    console.log(`Generated: ${filename}`);
  }
}
run();