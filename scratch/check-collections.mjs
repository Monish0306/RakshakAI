import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log("Fetching collections...");
  const collections = await db.listCollections();
  console.log("Collections:", collections.map(c => c.id));
  
  for (const c of collections) {
    const snap = await db.collection(c.id).limit(2).get();
    console.log(`Collection ${c.id}: ${snap.size} docs`);
    if (snap.size > 0) {
      console.log(`Sample doc in ${c.id}:`, snap.docs[0].id, snap.docs[0].data());
    }
  }
  process.exit(0);
}

run().catch(console.error);
