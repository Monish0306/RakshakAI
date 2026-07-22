import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const doc = await db.collection("citizenReports").doc("mIxyDXVajJ1byUFr5ANa").get();
  console.log("Document data:", doc.id, doc.data());
  process.exit(0);
}

run().catch(console.error);
