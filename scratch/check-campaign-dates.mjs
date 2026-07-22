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
  const reports = [];
  snapshot.forEach(doc => {
    reports.push(doc.data());
  });

  const campId = 'CAMPAIGN-1784636322880';
  const linked = reports.filter(r => r.campaignId === campId || (r.sessionId && `CAMPAIGN-${r.sessionId.replace('RKSH-', '')}` === campId));

  console.log(`Found ${linked.length} linked reports for ${campId}:`);
  linked.forEach(r => {
    console.log(`Session: ${r.sessionId} | Timestamp: ${r.timestamp} | Parsed: ${new Date(r.timestamp).getTime()}`);
  });

  const sortedAsc = [...linked].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  console.log("\nSorted Ascending:");
  sortedAsc.forEach(r => {
    console.log(`Session: ${r.sessionId} | Timestamp: ${r.timestamp}`);
  });

  process.exit(0);
}

run().catch(console.error);
