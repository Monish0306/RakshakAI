import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

export function getFirebase() {
  if (!getApps().length) {
    if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      });
    } else {
      const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
        initializeApp({ credential: cert(serviceAccount) });
      } else {
        const error = new Error("Firebase Admin is not configured");
        error.statusCode = 500;
        throw error;
      }
    }
  }
  return { db: getFirestore(), auth: getAuth() };
}

export async function verifyAdminAuth(req, auth) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await auth.verifyIdToken(token);
  if (decodedToken.role !== 'admin') {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
  return decodedToken;
}

export function toSafeAdminCase(doc) {
  const data = doc.data();
  const fields = [
    'sessionId', 'timestamp', 'verdict', 'threatLevel', 'confidence',
    'campaignId', 'caseStatus', 'assignedOfficer', 'recoveryPercent', 'closedAt'
  ];

  return fields.reduce((caseData, field) => {
    if (data[field] !== undefined) caseData[field] = data[field];
    return caseData;
  }, { id: doc.id });
}

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}
