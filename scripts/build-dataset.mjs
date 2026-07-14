import fs from "fs";
import { parse } from "csv-parse/sync";

// --- English_Scam / English_NonScam ---
function parseNumbered(text, label, source) {
  return text
    .split(/\r?\n\r?\n/)
    .map(l => l.replace(/^\d+\.\t/, "").trim())
    .filter(l => l.length > 20)
    .map(transcript => ({ transcript, label, source }));
}

// --- fraud_call.file ---
function parseFraudCallFile(text, normalSampleSize = 250) {
  const scamEntries = [];
  const legitEntries = [];
  text.split("\n").forEach(line => {
    const [rawLabel, ...rest] = line.split("\t");
    const transcript = rest.join(" ").trim();
    if (!transcript) return;
    if (rawLabel.trim() === "fraud") {
      scamEntries.push({ transcript, label: "scam", source: "fraud-call-file" });
    } else if (rawLabel.trim() === "normal") {
      legitEntries.push({ transcript, label: "legitimate", source: "fraud-call-file" });
    }
  });
  // Subsample the much larger 'normal' side so it doesn't dwarf everything else
  const shuffled = legitEntries.sort(() => Math.random() - 0.5).slice(0, normalSampleSize);
  return [...scamEntries, ...shuffled];
}

// --- BETTER30.csv ---
function tierFromLabel(rawLabel) {
  const l = rawLabel.trim().toLowerCase();
  if (["scam", "scam_response", "highly_suspicious"].includes(l)) return "scam";
  if (["suspicious", "slightly_suspicious", "potential_scam"].includes(l)) return "uncertain";
  if (["neutral", "legitimate"].includes(l)) return "legitimate";
  return null; // skip odd/malformed label rows
}

function parseBetter30(csvText) {
  const rows = parse(csvText, { columns: true, skip_empty_lines: true });
  const byConversation = {};
  for (const row of rows) {
    const id = row.CONVERSATION_ID;
    if (!byConversation[id]) byConversation[id] = { steps: [], tiers: [] };
    byConversation[id].steps.push(row.TEXT.trim());
    const tier = tierFromLabel(row.LABEL || "");
    if (tier) byConversation[id].tiers.push(tier);
  }
  const severity = { legitimate: 0, uncertain: 1, scam: 2 };
  return Object.values(byConversation).map(conv => {
    const worst = conv.tiers.reduce((a, b) => (severity[b] > severity[a] ? b : a), "legitimate");
    return {
      transcript: conv.steps.join(" "),
      label: worst,
      source: "better30-conversations",
    };
  });
}

const scamText = fs.readFileSync("./data/raw/English_Scam.txt", "utf-8");
const nonScamText = fs.readFileSync("./data/raw/English_NonScam.txt", "utf-8");
const fraudCallText = fs.readFileSync("./data/raw/fraud_call.file", "utf-8");
const better30Text = fs.readFileSync("./data/raw/BETTER30.csv", "utf-8");

const all = [
  ...parseNumbered(scamText, "scam", "english-scam"),
  ...parseNumbered(nonScamText, "legitimate", "english-nonscam"),
  ...parseFraudCallFile(fraudCallText),
  ...parseBetter30(better30Text),
];

fs.writeFileSync("./data/curated-examples.json", JSON.stringify(all, null, 2));

const counts = all.reduce((acc, e) => ({ ...acc, [e.label]: (acc[e.label] || 0) + 1 }), {});
console.log(`Total entries: ${all.length}`);
console.log(counts);