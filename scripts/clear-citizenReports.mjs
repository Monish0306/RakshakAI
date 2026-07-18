import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function getDb() {
  if (!getApps().length) {
    const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

async function run() {
  const db = getDb();
  const snapshot = await db.collection("citizenReports").get();
  
  if (snapshot.empty) {
    console.log("No documents to delete.");
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Successfully deleted ${snapshot.size} test documents.`);
}

run();
