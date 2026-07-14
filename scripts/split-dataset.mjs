import fs from "fs";

const all = JSON.parse(fs.readFileSync("./data/curated-examples.json", "utf-8"));

function sample(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

const scam = all.filter(e => e.label === "scam");
const legit = all.filter(e => e.label === "legitimate");
const uncertain = all.filter(e => e.label === "uncertain");

// Few-shot set: small, diverse, pulled from different sources
const fewShot = [
  ...sample(scam.filter(e => e.source === "english-scam"), 3),
  ...sample(scam.filter(e => e.source === "fraud-call-file"), 2),
  ...sample(legit.filter(e => e.source === "english-nonscam"), 3),
  ...sample(legit.filter(e => e.source === "fraud-call-file"), 2),
  ...uncertain.slice(0, 5), // keep all — they're rare and valuable
];

const fewShotTranscripts = new Set(fewShot.map(e => e.transcript));

// Evaluation set: everything else, capped and stratified so it's balanced and API-friendly
const remainingScam = scam.filter(e => !fewShotTranscripts.has(e.transcript));
const remainingLegit = legit.filter(e => !fewShotTranscripts.has(e.transcript));
const remainingUncertain = uncertain.filter(e => !fewShotTranscripts.has(e.transcript));

const evaluationSet = [
  ...sample(remainingScam, 75),
  ...sample(remainingLegit, 75),
  ...remainingUncertain,
].sort(() => Math.random() - 0.5);

fs.writeFileSync("./data/few-shot-examples.json", JSON.stringify(fewShot, null, 2));
fs.writeFileSync("./data/evaluation-set.json", JSON.stringify(evaluationSet, null, 2));

console.log(`Few-shot set: ${fewShot.length} examples`);
console.log(`Evaluation set: ${evaluationSet.length} examples`);