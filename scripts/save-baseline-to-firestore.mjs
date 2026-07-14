import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf-8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const baseline = JSON.parse(fs.readFileSync("./data/baseline-results.json", "utf-8"));

async function save() {
  await db.collection("evaluationResults").doc("baseline").set({
    method: baseline.method,
    precision: baseline.precision,
    recall: baseline.recall,
    f1Score: baseline.f1,
    totalCases: baseline.totalCases,
    computedAt: baseline.computedAt,
  });
  console.log("Baseline saved to Firestore as a fixed document (id: 'baseline').");
}

save();