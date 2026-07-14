import fs from "fs";

const evalSet = JSON.parse(fs.readFileSync("./data/evaluation-set.json", "utf-8"));

// Deliberately simple — no reasoning, just literal keyword presence
const NAIVE_KEYWORDS = [
  "cbi", "ed officer", "customs department", "arrest", "warrant",
  "otp", "transfer money", "urgent", "digital arrest", "police",
  "congratulations", "won", "prize", "claim now",
];

function naiveClassify(transcript) {
  const lower = transcript.toLowerCase();
  const matched = NAIVE_KEYWORDS.filter((kw) => lower.includes(kw));
  return matched.length > 0 ? "HIGH_RISK" : "SAFE";
}

function labelsMatch(trueLabel, verdict) {
  // Naive baseline only ever outputs SAFE or HIGH_RISK — no UNCERTAIN tier
  const map = { scam: "HIGH_RISK", uncertain: "HIGH_RISK", legitimate: "SAFE" };
  return map[trueLabel] === verdict;
}

let truePositives = 0, falsePositives = 0, falseNegatives = 0, trueNegatives = 0;
const results = [];

for (const { transcript, label } of evalSet) {
  const verdict = naiveClassify(transcript);
  const isCorrect = labelsMatch(label, verdict);
  const predictedScam = verdict === "HIGH_RISK";
  const actualScam = label === "scam" || label === "uncertain";

  if (predictedScam && actualScam) truePositives++;
  else if (predictedScam && !actualScam) falsePositives++;
  else if (!predictedScam && actualScam) falseNegatives++;
  else trueNegatives++;

  results.push({ transcript: transcript.slice(0, 80), label, verdict, isCorrect });
}

const precision = truePositives / (truePositives + falsePositives) || 0;
const recall = truePositives / (truePositives + falseNegatives) || 0;
const f1 = (2 * precision * recall) / (precision + recall) || 0;

console.log("=== NAIVE KEYWORD-MATCHING BASELINE ===");
console.log({ precision, recall, f1, truePositives, falsePositives, falseNegatives, trueNegatives });

fs.writeFileSync("./data/baseline-results.json", JSON.stringify({
  computedAt: new Date().toISOString(),
  method: "naive keyword matching",
  totalCases: evalSet.length,
  precision, recall, f1,
  truePositives, falsePositives, falseNegatives, trueNegatives,
  results,
}, null, 2));

console.log("\nSaved to data/baseline-results.json");