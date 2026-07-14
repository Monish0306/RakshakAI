import fs from "fs";
const data = JSON.parse(fs.readFileSync("./data/evaluation-results.json", "utf-8"));

// Bucket by confidence range, check correctness rate per bucket
const buckets = { "90-100": [], "70-89": [], "50-69": [], "0-49": [] };
for (const r of data.results) {
  if (r.confidence === undefined) continue;
  const c = r.confidence;
  const bucket = c >= 90 ? "90-100" : c >= 70 ? "70-89" : c >= 50 ? "50-69" : "0-49";
  buckets[bucket].push(r.isCorrect);
}

console.log("=== Confidence Calibration ===");
for (const [range, values] of Object.entries(buckets)) {
  if (values.length === 0) continue;
  const correctRate = values.filter(Boolean).length / values.length;
  console.log(`Confidence ${range}: ${values.length} cases, ${(correctRate * 100).toFixed(1)}% correct`);
}