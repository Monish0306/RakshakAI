// scripts/save-evaluation-to-firestore.mjs
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf-8"));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const results = JSON.parse(fs.readFileSync("./data/evaluation-results.json", "utf-8"));

async function save() {
  await db.collection("evaluationResults").add({
    datasetSource: "kaggle-multi-source-1753-curated",
    totalCases: 152,
    precision: results.precision,
    recall: results.recall,
    f1Score: (2 * results.precision * results.recall) / (results.precision + results.recall),
    falsePositiveRate: results.falsePositives / (results.falsePositives + results.trueNegatives),
    falseNegativeRate: results.falseNegatives / (results.falseNegatives + results.truePositives),
    computedAt: new Date().toISOString(),
  });
  console.log("Saved to Firestore.");
}

save();