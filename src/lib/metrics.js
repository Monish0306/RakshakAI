import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, orderBy, query, limit, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjPlj_kxy-0Qdnyj4hvDmlzhKUjJyG7Lg",
  authDomain: "rakshakai-6fd43.firebaseapp.com",
  projectId: "rakshakai-6fd43",
  storageBucket: "rakshakai-6fd43.firebasestorage.app",
  messagingSenderId: "37327882903",
  appId: "1:37327882903:web:1d7138b83dfef523c5b7d2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function getLatestMetrics() {
  const q = query(collection(db, "evaluationResults"), orderBy("computedAt", "desc"), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

export async function getAverageLatency() {
  const q = query(collection(db, "evaluationResults"), orderBy("computedAt", "desc"), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data().avgLatencyMs ?? null;
}

export async function getBaselineMetrics() {
  const docRef = doc(db, "evaluationResults", "baseline");
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}