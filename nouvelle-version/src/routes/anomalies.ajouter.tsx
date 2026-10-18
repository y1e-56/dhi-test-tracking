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
import { SEVERITY_LABEL, type Severity } from "@/lib/dhi-data";

import { api, mapBackendAnomaly, type BackendAnomaly } from "@/lib/api";
import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { useVisibleProducts } from "@/lib/use-scope";

export const Route = createFileRoute("/anomalies/ajouter")({
  head: () => ({
    meta: [{ title: "Créer une anomalie — DHI Quality Platform" }],
  }),
  component: CreateDefectPage,
});

type DefectForm = {
  title: string;
  description: string;
  severity: Severity;
  priority: Severity;
  productId: string;
  campaignId: string;
  featureId: string;
  assignee: string;
  developer: string;
};

function CreateDefectPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products, features, users, campaigns, addDefect, currentUser } = useStore();
  const viewableProducts = useVisibleProducts(products);

  const universe = users.filter((u) => u.active).map((u) => u.name);
  const devs = users.filter((u) => u.active && u.role === "developpeur").map((u) => u.name);
  const isDev = (currentUser?.role as string) === "developpeur";
  const defaultDeveloper =
    isDev && currentUser && devs.includes(currentUser.name)
      ? currentUser.name
      : devs[0] ?? "";

  const [form, setForm] = useState<DefectForm>({
    title: "",
    description: "",
    severity: "moyenne",
    priority: "moyenne",
    productId: viewableProducts[0]?.id ?? "",
    campaignId: campaigns[0]?.id ?? "",
    featureId: features[0]?.id ?? "",
    assignee: currentUser?.name && universe.includes(currentUser.name) ? currentUser.name : universe[0] ?? "",
    developer: defaultDeveloper,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("pages.anomalies.title_required"));
      return;
    }
    const base = {
      productId: form.productId,
      title: form.title.trim(),
      description: form.description,
      severity: form.severity,
      priority: form.priority,
      status: "nouvelle" as const,
      featureId: form.featureId,
      version: "4.12",
      reporter: currentUser?.name ?? "Marie Martin",
      assignee: form.assignee,
      developer: form.developer,
      createdAt: new Date().toISOString().slice(0, 10),
      targetDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    };

    const numericFeatureId = Number(form.featureId);
    const numericCampaignId = Number(form.campaignId);
    const eligibleForBackend =
      localStorage.getItem("token") &&
      Number.isInteger(numericFeatureId) &&
      numericFeatureId > 0 &&
      Number.isInteger(numericCampaignId) &&
      numericCampaignId > 0;

    if (eligibleForBackend) {
      try {
        const { anomaly } = await api<{ anomaly: BackendAnomaly }>("/anomalies", {
          method: "POST",
          body: JSON.stringify({
            feature_id: numericFeatureId,
            campaign_id: numericCampaignId,
            description: form.title.trim(),
            correction_due_date: base.targetDate,
          }),
        });
        addDefect(mapBackendAnomaly(anomaly));
        toast.success(
          t("pages.anomalies.created_msg").replace("{id}", `ANO-${anomaly.id}`),
        );
        navigate({ to: "/anomalies" });
        return;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur lors de la création de l'anomalie.");
        return;
      }
    }

    const id = addDefect(base);
    toast.success(t("pages.anomalies.created_msg").replace("{id}", id));
    navigate({ to: "/anomalies" });
  };

  return (
    <AppShell
      title={t("pages.anomalies.title")}
      subtitle={t("pages.anomalies.subtitle")}
      breadcrumb={[t("nav.systeme"), t("nav.anomalies"), t("pages.anomalies.breadcrumb_new")]}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/anomalies" })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("nav.anomalies")}
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.anomalies.new_anomaly_page")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("pages.anomalies.subtitle")}</p>
            </div>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>{t("pages.anomalies.defect_title")}</Label>
                <Input
                  value={form.title}
                  placeholder={t("pages.anomalies.title_placeholder")}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.description")}</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("common.produit")}</Label>
                  <Select
                    value={form.productId}
                    onValueChange={(v) => setForm({ ...form, productId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {viewableProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("common.fonctionnalite")}</Label>
                  <Select
                    value={form.featureId}
                    onValueChange={(v) => setForm({ ...form, featureId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {features.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("common.campagne")}</Label>
                  <Select
                    value={form.campaignId}
                    onValueChange={(v) => setForm({ ...form, campaignId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.anomalies.severity")}</Label>
                  <Select
                    value={form.severity}
                    onValueChange={(v) => setForm({ ...form, severity: v as Severity })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {SEVERITY_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.anomalies.priority")}</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v as Severity })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {SEVERITY_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.anomalies.assignee")}</Label>
                  <Select
                    value={form.assignee}
                    onValueChange={(v) => setForm({ ...form, assignee: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {universe.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.anomalies.developer")}</Label>
                  <Select
                    value={form.developer}
                    onValueChange={(v) => setForm({ ...form, developer: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {devs.map((p) => (
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
              onClick={() => navigate({ to: "/anomalies" })}
              className="h-11 px-6"
            >
              {t("actions.annuler")}
            </Button>
            <Button type="submit" className="h-11 px-6">
              {t("pages.anomalies.create_anomaly")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
