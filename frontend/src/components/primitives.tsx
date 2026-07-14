import { cn } from "@/lib/utils";

// A minimal set of reusable primitives for the platform.

export function SectionHeader({
  eyebrow, title, description, actions, className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6", className)}>
      <div>
        {eyebrow && (
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl md:text-[28px] font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label, value, delta, trend, hint, icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  icon?: React.ReactNode;
}) {
  const trendColor =
    trend === "up" ? "text-destructive" : trend === "down" ? "text-success" : "text-muted-foreground";
  return (
    <div className="gov-card p-4">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
        {icon && <div className="text-muted-foreground/60">{icon}</div>}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && <span className={cn("font-medium tabular-nums", trendColor)}>{delta}</span>}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function StatusPill({
  tone = "neutral", children, dot = true,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "navy";
  children: React.ReactNode;
  dot?: boolean;
}) {
  const map: Record<string, string> = {
    neutral: "bg-muted text-foreground/80 border-border",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-[color:var(--warning)] border-warning/25",
    danger: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-info/10 text-info border-info/20",
    navy: "bg-navy/8 text-navy border-navy/15",
  };
  const dotMap: Record<string, string> = {
    neutral: "bg-muted-foreground",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    info: "bg-info",
    navy: "bg-navy",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", map[tone])}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotMap[tone])} />}
      {children}
    </span>
  );
}

export function RiskMeter({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone = clamped >= 75 ? "danger" : clamped >= 50 ? "warning" : clamped >= 25 ? "info" : "success";
  const label = clamped >= 75 ? "High risk" : clamped >= 50 ? "Suspicious" : clamped >= 25 ? "Low risk" : "Safe";
  const color = tone === "danger" ? "var(--destructive)" : tone === "warning" ? "var(--warning)" : tone === "info" ? "var(--info)" : "var(--success)";
  return (
    <div className="gov-card p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Risk Score</div>
        <StatusPill tone={tone as any}>{label}</StatusPill>
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="font-display text-5xl font-semibold tabular-nums" style={{ color }}>{clamped}</div>
        <div className="text-xs text-muted-foreground pb-2">/ 100 confidence</div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${clamped}%`, background: color }} />
      </div>
      <div className="mt-3 grid grid-cols-4 text-[10px] font-mono uppercase text-muted-foreground">
        <span>Safe</span><span>Low</span><span>Susp.</span><span className="text-right">High</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="gov-card p-10 text-center">
      {icon && <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-muted grid place-items-center text-muted-foreground">{icon}</div>}
      <div className="font-medium">{title}</div>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function KBD({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {children}
    </kbd>
  );
}
