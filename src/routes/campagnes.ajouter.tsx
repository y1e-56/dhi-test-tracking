import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
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
import { DEVELOPERS, PEOPLE, type CampaignStatus } from "@/lib/dhi-data";
import { EXECUTION_TABS } from "@/lib/dhi-nav";
import { campaignStats, useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { useVisibleProducts, useVisibleProjects, useVisibleCampaigns } from "@/lib/use-scope";

export const Route = createFileRoute("/campagnes/ajouter")({
  head: () => ({
    meta: [
      { title: "Créer une campagne — DHI Quality Platform" },
      {
        name: "description",
        content: "Créer une nouvelle campagne de tests.",
      },
    ],
  }),
  component: CreateCampaignPage,
});

const CAMPAIGN_TYPES = ["Recette", "Régression", "Sécurité", "Performance", "Exploratoire"];
const ENVIRONMENTS = ["RECETTE", "PREPROD", "DEV", "PROD"];

function CreateCampaignPage() {
  const { campaigns, tests, products, projects, addCampaign } = useStore();
  const navigate = useNavigate();
  const { t } = useI18n();

  const viewableProducts = useVisibleProducts(products);
  const viewableProjects = useVisibleProjects(projects, products);
  const viewableCampaigns = useVisibleCampaigns(campaigns, products);

  const [form, setForm] = useState({
    name: "",
    type: "Recette",
    productId: "p-paiement",
    projectId: "pr-3ds",
    version: "4.12",
    environment: "RECETTE",
    owner: "Marie Martin",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    clone: true,
    cloneFrom: "c-recette-412",
    testers: new Set<string>(["Marie Martin"]),
    developers: new Set<string>(["Lucas Bernard"]),
  });

  const formProjects = viewableProjects.filter((pr) => pr.productId === form.productId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("pages.add_campaign.name_required"));
      return;
    }
    if (!form.projectId) {
      toast.error(t("pages.add_campaign.project_required"));
      return;
    }

    // Validation des dates
    if (form.endDate && form.startDate > form.endDate) {
      toast.error(t("pages.add_campaign.end_date_before_start"));
      return;
    }

    const id = addCampaign(
      {
        productId: form.productId,
        projectId: form.projectId,
        name: form.name.trim(),
        type: form.type,
        version: form.version,
        environment: form.environment,
        owner: form.owner,
        status: "planifiee" as CampaignStatus,
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        testers: [...form.testers],
        developers: [...form.developers],
      },
      form.clone ? form.cloneFrom : undefined,
    );
    toast.success(
      `${t("common.campagne")} « ${form.name.trim()} » ${t("pages.add_campaign.created")}`,
    );
    navigate({ to: "/campagnes/$campaignId", params: { campaignId: id } });
  };

  return (
    <AppShell
      title={t("pages.add_campaign.title")}
      subtitle={t("pages.add_campaign.subtitle")}
      breadcrumb={[
        t("nav.execution"),
        t("nav.campagnes"),
        t("pages.add_campaign.breadcrumb_create"),
      ]}
      tabs={EXECUTION_TABS}
    >
      <div className="panel">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/campagnes" })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("pages.add_campaign.back_to_campaigns")}
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.add_campaign.informations_generales")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("pages.add_campaign.informations_generales_hint")}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="c-name" className="text-sm font-medium">
                  {t("pages.add_campaign.campaign_name")}
                </Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("pages.add_campaign.name_placeholder")}
                  required
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">{t("common.type")}</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">{t("common.produit")}</Label>
                  <Select
                    value={form.productId}
                    onValueChange={(v) => {
                      const first = viewableProjects.find((pr) => pr.productId === v);
                      setForm((f) => ({
                        ...f,
                        productId: v,
                        projectId: first?.id ?? "",
                        version: first?.targetVersion ?? f.version,
                      }));
                    }}
                  >
                    <SelectTrigger className="h-11">
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
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">{t("common.projet")}</Label>
                  <Select
                    value={form.projectId}
                    onValueChange={(v) => {
                      const pr = viewableProjects.find((p) => p.id === v);
                      setForm((f) => ({
                        ...f,
                        projectId: v,
                        productId: pr?.productId ?? f.productId,
                        version: pr?.targetVersion ?? f.version,
                      }));
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("pages.add_campaign.choose_project")} />
                    </SelectTrigger>
                    <SelectContent>
                      {formProjects.map((pr) => (
                        <SelectItem key={pr.id} value={pr.id}>
                          {pr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-version" className="text-sm font-medium">
                    {t("common.version")}
                  </Label>
                  <Input
                    id="c-version"
                    value={form.version}
                    onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">
                    {t("pages.add_campaign.environment")}
                  </Label>
                  <Select
                    value={form.environment}
                    onValueChange={(v) => setForm((f) => ({ ...f, environment: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENVIRONMENTS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">{t("common.responsable")}</Label>
                  <Select
                    value={form.owner}
                    onValueChange={(v) => setForm((f) => ({ ...f, owner: v }))}
                  >
                    <SelectTrigger className="h-11">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="c-start" className="text-sm font-medium">
                    {t("pages.add_campaign.start_date")}
                  </Label>
                  <Input
                    id="c-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="h-11"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-end" className="text-sm font-medium">
                    {t("pages.add_campaign.end_date")}
                  </Label>
                  <Input
                    id="c-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="h-11"
                    min={form.startDate}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.add_campaign.test_config")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("pages.add_campaign.test_config_hint")}
              </p>
            </div>

            <div className="rounded-xl border border-border p-4">
              <label className="flex items-center gap-2 text-sm font-medium mb-4">
                <Checkbox
                  checked={form.clone}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, clone: !!v }))}
                />
                {t("pages.add_campaign.recreate_from_existing")}
              </label>
              {form.clone ? (
                <Select
                  value={form.cloneFrom}
                  onValueChange={(v) => setForm((f) => ({ ...f, cloneFrom: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {viewableCampaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium">
                {t("pages.add_campaign.assigned_testers")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {PEOPLE.map((p) => (
                  <label
                    key={p}
                    className="flex items-center gap-2 text-sm p-3 rounded-lg border border-border hover:bg-subtle cursor-pointer"
                  >
                    <Checkbox
                      checked={form.testers.has(p)}
                      onCheckedChange={(checked) =>
                        setForm((f) => {
                          const next = new Set(f.testers);
                          if (checked) next.add(p);
                          else next.delete(p);
                          return { ...f, testers: next };
                        })
                      }
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium">
                {t("pages.add_campaign.assigned_developers")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {DEVELOPERS.map((p) => (
                  <label
                    key={p}
                    className="flex items-center gap-2 text-sm p-3 rounded-lg border border-border hover:bg-subtle cursor-pointer"
                  >
                    <Checkbox
                      checked={form.developers.has(p)}
                      onCheckedChange={(checked) =>
                        setForm((f) => {
                          const next = new Set(f.developers);
                          if (checked) next.add(p);
                          else next.delete(p);
                          return { ...f, developers: next };
                        })
                      }
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/campagnes" })}
              className="h-11 px-6"
            >
              {t("actions.annuler")}
            </Button>
            <Button type="submit" className="h-11 px-6">
              {t("pages.add_campaign.create")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
