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
import { PILOTAGE_TABS } from "@/lib/dhi-nav";
import { useI18n, type TranslationKey } from "@/lib/i18n";

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

const TYPE_LABEL: Record<AlertType, TranslationKey> = {
  anomalie: "pages.alerts.type_anomalie",
  campagne: "pages.alerts.type_campagne",
  couverture: "pages.alerts.type_couverture",
  golive: "pages.alerts.type_golive",
  systeme: "pages.alerts.type_systeme",
};

function AlertTargetLink({ target }: { target: string }) {
  const { t } = useI18n();
  return (
    <Link
      to={target}
      className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
    >
      {t("pages.alerts.voir_cible")}
    </Link>
  );
}

const FILTERS: { id: "all" | "unread" | AlertType; label: TranslationKey }[] = [
  { id: "all", label: "pages.alerts.all" },
  { id: "unread", label: "pages.alerts.unread" },
  { id: "anomalie", label: "pages.alerts.anomalies" },
  { id: "campagne", label: "pages.alerts.campagnes" },
  { id: "couverture", label: "pages.alerts.couverture" },
  { id: "golive", label: "pages.alerts.go_live" },
];

function AlertsPage() {
  const { alerts, markAlertRead, markAllAlertsRead } = useStore();
  const { t } = useI18n();
  const [filter, setFilter] = useState<"all" | "unread" | AlertType>("all");

  const rows = alerts.filter((a) =>
    filter === "all" ? true : filter === "unread" ? !a.read : a.type === filter,
  );
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <AppShell
      title={t("pages.alerts.title")}
      subtitle={t("pages.alerts.subtitle")}
      breadcrumb={t("pages.alerts.breadcrumb")}
      tabs={PILOTAGE_TABS}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            markAllAlertsRead();
            toast.success(t("pages.alerts.all_read"));
          }}
        >
          <CheckCheck className="size-4" /> {t("pages.alerts.mark_all_read")}
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("pages.alerts.alerts")}
          value={alerts.length}
          hint={t("pages.alerts.sur_30_jours")}
        />
        <KpiCard
          label={t("pages.alerts.unread")}
          value={unread}
          tone="info"
          hint={t("pages.alerts.a_consulter")}
        />
        <KpiCard
          label={t("pages.alerts.high_severity")}
          value={alerts.filter((a) => a.severity === "haute").length}
          tone="danger"
          hint={t("pages.alerts.action_immediate")}
        />
        <KpiCard
          label={t("pages.alerts.go_live")}
          value={alerts.filter((a) => a.type === "golive").length}
          tone="warning"
          hint={t("pages.alerts.impact_mep")}
        />
      </div>

      <Panel
        title={t("pages.alerts.flux")}
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
                {t(f.label)}
              </button>
            ))}
          </div>
        }
      >
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("pages.alerts.no_alerts")}
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
                      {a.title ?? a.message}
                    </p>
                    <SeverityBadge level={a.severity} />
                    <span className="label-eyebrow">{t(TYPE_LABEL[a.type])}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.message ?? a.detail}</p>
                  <p className="num mt-1 text-xs text-muted-foreground/80">{a.createdAt}</p>
                  {a.target ? <AlertTargetLink target={a.target} /> : null}
                </div>
                {a.read ? null : (
                  <Button size="sm" variant="ghost" onClick={() => markAlertRead(a.id)}>
                    {t("pages.alerts.mark_read")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="mt-4 text-xs text-muted-foreground">
        {t("pages.alerts.footer_prefix")}{" "}
        <Link to="/anomalies" className="font-medium text-primary hover:underline">
          {t("pages.alerts.footer_link")}
        </Link>
        {t("pages.alerts.footer_suffix")}
      </p>
    </AppShell>
  );
}
