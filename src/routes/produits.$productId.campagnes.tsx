import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { QualityBar, StatusBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { campaignStats, loadSnapshot, useStore } from "@/lib/dhi-store";
import { products as seedProducts } from "@/lib/dhi-data";
import { productTabs } from "@/lib/dhi-nav";
import { canCreate } from "@/lib/role-protection";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/produits/$productId/campagnes")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Campagnes · ${loaderData?.name ?? "Produit"} — DHI Quality Platform` },
    ],
  }),
  component: ProductCampaigns,
});

function ProductCampaigns() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const { products, projects, campaigns, tests } = useStore();
  const product = products.find((p) => p.id === productId);

  const prodCampaigns = campaigns.filter((c) => c.productId === productId);

  return (
    <AppShell
      title={product?.name ?? t("nav.product_campaigns")}
      subtitle={t("nav.product_campaigns")}
      breadcrumb={[t("nav.qualite"), t("nav.produits"), product?.name ?? "", t("nav.product_campaigns")]}
      tabs={productTabs(productId)}
      actions={
        canCreate() ? (
          <Link to="/campagnes/ajouter">
            <Button size="sm">
              <Plus className="size-4" /> {t("pages.campaigns.new_campaign")}
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.campagne")}</TableHead>
              <TableHead>{t("common.projet")}</TableHead>
              <TableHead>{t("common.version")}</TableHead>
              <TableHead>{t("common.etat")}</TableHead>
              <TableHead>{t("pages.campaigns.progress")}</TableHead>
              <TableHead className="text-right">{t("pages.product_detail.success_rate")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prodCampaigns.map((c) => {
              const st = campaignStats(tests, c.id);
              const pr = projects.find((p) => p.id === c.projectId);
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
                  <TableCell>
                    {pr ? (
                      <Link
                        to="/projets/$projectId"
                        params={{ projectId: pr.id }}
                        className="text-sm text-primary hover:underline"
                      >
                        {pr.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="num">{c.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="w-48">
                    <QualityBar value={st.executionRate} neutral />
                  </TableCell>
                  <TableCell className="num text-right">{st.successRate} %</TableCell>
                </TableRow>
              );
            })}
            {prodCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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