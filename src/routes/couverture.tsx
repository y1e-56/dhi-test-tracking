import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { Panel } from "@/components/dhi/indicators";
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
import { TEST_TYPES } from "@/lib/dhi-data";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/couverture")({
  head: () => ({
    meta: [
      { title: "Matrice de couverture — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Matrice de couverture 2D : fonctionnalités × types de tests, avec alertes sur les trous.",
      },
      { property: "og:title", content: "Matrice de couverture — DHI Quality Platform" },
      {
        property: "og:description",
        content: "Visualisez les trous de couverture de tests par fonctionnalité.",
      },
    ],
  }),
  component: CoveragePage,
});

function CoveragePage() {
  const { t } = useI18n();
  const { features, products } = useStore();
  const [productFilter, setProductFilter] = useState("all");

  const rows = useMemo(
    () => features.filter((f) => productFilter === "all" || f.productId === productFilter),
    [features, productFilter],
  );

  const totalCells = rows.length * TEST_TYPES.length;
  const missingCells = rows.flatMap((f) =>
    TEST_TYPES.filter((t) => !f.coverage[t.id]).map((t) => ({ f, t })),
  );
  const missingPct = totalCells ? Math.round((missingCells.length / totalCells) * 100) : 0;

  return (
    <AppShell
      title={t("pages.couverture.title")}
      subtitle={t("pages.couverture.subtitle")}
      breadcrumb={t("pages.couverture.breadcrumb")}
      tabs={QUALITY_TABS}
    >
      <Panel
        title={t("pages.couverture.grid_title")}
        actions={
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("pages.couverture.product_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.couverture.all_products")}</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.couverture.feature")}</TableHead>
              {TEST_TYPES.map((testType) => (
                <TableHead key={testType.id} className="text-center">
                  {testType.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                {TEST_TYPES.map((testType) => {
                  const covered = !!f.coverage[testType.id];
                  return (
                    <TableCell key={testType.id} className="text-center">
                      <span
                        className={
                          covered
                            ? "inline-flex size-7 items-center justify-center rounded-md bg-success-soft text-success"
                            : "inline-flex size-7 items-center justify-center rounded-md bg-danger-soft text-danger"
                        }
                        title={`${f.name} · ${testType.label} : ${
                          covered
                            ? t("pages.couverture.covered")
                            : t("pages.couverture.not_covered")
                        }`}
                      >
                        {covered ? <Check className="size-4" /> : <X className="size-4" />}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            {t("pages.couverture.legend")}{" "}
            <span className="font-medium text-success">✓ {t("pages.couverture.covered")}</span> ·{" "}
            <span className="font-medium text-danger">✗ {t("pages.couverture.not_covered")}</span>
          </p>
          <p className="num text-sm font-medium">
            {t(
              "pages.couverture.missing_cells",
              `Cases manquantes : ${missingCells.length} / ${totalCells} (${missingPct} %)`,
            )
              .replace("{count}", String(missingCells.length))
              .replace("{total}", String(totalCells))
              .replace("{pct}", String(missingPct))}
          </p>
        </div>
      </Panel>

      <Panel title={t("pages.couverture.alerts_title")} className="mt-4">
        {missingCells.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("pages.couverture.full_coverage")}</p>
        ) : (
          <ul className="space-y-2">
            {missingCells.slice(0, 10).map(({ f, t: testType }) => (
              <li
                key={`${f.id}-${testType.id}`}
                className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 text-warning" />
                <span>
                  {t("pages.couverture.no_test")
                    .replace("{feature}", f.name)
                    .replace("{type}", testType.label.toLowerCase())}
                </span>
              </li>
            ))}
            {missingCells.length > 10 ? (
              <li className="text-sm text-muted-foreground">
                {t("pages.couverture.more_trou").replace(
                  "{count}",
                  String(missingCells.length - 10),
                )}
              </li>
            ) : null}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
