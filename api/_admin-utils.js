import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

export function getFirebase() {
  if (!getApps().length) {
    try {
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
          initializeApp();
        }
      }
    } catch (err) {
      console.warn("Failed to initialize Firebase Admin, falling back to default:", err);
      initializeApp();
    }
  }
  return { db: getFirestore(), auth: getAuth() };
}

export async function verifyAdminAuth(req, auth) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided');
  }
  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await auth.verifyIdToken(token);
  if (decodedToken.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return decodedToken;
}

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}
