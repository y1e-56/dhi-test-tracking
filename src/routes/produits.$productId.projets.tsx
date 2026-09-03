import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/dhi/AppShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { products as seedProducts, PROJECT_STATUS_LABEL } from "@/lib/dhi-data";
import { cn } from "@/lib/utils";
import { productTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/produits/$productId/projets")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Projets · ${loaderData?.name ?? "Produit"} — DHI Quality Platform` }],
  }),
  component: ProductProjects,
});

const STATUS_TONE: Record<string, string> = {
  encours: "border-info/30 bg-info-soft text-info",
  termine: "border-success/30 bg-success-soft text-success",
  planifie: "border-border bg-secondary text-secondary-foreground",
};

function ProductProjects() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const { products, projects, campaigns } = useStore();
  const product = products.find((p) => p.id === productId);

  const prodProjects = projects.filter((pr) => pr.productId === productId);

  return (
    <AppShell
      title={product?.name ?? t("nav.product_projects")}
      subtitle={t("nav.product_projects")}
      breadcrumb={[t("nav.qualite"), t("nav.produits"), product?.name ?? "", t("nav.product_projects")]}
      tabs={productTabs(productId)}
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.projet")}</TableHead>
              <TableHead>{t("common.etat")}</TableHead>
              <TableHead>{t("pages.campaigns.progress")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prodProjects.map((pr) => {
              const prCampaigns = campaigns.filter((c) => c.projectId === pr.id);
              const executed = prCampaigns.filter((c) => c.status !== "planifiee").length;
              const rate = prCampaigns.length > 0 ? Math.round((executed / prCampaigns.length) * 100) : 0;
              return (
                <TableRow key={pr.id}>
                  <TableCell>
                    <Link
                      to="/projets/$projectId"
                      params={{ projectId: pr.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {pr.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold",
                        STATUS_TONE[pr.status],
                      )}
                    >
                      {PROJECT_STATUS_LABEL[pr.status]}
                    </span>
                  </TableCell>
                  <TableCell className="num text-sm">
                    {prCampaigns.length} · {rate} %
                  </TableCell>
                </TableRow>
              );
            })}
            {prodProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  {t("pages.product.no_projects")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}