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
import { Textarea } from "@/components/ui/textarea";
import { PEOPLE, WATCH_LEVEL_LABEL, type WatchLevel } from "@/lib/dhi-data";
import { useVisibleProductIds } from "@/lib/use-scope";
import { DECISION_TABS } from "@/lib/dhi-nav";
import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/points-a-surveiller/ajouter")({
  head: () => ({
    meta: [{ title: "Créer un point à surveiller — DHI Quality Platform" }],
  }),
  component: CreateWatchPointPage,
});

type WatchPointForm = {
  title: string;
  description: string;
  productId: string;
  featureId?: string;
  level: WatchLevel;
  owner: string;
};

function CreateWatchPointPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products, features, addWatchPoint } = useStore();
  const productIds = useVisibleProductIds(products);
  const visibleProducts = products.filter((p) => productIds.has(p.id));

  const [form, setForm] = useState<WatchPointForm>({
    title: "",
    description: "",
    productId: visibleProducts[0]?.id ?? "",
    featureId: "",
    level: "vigilance",
    owner: PEOPLE[0] ?? "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("pages.watchpoints.title_required"));
      return;
    }
    addWatchPoint({
      productId: form.productId,
      featureId: form.featureId || undefined,
      title: form.title.trim(),
      description: form.description,
      level: form.level,
      status: "ouvert",
      owner: form.owner,
    });
    toast.success(t("pages.watchpoints.saved"));
    navigate({ to: "/points-a-surveiller" });
  };

  return (
    <AppShell
      title={t("pages.watchpoints.title")}
      subtitle={t("pages.watchpoints.subtitle")}
      breadcrumb={t("pages.watchpoints.breadcrumb")}
      tabs={DECISION_TABS}
    >
      <div className="panel">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/points-a-surveiller" })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("pages.watchpoints.title")}
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.watchpoints.new_point_page")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("pages.watchpoints.subtitle")}</p>
            </div>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>{t("pages.watchpoints.titre")}</Label>
                <Input
                  value={form.title}
                  placeholder={t("pages.watchpoints.title_placeholder")}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.watchpoints.description")}</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("pages.watchpoints.produit")}</Label>
                  <Select
                    value={form.productId}
                    onValueChange={(v) =>
                      setForm({ ...form, productId: v, featureId: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.watchpoints.feature")}</Label>
                  <Select
                    value={form.featureId ?? ""}
                    onValueChange={(v) => setForm({ ...form, featureId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("pages.watchpoints.no_feature")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("pages.watchpoints.no_feature")}</SelectItem>
                      {features
                        .filter((f) => f.productId === form.productId)
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.watchpoints.niveau")}</Label>
                  <Select
                    value={form.level}
                    onValueChange={(v) => setForm({ ...form, level: v as WatchLevel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(WATCH_LEVEL_LABEL) as WatchLevel[]).map((l) => (
                        <SelectItem key={l} value={l}>
                          {WATCH_LEVEL_LABEL[l]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.watchpoints.responsable")}</Label>
                  <Select value={form.owner} onValueChange={(v) => setForm({ ...form, owner: v })}>
                    <SelectTrigger>
                      <SelectValue />
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
              onClick={() => navigate({ to: "/points-a-surveiller" })}
              className="h-11 px-6"
            >
              {t("pages.watchpoints.annuler")}
            </Button>
            <Button type="submit" className="h-11 px-6">
              {t("pages.watchpoints.enregistrer")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
