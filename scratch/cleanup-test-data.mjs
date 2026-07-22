import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function cleanup() {
  const ids = ['RKSH-1001', 'RKSH-1002', 'RKSH-1003', 'RKSH-1004', 'RKSH-1005'];
  console.log("Cleaning up seeded test reports...");
  for (const id of ids) {
    await db.collection("citizenReports").doc(id).delete();
    console.log(`Deleted report: ${id}`);
  }
  console.log("Cleanup completed successfully!");
  process.exit(0);
}

cleanup().catch(console.error);
