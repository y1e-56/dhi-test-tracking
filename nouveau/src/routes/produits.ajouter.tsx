import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AccessDenied } from "@/components/dhi/AccessDenied";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { productForm } from "@/lib/forms/product-form";
import { useI18n } from "@/lib/i18n";
import { canCreateProduct } from "@/lib/role-protection";

export const Route = createFileRoute("/produits/ajouter")({
  head: () => ({
    meta: [
      { title: "Créer un produit — DHI Quality Platform" },
      { name: "description", content: "Créer un nouveau produit logiciel." },
    ],
  }),
  component: CreateProductPage,
});

function CreateProductPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const goToPortfolio = () => void navigate({ to: "/produits" });
  // Meme regle que le bouton « Nouveau produit » : l'URL directe ne doit pas
  // ouvrir un formulaire que le serveur refuserait.
  if (!canCreateProduct()) return <AccessDenied subject={t("nav.produits")} />;

  return (
    <AppShell
      title={t("pages.products.title")}
      subtitle={t("pages.products.subtitle")}
      breadcrumb={t("pages.products.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToPortfolio} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("pages.product_detail.portfolio")}
          </Button>
        </div>

        <EntityForm
          schema={productForm}
          mode="create"
          onCancel={goToPortfolio}
          onSaved={goToPortfolio}
        />
      </div>
    </AppShell>
  );
}
