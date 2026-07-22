import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const mockReports = [
  {
    sessionId: 'RKSH-1001',
    campaignId: 'CAMPAIGN-1784367565470',
    transcript: 'This is Officer Sharma from CBI. You are under digital arrest. Call me at +91-9988776655 immediately or transfer money to CBI-Escrow@okaxis. Device ID: DEV-A1B2C3D4.',
    verdict: 'HIGH_RISK',
    confidence: 95,
    matches: [
      { category: 1, evidence: 'Officer Sharma from CBI', reason: 'Impersonation of CBI officer', severity: 'Critical', riskScore: 95 }
    ],
    redFlagsDetected: ['cbi', 'digital arrest'],
    timestamp: new Date().toISOString(),
    ranOnDevice: false,
    userId: 'w4KtvMd4v9gL8FVFKZqlrANnx1D3',
    userEmail: 'imonish@gmail.com',
    caseStatus: 'pending',
    assignedOfficer: 'Inspector R. Sharma',
    recoveryPercent: null,
    isTestData: true
  },
  {
    sessionId: 'RKSH-1002',
    campaignId: 'CAMPAIGN-1784367565470',
    transcript: 'To verify your CBI clearance, transfer Rs 50,000 to the official bank account 123456789012. Call +91-9988776655 for support.',
    verdict: 'HIGH_RISK',
    confidence: 92,
    matches: [
      { category: 4, evidence: 'transfer Rs 50,000', reason: 'Direct payment demand', severity: 'High', riskScore: 85 }
    ],
    redFlagsDetected: ['cbi'],
    timestamp: new Date().toISOString(),
    ranOnDevice: false,
    userId: 'w4KtvMd4v9gL8FVFKZqlrANnx1D3',
    userEmail: 'imonish@gmail.com',
    caseStatus: 'active',
    assignedOfficer: 'Inspector P. Patel',
    recoveryPercent: null,
    isTestData: true
  },
  {
    sessionId: 'RKSH-1003',
    campaignId: 'CAMPAIGN-1784367565470',
    transcript: 'This is Senior CBI Officer Priya. Access escrow portal on Device ID: DEV-A1B2C3D4 or send UPI to payment@okaxis. Scammer phone: 9988776655.',
    verdict: 'HIGH_RISK',
    confidence: 97,
    matches: [
      { category: 1, evidence: 'CBI Officer Priya', reason: 'Impersonation of officer Priya', severity: 'Critical', riskScore: 97 }
    ],
    redFlagsDetected: ['cbi'],
    timestamp: new Date().toISOString(),
    ranOnDevice: false,
    userId: 'w4KtvMd4v9gL8FVFKZqlrANnx1D3',
    userEmail: 'imonish@gmail.com',
    caseStatus: 'pending',
    assignedOfficer: 'Inspector R. Sharma',
    recoveryPercent: null,
    isTestData: true
  },
  {
    sessionId: 'RKSH-1004',
    campaignId: 'CAMPAIGN-1784636322880',
    transcript: 'Alert: Your Aadhaar linked parcel seized. Send Rs 25,000 to upi handle transfer@okhdfcbank to prevent arrest. Device: DEV-E5F6G7H8. Phone: +91-8888877777',
    verdict: 'HIGH_RISK',
    confidence: 91,
    matches: [
      { category: 2, evidence: 'prevent arrest', reason: 'Threat of arrest', severity: 'High', riskScore: 88 }
    ],
    redFlagsDetected: ['arrest', 'parcel'],
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    ranOnDevice: false,
    userId: 'w4KtvMd4v9gL8FVFKZqlrANnx1D3',
    userEmail: 'imonish@gmail.com',
    caseStatus: 'pending',
    assignedOfficer: 'Inspector A. Kumar',
    recoveryPercent: null,
    isTestData: true
  },
  {
    sessionId: 'RKSH-1005',
    campaignId: 'CAMPAIGN-1784636322880',
    transcript: 'Courier support: verify details by transferring to account 987654321012. Scammer phone: 8888877777. Device ID: DEV-E5F6G7H8.',
    verdict: 'HIGH_RISK',
    confidence: 94,
    matches: [
      { category: 7, evidence: 'verify details', reason: 'Identity theft risk', severity: 'Medium', riskScore: 60 }
    ],
    redFlagsDetected: ['courier'],
    timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    ranOnDevice: false,
    userId: 'w4KtvMd4v9gL8FVFKZqlrANnx1D3',
    userEmail: 'imonish@gmail.com',
    caseStatus: 'closed',
    assignedOfficer: 'Inspector V. Singh',
    recoveryPercent: 40,
    isTestData: true
  }
];

async function seed() {
  console.log("Seeding realistic reports with isTestData: true ...");
  for (const rep of mockReports) {
    const docRef = db.collection("citizenReports").doc(rep.sessionId);
    await docRef.set(rep);
    console.log(`Seeded report: ${rep.sessionId} (isTestData: true)`);
  }
  console.log("Seeding completed successfully! All test documents are tagged with isTestData: true");
  process.exit(0);
}

seed().catch(console.error);
