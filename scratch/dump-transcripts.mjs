import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const snapshot = await db.collection("citizenReports").get();
  console.log(`Found ${snapshot.size} reports.`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`\n================ REPORT ${doc.id} (${data.sessionId}) ================`);
    console.log(`Campaign: ${data.campaignId}`);
    console.log(`Transcript:\n"${data.transcript}"`);
    console.log("Matches:", data.matches);
  });
  process.exit(0);
}

run().catch(console.error);
