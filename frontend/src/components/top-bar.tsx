import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, Moon, Sun, Type, Globe, ChevronDown, LifeBuoy } from "lucide-react";
import { useApp, type Lang, type Role } from "./app-providers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const roles: { id: Role; label: string; hint: string }[] = [
  { id: "citizen", label: "Citizen", hint: "Personal fraud shield" },
  { id: "lea", label: "Law Enforcement", hint: "Investigation & intel" },
  { id: "bank", label: "Financial Institution", hint: "Bank / NBFC operations" },
  { id: "admin", label: "Administrator", hint: "Platform administration" },
];

const langs: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
  { id: "ta", label: "தமிழ்" },
  { id: "te", label: "తెలుగు" },
  { id: "bn", label: "বাংলা" },
  { id: "mr", label: "मराठी" },
  { id: "gu", label: "ગુજરાતી" },
  { id: "kn", label: "ಕನ್ನಡ" },
  { id: "ml", label: "മലയാളം" },
  { id: "pa", label: "ਪੰਜਾਬੀ" },
  { id: "or", label: "ଓଡ଼ିଆ" },
  { id: "as", label: "অসমীয়া" },
];

export function TopBar() {
  const { role, setRole, lang, setLang, senior, setSenior, dark, setDark } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const inCommand = path.startsWith("/command");

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <div className="tricolor-strip h-[3px] w-full" aria-hidden />
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded bg-navy text-primary-foreground grid place-items-center">
            <Shield className="h-4.5 w-4.5" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-semibold text-[15px] tracking-tight">Suraksha Bharat</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Digital Public Safety Intel
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-6 text-sm">
          <NavLink to="/" label="Home" />
          <NavLink to="/citizen" label="Citizen Portal" />
          <NavLink to="/command" label="Command Centre" />
          <NavLink to="/transparency" label="AI Transparency" />
          <NavLink to="/privacy" label="Privacy" />
          <NavLink to="/status" label="Status" />
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 font-normal">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="hidden sm:inline text-xs">{roles.find(r => r.id === role)?.label}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs">Active role · demo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {roles.map(r => (
                <DropdownMenuItem key={r.id} onClick={() => setRole(r.id)} className="flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2 w-full">
                    <span className={`h-1.5 w-1.5 rounded-full ${role === r.id ? "bg-navy" : "bg-muted-foreground/40"}`} />
                    <span className="text-sm">{r.label}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground pl-3.5">{r.hint}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={inCommand ? "/citizen" : "/command"} className="text-xs">
                  Switch to {inCommand ? "Citizen Portal" : "Command Centre"} →
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Language">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Language · 12 supported</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {langs.map(l => (
                <DropdownMenuItem key={l.id} onClick={() => setLang(l.id)}>
                  <span className={`h-1.5 w-1.5 rounded-full mr-2 ${lang === l.id ? "bg-navy" : "bg-transparent"}`} />
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={senior ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            aria-label="Grandparent mode / large text"
            aria-pressed={senior}
            onClick={() => setSenior(!senior)}
            title="Grandparent Mode"
          >
            <Type className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Toggle dark mode"
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="Help">
            <Link to="/help"><LifeBuoy className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="px-2.5 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      activeProps={{ className: "px-2.5 py-1.5 rounded text-navy font-medium bg-navy-soft" }}
      activeOptions={{ exact: to === "/" }}
    >
      {label}
    </Link>
  );
}
