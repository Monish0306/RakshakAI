import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf-8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const avgLatencyMs = 1057; // measured directly via scripts/measure-latency.mjs

console.log(`Saving average latency: ${avgLatencyMs}ms`);

const snapshot = await db.collection("evaluationResults").orderBy("computedAt", "desc").limit(1).get();
if (!snapshot.empty) {
  await snapshot.docs[0].ref.update({ avgLatencyMs });
  console.log("Updated Firestore record with avgLatencyMs.");
} else {
  console.log("No evaluationResults document found to update.");
}