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
import {
  CRITICALITY_LABEL,
  TEST_TYPES,
  REQUIREMENT_STATUS_LABEL,
  features as seedFeatures,
  type Criticality,
  type TestType,
} from "@/lib/dhi-data";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/fonctionnalites/$featureId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const features = snapshot?.features ?? seedFeatures;
    const f = features.find((x) => x.id === params.featureId);
    return { name: f?.name ?? "Fonctionnalité" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Modifier ${loaderData?.name ?? "la fonctionnalité"} — DHI Quality Platform` }],
  }),
  component: EditFeaturePage,
});

type FeatureForm = {
  name: string;
  productId: string;
  criticality: Criticality;
  description: string;
  coverage: Set<TestType>;
  requirementIds: string[];
};

function EditFeaturePage() {
  const { featureId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products, features, requirements, updateFeature, updateRequirement } = useStore();
  const feature = features.find((f) => f.id === featureId);

  const [form, setForm] = useState<FeatureForm>(() => {
    const coverage = new Set<TestType>();
    if (feature) for (const tt of TEST_TYPES) if (feature.coverage[tt.id]) coverage.add(tt.id);
    const requirementIds = feature
      ? requirements.filter((r) => r.featureIds.includes(feature.id)).map((r) => r.id)
      : [];
    return {
      name: feature?.name ?? "",
      productId: feature?.productId ?? "",
      criticality: feature?.criticality ?? "moyenne",
      description: feature?.description ?? "",
      coverage,
      requirementIds,
    };
  });

  if (!feature) return null;

  const productRequirements = requirements.filter((r) => r.productId === form.productId);

  const toggleCoverage = (testType: TestType) => {
    setForm((f) => {
      const next = new Set(f.coverage);
      if (next.has(testType)) next.delete(testType);
      else next.add(testType);
      return { ...f, coverage: next };
    });
  };

  const toggleRequirement = (rid: string) => {
    setForm((f) => {
      const has = f.requirementIds.includes(rid);
      return {
        ...f,
        requirementIds: has
          ? f.requirementIds.filter((x) => x !== rid)
          : [...f.requirementIds, rid],
      };
    });
  };

  const syncRequirementsBackLinks = (featureId: string, selectedRids: string[]) => {
    for (const r of requirements) {
      const wasLinked = r.featureIds.includes(featureId);
      const shouldLink = selectedRids.includes(r.id);
      if (wasLinked && !shouldLink) {
        updateRequirement(r.id, { featureIds: r.featureIds.filter((f) => f !== featureId) });
      } else if (!wasLinked && shouldLink) {
        updateRequirement(r.id, { featureIds: [...r.featureIds, featureId] });
      }
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("pages.features.name_required"));
      return;
    }
    const coverage: Partial<Record<TestType, boolean>> = {};
    for (const tt of TEST_TYPES) coverage[tt.id] = form.coverage.has(tt.id);
    updateFeature(feature.id, {
      productId: form.productId,
      name: form.name.trim(),
      description: form.description,
      criticality: form.criticality,
      coverage,
    });
    syncRequirementsBackLinks(feature.id, form.requirementIds);
    toast.success(t("pages.features.updated_msg").replace("{name}", form.name.trim()));
    navigate({ to: "/fonctionnalites" });
  };

  return (
    <AppShell
      title={t("pages.features.title")}
      subtitle={t("pages.features.subtitle")}
      breadcrumb={[t("nav.qualite"), t("nav.fonctionnalites")]}
      tabs={QUALITY_TABS}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/fonctionnalites" })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("nav.fonctionnalites")}
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.features.edit_feature_page")} — {feature.name}
              </h2>
              <p className="text-sm text-muted-foreground">{t("pages.features.subtitle")}</p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="f-name">{t("common.nom")}</Label>
                <Input
                  id="f-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("pages.features.name_placeholder")}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="f-desc">{t("common.description")}</Label>
                <Input
                  id="f-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>{t("common.produit")}</Label>
                  <Select
                    value={form.productId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, productId: v, requirementIds: [] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t("common.criticite")}</Label>
                  <Select
                    value={form.criticality}
                    onValueChange={(v) => setForm((f) => ({ ...f, criticality: v as Criticality }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CRITICALITY_LABEL) as Criticality[]).map((c) => (
                        <SelectItem key={c} value={c}>
                          {CRITICALITY_LABEL[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t("pages.features.coverage_label")}</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {form.coverage.size} / {TEST_TYPES.length} {t("pages.features.types")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-subtle/50 p-3 max-h-48 overflow-y-auto">
                  {TEST_TYPES.map((testType) => (
                    <label
                      key={testType.id}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:bg-primary/5 rounded px-1.5 py-1"
                    >
                      <Checkbox
                        checked={form.coverage.has(testType.id)}
                        onCheckedChange={() => toggleCoverage(testType.id)}
                      />
                      <span className="truncate">{testType.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t("pages.features.requirements_satisfied")}</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {t("pages.features.selected_count")
                      .replace("{count}", String(form.requirementIds.length))
                      .replace("{total}", String(productRequirements.length))}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-subtle/50 p-3 max-h-48 overflow-y-auto">
                  {productRequirements.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {t("pages.features.no_requirement_for_product")}
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {productRequirements.map((r) => (
                        <label
                          key={r.id}
                          className="flex items-start gap-2 rounded-md border border-border bg-white px-2.5 py-2 text-xs cursor-pointer hover:bg-primary/5"
                        >
                          <Checkbox
                            className="mt-0.5 size-3.5"
                            checked={form.requirementIds.includes(r.id)}
                            onCheckedChange={() => toggleRequirement(r.id)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate">
                              <span className="num font-semibold mr-1.5">{r.id}</span>
                              <span className="font-medium truncate">{r.title}</span>
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {REQUIREMENT_STATUS_LABEL[r.status]}
                            </p>
                          </div>
                          <CriticalityBadge level={r.priority} />
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
              onClick={() => navigate({ to: "/fonctionnalites" })}
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
