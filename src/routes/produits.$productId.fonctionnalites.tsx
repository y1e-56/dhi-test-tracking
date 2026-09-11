import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { FileText, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, QualityBar } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { products as seedProducts, TEST_TYPES } from "@/lib/dhi-data";
import { productTabs } from "@/lib/dhi-nav";
import { canCreate } from "@/lib/role-protection";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/produits/$productId/fonctionnalites")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Fonctionnalités · ${loaderData?.name ?? "Produit"} — DHI Quality Platform` },
    ],
  }),
  component: ProductFeatures,
});

const coveragePct = (f: ReturnType<typeof useStore>["features"][number]) => {
  const total = TEST_TYPES.length;
  const covered = TEST_TYPES.filter((t) => f.coverage[t.id]).length;
  return Math.round((covered / total) * 100);
};

function ProductFeatures() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const { products, features } = useStore();
  const product = products.find((p) => p.id === productId);
  const [search, setSearch] = useState("");

  const rows = useMemo(
    () =>
      features
        .filter((f) => f.productId === productId)
        .filter((feature) => {
          if (!search.trim()) return true;
          const query = search.toLowerCase();
          return (
            feature.name.toLowerCase().includes(query) ||
            feature.description.toLowerCase().includes(query)
          );
        }),
    [features, productId, search],
  );

  return (
    <AppShell
      title={product?.name ?? t("nav.product_features")}
      subtitle={t("nav.product_features")}
      breadcrumb={[t("nav.qualite"), t("nav.produits"), product?.name ?? "", t("nav.product_features")]}
      tabs={productTabs(productId)}
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
        <div className="border-b border-border px-4 py-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("pages.features.search_placeholder")}
              className="pl-8"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.fonctionnalite")}</TableHead>
              <TableHead>{t("common.criticite")}</TableHead>
              <TableHead>{t("pages.features.tests_covered")}</TableHead>
              <TableHead className="w-56">{t("pages.features.coverage")}</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => {
              const pct = coveragePct(f);
              const covered = TEST_TYPES.filter((x) => f.coverage[x.id]).length;
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    <p className="font-medium">{f.name}</p>
                    <p className="max-w-xs truncate text-xs text-muted-foreground">
                      {f.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <CriticalityBadge level={f.criticality} />
                  </TableCell>
                  <TableCell className="num text-sm">
                    {covered} / {TEST_TYPES.length} {t("pages.features.types")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <QualityBar value={pct} className="flex-1" />
                      <span className="num w-12 text-right text-sm">{pct} %</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/fonctionnalites/$featureId/documents"
                      params={{ featureId: f.id }}
                      title={t("pages.documents.feature_docs")}
                    >
                      <Button size="icon" variant="ghost" className="size-7">
                        <FileText className="size-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {t("pages.features.no_features")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}