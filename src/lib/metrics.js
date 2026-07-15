import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, orderBy, query, limit, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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