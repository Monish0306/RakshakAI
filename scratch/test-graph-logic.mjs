import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import crypto from 'crypto';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Masking helpers from admin-insights.js
const maskPhone = (phone) => {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length >= 10) {
    return `${clean.slice(-10, -6)}****${clean.slice(-2)}`;
  }
  return 'Phone: ****';
};

const maskUPI = (upi) => {
  const parts = upi.split('@');
  if (parts.length === 2) {
    const username = parts[0];
    const domain = parts[1];
    const maskedUser = username.length > 3 ? username.substring(0, 3) + '***' : '***';
    return `${maskedUser}@${domain}`;
  }
  return '******@upi';
};

const maskBankAccount = (acc) => {
  const clean = acc.replace(/[^0-9]/g, '');
  if (clean.length >= 4) {
    return `XXXX ****${clean.slice(-4)}`;
  }
  return 'Bank: ****';
};

const maskDevice = (dev) => {
  const clean = dev.toUpperCase();
  if (clean.length >= 7) {
    return `${clean.slice(0, 4)}****${clean.slice(-3)}`;
  }
  return 'Device: ****';
};

const hashIdentifier = (val) => {
  return crypto.createHash('sha256').update(val).digest('hex').substring(0, 16);
};

async function test() {
  console.log("=== DIAGNOSTIC RUN ===");
  
  // 1. Fetch data from citizenReports
  const snapshot = await db.collection("citizenReports").get();
  console.log(`Total reports in citizenReports: ${snapshot.size}`);
  
  const allReports = [];
  snapshot.forEach(doc => {
    allReports.push({
      id: doc.id,
      ...doc.data()
    });
  });

  if (allReports.length > 0) {
    console.log("Keys in first report document:", Object.keys(allReports[0]));
    console.log("First report object snippet:", JSON.stringify({
      id: allReports[0].id,
      sessionId: allReports[0].sessionId,
      campaignId: allReports[0].campaignId,
      verdict: allReports[0].verdict,
      timestamp: allReports[0].timestamp,
      transcriptSnippet: allReports[0].transcript ? allReports[0].transcript.substring(0, 80) : "MISSING"
    }, null, 2));
  } else {
    console.log("NO REPORTS FOUND IN FIRESTORE!");
    process.exit(0);
  }

  // Group campaigns
  const campaignsMap = {};
  allReports.forEach(r => {
    if (r.campaignId) {
      if (!campaignsMap[r.campaignId]) {
        campaignsMap[r.campaignId] = [];
      }
      campaignsMap[r.campaignId].push(r.sessionId);
    }
  });

  // Second pass: associate seeding reports
  allReports.forEach(r => {
    if (!r.campaignId && r.sessionId) {
      const potentialCampaignId = `CAMPAIGN-${r.sessionId.replace('RKSH-', '')}`;
      if (campaignsMap[potentialCampaignId]) {
        campaignsMap[potentialCampaignId].push(r.sessionId);
        r.campaignId = potentialCampaignId;
      }
    }
  });

  console.log("Campaign Map:", campaignsMap);

  // Helper to compile graph
  const buildGraph = (reportsList, threshold) => {
    const nodesMap = new Map();
    const edges = [];

    const addNode = (id, nodeData) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, nodeData);
      }
    };

    // First pass: create Report nodes & Campaign nodes
    reportsList.forEach(r => {
      const last4 = r.sessionId ? r.sessionId.slice(-4) : 'xxxx';
      const label = `Case: RKSH-...${last4}`;
      
      addNode(r.sessionId, {
        id: r.sessionId,
        type: 'Report',
        label: label,
        riskScore: r.confidence || 50,
        verdict: r.verdict || 'UNKNOWN'
      });

      if (r.campaignId) {
        const campLast4 = r.campaignId.slice(-4);
        addNode(r.campaignId, {
          id: r.campaignId,
          type: 'Campaign',
          label: `Campaign: CAMPAIGN-...${campLast4}`,
          riskScore: r.confidence || 50
        });

        edges.push({
          id: `edge-${r.campaignId}-${r.sessionId}`,
          source: r.campaignId,
          target: r.sessionId,
          type: 'CampaignToReport',
          style: 'dashed'
        });
      }
    });

    // Second pass: extract identifiers, create nodes & edges
    reportsList.forEach(r => {
      const transcript = r.transcript || r.transcriptSnippet || "";
      console.log(`\nTesting Report ${r.id} (${r.sessionId}):`);
      console.log(`Transcript Length: ${transcript.length}`);

      // Phone numbers regex (Indian 10-digit formats)
      const phoneRegex = /\b(?:\+?91[- ]?)?[6-9]\d{2}[- ]?\d{3}[- ]?\d{4}\b/g;
      const phoneMatches = transcript.match(phoneRegex) || [];
      console.log(`Phone matches:`, phoneMatches);
      const uniquePhones = Array.from(new Set(phoneMatches.map(p => p.replace(/[^0-9]/g, '').slice(-10))));
      uniquePhones.forEach(phone => {
        const hashedId = hashIdentifier(phone);
        const masked = maskPhone(phone);
        addNode(hashedId, {
          id: hashedId,
          type: 'PhoneNumber',
          label: masked,
          riskScore: r.confidence || 50
        });
        edges.push({
          id: `edge-${hashedId}-${r.sessionId}`,
          source: hashedId,
          target: r.sessionId,
          type: 'PhoneToReport',
          style: 'solid'
        });

        if (r.campaignId) {
          edges.push({
            id: `edge-${r.campaignId}-${hashedId}`,
            source: r.campaignId,
            target: hashedId,
            type: 'CampaignToPhone',
            style: 'dashed'
          });
        }
      });

      // UPI Handles regex (excluding common emails)
      const upiRegex = /[a-zA-Z0-9._%+-]+@(?!gmail|yahoo|hotmail|outlook|icloud|aol|mail|proton)[a-zA-Z0-9.-]+\b/gi;
      const upiMatches = transcript.match(upiRegex) || [];
      console.log(`UPI matches:`, upiMatches);
      const uniqueUpis = Array.from(new Set(upiMatches));
      uniqueUpis.forEach(upi => {
        const hashedId = hashIdentifier(upi.toLowerCase());
        const masked = maskUPI(upi);
        addNode(hashedId, {
          id: hashedId,
          type: 'UPIHandle',
          label: masked,
          riskScore: r.confidence || 50
        });
        edges.push({
          id: `edge-${hashedId}-${r.sessionId}`,
          source: hashedId,
          target: r.sessionId,
          type: 'UPIToReport',
          style: 'solid'
        });

        if (r.campaignId) {
          edges.push({
            id: `edge-${r.campaignId}-${hashedId}`,
            source: r.campaignId,
            target: hashedId,
            type: 'CampaignToUPI',
            style: 'dashed'
          });
        }
      });

      // Bank Accounts regex
      const bankRegex = /\b\d{9,18}\b/g;
      const bankMatches = transcript.match(bankRegex) || [];
      console.log(`Bank matches:`, bankMatches);
      const uniqueBanks = Array.from(new Set(bankMatches)).filter(b => {
        // Exclude phone number match overlaps (10 digits starting with 6-9)
        if (b.length === 10 && /^[6-9]/.test(b)) return false;
        return true;
      });
      uniqueBanks.forEach(bank => {
        const hashedId = hashIdentifier(bank);
        const masked = maskBankAccount(bank);
        addNode(hashedId, {
          id: hashedId,
          type: 'BankAccountFragment',
          label: masked,
          riskScore: r.confidence || 50
        });
        edges.push({
          id: `edge-${hashedId}-${r.sessionId}`,
          source: hashedId,
          target: r.sessionId,
          type: 'BankToReport',
          style: 'solid'
        });

        if (r.campaignId) {
          edges.push({
            id: `edge-${r.campaignId}-${hashedId}`,
            source: r.campaignId,
            target: hashedId,
            type: 'CampaignToBank',
            style: 'dashed'
          });
        }
      });

      // Device IDs (supporting dashes in class)
      const deviceList = [];
      if (r.deviceId) deviceList.push(r.deviceId);
      if (r.device) deviceList.push(r.device);
      const devRegex = /(?:Device\s*(?:ID)?|IMEI)[:\s]+([A-Z0-9-]{8,24})/gi;
      let devMatch;
      while ((devMatch = devRegex.exec(transcript)) !== null) {
        if (devMatch[1]) deviceList.push(devMatch[1].trim());
      }
      console.log(`Devices matched:`, deviceList);

      const uniqueDevices = Array.from(new Set(deviceList));
      uniqueDevices.forEach(device => {
        const hashedId = hashIdentifier(device);
        const masked = maskDevice(device);
        addNode(hashedId, {
          id: hashedId,
          type: 'DeviceID',
          label: masked,
          riskScore: r.confidence || 50
        });
        edges.push({
          id: `edge-${hashedId}-${r.sessionId}`,
          source: hashedId,
          target: r.sessionId,
          type: 'DeviceToReport',
          style: 'solid'
        });

        if (r.campaignId) {
          edges.push({
            id: `edge-${r.campaignId}-${hashedId}`,
            source: r.campaignId,
            target: hashedId,
            type: 'CampaignToDevice',
            style: 'dashed'
          });
        }
      });
    });

    // Update connections counts
    edges.forEach(e => {
      const sNode = nodesMap.get(e.source);
      const tNode = nodesMap.get(e.target);
      if (sNode) sNode.connections = (sNode.connections || 0) + 1;
      if (tNode) tNode.connections = (tNode.connections || 0) + 1;
    });

    let nodes = Array.from(nodesMap.values());

    if (threshold > 1) {
      nodes = nodes.filter(n => n.type === 'Campaign' || n.connections >= threshold);
      const nodeIds = new Set(nodes.map(n => n.id));
      const filteredEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
      return { nodes, edges: filteredEdges };
    }

    return { nodes, edges };
  };

  // Build the graph with minLinks = 2 (the query threshold)
  const threshold = 2;
  const graph = buildGraph(allReports, threshold);
  
  console.log("\n=== GRAPH OUTPUT (THRESHOLD = 2) ===");
  console.log(`Total nodes: ${graph.nodes.length}`);
  console.log(`Node counts by type:`, {
    Campaign: graph.nodes.filter(n => n.type === 'Campaign').length,
    Report: graph.nodes.filter(n => n.type === 'Report').length,
    PhoneNumber: graph.nodes.filter(n => n.type === 'PhoneNumber').length,
    UPIHandle: graph.nodes.filter(n => n.type === 'UPIHandle').length,
    BankAccountFragment: graph.nodes.filter(n => n.type === 'BankAccountFragment').length,
    DeviceID: graph.nodes.filter(n => n.type === 'DeviceID').length
  });
  console.log(`Total edges: ${graph.edges.length}`);
  if (graph.nodes.length > 0) {
    console.log("Sample Nodes (up to 5):", graph.nodes.slice(0, 5));
  }
  if (graph.edges.length > 0) {
    console.log("Sample Edges (up to 5):", graph.edges.slice(0, 5));
  }

  // Build the graph with minLinks = 1
  const graphMin1 = buildGraph(allReports, 1);
  console.log("\n=== GRAPH OUTPUT (THRESHOLD = 1) ===");
  console.log(`Total nodes: ${graphMin1.nodes.length}`);
  console.log(`Node counts by type (threshold=1):`, {
    Campaign: graphMin1.nodes.filter(n => n.type === 'Campaign').length,
    Report: graphMin1.nodes.filter(n => n.type === 'Report').length,
    PhoneNumber: graphMin1.nodes.filter(n => n.type === 'PhoneNumber').length,
    UPIHandle: graphMin1.nodes.filter(n => n.type === 'UPIHandle').length,
    BankAccountFragment: graphMin1.nodes.filter(n => n.type === 'BankAccountFragment').length,
    DeviceID: graphMin1.nodes.filter(n => n.type === 'DeviceID').length
  });
  console.log(`Total edges: ${graphMin1.edges.length}`);
  
  process.exit(0);
}

test().catch(console.error);
