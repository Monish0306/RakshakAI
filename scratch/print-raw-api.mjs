import handler from '../api/admin-insights.js';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { readFileSync } from 'fs';

// Initialize firebase admin for local execution context of handler
if (!getApps().length) {
  const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
}

async function getRaw(days, minLinks) {
  const req = {
    method: 'GET',
    query: {
      type: 'network-graph',
      days: String(days),
      minLinks: String(minLinks)
    },
    headers: {}
  };

  let responseData = "";
  const res = {
    status: function(code) {
      return this;
    },
    json: function(data) {
      responseData = JSON.stringify(data);
      return this;
    }
  };

  try {
    // We override verifyAdminAuth temporarily by attaching dummy function or mocking
    // Wait, the handler imports verifyAdminAuth from ./_admin-utils.js
    // Since we are running in node, we can mock it or let it fail if it expects req.headers.authorization.
    // Let's modify the req object to bypass authentication.
    // Wait, to make it bypass verifyAdminAuth without modifying the source file,
    // we can pass a valid token or mock the auth verifyIdToken.
    // But since the serviceAccount gives us full admin credentials, we can bypass verifyAdminAuth in our local node test context
    // by mocking verifyAdminAuth.
    // Let's check how verifyAdminAuth works in _admin-utils.js first.
  } catch (err) {
    console.error(err);
  }
}

// Let's read the _admin-utils.js file to see how verifyAdminAuth verifies tokens.
