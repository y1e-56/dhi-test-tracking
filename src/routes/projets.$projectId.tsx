import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import {
  HealthBadge,
  Panel,
  QualityBar,
  ScoreValue,
  StatusBadge,
} from "@/components/dhi/indicators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GOLIVE_VERDICT_LABEL,
  PROJECT_STATUS_LABEL,
  RELEASE_STATUS_LABEL,
  projects as seedProjects,
} from "@/lib/dhi-data";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { campaignStats, loadSnapshot, productScore, useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/projets/$projectId")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const projects = snapshot?.projects ?? seedProjects;
    const pr = projects.find((x) => x.id === params.projectId);
    return { name: pr?.name ?? "Projet" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? "Projet"} — DHI Quality Platform` }],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { t } = useI18n();
  const { projectId } = Route.useParams();
  const { products, projects, campaigns, tests, releases, goLiveDecisions, features, defects } =
    useStore();
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <AppShell title={t("pages.project_detail.not_found")} tabs={QUALITY_TABS}>
        <p className="text-sm text-muted-foreground">
          {t("pages.project_detail.not_found_message")}
        </p>
        <Link to="/projets" className="text-sm font-medium text-primary hover:underline">
          {t("pages.project_detail.back_to_projects")}
        </Link>
      </AppShell>
    );
  }

  const product = products.find((p) => p.id === project.productId);
  const score = product ? productScore(product) : 0;
  const projCampaigns = campaigns.filter((c) => c.projectId === project.id);
  const projReleases = releases.filter((r) => r.projectId === project.id);
  const prodFeatures = features.filter((f) => f.productId === project.productId);
  const openDefects = defects.filter(
    (d) => d.productId === project.productId && d.status !== "fermee",
  );
  const latestDecision = goLiveDecisions.find((d) =>
    projReleases.some((r) => r.id === d.releaseId),
  );

  return (
    <AppShell
      title={project.name}
      subtitle={`${t("common.projet")} · ${product?.name ?? t("common.produit")} · ${t(
        "pages.project_detail.target",
      )} ${project.targetVersion}`}
      breadcrumb={[t("nav.qualite"), t("nav.projets"), project.name]}
      tabs={QUALITY_TABS}
      actions={
        <Link
          to="/projets"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> {t("pages.project_detail.all_projects")}
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("pages.project_detail.identity_title")} className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("pages.project_detail.parent_product")}
              </dt>
              <dd className="mt-1 font-medium">
                {product ? (
                  <Link
                    to="/produits/$productId"
                    params={{ productId: product.id }}
                    className="text-primary hover:underline"
                  >
                    {product.name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("common.statut")}
              </dt>
              <dd className="mt-1">{PROJECT_STATUS_LABEL[project.status]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("pages.project_detail.project_manager")}
              </dt>
              <dd className="mt-1">{project.manager}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("pages.project_detail.qa_lead")}
              </dt>
              <dd className="mt-1">{project.qaLead}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("pages.project_detail.objective")}
              </dt>
              <dd className="mt-1">{project.objective}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("pages.project_detail.period")}
              </dt>
              <dd className="mt-1 num">
                {project.startDate} → {project.endDate || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("pages.project_detail.progress")}
              </dt>
              <dd className="mt-2">
                <QualityBar value={project.progress} neutral />
                <p className="num mt-1 text-xs text-muted-foreground">{project.progress} %</p>
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title={t("pages.project_detail.readiness")}>
          <div className="flex items-center justify-between">
            <ScoreValue score={score} size="lg" />
            <HealthBadge score={score} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("pages.project_detail.score_hint")}
          </p>
          <p className="mt-4 text-sm">
            {t("pages.project_detail.last_golive_decision")}{" "}
            <strong>
              {latestDecision ? GOLIVE_VERDICT_LABEL[latestDecision.verdict] : t("common.aucun")}
            </strong>
          </p>
          <Link
            to="/go-live"
            className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
          >
            {t("pages.project_detail.open_golive_center")}
          </Link>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("pages.project_detail.releases_title")}>
          {projReleases.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("pages.project_detail.no_releases")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {projReleases.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between rounded-md border border-border px-3 py-2"
                >
                  <span className="num font-medium">{r.version}</span>
                  <span className="text-muted-foreground">
                    {RELEASE_STATUS_LABEL[r.status]} · {r.environment}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={t("pages.project_detail.indicators_title")}>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>{t("pages.project_detail.product_features")}</span>
              <span className="num">{prodFeatures.length}</span>
            </li>
            <li className="flex justify-between">
              <span>{t("pages.project_detail.project_campaigns")}</span>
              <span className="num">{projCampaigns.length}</span>
            </li>
            <li className="flex justify-between">
              <span>{t("pages.project_detail.open_defects")}</span>
              <span className="num">{openDefects.length}</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title={t("pages.project_detail.campaigns_of_project")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.campagne")}</TableHead>
              <TableHead>{t("common.version")}</TableHead>
              <TableHead>{t("common.etat")}</TableHead>
              <TableHead>{t("pages.campaigns.progress")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projCampaigns.map((c) => {
              const st = campaignStats(tests, c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to="/campagnes/$campaignId"
                      params={{ campaignId: c.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="num">{c.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <QualityBar value={st.executionRate} neutral />
                  </TableCell>
                </TableRow>
              );
            })}
            {projCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {t("pages.project_detail.no_campaigns")}{" "}
                  <Link to="/campagnes" className="text-primary hover:underline">
                    {t("pages.project_detail.create_campaign")}
                  </Link>
                  .
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
