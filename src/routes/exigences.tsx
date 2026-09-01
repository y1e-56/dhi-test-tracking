import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  FileText,
  Box,
  CheckSquare,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, KpiCard } from "@/components/dhi/indicators";
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
import { useStore } from "@/lib/dhi-store";
import { useVisibleProductIds } from "@/lib/use-scope";
import { type Requirement, type RequirementStatus, type TestCase } from "@/lib/dhi-data";
import { canCreate } from "@/lib/role-protection";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { useI18n, type TranslationKey } from "@/lib/i18n";

const REQUIREMENT_STATUS_T_KEY: Record<RequirementStatus, TranslationKey> = {
  brouillon: "pages.requirements.status_brouillon",
  validee: "pages.requirements.status_validee",
  couverte: "pages.requirements.status_couverte",
};

export const Route = createFileRoute("/exigences")({
  head: () => ({
    meta: [
      { title: "Exigences & traçabilité — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Référentiel des exigences produit : priorité, statut de validation et rattachement aux fonctionnalités testées.",
      },
      { property: "og:title", content: "Exigences & traçabilité — DHI Quality Platform" },
      {
        property: "og:description",
        content: "Traçabilité entre exigences métier et fonctionnalités couvertes par les tests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequirementsPage,
});

function StatusPill({ status }: { status: RequirementStatus }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
        status === "couverte" && "border-success/30 bg-success-soft text-success",
        status === "validee" && "border-info/30 bg-info-soft text-info",
        status === "brouillon" && "border-border bg-secondary text-secondary-foreground",
      )}
    >
      {t(REQUIREMENT_STATUS_T_KEY[status])}
    </span>
  );
}

function RequirementsPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/exigences") return <Outlet />;
  return <RequirementsList />;
}

