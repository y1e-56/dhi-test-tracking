import { cn } from "@/lib/utils";
import {
  CRITICALITY_LABEL,
  HEALTH_LABEL,
  CAMPAIGN_STATUS_LABEL,
  DEFECT_STATUS_LABEL,
  SEVERITY_LABEL,
  VERDICT_LABEL,
  healthOf,
  type CampaignStatus,
  type Criticality,
  type DefectStatus,
  type Severity,
  type Verdict,
} from "@/lib/dhi-data";
import type { ReactNode } from "react";

const pill =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

export function HealthBadge({ score }: { score: number }) {
  const h = healthOf(score);
  return (
    <span
      className={cn(
        pill,
        h === "sain" && "border-success/30 bg-success-soft text-success",
        h === "risque" && "border-warning/40 bg-warning-soft text-warning",
        h === "critique" && "border-danger/30 bg-danger-soft text-danger",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {HEALTH_LABEL[h]}
    </span>
  );
}

export function ScoreValue({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const h = healthOf(score);
  return (
    <span
      className={cn(
        "num font-semibold",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-4xl",
        h === "sain" && "text-success",
        h === "risque" && "text-warning",
        h === "critique" && "text-danger",
      )}
    >
      {score}
      <span className="text-muted-foreground/70 text-[0.6em] font-normal">/100</span>
    </span>
  );
}

export function CriticalityBadge({ level }: { level: Criticality }) {
  return (
    <span
      className={cn(
        pill,
        level === "critique" && "border-danger/30 bg-danger-soft text-danger uppercase",
        level === "haute" && "border-warning/40 bg-warning-soft text-warning",
        level === "moyenne" && "border-border bg-secondary text-secondary-foreground",
        level === "basse" && "border-success/25 bg-success-soft text-success",
      )}
    >
      {CRITICALITY_LABEL[level]}
    </span>
  );
}

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        pill,
        status === "terminee" && "border-success/30 bg-success-soft text-success",
        status === "encours" && "border-info/30 bg-info-soft text-info",
        status === "planifiee" && "border-border bg-secondary text-secondary-foreground",
        status === "avenir" && "border-border bg-muted text-muted-foreground",
      )}
    >
      {CAMPAIGN_STATUS_LABEL[status]}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={cn(
        pill,
        "num",
        verdict === "PASS" && "border-success/30 bg-success-soft text-success",
        verdict === "PASS_WITH_RESERVATION" && "border-success/40 bg-success-soft text-success",
        verdict === "FAIL" && "border-danger/30 bg-danger-soft text-danger",
        verdict === "BLOCKED" && "border-warning/40 bg-warning-soft text-warning",
        verdict === "NOT_RUN" && "border-border bg-muted text-muted-foreground",
        verdict === "NOT_APPLICABLE" && "border-border bg-muted text-muted-foreground/70",
      )}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function SeverityBadge({ level }: { level: Severity }) {
  return (
    <span
      className={cn(
        pill,
        level === "haute" && "border-danger/30 bg-danger-soft text-danger",
        level === "moyenne" && "border-warning/40 bg-warning-soft text-warning",
        level === "basse" && "border-border bg-secondary text-secondary-foreground",
      )}
    >
      {SEVERITY_LABEL[level]}
    </span>
  );
}

export function DefectStatusBadge({ status }: { status: DefectStatus }) {
  return (
    <span
      className={cn(
        pill,
        status === "nouvelle" && "border-info/30 bg-info-soft text-info",
        status === "affectee" && "border-border bg-secondary text-secondary-foreground",
        status === "encorrection" && "border-warning/40 bg-warning-soft text-warning",
        status === "fermee" && "border-success/30 bg-success-soft text-success",
      )}
    >
      {DEFECT_STATUS_LABEL[status]}
    </span>
  );
}

export function QualityBar({
  value,
  className,
  neutral = false,
}: {
  value: number;
  className?: string;
  neutral?: boolean;
}) {
  const tone = neutral
    ? value > 0
      ? "bg-info"
      : "bg-border"
    : value >= 85
      ? "bg-success"
      : value >= 70
        ? "bg-warning"
        : value > 0
          ? "bg-danger"
          : "bg-border";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "panel p-4 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        tone === "success" && "border-success/30",
        tone === "warning" && "border-warning/40",
        tone === "danger" && "border-danger/30",
        tone === "info" && "border-info/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <div
        className={cn(
          "num mt-2 text-3xl font-semibold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "info" && "text-info",
        )}
      >
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {actions}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
