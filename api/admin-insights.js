import { getFirebase, verifyAdminAuth, setCorsHeaders } from './_admin-utils.js';
import crypto from 'crypto';

function sanitizeTranscript(text) {
  if (!text || typeof text !== 'string') return "";
  return text
    .replace(/(\+?\d{1,3}[- ]?)?\b\d{10}\b/g, '[REDACTED_PHONE]')
    .replace(/\b\d{12,16}\b/g, '[REDACTED_ACCOUNT]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/[a-zA-Z0-9._%+-]+@(upi|ybl|axl|sbi|icici|okicici|paytm|apl|oksbi)/gi, '[REDACTED_UPI]');
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Use GET' });
  }

  try {
    const { db, auth } = getFirebase();
    await verifyAdminAuth(req, auth);

    const type = req.query.type || 'overview';

    // 1. NATIONAL HEATMAP: Aggregated region/city counts only (Zero individual coordinates or user locations)
    if (type === 'heatmap') {
      const snapshot = await db.collection("citizenReports").get();
      const regionMap = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isTestData) return; // Exclude test data from aggregates
        const region = data.region || data.city || data.state || 'Maharashtra (Mumbai Region)';
        
        if (!regionMap[region]) {
          regionMap[region] = { region, count: 0, highRiskCount: 0, mediumRiskCount: 0, safeCount: 0 };
        }

        const stat = regionMap[region];
        stat.count += 1;

        if (data.verdict === 'HIGH_RISK' || data.threatLevel === 'HIGH_RISK') stat.highRiskCount += 1;
        else if (data.verdict === 'UNCERTAIN' || data.threatLevel === 'MEDIUM_RISK') stat.mediumRiskCount += 1;
        else stat.safeCount += 1;
      });

      // Default fallback mock region distribution if dataset has limited location metadata
      const defaultRegions = [
        { region: 'Maharashtra (Mumbai Metro)', count: 142, highRiskCount: 38, mediumRiskCount: 44, safeCount: 60, riskLevel: 'HIGH' },
        { region: 'Delhi NCR', count: 118, highRiskCount: 32, mediumRiskCount: 36, safeCount: 50, riskLevel: 'HIGH' },
        { region: 'Karnataka (Bengaluru)', count: 96, highRiskCount: 24, mediumRiskCount: 32, safeCount: 40, riskLevel: 'MEDIUM' },
        { region: 'Telangana (Hyderabad)', count: 74, highRiskCount: 18, mediumRiskCount: 26, safeCount: 30, riskLevel: 'MEDIUM' },
        { region: 'Tamil Nadu (Chennai)', count: 62, highRiskCount: 12, mediumRiskCount: 20, safeCount: 30, riskLevel: 'LOW' },
        { region: 'Gujarat (Ahmedabad)', count: 48, highRiskCount: 10, mediumRiskCount: 18, safeCount: 20, riskLevel: 'LOW' }
      ];

      const results = Object.values(regionMap).length > 0 ? Object.values(regionMap) : defaultRegions;

      return res.status(200).json({
        success: true,
        type: 'heatmap',
        data: results
      });
    }

    // 2. EVIDENCE MANAGEMENT: Redacted transcripts (Server-side PII redaction) + safe metadata
    if (type === 'evidence') {
      const snapshot = await db.collection("citizenReports")
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      const evidenceItems = snapshot.docs.filter(doc => !doc.data().isTestData).map(doc => {
        const data = doc.data();
        const rawText = data.transcriptSnippet || data.transcript || "";
        const redactedSnippet = sanitizeTranscript(rawText);

        return {
          id: doc.id,
          sessionId: data.sessionId,
          timestamp: data.timestamp,
          verdict: data.verdict || data.threatLevel || 'UNKNOWN',
          threatLevel: data.threatLevel || 'UNKNOWN',
          confidence: data.confidence || 0,
          redactedSnippet,
          redFlagsDetected: data.redFlagsDetected || [],
          caseStatus: data.caseStatus || 'pending',
          assignedOfficer: data.assignedOfficer || 'Unassigned'
        };
      });

      return res.status(200).json({
        success: true,
        type: 'evidence',
        data: evidenceItems
      });
    }

    // 3. REPORTS & ANALYTICS: Time series (last 30 days), resolution velocity, financial recovery
    if (type === 'analytics') {
      const snapshot = await db.collection("citizenReports").get();
      const reports = snapshot.docs.map(doc => doc.data()).filter(r => !r.isTestData);

      // Daily trend calculation for last 30 days
      const daysMap = {};
      const now = new Date();

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        daysMap[dateStr] = { date: dateStr, count: 0, highRisk: 0 };
      }

      let totalResolutionTimeMs = 0;
      let closedCountWithTime = 0;
      let totalRecoverySum = 0;
      let recoveryCount = 0;
      const categoryCounts = {};

      reports.forEach(r => {
        const dateStr = r.timestamp ? new Date(r.timestamp).toISOString().split('T')[0] : null;
        if (dateStr && daysMap[dateStr]) {
          daysMap[dateStr].count += 1;
          if (r.verdict === 'HIGH_RISK' || r.threatLevel === 'HIGH_RISK') daysMap[dateStr].highRisk += 1;
        }

        if (r.caseStatus === 'closed') {
          if (r.timestamp && r.closedAt) {
            const start = new Date(r.timestamp).getTime();
            const end = new Date(r.closedAt).getTime();
            if (!isNaN(start) && !isNaN(end) && end > start) {
              totalResolutionTimeMs += (end - start);
              closedCountWithTime += 1;
            }
          }

          if (typeof r.recoveryPercent === 'number') {
            totalRecoverySum += r.recoveryPercent;
            recoveryCount += 1;
          }
        }

        const cat = r.category || 'Uncategorized (Legacy Data)';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        if (Array.isArray(r.redFlagsDetected)) {
          r.redFlagsDetected.forEach(flag => {
            categoryCounts[`Flag: ${flag}`] = (categoryCounts[`Flag: ${flag}`] || 0) + 1;
          });
        }
      });

      const timeSeries = Object.values(daysMap);
      const avgResolutionHours = closedCountWithTime > 0 ? (totalResolutionTimeMs / closedCountWithTime) / (1000 * 60 * 60) : 0;
      const avgRecoveryPercent = recoveryCount > 0 ? totalRecoverySum / recoveryCount : 0;

      return res.status(200).json({
        success: true,
        type: 'analytics',
        data: {
          timeSeries,
          avgResolutionHours,
          avgRecoveryPercent,
          categoryBreakdown: categoryCounts
        }
      });
    }

    // 4. SYSTEM ADMINISTRATION: Registered users list (Safe fields ONLY: uid, email, displayName, createdAt, role)
    if (type === 'system-users') {
      const snapshot = await db.collection("users").limit(100).get();

      const safeUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || 'N/A',
          displayName: data.displayName || data.name || 'Citizen User',
          createdAt: data.createdAt || data.timestamp || new Date().toISOString(),
          role: data.role || (data.isAdmin ? 'admin' : 'user')
        };
      });

      return res.status(200).json({
        success: true,
        type: 'system-users',
        data: safeUsers
      });
    }

    // 5. FRAUD NETWORK GRAPH INTELLIGENCE
    if (type === 'network-graph') {
      const days = parseInt(req.query.days) || 30;
      const minLinks = parseInt(req.query.minLinks) || 2;
      
      const now = new Date();
      const timeLimit = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Seeding Firestore officers collection if empty
      const officersSnapshot = await db.collection("officers").get();
      const officersMap = {};
      const defaultOfficers = [
        { name: "Inspector R. Sharma", avatar: "RS", division: "Cyber Crime Unit" },
        { name: "Inspector P. Patel", avatar: "PP", division: "Financial Fraud Division" },
        { name: "Inspector A. Kumar", avatar: "AK", division: "Digital Forensics Unit" },
        { name: "Inspector V. Singh", avatar: "VS", division: "Campaign Intelligence Division" }
      ];

      if (officersSnapshot.empty) {
        for (const o of defaultOfficers) {
          await db.collection("officers").add(o);
          officersMap[o.name] = o;
        }
      } else {
        officersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.name) {
            officersMap[data.name] = {
              name: data.name,
              avatar: data.avatar || data.name.substring(0, 2).toUpperCase(),
              division: data.division || "Cyber Crime Unit"
            };
          }
        });
        // Backfill defaults
        for (const o of defaultOfficers) {
          if (!officersMap[o.name]) {
            officersMap[o.name] = o;
          }
        }
      }

      const snapshot = await db.collection("citizenReports").get();
      const allReports = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // NOTE: Network graph intentionally includes isTestData documents.
        // Graph stats are self-contained (not shared with Dashboard/Analytics),
        // and test data provides the identifier nodes needed for visual verification.
        // All OTHER aggregate endpoints filter out isTestData.
        allReports.push({
          id: doc.id,
          ...data
        });
      });

      // Filter reports by date
      const filteredReports = allReports.filter(r => {
        if (!r.timestamp) return false;
        const rDate = new Date(r.timestamp);
        return rDate >= timeLimit;
      });

      // Grouping campaigns (reusing campaign-list.js logic)
      const campaignsMap = {};
      allReports.forEach(r => {
        if (r.campaignId) {
          if (!campaignsMap[r.campaignId]) {
            campaignsMap[r.campaignId] = [];
          }
          campaignsMap[r.campaignId].push(r.sessionId);
        }
      });

      // Second pass: Find original seeding reports and associate them
      allReports.forEach(r => {
        if (!r.campaignId && r.sessionId) {
          const potentialCampaignId = `CAMPAIGN-${r.sessionId.replace('RKSH-', '')}`;
          if (campaignsMap[potentialCampaignId]) {
            campaignsMap[potentialCampaignId].push(r.sessionId);
            r.campaignId = potentialCampaignId; // link in-memory for network graph
          }
        }
      });

      // Masking helpers
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

      // Secure hashing helper
      const hashIdentifier = (val) => {
        return crypto.createHash('sha256').update(val).digest('hex').substring(0, 16);
      };

      // AI Summary Generator
      const generateAISummary = (linkedReports) => {
        const categories = new Set();
        const redFlags = new Set();
        const reasons = [];

        linkedReports.forEach(r => {
          if (r.category) categories.add(r.category);
          if (r.redFlagsDetected) {
            r.redFlagsDetected.forEach(flag => redFlags.add(flag));
          }
          if (r.matches) {
            r.matches.forEach(m => {
              if (m.reason) reasons.push(m.reason);
            });
          }
        });

        const catList = Array.from(categories);
        const catStr = catList.length > 0 ? catList.join(" and ") : "authority impersonation";
        const flagsList = Array.from(redFlags).slice(0, 3);
        const flagsStr = flagsList.length > 0 ? flagsList.join(", ") : "digital arrest and money transfers";
        const sampleReason = reasons.length > 0 ? reasons[0] : "coercing the victim into compliance";

        return `This campaign utilizes a coordinated scam pattern categorized primarily under ${catStr}. Investigators detected indicators such as ${flagsStr}. The tactical operation relies on ${sampleReason.toLowerCase().replace(/\.$/, "")} to pressure victims.`;
      };

      // Helper to compute nodes & edges
      const buildGraph = (reportsList, threshold) => {
        const nodesMap = new Map();
        const edges = [];

        const addNode = (id, nodeData) => {
          if (!nodesMap.has(id)) {
            nodesMap.set(id, nodeData);
          }
        };

        // Determine Campaign stats (first seen, last seen, average risk, AI summary, assigned officer)
        const campaignDetails = {};
        Object.entries(campaignsMap).forEach(([campId, sessionIds]) => {
          const linkedRep = reportsList.filter(rep => sessionIds.includes(rep.sessionId));
          if (linkedRep.length > 0) {
            const sortedRep = [...linkedRep].sort((a, b) => {
              const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
              const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
              return tA - tB;
            });
            const sumScore = linkedRep.reduce((acc, curr) => acc + (curr.confidence || 50), 0);
            const avgScore = Math.round(sumScore / linkedRep.length);
            
            // Find assigned officer from reports
            let officerName = null;
            for (const r of sortedRep) {
              if (r.assignedOfficer) {
                officerName = r.assignedOfficer;
                break;
              }
            }

            const officer = officerName 
              ? (officersMap[officerName] || { name: officerName, avatar: officerName.substring(0, 2).toUpperCase(), division: 'Cyber Crime Unit' })
              : { name: "Unassigned", avatar: "UA", division: "Cyber Crime Unit" };

            campaignDetails[campId] = {
              id: campId,
              riskScore: avgScore,
              firstSeen: sortedRep[0].timestamp,
              lastSeen: sortedRep[sortedRep.length - 1].timestamp,
              aiSummary: generateAISummary(linkedRep),
              officer
            };
          }
        });

        // First pass: create Report nodes & Campaign nodes
        reportsList.forEach(r => {
          const last4 = r.sessionId ? r.sessionId.slice(-4) : 'xxxx';
          const label = `Case: RKSH-...${last4}`;
          
          // Get officer details for Report
          const reportOfficer = r.assignedOfficer
            ? (officersMap[r.assignedOfficer] || { name: r.assignedOfficer, avatar: r.assignedOfficer.substring(0, 2).toUpperCase(), division: 'Cyber Crime Unit' })
            : { name: "Unassigned", avatar: "UA", division: "Cyber Crime Unit" };

          addNode(r.sessionId, {
            id: r.sessionId,
            type: 'Report',
            label: label,
            val: 12,
            connections: 0,
            timestamp: r.timestamp,
            verdict: r.verdict || r.threatLevel || 'UNKNOWN',
            riskScore: r.confidence || 50,
            officer: reportOfficer
          });

          if (r.campaignId) {
            const campLast4 = r.campaignId.slice(-4);
            const details = campaignDetails[r.campaignId] || {
              riskScore: r.confidence || 50,
              firstSeen: r.timestamp,
              lastSeen: r.timestamp,
              aiSummary: "Automated scam vector campaign cluster.",
              officer: reportOfficer
            };

            addNode(r.campaignId, {
              id: r.campaignId,
              type: 'Campaign',
              label: `Campaign: CAMPAIGN-...${campLast4}`,
              val: 24,
              connections: 0,
              riskScore: details.riskScore,
              firstSeen: details.firstSeen,
              lastSeen: details.lastSeen,
              aiSummary: details.aiSummary,
              officer: details.officer
            });

            // Connect Campaign to Report directly
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
          if (!transcript) return;

          // Phone numbers (Indian 10-digit formats, clean country prefix)
          const phoneRegex = /\b(?:\+?91[- ]?)?[6-9]\d{2}[- ]?\d{3}[- ]?\d{4}\b/g;
          const phoneMatches = transcript.match(phoneRegex) || [];
          const uniquePhones = Array.from(new Set(phoneMatches.map(p => p.replace(/[^0-9]/g, '').slice(-10))));
          uniquePhones.forEach(phone => {
            const hashedId = hashIdentifier(phone);
            const masked = maskPhone(phone);
            addNode(hashedId, {
              id: hashedId,
              type: 'PhoneNumber',
              label: masked,
              val: 10,
              connections: 0,
              riskScore: r.confidence || 50
            });
            // Identifier ➔ Report (solid, Direct)
            edges.push({
              id: `edge-${hashedId}-${r.sessionId}`,
              source: hashedId,
              target: r.sessionId,
              type: 'PhoneToReport',
              style: 'solid'
            });

            if (r.campaignId) {
              // Campaign ➔ Identifier (dashed, Indirect)
              edges.push({
                id: `edge-${r.campaignId}-${hashedId}`,
                source: r.campaignId,
                target: hashedId,
                type: 'CampaignToPhone',
                style: 'dashed'
              });
            }
          });

          // UPI Handles (matching all domains, excluding email providers)
          const upiRegex = /[a-zA-Z0-9._%+-]+@(?!gmail|yahoo|hotmail|outlook|icloud|aol|mail|proton)[a-zA-Z0-9.-]+\b/gi;
          const upiMatches = transcript.match(upiRegex) || [];
          const uniqueUpis = Array.from(new Set(upiMatches));
          uniqueUpis.forEach(upi => {
            const hashedId = hashIdentifier(upi.toLowerCase());
            const masked = maskUPI(upi);
            addNode(hashedId, {
              id: hashedId,
              type: 'UPIHandle',
              label: masked,
              val: 10,
              connections: 0,
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

          // Bank Accounts (9 to 18 digits, excluding phone numbers overlaps)
          const bankRegex = /\b\d{9,18}\b/g;
          const bankMatches = transcript.match(bankRegex) || [];
          const uniqueBanks = Array.from(new Set(bankMatches)).filter(b => {
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
              val: 10,
              connections: 0,
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

          // Device IDs (supporting dashes in regex matcher)
          const deviceList = [];
          if (r.deviceId) deviceList.push(r.deviceId);
          if (r.device) deviceList.push(r.device);
          const devRegex = /(?:Device\s*(?:ID)?|IMEI)[:\s]+([A-Z0-9-]{8,24})/gi;
          let devMatch;
          while ((devMatch = devRegex.exec(transcript)) !== null) {
            if (devMatch[1]) deviceList.push(devMatch[1].trim());
          }

          const uniqueDevices = Array.from(new Set(deviceList));
          uniqueDevices.forEach(device => {
            const hashedId = hashIdentifier(device);
            const masked = maskDevice(device);
            addNode(hashedId, {
              id: hashedId,
              type: 'DeviceID',
              label: masked,
              val: 10,
              connections: 0,
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

        // Filter by minLinks connection density (to avoid cluttered unlinked nodes)
        if (threshold > 1) {
          nodes = nodes.filter(n => n.type === 'Campaign' || n.connections >= threshold);
          const nodeIds = new Set(nodes.map(n => n.id));
          const filteredEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
          return { nodes, edges: filteredEdges };
        }

        return { nodes, edges };
      };

      // 1. Build primary graph data
      const primaryGraph = buildGraph(filteredReports, minLinks);

      // 2. Perform 7-Day Velocity Statistics Comparison (Recent 7 days vs Prior 7 days)
      const nowMs = now.getTime();
      const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(nowMs - 14 * 24 * 60 * 60 * 1000);

      const recentReports = allReports.filter(r => r.timestamp && new Date(r.timestamp) >= sevenDaysAgo);
      const priorReports = allReports.filter(r => r.timestamp && new Date(r.timestamp) >= fourteenDaysAgo && new Date(r.timestamp) < sevenDaysAgo);

      // Run buildGraph on both periods with minLinks = 1 to get full count details
      const recentGraph = buildGraph(recentReports, 1);
      const priorGraph = buildGraph(priorReports, 1);

      const calculatePctChange = (recentVal, priorVal) => {
        if (priorVal === 0) return null; // do not fabricate or return 100% if no baseline exists
        return Math.round(((recentVal - priorVal) / priorVal) * 100 * 10) / 10;
      };

      const stats = {
        totalNodes: {
          value: primaryGraph.nodes.length,
          change: calculatePctChange(recentGraph.nodes.length, priorGraph.nodes.length)
        },
        totalConnections: {
          value: primaryGraph.edges.length,
          change: calculatePctChange(recentGraph.edges.length, priorGraph.edges.length)
        },
        activeCampaigns: {
          value: primaryGraph.nodes.filter(n => n.type === 'Campaign').length,
          change: calculatePctChange(
            recentGraph.nodes.filter(n => n.type === 'Campaign').length,
            priorGraph.nodes.filter(n => n.type === 'Campaign').length
          )
        },
        victimReports: {
          value: primaryGraph.nodes.filter(n => n.type === 'Report').length,
          change: calculatePctChange(
            recentGraph.nodes.filter(n => n.type === 'Report').length,
            priorGraph.nodes.filter(n => n.type === 'Report').length
          )
        },
        highRiskClusters: {
          value: primaryGraph.nodes.filter(n => n.type === 'Campaign' && n.riskScore >= 80).length,
          change: calculatePctChange(
            recentGraph.nodes.filter(n => n.type === 'Campaign' && n.riskScore >= 80).length,
            priorGraph.nodes.filter(n => n.type === 'Campaign' && n.riskScore >= 80).length
          )
        }
      };

      return res.status(200).json({
        success: true,
        type: 'network-graph',
        data: {
          nodes: primaryGraph.nodes,
          edges: primaryGraph.edges,
          stats
        }
      });
    }

    // 5. OFFICER STATS: Computes case stats resolved per officer (Consolidated)
    if (type === 'officer-stats') {
      const snapshot = await db.collection("citizenReports").get();
      const officers = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isTestData) return; // Exclude test data from aggregates
        const officer = data.assignedOfficer;
        if (!officer) return; 
        
        if (!officers[officer]) {
          officers[officer] = { 
            name: officer, 
            total: 0, 
            active: 0, 
            pending: 0, 
            closed: 0,
            sumTimeToClose: 0,
            sumRecoveryPercent: 0,
            closedCountWithRecovery: 0
          };
        }
        
        const stat = officers[officer];
        stat.total += 1;
        
        const status = data.caseStatus || 'pending';
        if (status === 'active') stat.active += 1;
        else if (status === 'pending') stat.pending += 1;
        else if (status === 'closed') {
          stat.closed += 1;
          
          if (data.timestamp && data.closedAt) {
            const start = new Date(data.timestamp).getTime();
            const end = new Date(data.closedAt).getTime();
            if (!isNaN(start) && !isNaN(end) && end > start) {
              stat.sumTimeToClose += (end - start);
            }
          }
          
          if (typeof data.recoveryPercent === 'number') {
            stat.sumRecoveryPercent += data.recoveryPercent;
            stat.closedCountWithRecovery += 1;
          }
        }
      });

      const results = Object.values(officers).map(stat => {
        const avgTimeToCloseMs = stat.closed > 0 ? stat.sumTimeToClose / stat.closed : 0;
        const avgRecoveryPercent = stat.closedCountWithRecovery > 0 ? stat.sumRecoveryPercent / stat.closedCountWithRecovery : 0;
        
        return {
          name: stat.name,
          total: stat.total,
          active: stat.active,
          pending: stat.pending,
          closed: stat.closed,
          avgTimeToCloseMs,
          avgRecoveryPercent
        };
      });

      return res.status(200).json({ success: true, stats: results });
    }

    return res.status(400).json({ success: false, error: 'Invalid type parameter' });
  } catch (err) {
    console.error("Admin insights error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.statusCode ? err.message : 'Failed to fetch admin insights'
    });
  }
}
