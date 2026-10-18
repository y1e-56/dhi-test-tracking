import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileUp, Upload } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { testForm, type FormTestType, type TestFormValues } from "@/lib/forms/test-form";
import type { FormCtl } from "@/lib/forms/types";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import {
  getUser,
  campaignVisibleTo,
  campaignTesterOptions,
  findTesterOption,
  sampleTesterEmail,
} from "@/lib/access";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import { canManageCampaign } from "@/lib/role-protection";
import { campaigns as seedCampaigns } from "@/lib/dhi-data";
import {
  exportCsvTemplate,
  exportNorTemplate,
  isImportableRow,
  parseImportText,
  type ParsedTestRow,
} from "@/lib/test-import";
import { IMPORT_ACCEPT, readImportSource, rowsToCsv } from "@/lib/import-file";
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

function AddTestPage() {
  const { campaignId } = Route.useParams();
  const store = useStore();
  const { campaigns, features, products, users } = store;
  const { t } = useI18n();
  const navigate = useNavigate();
  const campaign = campaigns.find((c) => c.id === campaignId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const testerOptions = useMemo(
    () => campaignTesterOptions(users, campaign?.testers),
    [users, campaign?.testers],
  );
  const campaignFeatures = useMemo(
    () => features.filter((f) => f.productId === campaign?.productId),
    [features, campaign?.productId],
  );

  const goToCampaign = () => {
    if (campaign)
      void navigate({ to: "/campagnes/$campaignId", params: { campaignId: campaign.id } });
  };

  const handleImportFile = async (file: File, ctl: FormCtl<TestFormValues>) => {
    let rows: ParsedTestRow[];
    try {
      const source = await readImportSource(file);
      if (source.kind === "table") {
        rows = parseImportText(rowsToCsv(source.rows), campaignFeatures, "import.csv");
      } else if (source.kind === "csv") {
        rows = parseImportText(source.text, campaignFeatures, "import.csv");
      } else {
        rows = parseImportText(source.text, campaignFeatures, "import.txt");
      }
    } catch {
      toast.error(t("pages.campaign_detail.erreur_lecture_csv"));
      return;
    }
    const row = rows.find(isImportableRow) ?? rows.find((r) => r.name.trim()) ?? rows[0];
    if (!row) {
      toast.error(t("pages.campaign_detail.fichier_invalide"));
      return;
    }
    // Un nom de testeur du CSV qui ne correspond a aucun compte existant ne
    // peut pas etre enregistre : on l'ignore et on le signale, plutot que de
    // laisser une valeur qui echouera silencieusement a l'enregistrement.
    const importedTester = (row.tester ?? "").trim();
    const testerMatch = findTesterOption(testerOptions, users, importedTester);
    if (importedTester && !testerMatch) {
      toast.error(`${t("pages.campaign_detail.tester_inconnu")} : « ${importedTester} »`);
    }
    ctl.reset({
      name: row.name.trim(),
      featureId: row.featureId || campaignFeatures[0]?.id || "",
      criticality: row.criticality,
      type: row.type as FormTestType,
      tester: testerMatch?.name ?? "",
      preconditions: row.preconditions.join("\n"),
      steps: row.steps.join("\n"),
      expected: row.expected.join("\n"),
      observed: row.observed?.join("\n") ?? "",
      comment: row.comment ?? "",
    });
    toast.success(
      `Fichier « ${file.name} » : ${row.name.trim()}${
        rows.length > 1 ? ` (+${rows.length - 1} autre(s))` : ""
      }`,
    );
  };

  if (campaign && !campaignVisibleTo(campaign, products, getUser())) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (campaign && !canManageCampaign()) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (campaign?.status === "terminee") {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (!campaign) return null;

  return (
    <AppShell
      title={`${t("common.campagne")} : ${campaign.name}`}
      subtitle={t("pages.campaign_detail.ajouter_un_test")}
      breadcrumb={[t("nav.execution"), t("pages.campaigns.campaigns"), campaign.name]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <EntityForm
          schema={testForm(campaignId)}
          mode="create"
          onCancel={goToCampaign}
          onSaved={goToCampaign}
          toolbar={(ctl) => (
            <>
              <Button variant="outline" size="sm" onClick={goToCampaign} className="gap-2">
                <ArrowLeft className="size-4" />
                {t("pages.campaigns.campaigns")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={IMPORT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f, ctl);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Remplir le formulaire depuis un fichier CSV, Excel, Word ou PDF (ou NOR .txt)"
              >
                <Upload className="size-4" />
                {t("actions.importer")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportCsvTemplate(campaignFeatures, sampleTesterEmail(testerOptions, users))}
                className="gap-2"
              >
                <FileUp className="size-4" /> Modèle CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportNorTemplate(campaignFeatures, sampleTesterEmail(testerOptions, users))}
                className="gap-2"
              >
                <FileUp className="size-4" /> NOR (.txt)
              </Button>
            </>
          )}
        />
      </div>
    </AppShell>
  );
}
