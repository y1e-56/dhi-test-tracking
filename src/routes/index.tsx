import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  FolderKanban,
  Gauge,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { HealthBadge, KpiCard, Panel, QualityBar, ScoreValue } from "@/components/dhi/indicators";
import { campaignStats, productScore, useStore } from "@/lib/dhi-store";
import { CAMPAIGN_STATUS_LABEL, PROJECT_STATUS_LABEL } from "@/lib/dhi-data";
import { PILOTAGE_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard exécutif — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Pilotage centralisé de la qualité logicielle : scores produits, campagnes de tests, couverture et alertes qualité.",
      },
      { property: "og:title", content: "Dashboard exécutif — DHI Quality Platform" },
      {
        property: "og:description",
        content:
          "Vue synthétique de la qualité de tous vos produits logiciels : score, campagnes, couverture, alertes.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { products, projects, campaigns, tests, defects, alerts } = useStore();
  const activeProjects = projects.filter((pr) => pr.status === "encours");

  const avgScore = products.length
    ? Math.round(products.reduce((s, p) => s + productScore(p), 0) / products.length)
    : 0;
  const critiques = products.filter((p) => productScore(p) < 60).length;
  const actives = campaigns.filter(
    (c) => c.status === "encours" || c.status === "planifiee",
  ).length;
  const incidents = defects.filter((d) => d.status !== "fermee" && d.severity === "haute").length;
  const unread = alerts.filter((a) => !a.read);

  return (
    <AppShell
      title={t("dashboard.executive.title")}
      subtitle={t("dashboard.executive.subtitle")}
      breadcrumb={t("dashboard.executive.breadcrumb")}
      tabs={PILOTAGE_TABS}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={t("dashboard.executive.products")}
          value={products.length}
          icon={<Boxes className="size-4" />}
          hint={t("dashboard.executive.supervised")}
          onClick={() => void navigate({ to: "/produits" })}
        />
        <KpiCard
          label={t("dashboard.executive.projects")}
          value={projects.length}
          icon={<FolderKanban className="size-4" />}
          hint={t("dashboard.executive.linked")}
          onClick={() => void navigate({ to: "/projets" })}
        />
        <KpiCard
          label={t("dashboard.executive.avg_score")}
          value={`${avgScore}/100`}
          tone={avgScore >= 85 ? "success" : avgScore >= 70 ? "warning" : "danger"}
          icon={<Gauge className="size-4" />}
          hint={t("dashboard.executive.weighted")}
          onClick={() => void navigate({ to: "/referentiels" })}
        />
        <KpiCard
          label={t("dashboard.executive.critical_products")}
          value={critiques}
          tone={critiques ? "danger" : "success"}
          icon={<ShieldAlert className="size-4" />}
          hint="Score < 60"
          onClick={() => void navigate({ to: "/produits" })}
        />
        <KpiCard
          label={t("dashboard.executive.active_campaigns")}
          value={actives}
          tone="info"
          hint={t("dashboard.executive.current_campaigns")}
          onClick={() => void navigate({ to: "/campagnes" })}
        />
        <KpiCard
          label={t("dashboard.executive.open_incidents")}
          value={incidents}
          tone={incidents ? "warning" : "success"}
          icon={<TriangleAlert className="size-4" />}
          hint={t("pages.root.gravite_haute")}
          onClick={() => void navigate({ to: "/anomalies" })}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("dashboard.executive.supervised_products")}
          actions={
            <Link
              to="/produits"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.executive.all_products")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {products.map((p) => {
              const score = productScore(p);
              return (
                <li key={p.id}>
                  <Link
                    to="/produits/$productId"
                    params={{ productId: p.id }}
                    className="-mx-4 flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <QualityBar value={score} className="mt-1.5" />
                    </div>
                    <ScoreValue score={score} size="sm" />
                    <HealthBadge score={score} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title={t("dashboard.executive.active_projects")}
          actions={
            <Link
              to="/projets"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.executive.all_projects")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {(activeProjects.length ? activeProjects : projects).slice(0, 5).map((pr) => {
              const product = products.find((p) => p.id === pr.productId);
              return (
                <li key={pr.id}>
                  <Link
                    to="/projets/$projectId"
                    params={{ projectId: pr.id }}
                    className="-mx-4 block px-4 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{pr.name}</p>
                      <span className="num text-xs text-muted-foreground">{pr.progress} %</span>
                    </div>
                    <QualityBar value={pr.progress} neutral className="mt-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product?.name ?? t("common.produit")} · {PROJECT_STATUS_LABEL[pr.status]} ·{" "}
                      {t("pages.root.target")} {pr.targetVersion}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("dashboard.executive.current_campaigns")}
          actions={
            <Link
              to="/campagnes"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.executive.show_all")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {campaigns.slice(0, 5).map((c) => {
              const st = campaignStats(tests, c.id);
              return (
                <li key={c.id}>
                  <Link
                    to="/campagnes/$campaignId"
                    params={{ campaignId: c.id }}
                    className="-mx-4 block px-4 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{c.name}</p>
                      <span className="num text-sm text-muted-foreground">
                        {st.executionRate}% {t("pages.root.executed")}
                      </span>
                    </div>
                    <QualityBar value={st.executionRate} neutral className="mt-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {CAMPAIGN_STATUS_LABEL[c.status]} · {st.total} {t("pages.root.tests")} · v
                      {c.version}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title={t("dashboard.executive.alerts")}
          actions={
            <Link
              to="/alertes"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.executive.all_alerts")}
            </Link>
          }
        >
          <ul className="space-y-2">
            {(unread.length ? unread : alerts).slice(0, 5).map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5"
              >
                <AlertTriangle className="mt-0.5 size-4 text-danger" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-foreground">{a.message}</p>
                  <p className="text-muted-foreground">{a.detail}</p>
                </div>
                <Link
                  to="/alertes"
                  className="ml-auto shrink-0 text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                >
                  {t("pages.root.open")}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link to="/projets" className="font-medium text-primary hover:underline">
              {t("dashboard.executive.all_projects")}
            </Link>
            <Link to="/go-live" className="font-medium text-primary hover:underline">
              {t("nav.go_live")}
            </Link>
            <Link to="/points-a-surveiller" className="font-medium text-primary hover:underline">
              {t("nav.points_surveiller")}
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
