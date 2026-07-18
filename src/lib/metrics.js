import { collection, getDocs, orderBy, query, limit, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getLatestMetrics() {
  const q = query(collection(db, "evaluationResults"), orderBy("computedAt", "desc"), limit(10));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const validDoc = snapshot.docs.find((d) => d.data().method !== 'naive keyword matching');
  return validDoc ? validDoc.data() : null;
}

export async function getAverageLatency() {
  const q = query(collection(db, "evaluationResults"), orderBy("computedAt", "desc"), limit(10));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const validDoc = snapshot.docs.find((d) => d.data().method !== 'naive keyword matching');
  return validDoc?.data().avgLatencyMs ?? null;
}

export async function getBaselineMetrics() {
  const docRef = doc(db, "evaluationResults", "baseline");
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}