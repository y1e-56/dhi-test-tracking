/* ==============================
   1. Imports
   ============================== */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/dhi-store";
import { cn } from "@/lib/utils";
import { VERDICT_LABEL, type Product, type TestCase, type TestType } from "@/lib/dhi-data";

/* ==============================
   2. Helpers / utilitaires
   ============================== */

/** Types de tests considérés comme automatisables. */
const AUTOMATABLE_TYPES: ReadonlySet<TestType> = new Set<TestType>([
  "api",
  "performance",
  "charge",
  "endurance",
  "volumetrie",
  "securite",
  "penetration",
  "robustesse",
  "regression",
]);

type TestabilityStatus = "ready" | "partial" | "poor";

function statusOf(t: TestCase): TestabilityStatus {
  const documented = t.preconditions.length > 0 && t.steps.length > 0 && t.expected.length > 0;
  if (documented) return "ready";
  if (t.preconditions.length > 0 || t.expected.length > 0) return "partial";
  return "poor";
}

type KeyedRow = {
  test: TestCase;
  product: Product | undefined;
  featureName: string | undefined;
  campaignName: string | undefined;
  status: TestabilityStatus;
};

type ProductMetrics = {
  product: Product | undefined;
  tests: number;
  documented: number;
  withPreconditions: number;
  withSteps: number;
  withExpected: number;
  automatable: number;
  measurable: number;
  executed: number;
  score: number;
};

function buildMetrics(rows: KeyedRow[]): ProductMetrics[] {
  const byProduct = new Map<string, KeyedRow[]>();
  for (const r of rows) {
    const key = r.product?.id ?? "sans-produit";
    const list = byProduct.get(key) ?? [];
    list.push(r);
    byProduct.set(key, list);
  }
  return Array.from(byProduct.entries()).map(([productId, list]) => {
    const product = list[0]?.product;
    const documented = list.filter((r) => r.status === "ready").length;
    const withPreconditions = list.filter((r) => r.test.preconditions.length > 0).length;
    const withSteps = list.filter((r) => r.test.steps.length > 0).length;
    const withExpected = list.filter((r) => r.test.expected.length > 0).length;
    const automatable = list.filter((r) => AUTOMATABLE_TYPES.has(r.test.type)).length;
    const measurable = list.filter((r) => r.test.expectedValue).length;
    const executed = list.filter((r) => r.test.verdict !== "NOT_RUN").length;
    const n = list.length || 1;
    const docRatio = documented / n;
    const execRatio = executed / n;
    const measRatio = measurable / n;
    const autoRatio = automatable / n;
    const score = Math.round((0.6 * docRatio + 0.2 * execRatio + 0.1 * measRatio + 0.1 * autoRatio) * 100);
    return {
      product,
      tests: list.length,
      documented,
      withPreconditions,
      withSteps,
      withExpected,
      automatable,
      measurable,
      executed,
      score,
    };
  });
}

/* ==============================
   3. Composant Route principal
   ============================== */
