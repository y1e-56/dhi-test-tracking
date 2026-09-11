import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { api } from "@/lib/api";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { getUser, campaignVisibleTo } from "@/lib/access";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import {
  campaigns as seedCampaigns,
  testCases as seedTests,
  type Criticality,
  type TestType,
} from "@/lib/dhi-data";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/campagnes/$campaignId/tests/$testId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const tests = snapshot?.tests ?? seedTests;
    const c = campaigns.find((x) => x.id === params.campaignId);
    const test = tests.find((x) => x.id === params.testId);
    return { name: test?.name ?? "Test" };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Modifier ${loaderData?.name ?? "le test"} — DHI Quality Platform`,
      },
    ],
  }),
  component: EditTestPage,
});

const CRITICALITIES: Criticality[] = ["critique", "haute", "moyenne", "basse"];

const TEST_TYPES: TestType[] = [
  "fonctionnel",
  "regression",
  "integration",
  "api",
  "recette_metier",
  "smoke",
  "sanity",
  "exploratoire",
  "securite",
  "penetration",
  "performance",
  "charge",
  "endurance",
  "volumetrie",
  "robustesse",
  "accessibilite",
  "compatibilite",
  "conformite",
];

type TestForm = {
  name: string;
  featureId: string;
  criticality: Criticality;
  type: TestType;
  tester: string;
  preconditions: string;
  steps: string;
  expected: string;
  observed: string;
  comment: string;
};

function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function EditTestPage() {
  const { campaignId, testId } = Route.useParams();
  const store = useStore();
  const { campaigns, tests, features, products, updateTest } = store;
  const { t } = useI18n();
  const navigate = useNavigate();
  const campaign = campaigns.find((c) => c.id === campaignId);
  const test = tests.find((x) => x.id === testId);

  const campaignFeatures = useMemo(
    () => features.filter((f) => f.productId === campaign?.productId),
    [features, campaign?.productId],
  );

  const [form, setForm] = useState<TestForm>(() => ({
    name: test?.name ?? "",
    featureId: test?.featureId ?? campaignFeatures[0]?.id ?? "",
    criticality: test?.criticality ?? "moyenne",
    type: test?.type ?? "fonctionnel",
    tester: test?.tester ?? "",
    preconditions: test?.preconditions.join("\n") ?? "",
    steps: test?.steps.join("\n") ?? "",
    expected: test?.expected.join("\n") ?? "",
    observed: test?.observed ?? "",
    comment: test?.comment ?? "",
  }));

  if (campaign && !campaignVisibleTo(campaign, products, getUser())) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (campaign?.status === "terminee") {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (!campaign || !test) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("pages.campaign_detail.nom_test_obligatoire"));
      return;
    }
    const patch = {
      name: form.name.trim(),
      featureId: form.featureId,
      criticality: form.criticality,
      type: form.type,
      tester: form.tester.trim() || undefined,
      preconditions: splitLines(form.preconditions),
      steps: splitLines(form.steps),
      expected: splitLines(form.expected),
      observed: form.observed.trim(),
      comment: form.comment.trim(),
    };
    updateTest(test.id, patch);
    toast.success(t("pages.campaign_detail.cas_test_modifier").replace("{id}", test.id));
    if (/^\d+$/.test(test.id) && localStorage.getItem("token")) {
      const numericFeatureId = Number(form.featureId);
      const priorityMap = {
        critique: "critical",
        haute: "high",
        moyenne: "medium",
        basse: "low",
      } as const;
      try {
        await api(`/test-cases/${test.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name.trim(),
            feature_id: Number.isInteger(numericFeatureId) && numericFeatureId > 0 ? numericFeatureId : undefined,
            steps: splitLines(form.steps).join("\n"),
            expected_result: splitLines(form.expected).join("\n"),
            priority: priorityMap[form.criticality],
            type: form.type,
          }),
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("pages.campaign_detail.cas_test_modifier"));
        return;
      }
    }
    navigate({ to: "/campagnes/$campaignId", params: { campaignId: campaign.id } });
  };

  return (
    <AppShell
      title={`${t("common.campagne")} : ${campaign.name}`}
      subtitle={`${t("pages.campaign_detail.modifier_cas_test")} ${test.id}`}
      breadcrumb={[t("nav.execution"), t("pages.campaigns.campaigns"), campaign.name]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                to: "/campagnes/$campaignId",
                params: { campaignId: campaign.id },
              })
            }
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("pages.campaigns.campaigns")}
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.campaign_detail.modifier_cas_test")} — {test.id} · {test.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("pages.campaign_detail.modifier_cas_test")} {test.id}
              </p>
            </div>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>{t("pages.campaign_detail.nom_du_test")}</Label>
                <Input
                  value={form.name}
                  placeholder={t("pages.campaign_detail.nom_test_placeholder")}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("pages.campaign_detail.fonctionnalite_associee")}</Label>
                  <Select
                    value={form.featureId}
                    onValueChange={(v) => setForm({ ...form, featureId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("pages.campaign_detail.selectionner_fonctionnalite")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignFeatures.length === 0 ? (
                        <SelectItem value="" disabled>
                          {t("pages.campaign_detail.aucune_fonctionnalite")}
                        </SelectItem>
                      ) : (
                        campaignFeatures.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.campaign_detail.testeur_referent")}</Label>
                  <Input
                    value={form.tester}
                    placeholder={t("pages.campaign_detail.tester_placeholder")}
                    onChange={(e) => setForm({ ...form, tester: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("common.criticite")}</Label>
                  <Select
                    value={form.criticality}
                    onValueChange={(v) => setForm({ ...form, criticality: v as Criticality })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRITICALITIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("pages.campaign_detail.type_de_test")}</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as TestType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEST_TYPES.map((tt) => (
                        <SelectItem key={tt} value={tt} className="capitalize">
                          {tt.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("pages.campaign_detail.preconditions_une_par_ligne")}</Label>
                <Textarea
                  rows={3}
                  value={form.preconditions}
                  placeholder={t("pages.campaign_detail.preconditions_placeholder")}
                  onChange={(e) => setForm({ ...form, preconditions: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.campaign_detail.etapes_une_par_ligne")}</Label>
                <Textarea
                  rows={4}
                  value={form.steps}
                  placeholder={t("pages.campaign_detail.etapes_placeholder")}
                  onChange={(e) => setForm({ ...form, steps: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.campaign_detail.resultats_attendus")}</Label>
                <Textarea
                  rows={3}
                  value={form.expected}
                  placeholder={t("pages.campaign_detail.expected_placeholder")}
                  onChange={(e) => setForm({ ...form, expected: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.campaign_detail.resultat_obtenu")}</Label>
                <Textarea
                  rows={3}
                  value={form.observed}
                  placeholder={t("pages.campaign_detail.resultat_obtenu_placeholder")}
                  onChange={(e) => setForm({ ...form, observed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.campaign_detail.commentaires")}</Label>
                <Textarea
                  rows={3}
                  value={form.comment}
                  placeholder={t("pages.campaign_detail.commentaires_placeholder")}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate({
                  to: "/campagnes/$campaignId",
                  params: { campaignId: campaign.id },
                })
              }
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
