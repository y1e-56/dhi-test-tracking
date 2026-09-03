import { createFileRoute, Link, notFound, Outlet, useMatches } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Users, GitBranch } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import {
  HealthBadge,
  Panel,
  QualityBar,
  ScoreValue,
} from "@/components/dhi/indicators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, productScore, useStore } from "@/lib/dhi-store";
import {
  PROJECT_STATUS_LABEL,
  SCORE_LABELS,
  SCORE_WEIGHTS,
  products as seedProducts,
  type ScoreBreakdown,
} from "@/lib/dhi-data";
import { productTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { getUser, productVisibleTo } from "@/lib/access";
import { ProductAccessDenied } from "@/components/dhi/AccessDenied";

export const Route = createFileRoute("/produits/$productId")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Produit"} — DHI Quality Platform` },
      {
        name: "description",
        content: "Fiche produit : score, projets associés, couverture et campagnes.",
      },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const { products: allProducts, projects, features, campaigns, tests, defects } = useStore();

  const matches = useMatches();
  const product = allProducts.find((p) => p.id === productId);
  if (product && !productVisibleTo(product, getUser())) {
    return <ProductAccessDenied subject={product.name} />;
  }
  const matchesExact = matches[matches.length - 1]?.pathname === `/produits/${productId}`;
  if (!matchesExact) {
    return <Outlet />;
  }

  if (!product) return null;

  const score = productScore(product);
  const b = product.breakdown;
  const prodProjects = projects.filter((pr) => pr.productId === product.id);
  const prodFeatures = features.filter((f) => f.productId === product.id);
  const prodCampaigns = campaigns.filter((c) => c.productId === product.id);
  const campaignIds = new Set(prodCampaigns.map((c) => c.id));
  const prodTests = tests.filter((t) => campaignIds.has(t.campaignId));
  const prodDefects = defects.filter((d) => d.productId === product.id && d.status !== "fermee");
  const failed = prodTests.filter((t) => t.verdict === "FAIL").length;

  const weightKeys = Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdown)[];

  return (
    <AppShell
      title={product.name}
      subtitle={`${t("common.produit")} · ${product.description}`}
      breadcrumb={[t("nav.qualite"), t("nav.produits"), product.name]}
      tabs={productTabs(productId)}
      actions={
        <Link
          to="/produits"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> {t("pages.product_detail.portfolio")}
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={t("pages.product_detail.identity_responsibilities")}
          className="lg:col-span-2"
        >
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("pages.products.owner")}
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Users className="size-4 text-muted-foreground" /> {product.owner}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("pages.product_detail.qa_lead")}
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-muted-foreground" /> {product.qaLead}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("pages.product_detail.qa_team")}
              </dt>
              <dd className="mt-1 text-sm">{product.qaTeam.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("pages.product_detail.active_versions")}
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {product.versions.map((v) => (
                  <span
                    key={v}
                    className="num inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium"
                  >
                    <GitBranch className="size-3" /> {v}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title={t("pages.product_detail.quality_score_explainable")}>
          <div className="flex items-center justify-between">
            <ScoreValue score={score} size="lg" />
            <HealthBadge score={score} />
          </div>
          <ul className="mt-4 space-y-3">
            {weightKeys.map((key) => (
              <li key={key}>
                <div className="flex items-center justify-between text-sm">
                  <span>{SCORE_LABELS[key]}</span>
                  <span className="num text-muted-foreground">
                    {b[key]}/100 · {Math.round(SCORE_WEIGHTS[key] * 100)} %
                  </span>
                </div>
                <QualityBar value={b[key]} className="mt-1" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title={t("pages.product_detail.product_projects")}
        actions={
          <Link to="/projets" className="text-xs font-medium text-primary hover:underline">
            {t("pages.product_detail.all_projects")}
          </Link>
        }
      >
        {prodProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("pages.product_detail.no_projects")}{" "}
            <Link to="/projets" className="font-medium text-primary hover:underline">
              {t("pages.product_detail.create_one")}
            </Link>
            .
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.projet")}</TableHead>
                <TableHead>{t("pages.product_detail.target_version")}</TableHead>
                <TableHead>{t("common.statut")}</TableHead>
                <TableHead>{t("pages.campaigns.progress")}</TableHead>
                <TableHead>{t("pages.product_detail.project_manager")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prodProjects.map((pr) => (
                <TableRow key={pr.id}>
                  <TableCell>
                    <Link
                      to="/projets/$projectId"
                      params={{ projectId: pr.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {pr.name}
                    </Link>
                    <p className="max-w-md truncate text-xs text-muted-foreground">
                      {pr.objective}
                    </p>
                  </TableCell>
                  <TableCell className="num">{pr.targetVersion}</TableCell>
                  <TableCell>{PROJECT_STATUS_LABEL[pr.status]}</TableCell>
                  <TableCell className="w-40">
                    <QualityBar value={pr.progress} neutral />
                  </TableCell>
                  <TableCell className="text-sm">{pr.manager}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("pages.product_detail.coverage_test_gaps")}
          actions={
            <Link to="/couverture" className="text-xs font-medium text-primary hover:underline">
              {t("pages.product_detail.matrix")}
            </Link>
          }
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("pages.product_detail.global_coverage")}
            </p>
            <p className="num text-xl font-semibold text-success">{b.coverage} %</p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>{t("pages.product_detail.features")}</span>
              <span className="num">
                {prodFeatures.length} {t("pages.product_detail.inventoried")}
              </span>
            </li>
            <li className="flex justify-between">
              <span>{t("pages.product_detail.with_functional_tests")}</span>
              <span className="num">
                {prodFeatures.filter((f) => f.coverage.fonctionnel).length} / {prodFeatures.length}
              </span>
            </li>
            <li className="flex justify-between">
              <span>{t("pages.product_detail.critical_elements_covered")}</span>
              <span className="num">
                {
                  prodFeatures.filter((f) => f.criticality === "critique" && f.coverage.fonctionnel)
                    .length
                }{" "}
                / {prodFeatures.filter((f) => f.criticality === "critique").length}
              </span>
            </li>
          </ul>
          <div className="mt-4 rounded-md border border-warning/40 bg-warning-soft p-3 text-sm">
            <p className="font-medium">{t("pages.product_detail.gaps_detected")}</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
              {prodFeatures.flatMap((f) =>
                Object.entries(f.coverage)
                  .filter(([, ok]) => !ok)
                  .map(([type]) => (
                    <li key={`${f.id}-${type}`}>
                      « {f.name} » : {t("pages.product_detail.missing_test")} {type}
                    </li>
                  )),
              )}
              {prodFeatures.every((f) => Object.values(f.coverage).every(Boolean)) && (
                <li>{t("pages.product_detail.no_coverage_gap")}</li>
              )}
            </ul>
          </div>
        </Panel>

        <Panel title={t("pages.product_detail.key_indicators")}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-danger/30 bg-danger-soft p-3">
              <p className="num text-2xl font-semibold text-danger">{failed}</p>
              <p className="text-xs text-muted-foreground">
                {t("pages.product_detail.failed_tests_product_campaigns")}
              </p>
            </div>
            <div className="rounded-md border border-warning/40 bg-warning-soft p-3">
              <p className="num text-2xl font-semibold text-warning">{prodDefects.length}</p>
              <p className="text-xs text-muted-foreground">
                {t("pages.product_detail.open_defects")}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="num text-2xl font-semibold">
                {prodDefects.filter((d) => d.severity === "haute").length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("pages.product_detail.high_severity_incidents")}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="num text-2xl font-semibold">{prodProjects.length}</p>
              <p className="text-xs text-muted-foreground">
                {t("pages.product_detail.associated_projects")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link to="/anomalies" className="font-medium text-primary hover:underline">
              {t("pages.alerts.anomalies")}
            </Link>
            <Link to="/go-live" className="font-medium text-primary hover:underline">
              {t("pages.alerts.go_live")}
            </Link>
            <Link to="/exigences" className="font-medium text-primary hover:underline">
              {t("nav.exigences")}
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/produits/$productId/fonctionnalites" params={{ productId }}>
          <div className="panel p-5 transition-colors hover:bg-subtle">
            <p className="label-eyebrow">{t("nav.product_features")}</p>
            <p className="num mt-1 text-3xl font-semibold">{prodFeatures.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pages.product_detail.features")}
            </p>
          </div>
        </Link>
        <Link to="/produits/$productId/campagnes" params={{ productId }}>
          <div className="panel p-5 transition-colors hover:bg-subtle">
            <p className="label-eyebrow">{t("nav.product_campaigns")}</p>
            <p className="num mt-1 text-3xl font-semibold">{prodCampaigns.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pages.product_detail.campaigns_all_versions")}
            </p>
          </div>
        </Link>
        <Link to="/produits/$productId/projets" params={{ productId }}>
          <div className="panel p-5 transition-colors hover:bg-subtle">
            <p className="label-eyebrow">{t("nav.product_projects")}</p>
            <p className="num mt-1 text-3xl font-semibold">{prodProjects.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pages.product.associated_projects")}
            </p>
          </div>
        </Link>
      </div>
    </AppShell>
  );
}
