import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide,
  forceX,
  forceY
} from 'd3-force';
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { 
  FolderKanban, 
  Phone, 
  Send, 
  Landmark, 
  ShieldAlert, 
  RefreshCw, 
  AlertTriangle,
  X,
  Edit3,
  CheckCircle2,
  Clock,
  UserCheck,
  Percent,
  Shield,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Smartphone,
  TrendingUp,
  TrendingDown,
  GitCommit,
  Layers,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Type definitions
interface OfficerData {
  name: string;
  avatar: string;
  division: string;
}

interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: 'Report' | 'PhoneNumber' | 'UPIHandle' | 'BankAccountFragment' | 'Campaign' | 'DeviceID';
  label: string;
  val: number;
  connections: number;
  timestamp?: string;
  verdict?: string;
  riskScore: number;
  aiSummary?: string;
  firstSeen?: string;
  lastSeen?: string;
  officer?: OfficerData;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  style: 'solid' | 'dashed';
}

interface NetworkGraphSectionProps {
  user: any;
}

export default function NetworkGraphSection({ user }: NetworkGraphSectionProps) {
  const [days, setDays] = useState<number>(30);
  const [minLinks, setMinLinks] = useState<number>(2);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Interaction State
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [draggingNode, setDraggingNode] = useState<GraphNode | null>(null);
  
  // Pan and Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Case details modal state (reused from CaseManagementSection)
  const [editingCase, setEditingCase] = useState<any | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateOfficer, setUpdateOfficer] = useState('');
  const [updateRecovery, setUpdateRecovery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // List linked cases modal
  const [showCasesModal, setShowCasesModal] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<any>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setHoveredNode(null);
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const res = await fetch(`/api/admin-insights?type=network-graph&days=${days}&minLinks=${minLinks}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Failed to fetch graph: Non-JSON response');
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch graph data');
      }

      // Initialize positions in a circle to help layout converge faster
      const rawNodes = json.data.nodes || [];
      const rawEdges = json.data.edges || [];
      const width = 800;
      const height = 500;

      const initializedNodes = rawNodes.map((n: any, idx: number) => {
        const angle = (idx / rawNodes.length) * 2 * Math.PI;
        const radius = 150 + Math.random() * 50;
        return {
          ...n,
          x: width / 2 + radius * Math.cos(angle),
          y: height / 2 + radius * Math.sin(angle),
          connections: n.connections || 0,
          riskScore: n.riskScore || 50
        };
      });

      setNodes(initializedNodes);
      setLinks(rawEdges.map((e: any) => ({ ...e })));
      setStats(json.data.stats || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred loading the network graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGraphData();
    }
  }, [user, days, minLinks]);

  // Set up D3 force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const width = 800;
    const height = 500;

    // 1. Group nodes by connected Campaign cluster to apply separation force
    const nodeCampaigns = new Map<string, string>();
    nodes.forEach(n => {
      if (n.type === 'Campaign') {
        nodeCampaigns.set(n.id, n.id);
      }
    });

    // Propagate campaign assignment through links to assign each node to a cluster
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
      changed = false;
      iterations++;
      links.forEach(l => {
        const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        
        const sCamp = nodeCampaigns.get(sId);
        const tCamp = nodeCampaigns.get(tId);
        
        if (sCamp && !tCamp) {
          nodeCampaigns.set(tId, sCamp);
          changed = true;
        } else if (tCamp && !sCamp) {
          nodeCampaigns.set(sId, tCamp);
          changed = true;
        }
      });
    }

    const campaignIds = Array.from(new Set(nodes.filter(n => n.type === 'Campaign').map(n => n.id)));

    // Run simulation
    const sim = forceSimulation<GraphNode>(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => {
          if (d.type === 'CampaignToReport' || d.type === 'ReportToCampaign') return 130;
          return 150;
        })
      )
      .force('charge', forceManyBody<GraphNode>().strength(d => d.type === 'Campaign' ? -700 : -250))
      .force('collide', forceCollide<GraphNode>().radius(d => {
        if (d.type === 'Campaign') return 65;
        if (d.type === 'Report') return 55; // spacing for victim labels
        return 40; // spacing for phone/upi/bank labels
      }).iterations(3))
      .force('center', forceCenter(width / 2, height / 2))
      .force('x', forceX<GraphNode>(d => {
        const campId = nodeCampaigns.get(d.id);
        if (campId && campaignIds.length > 1) {
          const idx = campaignIds.indexOf(campId);
          return width * (0.22 + (0.56 * idx) / (campaignIds.length - 1));
        }
        return width / 2;
      }).strength(0.18))
      .force('y', forceY<GraphNode>(height / 2).strength(0.12));

    sim.on('tick', () => {
      // Force react updates by cloning node and link arrays
      setNodes([...nodes]);
      setLinks([...links]);
    });

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes.length]); // Re-run simulation only if node list length changes

  // Map node types to colors & icons
  const getNodeConfig = (type: string, riskScore: number = 50, verdict?: string) => {
    // Risk coloring: High >= 80 (Red), Medium 50-79 (Orange), Low < 50 (Green)
    const isHigh = riskScore >= 80 || verdict === 'HIGH_RISK';
    const isMedium = (riskScore >= 50 && riskScore < 80) || verdict === 'UNCERTAIN' || verdict === 'MEDIUM_RISK';
    
    const riskFillHex = isHigh ? '#EF4444' : isMedium ? '#F59E0B' : '#10B981';
    
    switch (type) {
      case 'Report':
        return {
          icon: FolderKanban,
          color: cn('text-white border-slate-200', isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'),
          glow: isHigh ? 'ring-2 ring-red-400/50 shadow-md shadow-red-500/20' : 'ring-1 ring-slate-350',
          fill: riskFillHex
        };
      case 'PhoneNumber':
        return {
          icon: Phone,
          color: 'bg-indigo-600 border-indigo-700 text-white',
          glow: 'ring-1 ring-indigo-400/50',
          fill: '#4F46E5'
        };
      case 'UPIHandle':
        return {
          icon: Send,
          color: 'bg-teal-600 border-teal-700 text-white',
          glow: 'ring-1 ring-teal-400/50',
          fill: '#0D9488'
        };
      case 'BankAccountFragment':
        return {
          icon: Landmark,
          color: 'bg-orange-600 border-orange-700 text-white',
          glow: 'ring-1 ring-orange-400/50',
          fill: '#EA580C'
        };
      case 'DeviceID':
        return {
          icon: Smartphone,
          color: 'bg-slate-600 border-slate-700 text-white',
          glow: 'ring-1 ring-slate-400/50',
          fill: '#475569'
        };
      case 'Campaign':
        return {
          icon: ShieldAlert,
          color: cn('border-red-600 border-2', isHigh ? 'bg-red-950 text-red-500' : isMedium ? 'bg-amber-950 text-amber-500' : 'bg-emerald-950 text-emerald-500'),
          glow: cn('animate-pulse shadow-lg ring-2', isHigh ? 'ring-red-500/50 shadow-red-950/40' : isMedium ? 'ring-amber-500/50 shadow-amber-950/40' : 'ring-emerald-500/50 shadow-emerald-950/40'),
          fill: '#0F172A' // Dark slate core
        };
      default:
        return {
          icon: Shield,
          color: 'bg-slate-500 border-slate-600 text-white',
          glow: 'ring-1 ring-slate-400',
          fill: '#6B7280'
        };
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.2));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // SVG Pan & Drag Handlers
  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    } else if (draggingNode) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        // Reverse translate and scale to set coordinates in SVG space
        draggingNode.fx = (clientX - pan.x) / zoom;
        draggingNode.fy = (clientY - pan.y) / zoom;

        // Reboot simulation alpha to heat layout calculations
        simulationRef.current?.alphaTarget(0.2).restart();
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (draggingNode) {
      draggingNode.fx = null;
      draggingNode.fy = null;
      setDraggingNode(null);
      simulationRef.current?.alphaTarget(0);
    }
  };

  // Node mouse events
  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    setDraggingNode(node);
    node.fx = node.x;
    node.fy = node.y;
  };

  const handleNodeClick = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    setSelectedNode(node === selectedNode ? null : node);
  };

  // Case detail fetching to trigger editing modal
  const handleManageCase = async (reportId: string) => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      // Query database for case info
      const res = await fetch(`/api/admin-cases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch case list');
      
      const found = data.cases.find((c: any) => c.id === reportId || c.sessionId === reportId);
      if (found) {
        setEditingCase(found);
        setUpdateStatus(found.caseStatus || 'pending');
        setUpdateOfficer(found.assignedOfficer || '');
        setUpdateRecovery(found.recoveryPercent !== null && found.recoveryPercent !== undefined ? String(found.recoveryPercent) : '');
      } else {
        // Mock fallback if not in first 100 cases
        setEditingCase({
          id: reportId,
          sessionId: reportId,
          timestamp: new Date().toISOString(),
          verdict: 'HIGH_RISK',
          threatLevel: 'HIGH_RISK',
          caseStatus: 'pending',
          assignedOfficer: '',
          recoveryPercent: null,
          transcript: 'Scam call transcript log loaded. Identity verification required.'
        });
        setUpdateStatus('pending');
        setUpdateOfficer('');
        setUpdateRecovery('');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to retrieve case details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCase = async () => {
    if (!editingCase) return;
    setIsUpdating(true);
    setUpdateSuccess(null);
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Authentication token required");

      const body: any = { caseId: editingCase.id };
      if (updateStatus) body.caseStatus = updateStatus;
      if (updateOfficer !== undefined) body.assignedOfficer = updateOfficer;
      if (updateRecovery !== '') body.recoveryPercent = Number(updateRecovery);
      
      if (updateStatus === 'closed' && editingCase.caseStatus !== 'closed') {
        body.closedAt = new Date().toISOString();
      }

      const res = await fetch('/api/admin-update-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Vercel API failed: Server returned non-JSON response');
      }
      
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update case');
      }

      setUpdateSuccess(`Case details saved successfully.`);
      
      // Update local nodes state if relevant
      setNodes(prev => prev.map(n => n.id === editingCase.id ? { ...n, verdict: updateStatus === 'closed' ? 'SAFE' : n.verdict } : n));

      setTimeout(() => {
        setEditingCase(null);
        setUpdateSuccess(null);
        // Refresh graph data to show updated stats/averages
        fetchGraphData();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update case");
    } finally {
      setIsUpdating(false);
    }
  };

  // Neighborhood selection logic
  const getNeighborhood = (centerNode: GraphNode | null) => {
    if (!centerNode) return null;
    const connectedIds = new Set<string>();
    connectedIds.add(centerNode.id);
    
    links.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      
      if (sId === centerNode.id) connectedIds.add(tId);
      if (tId === centerNode.id) connectedIds.add(sId);
    });
    return connectedIds;
  };

  // Highlight selection based on either mouse hover OR search term
  const highlightSet = useMemo(() => {
    if (hoveredNode) {
      return getNeighborhood(hoveredNode);
    }
    if (searchTerm.trim()) {
      const matches = new Set<string>();
      nodes.forEach(n => {
        if (n.label.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches.add(n.id);
          // Add its direct connections
          links.forEach(l => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            if (sId === n.id) matches.add(tId);
            if (tId === n.id) matches.add(sId);
          });
        }
      });
      return matches.size > 0 ? matches : null;
    }
    return null;
  }, [hoveredNode, searchTerm, nodes, links]);

  // Connected reports list for side panel details
  const connectedReports = useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.type === 'Report') return [selectedNode];
    
    const connectedIds = new Set<string>();
    links.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      
      if (sId === selectedNode.id) connectedIds.add(tId);
      if (tId === selectedNode.id) connectedIds.add(sId);
    });

    return nodes.filter(n => n.type === 'Report' && connectedIds.has(n.id));
  }, [selectedNode, nodes, links]);

  // Connected identifiers breakdown for Campaign nodes
  const campaignIdentifiers = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'Campaign') return null;
    
    const connectedNodeIds = new Set<string>();
    links.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if (sId === selectedNode.id) connectedNodeIds.add(tId);
      if (tId === selectedNode.id) connectedNodeIds.add(sId);
    });

    const connectedNodes = nodes.filter(n => connectedNodeIds.has(n.id));
    return {
      reports: connectedNodes.filter(n => n.type === 'Report').length,
      phones: connectedNodes.filter(n => n.type === 'PhoneNumber').length,
      upis: connectedNodes.filter(n => n.type === 'UPIHandle').length,
      banks: connectedNodes.filter(n => n.type === 'BankAccountFragment').length,
      devices: connectedNodes.filter(n => n.type === 'DeviceID').length
    };
  }, [selectedNode, nodes, links]);

  // Render change badge
  const renderChangeBadge = (change: number) => {
    if (change === undefined || change === null) return null;
    const isPositive = change > 0;
    const isZero = change === 0;

    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
        isZero ? "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400" :
        isPositive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40" :
        "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/40"
      )}>
        {isZero ? null : isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? `+${change}%` : `${change}%`}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Input Gated in Top Right of entire section */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">Fraud Intelligence Center</span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="text-xs bg-white dark:bg-slate-900 border border-gray-350 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            
            <select
              value={minLinks}
              onChange={(e) => setMinLinks(Number(e.target.value))}
              className="text-xs bg-white dark:bg-slate-900 border border-gray-350 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={1}>All Connections</option>
              <option value={2}>Shared Identifiers (Min 2)</option>
              <option value={3}>Dense Clusters (Min 3)</option>
            </select>
          </div>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone, UPI, account, campaign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* TOP STATS BAR (Only shown when not fullscreen) */}
      {!isFullscreen && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in duration-300">
          {/* Card 1: Total Nodes */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Nodes</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalNodes.value}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 rounded-xl">
                <GitCommit className="h-5 w-5" />
              </div>
              {renderChangeBadge(stats.totalNodes.change)}
            </div>
          </div>

          {/* Card 2: Total Connections */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connections</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalConnections.value}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-xl">
                <Send className="h-5 w-5 rotate-45" />
              </div>
              {renderChangeBadge(stats.totalConnections.change)}
            </div>
          </div>

          {/* Card 3: Active Campaigns */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Campaigns</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.activeCampaigns.value}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="p-2.5 bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400 rounded-xl">
                <ShieldAlert className="h-5 w-5" />
              </div>
              {renderChangeBadge(stats.activeCampaigns.change)}
            </div>
          </div>

          {/* Card 4: Victim Reports */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Victim Reports</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.victimReports.value}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="p-2.5 bg-amber-50 text-amber-650 dark:bg-amber-950/20 dark:text-amber-400 rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              {renderChangeBadge(stats.victimReports.change)}
            </div>
          </div>

          {/* Card 5: High Risk Clusters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">High Risk Clusters</span>
              <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.highRiskClusters.value}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="p-2.5 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-xl">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              {renderChangeBadge(stats.highRiskClusters.change)}
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas & Inspector Layout */}
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-4 gap-6",
        isFullscreen && "fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 p-6 h-screen w-screen overflow-hidden"
      )}>
        {/* Visual Graph panel */}
        <div className={cn(
          "bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden relative flex flex-col justify-end",
          isFullscreen ? "lg:col-span-3 h-full border-none shadow-none" : "lg:col-span-3 h-[560px]"
        )}>
          {/* Header toolbar */}
          <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-gray-200 dark:border-slate-850 rounded-lg p-1 flex items-center gap-1 shadow-md z-15">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 rounded transition-colors cursor-pointer"
              title="Reset Zoom (1:1)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="w-px h-4 bg-gray-200 dark:bg-slate-800 mx-0.5" />
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 rounded transition-colors cursor-pointer animate-in zoom-in duration-200"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Legend (top-left inside panel) */}
          <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-gray-200 dark:border-slate-850 rounded-xl p-3.5 text-[9px] space-y-1.5 shadow-md max-w-[200px] z-10">
            <span className="font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider block mb-1">Node Legend</span>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-slate-900 border-2 border-red-500 flex items-center justify-center animate-pulse"><ShieldAlert size={9} className="text-red-500" /></span>
              <span className="text-gray-700 dark:text-slate-350 font-bold text-red-500">Campaign (Scam Hub)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-red-500 border border-white flex items-center justify-center"><FolderKanban size={9} className="text-white" /></span>
              <span className="text-gray-700 dark:text-slate-350">Report (Victim Case)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-indigo-650 border border-white flex items-center justify-center"><Phone size={9} className="text-white" /></span>
              <span className="text-gray-700 dark:text-slate-350">Phone Number</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-teal-600 border border-white flex items-center justify-center"><Send size={9} className="text-white" /></span>
              <span className="text-gray-700 dark:text-slate-350">UPI Handle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-orange-655 border border-white flex items-center justify-center"><Landmark size={9} className="text-white" /></span>
              <span className="text-gray-700 dark:text-slate-350">Bank Account</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-slate-600 border border-white flex items-center justify-center"><Smartphone size={9} className="text-white" /></span>
              <span className="text-gray-700 dark:text-slate-350 font-semibold">Device ID</span>
            </div>
          </div>

          {/* Bottom-left legend: risk color coding + line-style key */}
          <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-gray-200 dark:border-slate-850 rounded-xl p-3.5 text-[9px] space-y-2.5 shadow-md max-w-[200px] z-10 leading-normal">
            <div>
              <span className="font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider block mb-1">Threat Risk Code</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-gray-600 dark:text-slate-350">High Risk (80-100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-gray-600 dark:text-slate-350">Medium Risk (50-79)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-gray-600 dark:text-slate-350">Low Risk (0-49)</span>
              </div>
            </div>
            
            <div className="border-t border-gray-150 dark:border-slate-800 pt-1.5">
              <span className="font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider block mb-1">Link Connectivity</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block w-6 h-[2px] bg-slate-400" />
                <span className="text-gray-600 dark:text-slate-350">Direct Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-6 border-b border-red-400 border-dashed border-[2px]" />
                <span className="text-gray-600 dark:text-slate-350">Indirect Connection</span>
              </div>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 z-10 flex flex-col items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-red-600 mb-2" />
              <p className="text-sm font-semibold text-gray-650 dark:text-slate-300">Rendering intelligence network graph...</p>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-red-650 mb-2 animate-bounce" />
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchGraphData}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow cursor-pointer"
              >
                Retry Request
              </button>
            </div>
          ) : nodes.length === 0 && !loading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-gray-500">
              <ShieldAlert className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm font-bold">No scam network clusters identified in the last {days} days.</p>
              <p className="text-xs text-gray-400 mt-1">Try expanding the scope timeframe or choosing "All Nodes".</p>
            </div>
          ) : null}

          {/* D3 visual SVG canvas */}
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="bg-slate-50 dark:bg-slate-950 cursor-grab active:cursor-grabbing"
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Edges / Connections */}
              <g>
                {links.map((link) => {
                  const sourceNode = typeof link.source === 'object' ? (link.source as GraphNode) : nodes.find(n => n.id === link.source);
                  const targetNode = typeof link.target === 'object' ? (link.target as GraphNode) : nodes.find(n => n.id === link.target);
                  
                  if (!sourceNode || !targetNode) return null;
                  
                  // Highlight check
                  const isHighlighted = highlightSet 
                    ? highlightSet.has(sourceNode.id) && highlightSet.has(targetNode.id)
                    : true;
                  
                  const isDimmed = highlightSet && !isHighlighted;

                  return (
                    <line
                      key={link.id}
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={link.style === 'dashed' ? '#EF4444' : '#94A3B8'}
                      strokeWidth={link.style === 'dashed' ? 2 : 1.5}
                      strokeDasharray={link.style === 'dashed' ? '4 4' : undefined}
                      style={{
                        opacity: isDimmed ? 0.05 : 0.75,
                        transition: 'opacity 0.3s ease'
                      }}
                    />
                  );
                })}
              </g>

              {/* Node Drawing */}
              <g>
                {nodes.map((node) => {
                  const { icon: IconComponent, glow, fill } = getNodeConfig(node.type, node.riskScore, node.verdict);
                  
                  // Highlight check
                  const isHighlighted = highlightSet ? highlightSet.has(node.id) : true;
                  const isDimmed = highlightSet && !isHighlighted;
                  const isSelected = selectedNode?.id === node.id;
                  
                  const isSearchMatch = searchTerm.trim() && node.label.toLowerCase().includes(searchTerm.toLowerCase());
                  const radius = node.val || 12;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x || 0}, ${node.y || 0})`}
                      className="cursor-pointer transition-[opacity] duration-300"
                      style={{ opacity: isDimmed ? 0.15 : 1 }}
                      onMouseDown={(e) => handleNodeMouseDown(e, node)}
                      onClick={(e) => handleNodeClick(e, node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Selection/Search highlight ring */}
                      {(isSelected || isSearchMatch || isHighlighted && (hoveredNode || selectedNode)) && (
                        <circle
                          r={radius + 8}
                          fill="none"
                          stroke={node.type === 'Campaign' ? '#EF4444' : isSearchMatch ? '#3B82F6' : '#6366F1'}
                          strokeWidth={2.5}
                          className={cn(
                            "opacity-45 animate-ping",
                            isSelected || isSearchMatch ? "stroke-blue-500 scale-110" : "stroke-blue-400"
                          )}
                          style={{ animationDuration: '3s' }}
                        />
                      )}

                      {/* Node core circle */}
                      <circle
                        r={radius}
                        fill={fill}
                        className={cn(
                          "stroke-[2.5] stroke-white dark:stroke-slate-900 shadow-xl",
                          glow
                        )}
                      />

                      {/* Render Icon inside Node */}
                      <g transform={`translate(-${radius - 3}, -${radius - 3})`}>
                        <foreignObject
                          width={(radius - 3) * 2}
                          height={(radius - 3) * 2}
                          style={{ pointerEvents: 'none' }}
                        >
                          <div className="flex items-center justify-center w-full h-full text-white">
                            <IconComponent size={radius * 1.0} className="stroke-[2.5]" />
                          </div>
                        </foreignObject>
                      </g>

                      {/* Label Text below node */}
                      <text
                        y={radius + 14}
                        textAnchor="middle"
                        className={cn(
                          "text-[9px] font-mono select-none px-1 rounded transition-colors fill-slate-700 dark:fill-slate-350 font-bold",
                          isSelected && "fill-blue-600 dark:fill-blue-400 text-[10px] font-black"
                        )}
                        style={{
                          textShadow: '0px 1px 2px rgba(255,255,255,0.95)'
                        }}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>

        {/* Side Panel Inspector details Column */}
        <div className={cn(
          "bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between overflow-hidden",
          isFullscreen ? "h-full border-none shadow-none" : "h-[560px]"
        )}>
          {selectedNode ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden space-y-4">
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Node Metadata Header */}
                <div className="border-b border-gray-150 dark:border-slate-800 pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Inspection Node</span>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white font-mono break-all mt-0.5">{selectedNode.label}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* CAMPAIGN SPECIFIC VIEW */}
                {selectedNode.type === 'Campaign' ? (
                  <div className="space-y-4 animate-in slide-in-from-right-2 duration-200">
                    {/* Risk Badge and Score */}
                    <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-200 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Risk Level</span>
                        <div className="mt-1">
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-black rounded-md border",
                            selectedNode.riskScore >= 80 ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-950/40" :
                            selectedNode.riskScore >= 50 ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-950/40" :
                            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/40"
                          )}>
                            {selectedNode.riskScore >= 80 ? 'HIGH RISK' : selectedNode.riskScore >= 50 ? 'MEDIUM RISK' : 'LOW RISK'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Risk Score</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white">{selectedNode.riskScore}/100</span>
                      </div>
                    </div>

                    {/* Timeline dates */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-200 dark:border-slate-850">
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider block">First Incident</span>
                        <span className="font-medium text-gray-800 dark:text-slate-350">
                          {selectedNode.firstSeen ? new Date(selectedNode.firstSeen).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider block">Last Active</span>
                        <span className="font-medium text-gray-800 dark:text-slate-350">
                          {selectedNode.lastSeen ? new Date(selectedNode.lastSeen).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Linked Identifiers breakdown */}
                    {campaignIdentifiers && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Linked Vector Footprint</span>
                        <div className="bg-white dark:bg-slate-850 border border-gray-150 dark:border-slate-800 rounded-xl divide-y divide-gray-150 dark:divide-slate-800 overflow-hidden text-xs">
                          <div className="p-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-650 dark:text-slate-300">
                              <FolderKanban size={13} className="text-blue-500" /> Linked Cases
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{campaignIdentifiers.reports}</span>
                          </div>
                          <div className="p-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-650 dark:text-slate-300">
                              <Phone size={13} className="text-indigo-500" /> Phone Numbers
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{campaignIdentifiers.phones}</span>
                          </div>
                          <div className="p-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-650 dark:text-slate-300">
                              <Send size={13} className="text-teal-500" /> UPI Handles
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{campaignIdentifiers.upis}</span>
                          </div>
                          <div className="p-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-650 dark:text-slate-300">
                              <Landmark size={13} className="text-orange-500" /> Bank Accounts
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{campaignIdentifiers.banks}</span>
                          </div>
                          <div className="p-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-650 dark:text-slate-300">
                              <Smartphone size={13} className="text-slate-500" /> Device IDs
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{campaignIdentifiers.devices}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Pattern Summary */}
                    {selectedNode.aiSummary && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">AI Pattern Summary</span>
                        <div className="p-3 bg-blue-50/50 dark:bg-slate-950 border border-blue-100 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-slate-300 leading-relaxed italic">
                          {selectedNode.aiSummary}
                        </div>
                      </div>
                    )}

                    {/* Assigned Officer */}
                    {selectedNode.officer && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Assigned Officer</span>
                        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-gray-200 dark:border-slate-850">
                          <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center border border-slate-700">
                            {selectedNode.officer.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-950 dark:text-slate-200">{selectedNode.officer.name}</p>
                            <p className="text-[9px] text-gray-450 uppercase font-semibold">{selectedNode.officer.division}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // GENERAL NODE / CASE LIST VIEW
                  <div className="space-y-3 animate-in slide-in-from-right-2 duration-200">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Associated Crime Reports ({connectedReports.length})</span>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                      {connectedReports.map((r) => (
                        <div 
                          key={r.id}
                          className="bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-gray-150 dark:border-slate-800 flex items-center justify-between text-xs hover:border-gray-300 dark:hover:border-slate-700"
                        >
                          <div className="font-mono">
                            <div className="flex items-center gap-1.5 font-bold text-gray-950 dark:text-slate-200">
                              <Shield size={12} className="text-red-500 shrink-0" />
                              <span>#{r.id.substring(0, 10)}</span>
                            </div>
                            <span className={cn(
                              "inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1.5 border",
                              r.verdict === 'HIGH_RISK' ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-950/45" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"
                            )}>
                              {r.verdict}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleManageCase(r.id)}
                            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={10} />
                            Manage
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View cases action button at bottom of Side Panel */}
              {selectedNode.type === 'Campaign' && (
                <button
                  onClick={() => setShowCasesModal(true)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FolderKanban size={13} />
                  View All Linked Cases
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-slate-500 p-4">
              <Shield className="h-8 w-8 text-gray-250 dark:text-slate-800 mb-2" />
              <span className="text-xs leading-relaxed">Select a campaign cluster or identifier node on the graph to inspect scam summaries, dynamic AI patterns, and assigned cybercrime officers.</span>
            </div>
          )}
        </div>
      </div>

      {/* Reused Case Update Modal from CaseManagementSection */}
      {editingCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-250 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FolderKanban className="h-5 w-5 text-red-500" />
                <h3 className="text-sm font-bold">Manage Case #{editingCase.id.substring(0, 10)}</h3>
              </div>
              <button 
                onClick={() => setEditingCase(null)}
                className="text-slate-450 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {updateSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {updateSuccess}
                </div>
              )}

              <div className="bg-gray-50 dark:bg-slate-950 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs text-gray-655 dark:text-slate-450 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700 dark:text-slate-350">Reported:</span>
                  <span>{new Date(editingCase.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700 dark:text-slate-350">Threat Verdict:</span>
                  <span className="font-bold text-red-650">{editingCase.verdict || editingCase.threatLevel}</span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-350 mb-1.5">Investigation Status</label>
                  <select 
                    value={updateStatus} 
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-850 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="active">Active Investigation</option>
                    <option value="closed">Case Closed & Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-350 mb-1.5">Assigned Officer</label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-450" />
                    <input
                      type="text"
                      placeholder="e.g. Inspector R. Sharma"
                      value={updateOfficer}
                      onChange={(e) => setUpdateOfficer(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-850 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                {updateStatus === 'closed' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-350 mb-1.5">Financial Recovery Percentage (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-455" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 85"
                        value={updateRecovery}
                        onChange={(e) => setUpdateRecovery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-850 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <button 
                  onClick={() => setEditingCase(null)} 
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateCase} 
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-650 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal to View All Linked Cases for Selected Campaign */}
      {showCasesModal && selectedNode && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-red-500" />
                <h3 className="text-sm font-bold">Linked Cases: {selectedNode.label}</h3>
              </div>
              <button 
                onClick={() => setShowCasesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-slate-800 space-y-4">
              {connectedReports.length > 0 ? (
                <div className="space-y-3">
                  {connectedReports.map((r) => (
                    <div 
                      key={r.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 dark:text-slate-100">#{r.id}</span>
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] font-bold rounded-md border",
                            r.verdict === 'HIGH_RISK' ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-950/40" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"
                          )}>
                            {r.verdict}
                          </span>
                        </div>
                        {r.timestamp && (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Reported: {new Date(r.timestamp).toLocaleString()}
                          </p>
                        )}
                        {r.officer && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                            <UserCheck className="h-3 w-3 text-blue-500" /> Assigned: {r.officer.name} ({r.officer.division})
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowCasesModal(false);
                          handleManageCase(r.id);
                        }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-center"
                      >
                        <Edit3 size={11} />
                        Manage Case
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-500 py-8">No linked report documents.</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowCasesModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Close list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
