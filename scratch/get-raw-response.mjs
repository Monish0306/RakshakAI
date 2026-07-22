import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
}

// 2. Read handler file and replace utility imports
let code = fs.readFileSync('./api/admin-insights.js', 'utf8');

// Replace the import statement with local variables/mocks
code = code.replace(
  "import { getFirebase, verifyAdminAuth, setCorsHeaders } from './_admin-utils.js';",
  "import { getFirestore } from 'firebase-admin/firestore';\nconst getFirebase = () => ({ db: getFirestore() });\nconst verifyAdminAuth = async () => {};\nconst setCorsHeaders = () => {};"
);

// We need to write it to a temporary file in scratch so we can import it
const tempPath = './scratch/temp-admin-insights.mjs';
fs.writeFileSync(tempPath, code);

async function run() {
  const { default: handler } = await import('./temp-admin-insights.mjs');
  
  const req = {
    method: 'GET',
    query: {
      type: 'network-graph',
      days: '30',
      minLinks: '2'
    },
    headers: {}
  };

  const res = {
    status: function(code) {
      return this;
    },
    json: function(data) {
      console.log("=== RAW JSON RESPONSE (unformatted) ===");
      console.log(JSON.stringify(data));
      return this;
    }
  };

  await handler(req, res);
  
  // Clean up temp file
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }
  process.exit(0);
}

run().catch(console.error);
