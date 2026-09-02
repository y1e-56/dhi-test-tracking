import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, VerdictBadge } from "@/components/dhi/indicators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { products as seedProducts } from "@/lib/dhi-data";
import { productTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/produits/$productId/tests")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Cas de test · ${loaderData?.name ?? "Produit"} — DHI Quality Platform` }],
  }),
  component: ProductTests,
});

function ProductTests() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const { products, campaigns, tests } = useStore();
  const product = products.find((p) => p.id === productId);

  const campaignIds = new Set(campaigns.filter((c) => c.productId === productId).map((c) => c.id));
  const prodTests = tests.filter((x) => campaignIds.has(x.campaignId));

  return (
    <AppShell
      title={product?.name ?? t("nav.product_tests")}
      subtitle={t("nav.product_tests")}
      breadcrumb={[t("nav.qualite"), t("nav.produits"), product?.name ?? "", t("nav.product_tests")]}
      tabs={productTabs(productId)}
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.id")}</TableHead>
              <TableHead>{t("pages.campaign_detail.test")}</TableHead>
              <TableHead>{t("common.campagne")}</TableHead>
              <TableHead>{t("common.criticite")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("common.verdict")}</TableHead>
              <TableHead>{t("common.testeur")}</TableHead>
              <TableHead className="text-right">{t("pages.campaign_detail.execution")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prodTests.map((tc) => {
              const camp = campaigns.find((c) => c.id === tc.campaignId);
              return (
                <TableRow key={tc.id}>
                  <TableCell className="num font-medium">{tc.id}</TableCell>
                  <TableCell className="max-w-xs truncate">{tc.name}</TableCell>
                  <TableCell className="text-sm">
                    {camp ? (
                      <Link
                        to="/campagnes/$campaignId"
                        params={{ campaignId: camp.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {camp.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <CriticalityBadge level={tc.criticality} />
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {tc.type.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    <VerdictBadge verdict={tc.verdict} />
                  </TableCell>
                  <TableCell className="text-sm">{tc.tester ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/execution/$testId"
                      params={{ testId: tc.id }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t("pages.campaign_detail.executer")}
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {prodTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  {t("pages.product_detail.no_campaigns_for_product")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}