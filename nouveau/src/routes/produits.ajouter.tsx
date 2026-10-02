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

import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { api, mapBackendProduct, type BackendProduct } from "@/lib/api";

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
  const { users, products, addProduct, replaceProducts } = useStore();
  const memberNames = users.filter((u) => u.active).map((u) => u.name);

  const [form, setForm] = useState({
    name: "",
    description: "",
    owner: "",
    qaLead: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerName = form.owner.trim();
    if (!form.name.trim() || !ownerName || !form.qaLead) {
      toast.error(t("pages.products.required"));
      return;
    }
    const owner = users.find((user) => user.name === ownerName);
    const qaLead = users.find((user) => user.name === form.qaLead);
    if (!localStorage.getItem("token")) {
      addProduct({ name: form.name.trim(), description: form.description, owner: ownerName, qaLead: form.qaLead, qaTeam: [form.qaLead], versions: ["1.0"], score: 80 });
      toast.success(t("pages.products.created"));
      void navigate({ to: "/produits" });
      return;
    }
    try {
      const response = await api<{ product: BackendProduct }>("/products", {
        method: "POST",
        body: JSON.stringify({ name: form.name.trim(), description: form.description, owner_id: owner ? Number(owner.id) : null, owner_name: ownerName, quality_manager_id: qaLead ? Number(qaLead.id) : null }),
      });
      replaceProducts([...products, { ...mapBackendProduct(response.product), owner: ownerName, qaLead: form.qaLead, qaTeam: [form.qaLead] }]);
      toast.success(t("pages.products.created"));
      void navigate({ to: "/produits" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.erreur"));
    }
  };

  return (
    <AppShell
      title={t("pages.products.title")}
      subtitle={t("pages.products.subtitle")}
      breadcrumb={t("pages.products.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
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
                {t("pages.products.new_product")}
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
                  <Label htmlFor="p-owner" className="text-sm font-medium">{t("pages.products.owner")}</Label>
                  <Input
                    id="p-owner"
                    value={form.owner}
                    onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                    placeholder={t("pages.products.owner_placeholder")}
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-qa" className="text-sm font-medium">{t("pages.products.qa_lead")}</Label>
                  <Select
                    value={form.qaLead}
                    onValueChange={(v) => setForm((f) => ({ ...f, qaLead: v }))}
                  >
                    <SelectTrigger id="p-qa" className="h-11">
                      <SelectValue placeholder={t("pages.go_live.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {memberNames.map((p) => (
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
              {t("pages.products.create")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
