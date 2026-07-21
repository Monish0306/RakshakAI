import { jsPDF } from "jspdf";

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
  evidenceStatus?: Record<string, boolean>;
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
  y += 6;

  // 4. SEVERITY DONUT & SUMMARY BLOCK
  if (session.matches.length >= 1) {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    session.matches.forEach(m => counts[m.severity] = (counts[m.severity] || 0) + 1);
    const total = session.matches.length;

    // Draw a clean background card for the summary chart
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(20, y, 170, 28, 2, 2, "FD");

    const pieX = 40;
    const pieY = y + 14;
    const radius = 10;

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
    doc.setFillColor(248, 250, 252);
    doc.circle(pieX, pieY, radius * 0.5, "F");

    // Donut label
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("SEVERITY", pieX - (doc.getTextWidth("SEVERITY") / 2), pieY + 1.5);

    // Legend items on the right side of the donut card
    let legendX = 65;
    let legendY = y + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text(`Total Indicators Detected: ${total}`, legendX, legendY);
    legendY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    severities.forEach((sev) => {
      if (counts[sev] > 0) {
        doc.setFillColor(colors[sev][0], colors[sev][1], colors[sev][2]);
        doc.rect(legendX, legendY - 2.5, 3, 3, "F");
        doc.text(`${sev}: ${counts[sev]}`, legendX + 5, legendY);
        legendX += 30;
        if (legendX > 160) {
          legendX = 65;
          legendY += 5;
        }
      }
    });

    y += 34; // Move y past the chart card container
  } else {
    y += 4;
  }

  doc.setTextColor(50, 50, 50);

  session.matches.forEach((m) => {
    // 3. RISK SCORE BAR CHART
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const title = `${CATEGORY_NAMES[m.category] || "Category " + m.category}`;
    doc.text(title, 20, y);

    // Background bar (placed safely at x: 120 to 170, score text at 175)
    const barX = 120;
    const barWidthMax = 50;
    doc.setFillColor(235, 235, 235);
    doc.rect(barX, y - 3, barWidthMax, 4, "F");

    let barColor = [156, 163, 175]; // Low
    if (m.severity === "Medium") barColor = [245, 158, 11];
    else if (m.severity === "High") barColor = [249, 115, 22];
    else if (m.severity === "Critical") barColor = [220, 38, 38];

    // Filled bar
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    const barWidth = (m.riskScore / 100) * barWidthMax;
    doc.rect(barX, y - 3, Math.max(1, barWidth), 4, "F");

    // Score text
    doc.setFontSize(8);
    doc.setTextColor(barColor[0], barColor[1], barColor[2]);
    doc.text(`${m.riskScore}/100`, 173, y);

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
    if (y > 265) {
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

  // Evidence Checklist Status Section
  if (session.evidenceStatus) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    } else {
      drawDivider(doc, y);
      y += 10;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Evidence Checklist Status", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    const evidenceKeys = [
      { key: 'screenshot', text: "Screenshotted full conversation" },
      { key: 'phone', text: "Saved caller's phone number" },
      { key: 'time', text: "Noted exact time and date" },
      { key: 'transaction', text: "Saved transaction ID / UTR number (if applicable)" },
      { key: 'notDeleted', text: "Conversation not deleted" },
      { key: 'notTold', text: "Caller not alerted about reporting" }
    ];
    
    evidenceKeys.forEach(item => {
      const status = session.evidenceStatus![item.key] ? "[X]" : "[ ]";
      doc.text(`${status}  ${item.text}`, 20, y);
      y += 5;
    });
    
    y += 2;
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