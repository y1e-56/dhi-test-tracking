import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import {
  FileText,
  Plus,
  CheckSquare,
  Box,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, QualityBar } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  CRITICALITY_LABEL,
  TEST_TYPES,
  REQUIREMENT_STATUS_LABEL,
  type Criticality,
  type TestCase,
  type TestType,
  type Verdict,
} from "@/lib/dhi-data";
import { canCreate } from "@/lib/role-protection";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { useStore } from "@/lib/dhi-store";
import { useVisibleProductIds } from "@/lib/use-scope";
import { VERDICT_LABEL } from "@/lib/dhi-data";
import { useI18n } from "@/lib/i18n";

const coveragePct = (f: ReturnType<typeof useStore>["features"][number]) => {
  const total = TEST_TYPES.length;
  const covered = TEST_TYPES.filter((t) => f.coverage[t.id]).length;
  return Math.round((covered / total) * 100);
};

function VerdotChip({ verdict }: { verdict: Verdict }) {
  const tone: Record<Verdict, string> = {
    PASS: "bg-success-soft text-success border-success/30",
    PASS_WITH_RESERVATION: "bg-success-soft/70 text-success/90 border-success/20",
    FAIL: "bg-danger-soft text-danger border-danger/30",
    BLOCKED: "bg-warning-soft text-warning border-warning/30",
    NOT_RUN: "bg-secondary text-secondary-foreground border-border",
    NOT_APPLICABLE: "bg-secondary/60 text-muted-foreground border-border/70",
  };
  return (
    <span
      className={cn(
        "num inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-4",
        tone[verdict],
      )}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

function FeaturesPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/fonctionnalites") return <Outlet />;
  return <FeaturesList />;
}

function FeaturesList() {
  const { features, products, requirements, tests, deleteFeature, updateRequirement } = useStore();
  const { t } = useI18n();
  const [productFilter, setProductFilter] = useState("all");
  const [critFilter, setCritFilter] = useState("all");

  const [toDeleteFeature, setToDeleteFeature] = useState<Feature | null>(null);

  const [expandedFeat, setExpandedFeat] = useState<Record<string, boolean>>({});

  const visiblePIds = useVisibleProductIds(products);

  const rows = useMemo(
    () =>
      features
        .filter((f) => visiblePIds.has(f.productId))
        .filter((f) => productFilter === "all" || f.productId === productFilter)
        .filter((f) => critFilter === "all" || f.criticality === critFilter),
    [features, productFilter, critFilter, visiblePIds],
  );

  const reqsByFeature = useMemo(() => {
    const map: Record<string, typeof requirements> = {};
    for (const r of requirements) {
      for (const fid of r.featureIds) (map[fid] ||= []).push(r);
    }
    return map;
  }, [requirements]);

  const testsByFeature = useMemo(() => {
    const map: Record<string, TestCase[]> = {};
    for (const t of tests) (map[t.featureId] ||= []).push(t);
    return map;
  }, [tests]);

  const confirmDelete = () => {
    if (!toDeleteFeature) return;
    for (const r of requirements) {
      if (r.featureIds.includes(toDeleteFeature.id)) {
        updateRequirement(r.id, {
          featureIds: r.featureIds.filter((x) => x !== toDeleteFeature.id),
        });
      }
    }
    deleteFeature(toDeleteFeature.id);
    toast.success(t("pages.features.deleted_msg").replace("{name}", toDeleteFeature.name));
    setToDeleteFeature(null);
  };

  return (
    <AppShell
      title={t("pages.features.title")}
      subtitle={t("pages.features.subtitle")}
      breadcrumb={[t("nav.qualite"), t("nav.fonctionnalites")]}
      tabs={QUALITY_TABS}
      actions={
        canCreate() ? (
          <Link to="/fonctionnalites/ajouter">
            <Button size="sm">
              <Plus className="size-4" /> {t("pages.features.new_feature")}
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("common.produit")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.features.all_products")}</SelectItem>
              {products
                .filter((p) => visiblePIds.has(p.id))
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={critFilter} onValueChange={setCritFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("common.criticite")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.features.all_criticites")}</SelectItem>
              {(Object.keys(CRITICALITY_LABEL) as Criticality[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {CRITICALITY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-sm text-muted-foreground">
            {t("pages.features.feature_count").replace("{count}", String(rows.length))}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.fonctionnalite")}</TableHead>
              <TableHead>{t("common.produit")}</TableHead>
              <TableHead>{t("common.criticite")}</TableHead>
              <TableHead>{t("pages.features.linked_requirements")}</TableHead>
              <TableHead>{t("pages.features.test_cases")}</TableHead>
              <TableHead>{t("pages.features.tests_covered")}</TableHead>
              <TableHead className="w-56">{t("pages.features.coverage")}</TableHead>
              <TableHead className="text-right">{t("pages.features.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => {
              const pct = coveragePct(f);
              const product = products.find((p) => p.id === f.productId);
              const fReqs = reqsByFeature[f.id] ?? [];
              const fTests = testsByFeature[f.id] ?? [];
              const fPassed = fTests.filter(
                (t) => t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION",
              ).length;
              const fRate = fTests.length > 0 ? Math.round((fPassed / fTests.length) * 100) : null;
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    <p className="font-medium">{f.name}</p>
                    <p className="max-w-xs truncate text-xs text-muted-foreground">
                      {f.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                  <TableCell>
                    <CriticalityBadge level={f.criticality} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {fReqs.length === 0 ? (
                      <span className="text-xs text-muted-foreground">{t("common.aucun")}</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {fReqs.slice(0, 3).map((r) => (
                          <Link
                            key={r.id}
                            to="/exigences"
                            className="inline-flex items-center rounded-md border border-border bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:bg-primary/5 hover:border-primary/30"
                            title={r.title}
                          >
                            <FileText className="mr-1 size-3 text-primary/70" />
                            {r.id}
                          </Link>
                        ))}
                        {fReqs.length > 3 ? (
                          <span className="text-[11px] text-muted-foreground">
                            +{fReqs.length - 3}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    {fTests.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="size-3.5 text-info" />
                          <Link to="/campagnes" className="text-sm font-medium hover:underline">
                            {fTests.length} {t("pages.features.cases")}
                          </Link>
                        </div>
                        {fRate !== null ? (
                          <p className="text-[11px] text-muted-foreground pl-5">
                            {fPassed} {t("common.ok")} ·{" "}
                            <span
                              className={
                                fRate >= 80
                                  ? "text-success font-medium"
                                  : fRate >= 60
                                    ? "text-warning font-medium"
                                    : "text-danger font-medium"
                              }
                            >
                              {fRate}%
                            </span>
                          </p>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="num text-sm">
                    {TEST_TYPES.filter((x) => f.coverage[x.id]).length} / {TEST_TYPES.length}{" "}
                    {t("pages.features.types")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <QualityBar value={pct} className="flex-1" />
                      <span className="num w-12 text-right text-sm">{pct} %</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link
                        to="/fonctionnalites/$featureId/modifier"
                        params={{ featureId: f.id }}
                        title={t("pages.features.edit_feature")}
                      >
                        <Button size="icon" variant="ghost" className="size-7">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => setToDeleteFeature(f)}
                        title={t("pages.features.delete_feature")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-3">
          <Box className="size-4 text-info" />
          <h2 className="text-[13px] font-semibold tracking-tight">
            {t("pages.features.traceability_title")}
          </h2>
          <p className="label-eyebrow ml-auto">
            {t("pages.features.traceability_count")
              .replace("{features}", String(rows.length))
              .replace("{requirements}", String(requirements.length))
              .replace("{tests}", String(tests.length))}
          </p>
        </div>
        <div className="p-4">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("pages.features.no_features")}
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((f) => {
                const fReqs = reqsByFeature[f.id] ?? [];
                const fTests = testsByFeature[f.id] ?? [];
                const isOpen = !!expandedFeat[f.id];
                const fPassed = fTests.filter(
                  (t) => t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION",
                ).length;
                const fRate =
                  fTests.length > 0 ? Math.round((fPassed / fTests.length) * 100) : null;
                return (
                  <div
                    key={f.id}
                    className="rounded-md border border-border overflow-hidden bg-white"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle transition-colors"
                      onClick={() => setExpandedFeat((e) => ({ ...e, [f.id]: !isOpen }))}
                    >
                      {isOpen ? (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <Box className="size-4 text-info shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{f.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {f.description || t("pages.features.no_description")} ·{" "}
                          {products.find((p) => p.id === f.productId)?.name ?? "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <FileText className="size-3.5" />
                          {fReqs.length} {t("pages.features.requirement")}
                          {fReqs.length > 1 ? "s" : ""}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <CheckSquare className="size-3.5" />
                          {fTests.length} {t("pages.features.tests")}
                        </span>
                        {fRate !== null ? (
                          <span
                            className={cn(
                              "num font-semibold",
                              fRate >= 80
                                ? "text-success"
                                : fRate >= 60
                                  ? "text-warning"
                                  : "text-danger",
                            )}
                          >
                            {fRate}% {t("common.ok")}
                          </span>
                        ) : null}
                        <CriticalityBadge level={f.criticality} />
                      </div>
                    </button>

                    {isOpen ? (
                      <div className="border-t border-border bg-muted/30 px-4 pb-3 pt-2 space-y-3">
                        {fReqs.length > 0 ? (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                              {t("pages.features.satisfied_requirements")}
                            </p>
                            <div className="ml-4 space-y-1.5">
                              {fReqs.map((r) => (
                                <Link
                                  key={r.id}
                                  to="/exigences"
                                  className="flex items-center gap-3 rounded-md border border-border/60 bg-white px-3 py-2 text-xs hover:bg-primary/5 hover:border-primary/30 transition-colors"
                                >
                                  <FileText className="size-3.5 shrink-0 text-primary" />
                                  <span className="num shrink-0 text-xs font-semibold text-muted-foreground">
                                    {r.id}
                                  </span>
                                  <span className="truncate flex-1 font-medium">{r.title}</span>
                                  <CriticalityBadge level={r.priority} />
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                                      r.status === "couverte" &&
                                        "border-success/30 bg-success-soft text-success",
                                      r.status === "validee" &&
                                        "border-info/30 bg-info-soft text-info",
                                      r.status === "brouillon" &&
                                        "border-border bg-secondary text-secondary-foreground",
                                    )}
                                  >
                                    {REQUIREMENT_STATUS_LABEL[r.status]}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {fTests.length > 0 ? (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                              {t("pages.features.linked_test_cases")}
                            </p>
                            <div className="ml-4 space-y-1.5">
                              {fTests.map((t) => (
                                <Link
                                  key={t.id}
                                  to="/execution/$testId"
                                  params={{ testId: t.id }}
                                  className="flex items-center gap-3 rounded-md border border-border/60 bg-white px-3 py-2 text-xs hover:bg-primary/5 hover:border-primary/30 transition-colors"
                                >
                                  <CheckSquare
                                    className={cn(
                                      "size-3.5 shrink-0",
                                      t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION"
                                        ? "text-success"
                                        : t.verdict === "FAIL"
                                          ? "text-danger"
                                          : t.verdict === "BLOCKED"
                                            ? "text-warning"
                                            : "text-muted-foreground",
                                    )}
                                  />
                                  <span className="num shrink-0 text-[11px] font-semibold text-muted-foreground">
                                    {t.id}
                                  </span>
                                  <span className="truncate flex-1 font-medium text-sm">
                                    {t.name}
                                  </span>
                                  <span className="shrink-0 text-[11px] capitalize text-muted-foreground">
                                    {t.type.replace(/_/g, " ")}
                                  </span>
                                  <CriticalityBadge level={t.criticality} />
                                  <VerdotChip verdict={t.verdict} />
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {fReqs.length === 0 && fTests.length === 0 ? (
                          <p className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
                            {t("pages.features.no_requirement_or_test")}
                            <Link
                              to="/fonctionnalites/$featureId/modifier"
                              params={{ featureId: f.id }}
                            >
                              <Button size="sm" variant="outline" className="ml-3">
                                <Pencil className="size-3.5 mr-1" /> {t("pages.features.complete")}
                              </Button>
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={toDeleteFeature !== null}
        onOpenChange={(o) => !o && setToDeleteFeature(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pages.features.delete_feature_confirmation")}</AlertDialogTitle>
            <AlertDialogDescription>
              {toDeleteFeature ? (
                <>
                  {t("pages.features.delete_feature_description_prefix")}{" "}
                  <span className="font-medium">{toDeleteFeature.name}</span>{" "}
                  {t("pages.features.delete_feature_description_suffix")}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDeleteFeature(null)}>
              {t("actions.annuler")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90 text-white"
              onClick={confirmDelete}
            >
              {t("actions.supprimer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

export const Route = createFileRoute("/fonctionnalites")({
  head: () => ({
    meta: [
      { title: "Registre des fonctionnalités — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Registre des fonctionnalités : criticité, couverture de tests, rattachement aux exigences et résultats d'exécution.",
      },
      { property: "og:title", content: "Registre des fonctionnalités — DHI Quality Platform" },
      {
        property: "og:description",
        content: "Criticité et couverture de tests par fonctionnalité.",
      },
    ],
  }),
  component: FeaturesPage,
});
