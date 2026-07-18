import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SideNav, type NavGroup } from "@/components/side-nav";
import { Home, MessageSquare, Mic, Image as ImageIcon, ScanLine, Timer, FileText, BookOpen, Settings, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_citizen")({
  component: CitizenLayout,
});

const groups: NavGroup[] = [
  {
    title: "Protection",
    items: [
      { to: "/citizen",                  label: "Home",              icon: <Home className="h-4 w-4" /> },
      { to: "/citizen/analyze/chat",     label: "Chat analyzer",     icon: <MessageSquare className="h-4 w-4" />, badge: "AI" },
      { to: "/citizen/analyze/voice",    label: "Voice analyzer",    icon: <Mic className="h-4 w-4" /> },
      { to: "/citizen/analyze/image",    label: "Screenshot & OCR",  icon: <ImageIcon className="h-4 w-4" /> },
      { to: "/citizen/analyze/currency", label: "Currency check",    icon: <ScanLine className="h-4 w-4" /> },
    ],
  },
  {
    title: "Response",
    items: [
      { to: "/citizen/cooling-off", label: "Cooling-off timer", icon: <Timer className="h-4 w-4" /> },
      { to: "/citizen/report",      label: "Report to NCRP",    icon: <FileText className="h-4 w-4" /> },
      { to: "/citizen/learn",       label: "Scam library",      icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/settings",      label: "Settings",         icon: <Settings className="h-4 w-4" /> },
      { to: "/privacy",       label: "My privacy",       icon: <ShieldCheck className="h-4 w-4" /> },
    ],
  },
];

function CitizenLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <div className="flex-1 flex">
        <SideNav groups={groups} title="Citizen Protection" />
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-[1200px] px-4 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