function TestabilityPage() {
  const { t } = useI18n();
  const { products, campaigns, features, tests } = useStore();

  const indexedProduct = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const indexedCampaign = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);
  const indexedFeature = useMemo(() => new Map(features.map((f) => [f.id, f])), [features]);

  const rows: KeyedRow[] = useMemo(() => {
    return tests.map((test) => {
      const campaign = indexedCampaign.get(test.campaignId);
      const product = campaign ? indexedProduct.get(campaign.productId) : undefined;
      const feature = indexedFeature.get(test.featureId);
      return {
        test,
        product,
        featureName: feature?.name,
        campaignName: campaign?.name,
        status: statusOf(test),
      };
    });
  }, [tests, indexedCampaign, indexedProduct, indexedFeature]);

  const metrics = useMemo(() => buildMetrics(rows), [rows]);
  const total = rows.length;
  const overall = useMemo(() => {
    if (metrics.length === 0) return 0;
    return Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length);
  }, [metrics]);

  const flagged = rows.filter((r) => r.status !== "ready");
  const documented = rows.filter((r) => r.status === "ready").length;
  const automatable = rows.filter((r) => AUTOMATABLE_TYPES.has(r.test.type)).length;
  const executed = rows.filter((r) => r.test.verdict !== "NOT_RUN").length;

  return (
    <AppShell
      title={t("pages.pilotage_testabilite.title")}
      subtitle={t("pages.pilotage_testabilite.subtitle")}
      breadcrumb={t("pages.pilotage_testabilite.breadcrumb")}
      actions={
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" /> {t("pages.pilotage_testabilite.print_report")}
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("pages.pilotage_testabilite.overall")}
          value={overall}
          tone={overall >= 75 ? "success" : overall >= 50 ? "warning" : "danger"}
          hint={`${total} ${t("pages.pilotage_testabilite.tests")}`}
        />
        <KpiCard
          label={t("pages.pilotage_testabilite.documented")}
          value={`${documented}`}
          hint={t("pages.pilotage_testabilite.documented_tooltip")}
        />
        <KpiCard
          label={t("pages.pilotage_testabilite.automatable")}
          value={`${automatable}`}
          hint={t("pages.pilotage_testabilite.automatable_hint")}
        />
        <KpiCard
          label={t("pages.pilotage_testabilite.executed_rate")}
          value={`${total ? Math.round((executed / total) * 100) : 0} %`}
          hint={t("pages.pilotage_testabilite.measure")}
        />
      </div>

      <p className="mb-4 rounded-md bg-info-soft px-3 py-2 text-xs text-info">
        {t("pages.pilotage_testabilite.explained")}
      </p>

      <Panel title={t("pages.pilotage_testabilite.per_product")}>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("pages.pilotage_testabilite.no_data")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.product?.id ?? "none"} className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {m.product ? (
                      <Link
                        to="/produits/$productId"
                        params={{ productId: m.product.id }}
                        className="hover:underline"
                      >
                        {m.product.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </p>
                  <span
                    className={cn(
                      "num rounded-md px-2 py-1 text-base font-semibold",
                      m.score >= 75
                        ? "bg-success-soft text-success"
                        : m.score >= 50
                          ? "bg-warning-soft text-warning"
                          : "bg-danger-soft text-danger",
                    )}
                  >
                    {m.score}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("pages.pilotage_testabilite.tests")}</dt>
                    <dd className="num font-medium">{m.tests}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("pages.pilotage_testabilite.preferable_preconditions")}</dt>
                    <dd className="num font-medium">{m.withPreconditions}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("pages.pilotage_testabilite.preferable_steps")}</dt>
                    <dd className="num font-medium">{m.withSteps}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("pages.pilotage_testabilite.preferable_expected")}</dt>
                    <dd className="num font-medium">{m.withExpected}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("pages.pilotage_testabilite.documented")}</dt>
                    <dd className="num font-medium">{m.documented}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("pages.pilotage_testabilite.automatable")}</dt>
                    <dd className="num font-medium">{m.automatable}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("pages.pilotage_testabilite.measure")}</dt>
                    <dd className="num font-medium">{m.measurable}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t("pages.pilotage_testabilite.executed_rate")}</dt>
                    <dd className="num font-medium">
                      {m.tests ? Math.round((m.executed / m.tests) * 100) : 0} %
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title={`${t("pages.pilotage_testabilite.per_test")} · ${flagged.length} ${t("pages.pilotage_testabilite.flagged")}`}
        className="mt-4"
      >
        <div className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("pages.pilotage_testabilite.no_data")}</p>
          ) : (
            rows.map((r) => (
              <div
                key={r.test.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
                  r.status === "ready" ? "border-success/30" : r.status === "partial" ? "border-warning/40" : "border-danger/30",
                )}
              >
                <div className="min-w-0">
                  <Link
                    to="/execution/$testId"
                    params={{ testId: r.test.id }}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.test.id}
                  </Link>
                  <span className="ml-2 text-muted-foreground">{r.test.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {r.campaignName ?? "—"} · {r.featureName ?? "—"} · {r.test.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="num text-muted-foreground">{VERDICT_LABEL[r.test.verdict]}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-medium",
                      r.status === "ready"
                        ? "bg-success-soft text-success"
                        : r.status === "partial"
                          ? "bg-warning-soft text-warning"
                          : "bg-danger-soft text-danger",
                    )}
                    title={t(`pages.pilotage_testabilite.${r.status}_hint`)}
                  >
                    {t(`pages.pilotage_testabilite.${r.status}`)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </AppShell>
  );
}

export const Route = createFileRoute("/pilotage-testabilite")({
  head: () => ({
    meta: [
      { title: "Pilotage de la testabilité — DHI Quality Platform" },
      {
        name: "description",
        content: "Capacité des campagnes à être exécutées et mesurées par produit.",
      },
    ],
  }),
  component: TestabilityPage,
});