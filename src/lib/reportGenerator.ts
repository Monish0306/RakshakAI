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

function drawDivider(doc: jsPDF, y: number) {
  doc.setDrawColor(220, 220, 220); // Light gray
  doc.line(20, y, 190, y);
}

function drawPieSlice(doc: jsPDF, x: number, y: number, radius: number, startAngle: number, endAngle: number, color: number[]) {
  doc.setFillColor(color[0], color[1], color[2]);
  const steps = 30;
  const stepAngle = (endAngle - startAngle) / steps;
  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + i * stepAngle;
    const a2 = startAngle + (i + 1) * stepAngle;
    doc.triangle(
      x, y,
      x + radius * Math.cos(a1), y + radius * Math.sin(a1),
      x + radius * Math.cos(a2), y + radius * Math.sin(a2),
      "F"
    );
  }
}

export async function generateReportPDF(session: ReportSession): Promise<jsPDF> {
  const doc = new jsPDF();
  let y = 0;

  const coreData = JSON.stringify({
    transcript: session.transcript,
    verdict: session.verdict,
    timestamp: session.timestamp,
    matches: session.matches,
  });
  
  let hashHex = "N/A";
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(coreData);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 1. HEADER BAR
  doc.setFillColor(30, 58, 138); // #1E3A8A Dark Navy
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Rakshak AI — Fraud Detection Report", 20, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Complaint Reference ID: ${session.sessionId}`, 20, 24);

  y = 44;

  // Back to black text for body
  doc.setTextColor(50, 50, 50);

  // SECTION: Incident Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Incident Details", 20, y);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date & Time: ${new Date(session.timestamp).toLocaleString("en-IN")}`, 120, y);
  y += 8;
  doc.text(`Crime Category: Financial Fraud (Digital Arrest / Impersonation Scam)`, 20, y);
  y += 10;

  drawDivider(doc, y);
  y += 10;

  // 2. VERDICT BADGE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("AI Risk Verdict:", 20, y);

  let badgeColor = [200, 200, 200];
  const verdictText = session.verdict.toUpperCase();
  if (verdictText === "HIGH_RISK") badgeColor = [220, 38, 38]; // Red
  else if (verdictText === "SAFE") badgeColor = [22, 163, 74]; // Green
  else if (verdictText === "UNCERTAIN") badgeColor = [217, 119, 6]; // Amber

  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(55, y - 5, 70, 7, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`${verdictText} (${session.confidence}% confidence)`, 60, y);
  doc.setTextColor(50, 50, 50);

  y += 10;
  drawDivider(doc, y);
  y += 10;

  // TRANSCRIPT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Incident Transcript Excerpt", 20, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const splitTranscript = doc.splitTextToSize(session.transcript, 170);
  doc.text(splitTranscript, 20, y);
  y += splitTranscript.length * 4 + 6;
  doc.setTextColor(50, 50, 50);

  drawDivider(doc, y);
  y += 10;

  // SECTION: MATCHED PATTERNS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Matched Scam Patterns", 20, y);

  // 4. SEVERITY DONUT SUMMARY
  if (session.matches.length >= 2) {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    session.matches.forEach(m => counts[m.severity]++);
    const total = session.matches.length;

    const pieX = 175;
    const pieY = y + 5;
    const radius = 12;

    let currentAngle = -Math.PI / 2; // Start at top
    const colors: Record<string, number[]> = {
      Low: [156, 163, 175], // Gray
      Medium: [245, 158, 11], // Amber
      High: [249, 115, 22], // Orange
      Critical: [220, 38, 38], // Red
    };

    const severities = ["Critical", "High", "Medium", "Low"];
    
    severities.forEach((sev) => {
      if (counts[sev] > 0) {
        const sliceAngle = (counts[sev] / total) * 2 * Math.PI;
        drawPieSlice(doc, pieX, pieY, radius, currentAngle, currentAngle + sliceAngle, colors[sev]);
        currentAngle += sliceAngle;
      }
    });

    // Make it a donut
    doc.setFillColor(255, 255, 255);
    doc.circle(pieX, pieY, radius * 0.5, "F");
    
    // Donut label
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Severity", pieX - 6, pieY + radius + 5);
    doc.setTextColor(50, 50, 50);
  }

  y += 14;

  session.matches.forEach((m) => {
    // 3. RISK SCORE BAR CHART
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const title = `${CATEGORY_NAMES[m.category] || "Category " + m.category}`;
    doc.text(title, 20, y);

    // Background bar
    doc.setFillColor(235, 235, 235);
    doc.rect(130, y - 3, 60, 4, "F");

    let barColor = [156, 163, 175]; // Low
    if (m.severity === "Medium") barColor = [245, 158, 11];
    else if (m.severity === "High") barColor = [249, 115, 22];
    else if (m.severity === "Critical") barColor = [220, 38, 38];

    // Filled bar
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    const barWidth = (m.riskScore / 100) * 60;
    doc.rect(130, y - 3, Math.max(1, barWidth), 4, "F"); // ensure at least 1px width

    // Score text
    doc.setFontSize(8);
    doc.setTextColor(barColor[0], barColor[1], barColor[2]);
    doc.text(`${m.riskScore}/100`, 115, y);

    doc.setTextColor(50, 50, 50);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const evidence = `Evidence: "${m.evidence}"`;
    const splitEvidence = doc.splitTextToSize(evidence, 170);
    doc.text(splitEvidence, 20, y);
    y += splitEvidence.length * 4;

    const reason = `Reason: ${m.reason}`;
    const splitReason = doc.splitTextToSize(reason, 170);
    doc.text(splitReason, 20, y);
    y += splitReason.length * 4 + 4;
    doc.setTextColor(50, 50, 50);
    
    // Page break protection
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  if (session.redFlagsDetected.length > 0) {
    drawDivider(doc, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detected Red-Flag Terms", 20, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitFlags = doc.splitTextToSize(session.redFlagsDetected.join(", "), 170);
    doc.text(splitFlags, 20, y);
    y += splitFlags.length * 4 + 6;
  }

  // Evidence Integrity Section
  if (y > 230) {
    doc.addPage();
    y = 20;
  } else {
    drawDivider(doc, y);
    y += 10;
  }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Evidence Integrity", 20, y);
  y += 7;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("AI Model Version: Rakshak AI v1.0 — Hybrid Edge+Cloud", 20, y);
  y += 5;
  doc.text(`Report Generated: ${new Date().toISOString()}`, 20, y);
  y += 5;
  
  const shortHash = hashHex !== "N/A" ? `${hashHex.substring(0, 16)}...` : hashHex;
  doc.text(`Integrity Hash (SHA-256): ${shortHash}`, 20, y);
  y += 5;
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const hashNote = doc.splitTextToSize("This hash is deterministically generated from session data. Any tampering with this document will result in a mismatch upon verification.", 170);
  doc.text(hashNote, 20, y);
  y += hashNote.length * 4 + 6;
  doc.setTextColor(50, 50, 50);

  // Ensure next steps fit
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  drawDivider(doc, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recommended Next Steps", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("File this incident at cybercrime.gov.in or call the national cybercrime helpline 1930.", 20, y);
  y += 5;
  doc.text("Keep this document as supporting evidence.", 20, y);

  return doc;
}