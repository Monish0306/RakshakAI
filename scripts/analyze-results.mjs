import fs from "fs";

const data = JSON.parse(fs.readFileSync("./data/evaluation-results.json", "utf-8"));

// Where did the 22 "misses" actually land?
const scamCases = data.results.filter(r => r.label === "scam");
const missedButUncertain = scamCases.filter(r => r.verdict === "UNCERTAIN").length;
const missedAsSafe = scamCases.filter(r => r.verdict === "SAFE").length;
console.log(`Scam cases: HIGH_RISK=${scamCases.filter(r=>r.verdict==="HIGH_RISK").length}, UNCERTAIN=${missedButUncertain}, SAFE=${missedAsSafe}`);

// Fairer "safety catch rate" — caught as HIGH_RISK or UNCERTAIN (never confidently cleared as safe)
const caughtAsCaution = scamCases.filter(r => r.verdict === "HIGH_RISK" || r.verdict === "UNCERTAIN").length;
console.log(`Safety catch rate (HIGH_RISK + UNCERTAIN): ${caughtAsCaution}/${scamCases.length} = ${(caughtAsCaution/scamCases.length*100).toFixed(1)}%`);

// Degraded breakdown
const degraded = data.results.filter(r => r.degraded);
console.log(`\nDegraded count: ${degraded.length}`);
console.log("Sample degraded labels:", degraded.slice(0, 5).map(r => r.label));
const genuineMisses = data.results.filter(r => r.label === "scam" && r.verdict === "SAFE");
console.log("\n=== The 9 real misses — read these carefully ===");
genuineMisses.forEach(m => console.log(`- "${m.transcript}"`));

const nonDegraded = data.results.filter(r => !r.degraded);
const nonDegradedCorrect = nonDegraded.filter(r => r.isCorrect).length;
console.log(`\nAccuracy excluding degraded calls: ${nonDegradedCorrect}/${nonDegraded.length} = ${(nonDegradedCorrect/nonDegraded.length*100).toFixed(1)}%`);