function RequirementsList() {
  const { requirements, products, features, tests, updateRequirement, deleteRequirement } =
    useStore();
  const { t } = useI18n();
  const [productFilter, setProductFilter] = useState("all");
  const [expandedReq, setExpandedReq] = useState<Record<string, boolean>>({});
  const [expandedFeature, setExpandedFeature] = useState<Record<string, boolean>>({});

  const [toDeleteReq, setToDeleteReq] = useState<Requirement | null>(null);

  const fmt = (key: TranslationKey, count: number) => t(key).replace("{count}", String(count));

  const visiblePIds = useVisibleProductIds(products);
  const visibleRequirements = useMemo(
    () => requirements.filter((r) => visiblePIds.has(r.productId)),
    [requirements, visiblePIds],
  );

  const rows = useMemo(
    () =>
      visibleRequirements.filter(
        (r) => productFilter === "all" || r.productId === productFilter,
      ),
    [visibleRequirements, productFilter],
  );

  const testsForFeatures = useMemo(() => {
    const byFeature: Record<string, TestCase[]> = {};
    for (const t of tests) (byFeature[t.featureId] ||= []).push(t);
    return byFeature;
  }, [tests]);

  const requirementsByFeature = useMemo(() => {
    const map: Record<string, Requirement[]> = {};
    for (const r of requirements) {
      for (const fid of r.featureIds) (map[fid] ||= []).push(r);
    }
    return map;
  }, [requirements]);

  const countTestsForReq = (featureIds: string[]) => {
    let total = 0;
    for (const fid of featureIds) total += testsForFeatures[fid]?.length ?? 0;
    return total;
  };

  const countPassedForReq = (featureIds: string[]) => {
    let passed = 0;
    let total = 0;
    for (const fid of featureIds) {
      const list = testsForFeatures[fid] ?? [];
      total += list.length;
      for (const t of list)
        if (t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION") passed++;
    }
    return { passed, total };
  };

  const orphanRequirements = useMemo(() => rows.filter((r) => r.featureIds.length === 0), [rows]);

  const orphanFeatures = useMemo(() => {
    const filteredProductIds =
      productFilter === "all" ? visiblePIds : new Set<string>([productFilter]);
    return features.filter(
      (f) => filteredProductIds.has(f.productId) && !(requirementsByFeature[f.id]?.length ?? 0),
    );
  }, [features, requirementsByFeature, productFilter, visiblePIds]);

  const confirmDelete = () => {
    if (!toDeleteReq) return;
    deleteRequirement(toDeleteReq.id);
    toast.success(t("pages.requirements.deleted").replace("{id}", toDeleteReq.id));
    setToDeleteReq(null);
  };

  return (
    <AppShell
      title={t("pages.requirements.title")}
      subtitle={t("pages.requirements.subtitle")}
      breadcrumb={t("pages.requirements.breadcrumb")}
      tabs={QUALITY_TABS}
      actions={
        canCreate() ? (
          <Link to="/exigences/ajouter">
            <Button size="sm">
              <Plus className="size-4" /> {t("pages.requirements.new_requirement")}
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("nav.exigences")}
          value={visibleRequirements.length}
          hint={t("pages.requirements.tous_produits")}
        />
        <KpiCard
          label={t("pages.requirements.couvertes")}
          value={visibleRequirements.filter((r) => r.status === "couverte").length}
          tone="success"
          hint={t("pages.requirements.rattachees_a_des_tests")}
        />
        <KpiCard
          label={t("pages.requirements.validees")}
          value={visibleRequirements.filter((r) => r.status === "validee").length}
          tone="info"
          hint={t("pages.requirements.a_couvrir")}
        />
        <KpiCard
          label={t("pages.requirements.brouillons")}
          value={visibleRequirements.filter((r) => r.status === "brouillon").length}
          tone="warning"
          hint={t("pages.requirements.a_valider")}
        />
      </div>

      {orphanRequirements.length > 0 || orphanFeatures.length > 0 ? (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          {orphanRequirements.length > 0 ? (
            <div className="panel border-warning/40 bg-warning-soft/40">
              <div className="flex items-start gap-3 px-4 py-3">
                <AlertTriangle className="size-5 shrink-0 text-warning mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-warning-foreground">
                    {t("gap.exigences_orphelines")}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {fmt("pages.requirements.orphelins_req_count", orphanRequirements.length)}
                  </p>
                  <ul className="space-y-1">
                    {orphanRequirements.slice(0, 4).map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between rounded-md bg-white/70 px-2 py-1.5 text-xs"
                      >
                        <span className="truncate">
                          <span className="num font-semibold mr-2">{r.id}</span>
                          <span className="truncate">{r.title}</span>
                        </span>
                        <Link
                          to="/exigences/$requirementId/modifier"
                          params={{ requirementId: r.id }}
                        >
                          <Button size="icon" variant="ghost" className="size-6 shrink-0 ml-2">
                            <Pencil className="size-3.5" />
                          </Button>
                        </Link>
                      </li>
                    ))}
                    {orphanRequirements.length > 4 ? (
                      <li className="text-[11px] text-muted-foreground pl-2">
                        {fmt("pages.requirements.plus_autres", orphanRequirements.length - 4)}
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
          {orphanFeatures.length > 0 ? (
            <div className="panel border-warning/40 bg-warning-soft/40">
              <div className="flex items-start gap-3 px-4 py-3">
                <Box className="size-5 shrink-0 text-warning mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-warning-foreground">
                    {t("gap.features_orphelines")}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {fmt("pages.requirements.orphelins_feat_count", orphanFeatures.length)}
                  </p>
                  <ul className="space-y-1">
                    {orphanFeatures.slice(0, 4).map((f) => {
                      const prod = products.find((p) => p.id === f.productId);
                      return (
                        <li
                          key={f.id}
                          className="flex items-center justify-between rounded-md bg-white/70 px-2 py-1.5 text-xs"
                        >
                          <span className="truncate">
                            <span className="font-semibold mr-2">{f.name}</span>
                            <span className="text-muted-foreground truncate">
                              ({prod?.name ?? "—"})
                            </span>
                          </span>
                          <Link
                            to="/fonctionnalites"
                            className="text-[11px] font-medium text-primary hover:underline shrink-0 ml-2"
                          >
                            {t("pages.requirements.lier")}
                          </Link>
                        </li>
                      );
                    })}
                    {orphanFeatures.length > 4 ? (
                      <li className="text-[11px] text-muted-foreground pl-2">
                        {fmt("pages.requirements.plus_autres", orphanFeatures.length - 4)}
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-2.5">
          <h2 className="text-[13px] font-semibold tracking-tight">
            {t("pages.requirements.referentiel")}
          </h2>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t("common.produit")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.requirements.tous_les_produits")}</SelectItem>
              {products
                .filter((p) => visiblePIds.has(p.id))
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="label-eyebrow ml-auto">
            {fmt("pages.requirements.exigences_count", rows.length)}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.id")}</TableHead>
              <TableHead>{t("pages.requirements.exigence")}</TableHead>
              <TableHead>{t("common.produit")}</TableHead>
              <TableHead>{t("pages.requirements.priorite")}</TableHead>
              <TableHead>{t("pages.requirements.fonctionnalites_liees")}</TableHead>
              <TableHead>{t("pages.requirements.tests_couverts")}</TableHead>
              <TableHead>{t("pages.requirements.reussite")}</TableHead>
              <TableHead>{t("common.statut")}</TableHead>
              <TableHead className="text-right">{t("pages.requirements.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const linkedFeatures = r.featureIds
                .map((id) => features.find((f) => f.id === id))
                .filter(Boolean);
              const nTests = countTestsForReq(r.featureIds);
              const { passed, total } = countPassedForReq(r.featureIds);
              const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
              return (
                <TableRow key={r.id}>
                  <TableCell className="num font-medium">{r.id}</TableCell>
                  <TableCell className="max-w-sm">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.description}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {products.find((p) => p.id === r.productId)?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <CriticalityBadge level={r.priority} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {linkedFeatures.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {t("pages.requirements.aucune")}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {linkedFeatures.slice(0, 3).map((f) => (
                          <span
                            key={f!.id}
                            className="inline-flex items-center rounded-md border border-border bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                            title={f!.description}
                          >
                            <Box className="mr-1 size-3 text-muted-foreground" />
                            {f!.name}
                          </span>
                        ))}
                        {linkedFeatures.length > 3 ? (
                          <span className="text-[11px] text-muted-foreground">
                            +{linkedFeatures.length - 3}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="num text-sm font-medium">
                    {nTests > 0 ? fmt("pages.requirements.tests_count", nTests) : "—"}
                  </TableCell>
                  <TableCell>
                    {total > 0 ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "num w-12 text-right text-sm font-medium",
                            passRate >= 80
                              ? "text-success"
                              : passRate >= 60
                                ? "text-warning"
                                : "text-danger",
                          )}
                        >
                          {passRate} %
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({passed}/{total})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.status}
                      onValueChange={(v) => {
                        updateRequirement(r.id, { status: v as RequirementStatus });
                        toast.success(
                          `${r.id} : ${t(REQUIREMENT_STATUS_T_KEY[v as RequirementStatus])}.`,
                        );
                      }}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <StatusPill status={r.status} />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(REQUIREMENT_STATUS_T_KEY) as RequirementStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(REQUIREMENT_STATUS_T_KEY[s])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link
                        to="/exigences/$requirementId/modifier"
                        params={{ requirementId: r.id }}
                        title={t("pages.requirements.edit_requirement")}
                      >
                        <Button size="icon" variant="ghost" className="size-7">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => setToDeleteReq(r)}
                        title={t("pages.requirements.delete_requirement")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  {t("pages.requirements.aucune_exigence_produit")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-3">
          <FileText className="size-4 text-primary" />
          <h2 className="text-[13px] font-semibold tracking-tight">
            {t("pages.requirements.traceability_view_title")}
          </h2>
          <p className="label-eyebrow ml-auto">
            {fmt("pages.requirements.exigences_count", rows.length)} ·{" "}
            {fmt("pages.requirements.fonctionnalites_count", features.length)} ·{" "}
            {fmt("pages.requirements.tests_count", tests.length)}
          </p>
        </div>
        <div className="p-4">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("pages.requirements.aucune_exigence_selection")}
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const linkedFeatures = r.featureIds
                  .map((id) => features.find((f) => f.id === id))
                  .filter(Boolean);
                const isReqOpen = !!expandedReq[r.id];
                const { passed, total } = countPassedForReq(r.featureIds);
                const passRate = total > 0 ? Math.round((passed / total) * 100) : null;
                return (
                  <div
                    key={r.id}
                    className="rounded-md border border-border overflow-hidden bg-white"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle transition-colors"
                      onClick={() => setExpandedReq((e) => ({ ...e, [r.id]: !isReqOpen }))}
                    >
                      {isReqOpen ? (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex min-w-0 items-center gap-3 flex-1">
                        <span className="num shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {r.id}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">{r.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.description || t("pages.requirements.sans_description")}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Box className="size-3.5" />
                          {fmt("pages.requirements.fonctionnalites_count", linkedFeatures.length)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <CheckSquare className="size-3.5" />
                          {fmt("pages.requirements.tests_count", countTestsForReq(r.featureIds))}
                        </span>
                        {passRate !== null ? (
                          <span
                            className={cn(
                              "num font-semibold",
                              passRate >= 80
                                ? "text-success"
                                : passRate >= 60
                                  ? "text-warning"
                                  : "text-danger",
                            )}
                          >
                            {passRate}% {t("common.ok")}
                          </span>
                        ) : null}
                        <StatusPill status={r.status} />
                      </div>
                    </button>

                    {isReqOpen ? (
                      <div className="border-t border-border bg-muted/30 px-4 pb-3 pt-2">
                        {linkedFeatures.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
                            {t("pages.requirements.aucune_feature_liee")}
                            <Link
                              to="/exigences/$requirementId/modifier"
                              params={{ requirementId: r.id }}
                            >
                              <Button size="sm" variant="outline" className="ml-3">
                                <Pencil className="size-3.5 mr-1" />{" "}
                                {t("actions.lier_fonctionnalites")}
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {linkedFeatures.map((f) => {
                              const fTests = testsForFeatures[f!.id] ?? [];
                              const isFeatOpen = !!expandedFeature[`${r.id}:${f!.id}`];
                              const fPassed = fTests.filter(
                                (t) =>
                                  t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION",
                              ).length;
                              const fRate =
                                fTests.length > 0
                                  ? Math.round((fPassed / fTests.length) * 100)
                                  : null;
                              return (
                                <div
                                  key={f!.id}
                                  className="ml-6 rounded-md border border-border/70 overflow-hidden bg-white"
                                >
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-subtle transition-colors"
                                    onClick={() =>
                                      setExpandedFeature((e) => ({
                                        ...e,
                                        [`${r.id}:${f!.id}`]: !isFeatOpen,
                                      }))
                                    }
                                  >
                                    {isFeatOpen ? (
                                      <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                                    ) : (
                                      <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <Box className="size-4 text-info shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium">{f!.name}</p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {f!.description || t("pages.requirements.sans_description")}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3 text-xs">
                                      <CriticalityBadge level={f!.criticality} />
                                      <span className="text-muted-foreground">
                                        {fmt("pages.requirements.tests_count", fTests.length)}
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
                                          {fRate}%
                                        </span>
                                      ) : null}
                                    </div>
                                  </button>

                                  {isFeatOpen ? (
                                    <div className="border-t border-border/70 bg-muted/30 px-3 py-2">
                                      {fTests.length === 0 ? (
                                        <p className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md ml-6">
                                          {t("pages.requirements.aucun_test_feature")}
                                        </p>
                                      ) : (
                                        <div className="ml-6 space-y-1.5">
                                          {fTests.map((t) => (
                                            <Link
                                              key={t.id}
                                              to="/execution/$testId"
                                              params={{ testId: t.id }}
                                              className="flex items-center gap-3 rounded-md border border-border/60 bg-white px-3 py-2 text-sm hover:bg-primary/5 hover:border-primary/30 transition-colors"
                                            >
                                              <CheckSquare
                                                className={cn(
                                                  "size-4 shrink-0",
                                                  t.verdict === "PASS" ||
                                                    t.verdict === "PASS_WITH_RESERVATION"
                                                    ? "text-success"
                                                    : t.verdict === "FAIL"
                                                      ? "text-danger"
                                                      : t.verdict === "BLOCKED"
                                                        ? "text-warning"
                                                        : "text-muted-foreground",
                                                )}
                                              />
                                              <span className="num shrink-0 text-xs font-semibold text-muted-foreground">
                                                {t.id}
                                              </span>
                                              <span className="truncate flex-1 font-medium">
                                                {t.name}
                                              </span>
                                              <span className="shrink-0 text-xs capitalize text-muted-foreground">
                                                {t.type.replace(/_/g, " ")}
                                              </span>
                                              <CriticalityBadge level={t.criticality} />
                                              <span
                                                className={cn(
                                                  "num shrink-0 text-xs font-semibold",
                                                  t.verdict === "PASS"
                                                    ? "text-success"
                                                    : t.verdict === "PASS_WITH_RESERVATION"
                                                      ? "text-success/80"
                                                      : t.verdict === "FAIL"
                                                        ? "text-danger"
                                                        : t.verdict === "BLOCKED"
                                                          ? "text-warning"
                                                          : t.verdict === "NOT_APPLICABLE"
                                                            ? "text-muted-foreground"
                                                            : "text-muted-foreground/70",
                                                )}
                                              >
                                                {t.verdict}
                                              </span>
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={toDeleteReq !== null} onOpenChange={(o) => !o && setToDeleteReq(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pages.requirements.delete_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {toDeleteReq
                ? t("pages.requirements.delete_confirm_text")
                    .replace("{id}", toDeleteReq.id)
                    .replace("{title}", toDeleteReq.title)
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDeleteReq(null)}>
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
