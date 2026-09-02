import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileUp, Upload } from "lucide-react";
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
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { getUser, campaignVisibleTo } from "@/lib/access";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import { campaigns as seedCampaigns, type Criticality, type TestType } from "@/lib/dhi-data";
import { exportCsvTemplate, exportNorTemplate, parseImportText } from "@/lib/test-import";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/campagnes/$campaignId/tests/ajouter")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const c = campaigns.find((x) => x.id === params.campaignId);
    return { name: c?.name ?? "Campagne" };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Ajouter un test — ${loaderData?.name ?? "Campagne"} — DHI Quality Platform`,
      },
    ],
  }),
  component: AddTestPage,
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
};

function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function AddTestPage() {
  const { campaignId } = Route.useParams();
  const store = useStore();
  const { campaigns, features, products, addTestCase } = store;
  const { t } = useI18n();
  const navigate = useNavigate();
  const campaign = campaigns.find((c) => c.id === campaignId);

  const campaignFeatures = useMemo(
    () => features.filter((f) => f.productId === campaign?.productId),
    [features, campaign?.productId],
  );

  const [form, setForm] = useState<TestForm>(() => ({
    name: "",
    featureId: campaignFeatures[0]?.id ?? "",
    criticality: "moyenne",
    type: "fonctionnel",
    tester: "",
    preconditions: "",
    steps: "",
    expected: "",
  }));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onerror = () => toast.error(t("pages.campaign_detail.erreur_lecture_csv"));
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseImportText(text, campaignFeatures, file.name);
      const row = rows.find((r) => r.name.trim()) ?? rows[0];
      if (!row) {
        toast.error(t("pages.campaign_detail.fichier_invalide"));
        return;
      }
      setForm({
        name: row.name.trim(),
        featureId: row.featureId || campaignFeatures[0]?.id || "",
        criticality: row.criticality,
        type: row.type,
        tester: row.tester || "",
        preconditions: row.preconditions.join("\n"),
        steps: row.steps.join("\n"),
        expected: row.expected.join("\n"),
      });
      toast.success(
        `Fichier « ${file.name} » : ${row.name.trim()}${
          rows.length > 1 ? ` (+${rows.length - 1} autre(s))` : ""
        }`,
      );
    };
    reader.readAsText(file, "UTF-8");
  };

  if (campaign && !campaignVisibleTo(campaign, products, getUser())) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (!campaign) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("pages.campaign_detail.nom_test_obligatoire"));
      return;
    }
    const id = addTestCase({
      campaignId: campaign.id,
      featureId: form.featureId,
      name: form.name.trim(),
      criticality: form.criticality,
      type: form.type,
      preconditions: splitLines(form.preconditions),
      steps: splitLines(form.steps),
      expected: splitLines(form.expected),
      tester: form.tester.trim() || undefined,
    });
    toast.success(t("pages.campaign_detail.cas_test_creer").replace("{id}", id));
    navigate({ to: "/campagnes/$campaignId", params: { campaignId: campaign.id } });
  };

  return (
    <AppShell
      title={`${t("common.campagne")} : ${campaign.name}`}
      subtitle={t("pages.campaign_detail.ajouter_un_test")}
      breadcrumb={[t("nav.execution"), t("pages.campaigns.campaigns"), campaign.name]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="mb-6 flex flex-wrap items-center gap-2">
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,.txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
            title="Remplir le formulaire depuis un fichier CSV ou NOR (.txt)"
          >
            <Upload className="size-4" />
            {t("actions.importer")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportCsvTemplate(campaignFeatures)}
            className="gap-2"
          >
            <FileUp className="size-4" /> Modèle CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportNorTemplate(campaignFeatures)}
            className="gap-2"
          >
            <FileUp className="size-4" /> NOR (.txt)
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.campaign_detail.ajouter_un_test")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("pages.campaign_detail.ajouter_un_test")}
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
              {t("pages.campaign_detail.creer_le_cas_test")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
