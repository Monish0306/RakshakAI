import fs from 'fs';
import path from 'path';

// Helper to load env variables from .env and .env.local
function loadEnv() {
  const env = {};
  [ '.env', '.env.local' ].forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      });
    }
  });
  return env;
}

async function run() {
  const env = loadEnv();
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    console.error("Error: Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID in environment files.");
    process.exit(1);
  }

  const testEmail = `rule-test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  const testUsername = `testuser-${Date.now()}`;

  console.log(`\n=== STEP 1: Creating a temporary test user auth record via Firebase Auth REST API ===`);
  console.log(`Email: ${testEmail}`);
  
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      returnSecureToken: true
    })
  });

  if (!authRes.ok) {
    const errData = await authRes.json();
    console.error("Auth creation failed:", errData);
    process.exit(1);
  }

  const authData = await authRes.json();
  const idToken = authData.idToken;
  const actualUid = authData.localId;
  console.log(`SUCCESS: Auth account created. Uid: ${actualUid}`);

  console.log(`\n=== STEP 2: Writing a username entry matching the authenticated UID (Should Succeed) ===`);
  const successWriteRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usernames/${testUsername}?documentId=${testUsername}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: actualUid },
        email: { stringValue: testEmail }
      }
    })
  });

  const successStatus = successWriteRes.status;
  const successData = await successWriteRes.json();
  console.log(`HTTP Status: ${successStatus}`);
  if (successWriteRes.ok) {
    console.log("RESULT: SUCCESS (Document successfully created as allowed by rules)");
  } else {
    console.log("RESULT: FAILED", successData);
  }

  console.log(`\n=== STEP 3: Attempting to create a username entry with a MISMATCHED UID (Should fail with 403 Forbidden) ===`);
  const maliciousUsername = `${testUsername}-hijack`;
  const failWriteRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usernames/${maliciousUsername}?documentId=${maliciousUsername}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: "hijacked_mismatched_uid" },
        email: { stringValue: "hijacker@example.com" }
      }
    })
  });

  const failStatus = failWriteRes.status;
  const failData = await failWriteRes.json();
  console.log(`HTTP Status: ${failStatus}`);
  if (failStatus === 403) {
    console.log("RESULT: REJECTED AS EXPECTED (Rule successfully blocked mismatched UID write)");
  } else {
    console.warn("RESULT: UNEXPECTED (Write did not return 403)", failData);
  }

  console.log(`\n=== STEP 4: Attempting to overwrite/update the existing username entry (Should fail with 403 Forbidden) ===`);
  // Update attempts should fail according to "allow update: if false;"
  const overwriteRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usernames/${testUsername}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: actualUid },
        email: { stringValue: "updated_email@example.com" }
      }
    })
  });

  const overwriteStatus = overwriteRes.status;
  console.log(`HTTP Status: ${overwriteStatus}`);
  if (overwriteStatus === 403) {
    console.log("RESULT: REJECTED AS EXPECTED (Rule successfully blocked update/overwrite)");
  } else {
    console.warn("RESULT: UNEXPECTED (Overwrite did not return 403)");
  }

  console.log(`\n=== STEP 5: Confirming public read access on the username entry is BLOCKED (Should fail with 403 Forbidden) ===`);
  const readRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usernames/${testUsername}`, {
    method: "GET"
  });

  const readStatus = readRes.status;
  console.log(`HTTP Status: ${readStatus}`);
  if (readStatus === 403) {
    console.log("RESULT: REJECTED AS EXPECTED (Public read query is blocked by rules)");
  } else {
    console.warn("RESULT: UNEXPECTED (Read did not return 403)");
  }
}

run().catch(console.error);
