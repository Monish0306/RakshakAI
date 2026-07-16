import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjPlj_kxy-0Qdnyj4hvDmlzhKUjJyG7Lg",
  authDomain: "rakshakai-6fd43.firebaseapp.com",
  projectId: "rakshakai-6fd43",
  storageBucket: "rakshakai-6fd43.firebasestorage.app",
  messagingSenderId: "37327882903",
  appId: "1:37327882903:web:1d7138b83dfef523c5b7d2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  const snapshot = await getDocs(collection(db, "evaluationResults"));
  console.log("Docs found:", snapshot.size);
  if (!snapshot.empty) {
    console.log("First doc:", snapshot.docs[0].data());
  } else {
    console.log("No data found.");
  }
  process.exit(0);
}
test().catch(console.error);
