import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel, SeverityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/dhi-store";
import type { AlertType } from "@/lib/dhi-data";

export const Route = createFileRoute("/alertes")({
  head: () => ({
    meta: [
      { title: "Alertes qualité — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Centre d'alertes qualité : anomalies critiques, campagnes en retard, trous de couverture et décisions Go Live.",
      },
      { property: "og:title", content: "Alertes qualité — DHI Quality Platform" },
      { property: "og:description", content: "Toutes les alertes qualité à traiter, priorisées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AlertsPage,
});

const TYPE_LABEL: Record<AlertType, string> = {
  anomalie: "Anomalie",
  campagne: "Campagne",
  couverture: "Couverture",
  golive: "Go Live",
  systeme: "Système",
};

const FILTERS: { id: "all" | "unread" | AlertType; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "unread", label: "Non lues" },
  { id: "anomalie", label: "Anomalies" },
  { id: "campagne", label: "Campagnes" },
  { id: "couverture", label: "Couverture" },
  { id: "golive", label: "Go Live" },
];

function AlertsPage() {
  const { alerts, markAlertRead, markAllAlertsRead } = useStore();
  const [filter, setFilter] = useState<"all" | "unread" | AlertType>("all");

  const rows = alerts.filter((a) =>
    filter === "all" ? true : filter === "unread" ? !a.read : a.type === filter,
  );
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <AppShell
      title="Alertes qualité"
      subtitle="Signaux à traiter, du plus critique au plus informatif"
      breadcrumb={["Pilotage", "Alertes"]}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            markAllAlertsRead();
            toast.success("Toutes les alertes ont été marquées comme lues.");
          }}
        >
          <CheckCheck className="size-4" /> Tout marquer comme lu
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Alertes" value={alerts.length} hint="Sur 30 jours" />
        <KpiCard label="Non lues" value={unread} tone="info" hint="À consulter" />
        <KpiCard
          label="Gravité haute"
          value={alerts.filter((a) => a.severity === "haute").length}
          tone="danger"
          hint="Action immédiate"
        />
        <KpiCard
          label="Go Live"
          value={alerts.filter((a) => a.type === "golive").length}
          tone="warning"
          hint="Impact mise en production"
        />
      </div>

      <Panel
        title="Flux d'alertes"
        actions={
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune alerte pour ce filtre.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    a.read ? "bg-border-strong" : "bg-info",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm", a.read ? "font-medium" : "font-semibold")}>
                      {a.message}
                    </p>
                    <SeverityBadge level={a.severity} />
                    <span className="label-eyebrow">{TYPE_LABEL[a.type]}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.detail}</p>
                  <p className="num mt-1 text-xs text-muted-foreground/80">
                    {a.createdAt} · {a.target}
                  </p>
                </div>
                {a.read ? null : (
                  <Button size="sm" variant="ghost" onClick={() => markAlertRead(a.id)}>
                    Marquer lu
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="mt-4 text-xs text-muted-foreground">
        Les alertes anomalies renvoient vers la{" "}
        <Link to="/anomalies" className="font-medium text-primary hover:underline">
          fiche de suivi des anomalies
        </Link>
        .
      </p>
    </AppShell>
  );
}
