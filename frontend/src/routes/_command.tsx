import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SideNav, type NavGroup } from "@/components/side-nav";
import {
  LayoutDashboard, FolderSearch2, Network, Map, Landmark, Archive, FileText, BarChart3, Radio,
  ScrollText, Activity, Users, ShieldCheck, Eye,
} from "lucide-react";

export const Route = createFileRoute("/_command")({
  component: CommandLayout,
});

const groups: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { to: "/command",                label: "Threat dashboard",   icon: <LayoutDashboard className="h-4 w-4" />, badge: "Live" },
      { to: "/command/investigations", label: "Investigations",     icon: <FolderSearch2 className="h-4 w-4" /> },
      { to: "/command/network",        label: "Fraud network",      icon: <Network className="h-4 w-4" /> },
      { to: "/command/geo",            label: "Geospatial intel",   icon: <Map className="h-4 w-4" /> },
      { to: "/command/currency",       label: "FICN intelligence",  icon: <Landmark className="h-4 w-4" /> },
    ],
  },
  {
    title: "Evidence & Reporting",
    items: [
      { to: "/command/evidence",  label: "Evidence vault",       icon: <Archive className="h-4 w-4" /> },
      { to: "/command/reports",   label: "Court-ready reports",  icon: <FileText className="h-4 w-4" /> },
      { to: "/command/analytics", label: "Analytics",            icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    title: "Intel & Systems",
    items: [
      { to: "/command/threat-feed", label: "Threat feed",     icon: <Radio className="h-4 w-4" /> },
      { to: "/command/audit",       label: "Audit logs",      icon: <ScrollText className="h-4 w-4" /> },
      { to: "/command/ai-health",   label: "AI health",       icon: <Activity className="h-4 w-4" /> },
      { to: "/command/admin",       label: "Administration",  icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: "Compliance",
    items: [
      { to: "/transparency", label: "AI transparency", icon: <Eye className="h-4 w-4" /> },
      { to: "/privacy",      label: "Privacy center",  icon: <ShieldCheck className="h-4 w-4" /> },
    ],
  },
];

function CommandLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <div className="flex-1 flex">
        <SideNav groups={groups} title="Command Centre" />
        <main className="flex-1 min-w-0 bg-canvas">
          <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
