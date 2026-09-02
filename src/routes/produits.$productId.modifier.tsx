import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PEOPLE, products as seedProducts } from "@/lib/dhi-data";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { getUser, productVisibleTo } from "@/lib/access";
import { ProductAccessDenied } from "@/components/dhi/AccessDenied";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/produits/$productId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Modifier ${loaderData?.name ?? "le produit"} — DHI Quality Platform` }],
  }),
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products, updateProduct } = useStore();
  const product = products.find((p) => p.id === productId);

  const [form, setForm] = useState(() => ({
    name: product?.name ?? "",
    description: product?.description ?? "",
    owner: product?.owner ?? "",
    qaLead: product?.qaLead ?? "",
  }));

  if (product && !productVisibleTo(product, getUser())) {
    return <ProductAccessDenied subject={product.name} />;
  }
  if (!product) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.owner || !form.qaLead) {
      toast.error(t("pages.products.required"));
      return;
    }
    updateProduct(product.id, {
      name: form.name.trim(),
      description: form.description,
      owner: form.owner,
      qaLead: form.qaLead,
      qaTeam: [form.qaLead],
    });
    toast.success(t("pages.products.updated_msg"));
    navigate({ to: "/produits" });
  };

  return (
    <AppShell
      title={t("pages.products.title")}
      subtitle={t("pages.products.subtitle")}
      breadcrumb={t("pages.products.breadcrumb")}
      tabs={QUALITY_TABS}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/produits" })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("pages.product_detail.portfolio")}
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.products.edit_product")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("pages.products.subtitle")}</p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-name" className="text-sm font-medium">
                  {t("pages.products.name_label")}
                </Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("pages.products.name_placeholder")}
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="p-desc" className="text-sm font-medium">
                  {t("common.description")}
                </Label>
                <Input
                  id="p-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">{t("pages.products.owner")}</Label>
                  <Select
                    value={form.owner}
                    onValueChange={(v) => setForm((f) => ({ ...f, owner: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("pages.go_live.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PEOPLE.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">{t("pages.products.qa_lead")}</Label>
                  <Select
                    value={form.qaLead}
                    onValueChange={(v) => setForm((f) => ({ ...f, qaLead: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("pages.go_live.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PEOPLE.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/produits" })}
              className="h-11 px-6"
            >
              {t("actions.annuler")}
            </Button>
            <Button type="submit" className="h-11 px-6">
              {t("actions.enregistrer")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
