import fs from "fs";
// Re-split from the original curated pool to get a clean, non-duplicated evaluation set
// (re-run your original split-dataset.mjs logic, or if that's simplest, just dedupe by transcript text)

const evalSet = JSON.parse(fs.readFileSync("./data/evaluation-set.json", "utf-8"));
const seen = new Set();
const deduped = evalSet.filter(e => {
  if (seen.has(e.transcript)) return false;
  seen.add(e.transcript);
  return true;
});
fs.writeFileSync("./data/evaluation-set.json", JSON.stringify(deduped, null, 2));
console.log(`Deduped: ${evalSet.length} → ${deduped.length} examples`);