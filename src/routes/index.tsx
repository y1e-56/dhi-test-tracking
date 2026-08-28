import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, FolderKanban, Gauge, ShieldAlert, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { HealthBadge, KpiCard, Panel, QualityBar, ScoreValue } from "@/components/dhi/indicators";
import { campaignStats, productScore, useStore } from "@/lib/dhi-store";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/dhi-data";

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
  const { products, campaigns, tests, defects } = useStore();

  const avgScore = Math.round(products.reduce((s, p) => s + productScore(p), 0) / products.length);
  const projects = products.reduce((s, p) => s + p.projects, 0);
  const critiques = products.filter((p) => productScore(p) < 70).length;
  const actives = campaigns.filter((c) => c.status === "encours" || c.status === "planifiee").length;
  const incidents = defects.filter((d) => d.status !== "fermee" && d.severity === "haute").length;

  const failedCritical = tests.filter((t) => t.verdict === "FAIL" && t.criticality === "critique");

  return (
    <AppShell
      title="Dashboard exécutif"
      subtitle="Vue synthétique de tous les produits et projets supervisés"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Produits" value={products.length} icon={<Boxes className="size-4" />} hint="Supervisés" />
        <KpiCard label="Projets" value={projects} icon={<FolderKanban className="size-4" />} hint="Tous produits" />
        <KpiCard
          label="Score moyen"
          value={`${avgScore}/100`}
          tone={avgScore >= 85 ? "success" : avgScore >= 70 ? "warning" : "danger"}
          icon={<Gauge className="size-4" />}
          hint="Pondéré R/C/K/I/NF"
        />
        <KpiCard
          label="Produits critiques"
          value={critiques}
          tone={critiques ? "danger" : "success"}
          icon={<ShieldAlert className="size-4" />}
          hint="Score < 70"
        />
        <KpiCard label="Campagnes actives" value={actives} tone="info" hint="En cours ou planifiées" />
        <KpiCard
          label="Incidents ouverts"
          value={incidents}
          tone={incidents ? "warning" : "success"}
          icon={<TriangleAlert className="size-4" />}
          hint="Gravité haute"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Produits supervisés"
          actions={
            <Link to="/produits" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              Tout voir
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
          title="Campagnes en cours"
          actions={
            <Link to="/campagnes" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              Tout voir
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
                        {st.executionRate}% exécutée
                      </span>
                    </div>
                    <QualityBar value={st.executionRate} neutral className="mt-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {CAMPAIGN_STATUS_LABEL[c.status]} · {st.total} tests · v{c.version}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="Alertes actives">
        <ul className="space-y-2">
          {failedCritical.slice(0, 3).map((t) => (
            <li
              key={t.id}
              className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 shadow-[inset_2px_0_0_0_var(--color-danger)]"
            >
              <AlertTriangle className="mt-0.5 size-4 text-danger" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Test critique en FAIL — {t.id}</p>
                <p className="text-muted-foreground">{t.name}</p>
              </div>
              <Link
                to="/execution/$testId"
                params={{ testId: t.id }}
                className="ml-auto text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
              >
                Ouvrir
              </Link>
            </li>
          ))}
          <li className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 shadow-[inset_2px_0_0_0_var(--color-warning)]">
            <AlertTriangle className="mt-0.5 size-4 text-warning" />
            <div className="text-sm">
              <p className="font-medium">Couverture &lt; 80 % — Portail Agence</p>
              <p className="text-muted-foreground">52 % de couverture fonctionnelle mesurée</p>
            </div>
            <Link to="/couverture" className="ml-auto text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground">
              Matrice
            </Link>
          </li>
          <li className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 shadow-[inset_2px_0_0_0_var(--color-danger)]">
            <ShieldAlert className="mt-0.5 size-4 text-danger" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Point critique non validé — Sécurité</p>
              <p className="text-muted-foreground">2 points critiques en attente de validation</p>
            </div>
            <Link to="/anomalies" className="ml-auto text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground">
              Anomalies
            </Link>
          </li>
        </ul>
      </Panel>
    </AppShell>
  );
}
