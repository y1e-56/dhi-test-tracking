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
import { WATCH_LEVEL_LABEL, type WatchLevel, type WatchPoint } from "@/lib/dhi-data";
import { useVisibleProductIds } from "@/lib/use-scope";

import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { api, mapBackendWatchPoint, type BackendWatchPoint } from "@/lib/api";

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
  const { products, projects, features, users, watchPoints, addWatchPoint, replaceWatchPoints } = useStore();
  const activeMembers = users.filter((u) => u.active).map((u) => u.name);
  const productIds = useVisibleProductIds(products);
  const visibleProducts = products.filter((p) => productIds.has(p.id));

  const [form, setForm] = useState<WatchPointForm>({
    title: "",
    description: "",
    productId: visibleProducts[0]?.id ?? "",
    featureId: "",
    level: "vigilance",
    owner: activeMembers[0] ?? "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("pages.watchpoints.title_required"));
      return;
    }
    const localPoint: Omit<WatchPoint, "id" | "createdAt"> = {
      productId: form.productId,
      title: form.title.trim(),
      description: form.description,
      level: form.level,
      status: "ouvert",
      owner: form.owner,
      ...(form.featureId ? { featureId: form.featureId } : {}),
    };
    const project = projects.find((item) => item.productId === form.productId && /^\d+$/.test(item.id));
    const featureId = form.featureId && /^\d+$/.test(form.featureId) ? Number(form.featureId) : undefined;
    if (!localStorage.getItem("token") || !project) {
      addWatchPoint(localPoint);
      toast.success(t("pages.watchpoints.saved"));
      void navigate({ to: "/points-a-surveiller" });
      return;
    }
    try {
      const owner = users.find((user) => user.name === form.owner);
      const ownerId = owner ? Number(owner.id) : undefined;
      const numericOwnerId = ownerId !== undefined && Number.isInteger(ownerId) && ownerId > 0 ? ownerId : undefined;
      const response = await api<BackendWatchPoint>("/watch-points", {
        method: "POST",
        body: JSON.stringify({ project_id: Number(project.id), feature_id: featureId, title: localPoint.title, description: localPoint.description, criticality: ({ critique: "critical", vigilance: "high", info: "low" } as const)[localPoint.level], owner_id: numericOwnerId, status: "open" }),
      });
      replaceWatchPoints([...watchPoints, { ...mapBackendWatchPoint(response, localPoint.productId), owner: localPoint.owner, productId: localPoint.productId }]);
      toast.success(t("pages.watchpoints.saved"));
      void navigate({ to: "/points-a-surveiller" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.erreur"));
    }
  };

  return (
    <AppShell
      title={t("pages.watchpoints.title")}
      subtitle={t("pages.watchpoints.subtitle")}
      breadcrumb={t("pages.watchpoints.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
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
                      {activeMembers.map((p) => (
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
