import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  requirements as seedRequirements,
  type Criticality,
  type RequirementStatus,
} from "@/lib/dhi-data";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { useVisibleProducts } from "@/lib/use-scope";
import { useI18n, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/exigences/$requirementId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const requirements = snapshot?.requirements ?? seedRequirements;
    const r = requirements.find((x) => x.id === params.requirementId);
    return { name: r?.title ?? "Exigence" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Modifier ${loaderData?.name ?? "l'exigence"} — DHI Quality Platform` }],
  }),
  component: EditRequirementPage,
});

const REQUIREMENT_STATUS_T_KEY: Record<RequirementStatus, TranslationKey> = {
  brouillon: "pages.requirements.status_brouillon",
  validee: "pages.requirements.status_validee",
  couverte: "pages.requirements.status_couverte",
};

const PRIORITY_T_KEY: Record<Criticality, TranslationKey> = {
  critique: "pages.requirements.priority_critique",
  haute: "pages.requirements.priority_haute",
  moyenne: "pages.requirements.priority_moyenne",
  basse: "pages.requirements.priority_basse",
};

type ReqForm = {
  title: string;
  description: string;
  productId: string;
  priority: Criticality;
  status: RequirementStatus;
  featureIds: string[];
};

function EditRequirementPage() {
  const { requirementId } = Route.useParams();
  const store = useStore();
  const { products, features, requirements, updateRequirement } = store;
  const viewableProducts = useVisibleProducts(products);
  const { t } = useI18n();
  const navigate = useNavigate();
  const requirement = requirements.find((r) => r.id === requirementId);

  const [form, setForm] = useState<ReqForm>(() => ({
    title: requirement?.title ?? "",
    description: requirement?.description ?? "",
    productId: requirement?.productId ?? viewableProducts[0]?.id ?? "",
    priority: requirement?.priority ?? "moyenne",
    status: requirement?.status ?? "brouillon",
    featureIds: requirement ? [...requirement.featureIds] : [],
  }));

  if (!requirement) return null;

  const linkedFeatures = features.filter((f) => f.productId === form.productId);

  const toggleFeature = (fid: string) => {
    setForm((f) => ({
      ...f,
      featureIds: f.featureIds.includes(fid)
        ? f.featureIds.filter((x) => x !== fid)
        : [...f.featureIds, fid],
    }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("pages.requirements.title_required"));
      return;
    }
    updateRequirement(requirement.id, {
      productId: form.productId,
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      status: form.status,
      featureIds: form.featureIds,
    });
    toast.success(t("pages.requirements.updated").replace("{id}", requirement.id));
    navigate({ to: "/exigences" });
  };

  return (
    <AppShell
      title={t("pages.requirements.title")}
      subtitle={t("pages.requirements.subtitle")}
      breadcrumb={t("pages.requirements.breadcrumb")}
      tabs={QUALITY_TABS}
    >
      <div className="panel">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/exigences" })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("nav.exigences")}
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.requirements.edit_requirement_page")} — {requirement.id} ·{" "}
                {requirement.title}
              </h2>
              <p className="text-sm text-muted-foreground">{t("pages.requirements.subtitle")}</p>
            </div>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>{t("pages.requirements.form_title")}</Label>
                <Input
                  value={form.title}
                  placeholder={t("pages.requirements.title_placeholder")}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.requirements.description_detaillee")}</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  placeholder={t("pages.requirements.description_placeholder")}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("common.produit")}</Label>
                  <Select
                    value={form.productId}
                    onValueChange={(v) => setForm({ ...form, productId: v, featureIds: [] })}
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
                  <Label>{t("pages.requirements.priorite")}</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v as Criticality })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PRIORITY_T_KEY) as Criticality[]).map((c) => (
                        <SelectItem key={c} value={c}>
                          {t(PRIORITY_T_KEY[c])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("common.statut")}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as RequirementStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(REQUIREMENT_STATUS_T_KEY) as RequirementStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(REQUIREMENT_STATUS_T_KEY[s])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("pages.requirements.fonctionnalites_couvertes")}</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {t("pages.requirements.selection_count").replace(
                      "{count}",
                      String(form.featureIds.length),
                    )}{" "}
                    / {linkedFeatures.length}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-subtle/50 p-3 max-h-56 overflow-y-auto">
                  {linkedFeatures.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {t("pages.requirements.aucune_feature_produit")}
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {linkedFeatures.map((f) => (
                        <label
                          key={f.id}
                          className="flex items-start gap-2 rounded-md border border-border bg-white px-2.5 py-2 text-xs cursor-pointer hover:bg-primary/5"
                        >
                          <Checkbox
                            className="mt-0.5 size-3.5"
                            checked={form.featureIds.includes(f.id)}
                            onCheckedChange={() => toggleFeature(f.id)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{f.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {f.description || t("pages.requirements.sans_description")}
                            </p>
                          </div>
                          <CriticalityBadge level={f.criticality} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/exigences" })}
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
