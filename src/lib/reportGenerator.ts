import jsPDF from "jspdf";

export function generateSessionId(): string {
  return `RKSH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface Match {
  category: number;
  evidence: string;
  reason: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  riskScore: number;
}

export interface ReportSession {
  sessionId: string;
  transcript: string;
  verdict: string;
  confidence: number;
  matches: Match[];
  redFlagsDetected: string[];
  timestamp: string;
}

const CATEGORY_NAMES: Record<number, string> = {
  1: "Authority impersonation",
  2: "Urgency/threat escalation",
  3: "Isolation instructions",
  4: "Payment/OTP demand",
  5: "Fake portal/document reference",
  6: "Video-hostage framing",
  7: "Identity verification pretext",
  8: "Reward/incentive lure",
};

export function generateReportPDF(session: ReportSession): jsPDF {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text("Rakshak AI — Fraud Detection Report", 20, y);
  y += 10;
  doc.setFontSize(10);
  doc.text("For submission alongside a National Cyber Crime Reporting Portal complaint", 20, y);
  y += 12;

  doc.setFontSize(11);
  doc.text(`Complaint Reference ID: ${session.sessionId}`, 20, y); y += 7;
  doc.text(`Incident Date and Time: ${new Date(session.timestamp).toLocaleString("en-IN")}`, 20, y); y += 7;
  doc.text(`Crime Category: Financial Fraud (Digital Arrest / Impersonation Scam)`, 20, y); y += 7;
  doc.text(`AI Risk Verdict: ${session.verdict} (${session.confidence}% confidence)`, 20, y); y += 10;

  doc.setFontSize(12);
  doc.text("Incident Details (transcript excerpt):", 20, y); y += 7;
  doc.setFontSize(9);
  const splitTranscript = doc.splitTextToSize(session.transcript, 170);
  doc.text(splitTranscript, 20, y);
  y += splitTranscript.length * 5 + 8;

  doc.setFontSize(12);
  doc.text("Matched Scam Patterns:", 20, y); y += 7;
  doc.setFontSize(9);
  session.matches.forEach((m) => {
    doc.text(`- [${m.severity}, risk ${m.riskScore}] ${CATEGORY_NAMES[m.category] || "Category " + m.category}`, 22, y); y += 5;
    doc.text(`  Evidence: "${m.evidence}"`, 24, y); y += 5;
    doc.text(`  Reason: ${m.reason}`, 24, y); y += 7;
  });
  y += 6;

  if (session.redFlagsDetected.length > 0) {
    doc.setFontSize(12);
    doc.text("Detected Red-Flag Terms:", 20, y); y += 7;
    doc.setFontSize(9);
    doc.text(session.redFlagsDetected.join(", "), 22, y);
    y += 10;
  }

  doc.setFontSize(9);
  doc.text("Recommended next step: File this incident at cybercrime.gov.in or call the", 20, y); y += 5;
  doc.text("national cybercrime helpline 1930. Keep this document as supporting evidence.", 20, y);

  return doc;
}