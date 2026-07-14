import fs from "fs";
const evalSet = JSON.parse(fs.readFileSync("./data/evaluation-set.json", "utf-8"));
const hardNegatives = JSON.parse(fs.readFileSync("./data/hard-negatives.json", "utf-8"));
const merged = [...evalSet, ...hardNegatives];
fs.writeFileSync("./data/evaluation-set.json", JSON.stringify(merged, null, 2));
console.log(`Evaluation set now has ${merged.length} examples (added ${hardNegatives.length} hard negatives)`);