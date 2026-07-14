import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type NavItem = { to: string; label: string; icon: ReactNode; badge?: string };
export type NavGroup = { title: string; items: NavItem[] };

export function SideNav({ groups, title }: { groups: NavGroup[]; title: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:block w-60 shrink-0 border-r bg-sidebar min-h-[calc(100dvh-3.5rem)] sticky top-14 self-start">
      <div className="p-4 border-b">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Portal</div>
        <div className="font-display font-semibold mt-0.5">{title}</div>
      </div>
      <nav className="p-2 space-y-4">
        {groups.map(g => (
          <div key={g.title}>
            <div className="px-2.5 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{g.title}</div>
            <ul className="space-y-0.5">
              {g.items.map(item => {
                const active = path === item.to || (item.to !== "/" && path.startsWith(item.to + "/"));
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-sm text-foreground/80 hover:bg-accent hover:text-foreground",
                        active && "bg-navy-soft text-navy font-medium",
                      )}
                    >
                      <span className={cn("shrink-0", active ? "text-navy" : "text-muted-foreground")}>{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-mono bg-navy text-primary-foreground rounded px-1.5 py-0.5">{item.badge}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
