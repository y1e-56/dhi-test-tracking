import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  PlayCircle,
  Plus,
  Pencil,
  Trash2,
  Upload,
  FileUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { MemberMultiSelect, type MemberOption } from "@/components/dhi/MemberMultiSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CriticalityBadge,
  Panel,
  QualityBar,
  StatusBadge,
  VerdictBadge,
} from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { campaignStats, loadSnapshot, useStore } from "@/lib/dhi-store";
import { getUser, campaignVisibleTo } from "@/lib/access";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import {
  campaigns as seedCampaigns,
  CAMPAIGN_STATUS_LABEL,
  type Feature,
  type TestCase,
} from "@/lib/dhi-data";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n, type TranslationKey } from "@/lib/i18n";

type TestStats = ReturnType<typeof campaignStats>;
type Campaign = (typeof seedCampaigns)[number];

type TranslateFn = (key: TranslationKey, fallback?: string) => string;

function exportCsv(list: TestStats["list"], campaignName: string, t: TranslateFn) {
  const header = "id;nom;criticite;verdict;testeur;date\n";
  const rows = list
    .map(
      (t) =>
        `${t.id};"${t.name}";${t.criticality};${t.verdict};${t.tester ?? ""};${t.executedAt ?? ""}`,
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-${campaignName.replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(t("pages.campaign_detail.rapport_exporte"));
}

function transitionCampaign(
  campaign: Campaign,
  updateCampaign: ReturnType<typeof useStore>["updateCampaign"],
  t: TranslateFn,
) {
  if (campaign.status === "planifiee" || campaign.status === "avenir") {
    updateCampaign(campaign.id, { status: "encours" });
    toast.success(t("pages.campaign_detail.campagne_demarree"));
  } else if (campaign.status === "encours") {
    updateCampaign(campaign.id, { status: "terminee" });
    toast.success(t("pages.campaign_detail.campagne_cloturee"));
  }
}

function SummaryPanel({ st }: { st: TestStats }) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.campaign_detail.resume_execution")}>
      <ul className="space-y-2 text-sm">
        {[
          [t("pages.campaign_detail.tests_totaux"), String(st.total)],
          [t("pages.campaign_detail.executes"), `${st.executed} (${st.executionRate} %)`],
          [t("pages.campaign_detail.reussis"), `${st.passed} (${st.successRate} %)`],
          [t("pages.campaign_detail.echoues"), String(st.failed)],
          [t("pages.campaign_detail.bloques"), String(st.blocked)],
          [t("pages.campaign_detail.non_executes"), String(st.notRun)],
        ].map(([label, value]) => (
          <li key={label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="num font-medium">{value}</span>
          </li>
        ))}
      </ul>
      <QualityBar value={st.executionRate} neutral className="mt-4" />
    </Panel>
  );
}

function InfoPanel({
  campaign,
  product,
  project,
}: {
  campaign: Campaign;
  product: ReturnType<typeof useStore>["products"][number] | undefined;
  project: ReturnType<typeof useStore>["projects"][number] | undefined;
}) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.campaign_detail.informations")}>
      <dl className="grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("common.produit")}</dt>
          <dd className="font-medium">
            {product ? (
              <Link
                to="/produits/$productId"
                params={{ productId: product.id }}
                className="text-primary hover:underline"
              >
                {product.name}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("common.projet")}</dt>
          <dd className="font-medium">
            {project ? (
              <Link
                to="/projets/$projectId"
                params={{ projectId: project.id }}
                className="text-primary hover:underline"
              >
                {project.name}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        {[
          [t("common.type"), campaign.type],
          [t("common.version"), campaign.version],
          [t("pages.campaign_detail.environnement"), campaign.environment],
          [t("common.responsable"), campaign.owner],
          [t("pages.campaign_detail.periode"), `${campaign.startDate} → ${campaign.endDate}`],
          [t("pages.campaign_detail.testeurs"), campaign.testers.join(", ") || "—"],
          [t("pages.campaign_detail.developpeurs"), (campaign.developers ?? []).join(", ") || "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <StatusBadge status={campaign.status} />
      </div>
    </Panel>
  );
}

function FailedTestsPanel({ failedTests }: { failedTests: TestStats["list"] }) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.campaign_detail.tests_echoues")}>
      {failedTests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("pages.campaign_detail.aucun_test_echec")}
        </p>
      ) : (
        <ul className="space-y-2">
          {failedTests.map((tc) => (
            <li
              key={tc.id}
              className="flex items-start justify-between gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2"
            >
              <div className="text-sm">
                <p className="num font-medium text-danger">{tc.id}</p>
                <p className="text-muted-foreground">{tc.name}</p>
              </div>
              <Link
                to="/execution/$testId"
                params={{ testId: tc.id }}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("pages.campaign_detail.detail")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CampaignTestsTable({
  list,
  campaignId,
  onDelete,
}: {
  list: TestStats["list"];
  campaignId: string;
  onDelete: (t: TestCase) => void;
}) {
  const { t } = useI18n();
  const { campaigns, updateTest, tests } = useStore();
  const campaign = campaigns.find((c) => c.id === campaignId);
  const assignees = campaign?.testers ?? [];

  const reassign = (testId: string, tester: string) => {
    const test = tests.find((x) => x.id === testId);
    const next = tester === "__none__" ? undefined : tester;
    updateTest(testId, { tester: next });
    toast.success(
      `${testId} ${t("pages.campaign_detail.reassigned")} ${
        next || t("pages.campaign_detail.unassigned")
      }.`,
    );
  };

  return (
    <Panel title={t("pages.campaign_detail.tous_les_tests")} className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.id")}</TableHead>
            <TableHead>{t("pages.campaign_detail.test")}</TableHead>
            <TableHead>{t("common.criticite")}</TableHead>
            <TableHead>{t("common.type")}</TableHead>
            <TableHead>{t("common.verdict")}</TableHead>
            <TableHead>{t("common.testeur")}</TableHead>
            <TableHead>{t("pages.campaign_detail.execution")}</TableHead>
            <TableHead className="text-right">{t("pages.campaign_detail.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((tc) => (
            <TableRow key={tc.id}>
              <TableCell className="num font-medium">{tc.id}</TableCell>
              <TableCell className="max-w-xs truncate">{tc.name}</TableCell>
              <TableCell>
                <CriticalityBadge level={tc.criticality} />
              </TableCell>
              <TableCell className="text-sm capitalize">{tc.type.replace(/_/g, " ")}</TableCell>
              <TableCell>
                <VerdictBadge verdict={tc.verdict} />
              </TableCell>
              <TableCell className="text-sm">
                <Select value={tc.tester ?? ""} onValueChange={(v) => reassign(tc.id, v)}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t("pages.campaign_detail.unassigned")}
                    </SelectItem>
                    {assignees.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  to="/execution/$testId"
                  params={{ testId: tc.id }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("pages.campaign_detail.executer")}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Link
                    to="/campagnes/$campaignId/tests/$testId/modifier"
                    params={{ campaignId, testId: tc.id }}
                    title={t("pages.campaign_detail.modifier_cas_test")}
                  >
                    <Button size="icon" variant="ghost" className="size-7">
                      <Pencil className="size-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() => onDelete(tc)}
                    title={t("pages.campaign_detail.supprimer_cas_test")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function CampaignActions({
  campaign,
  st,
  onExport,
  onTransition,
  onExportTemplate,
}: {
  campaign: Campaign;
  st: TestStats;
  onExport: () => void;
  onTransition: () => void;
  onExportTemplate: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {campaign.status !== "terminee" ? (
        <Link to="/campagnes/$campaignId/tests/ajouter" params={{ campaignId: campaign.id }}>
          <Button size="sm">
            <Plus className="size-4" /> {t("pages.campaign_detail.ajouter_un_test")}
          </Button>
        </Link>
      ) : null}
      {campaign.status !== "terminee" ? (
        <Link to="/campagnes/$campaignId/importer" params={{ campaignId: campaign.id }}>
          <Button size="sm" variant="outline">
            <Upload className="size-4" /> {t("pages.campaign_detail.importer_csv")}
          </Button>
        </Link>
      ) : null}
      {campaign.status !== "terminee" ? (
        <Button size="sm" variant="ghost" onClick={onExportTemplate}>
          <FileUp className="size-4" /> {t("pages.campaign_detail.modele_csv")}
        </Button>
      ) : null}
      {campaign.status !== "terminee" ? (
        <Button size="sm" variant="outline" onClick={onTransition}>
          <PlayCircle className="size-4" />
          {campaign.status === "encours" ? t("actions.cloturer") : t("actions.demarrer")}
        </Button>
      ) : null}
      <Button size="sm" variant="outline" onClick={onExport}>
        <Download className="size-4" /> {t("actions.rapport")}
      </Button>
      <Link
        to="/campagnes"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> {t("pages.campaigns.campaigns")}
      </Link>
    </div>
  );
}

const CSV_SEP = ";";
const CSV_TEMPLATE_HEADERS = [
  "nom",
  "fonctionnalite",
  "criticite",
  "type",
  "testeur",
  "preconditions",
  "steps",
  "expected",
];

function exportTemplateCsv(featureList: Feature[], t: TranslateFn) {
  const header = CSV_TEMPLATE_HEADERS.join(CSV_SEP) + "\n";
  const sampleFeature = featureList[0]
    ? `${featureList[0].name} (${featureList[0].id})`
    : "Authentification (f-auth)";
  const sample = [
    "Connexion avec mot de passe valide",
    sampleFeature,
    "critique",
    "fonctionnel",
    "Marie Martin",
    "Utilisateur enregistré|||Page de connexion ouverte",
    "Saisir email|||Saisir mdp demo|||Cliquer sur Se connecter",
    "Champ email ok|||Champ mdp ok|||Redirection tableau de bord",
  ]
    .map((v) => (v.includes(CSV_SEP) || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v))
    .join(CSV_SEP);
  const blob = new Blob([header + sample + "\n"], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-import-tests-campagne.csv";
  a.click();
  URL.revokeObjectURL(url);
  toast.success(t("pages.campaign_detail.modele_csv_telecharge"));
}

function ManageMembersButton({ campaign }: { campaign: Campaign }) {
  const { t } = useI18n();
  const { users, updateCampaign } = useStore();
  const [open, setOpen] = useState(false);
  const [testers, setTesters] = useState<Set<string>>(new Set(campaign.testers));
  const [developers, setDevelopers] = useState<Set<string>>(new Set(campaign.developers ?? []));

  const memberOptions: MemberOption[] = users.map((u) => ({
    name: u.name,
    role: u.role,
    active: u.active,
  }));
  const testerOptions = memberOptions.filter((o) => o.role === "testeur" || o.role === "chef_testeur");
  const devOptions = memberOptions.filter((o) => o.role === "developpeur");

  const save = () => {
    updateCampaign(campaign.id, { testers: [...testers], developers: [...developers] });
    toast.success(t("pages.add_campaign.membres_update_ok"));
    setOpen(false);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Users className="size-4" /> {t("pages.add_campaign.gerer_membres")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages.add_campaign.gerer_membres")}</DialogTitle>
            <DialogDescription>{campaign.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">{t("pages.add_campaign.membres_testeurs")}</Label>
              <MemberMultiSelect
                value={testers}
                onChange={setTesters}
                options={testerOptions}
                showRole={false}
                placeholder={t("pages.add_campaign.aucun_membre")}
                selectionLabel={{
                  label: t("pages.add_campaign.membre"),
                  labelPlural: t("pages.add_campaign.membres"),
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium">{t("pages.add_campaign.membres_developpeurs")}</Label>
              <MemberMultiSelect
                value={developers}
                onChange={setDevelopers}
                options={devOptions}
                showRole={false}
                placeholder={t("pages.add_campaign.aucun_membre")}
                selectionLabel={{
                  label: t("pages.add_campaign.membre"),
                  labelPlural: t("pages.add_campaign.membres"),
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("pages.campaign_detail.fermer")}
            </Button>
            <Button onClick={save}>{t("actions.enregistrer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const { campaigns, tests, products, projects, features, updateCampaign, deleteTest } = useStore();
  const { t } = useI18n();
  const campaign = campaigns.find((c) => c.id === campaignId);

  const [toDeleteTest, setToDeleteTest] = useState<TestCase | null>(null);

  const matches = useMatches();
  const matchesExact = matches[matches.length - 1]?.pathname === `/campagnes/${campaignId}`;
  if (!matchesExact) {
    return <Outlet />;
  }

  if (campaign && !campaignVisibleTo(campaign, products, getUser())) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }

  if (!campaign) return null;
  const product = products.find((p) => p.id === campaign.productId);
  const project = projects.find((p) => p.id === campaign.projectId);

  const st = campaignStats(tests, campaign.id);
  const failedTests = st.list.filter((t) => t.verdict === "FAIL");
  const campaignFeatures = features.filter((f) => f.productId === campaign.productId);

  const onExport = () => exportCsv(st.list, campaign.name, t);
  const onTransition = () => transitionCampaign(campaign, updateCampaign, t);
  const onExportTemplate = () => exportTemplateCsv(campaignFeatures, t);

  const confirmDelete = () => {
    if (!toDeleteTest) return;
    deleteTest(toDeleteTest.id);
    toast.success(t("pages.campaign_detail.cas_test_supprimer").replace("{id}", toDeleteTest.id));
    setToDeleteTest(null);
  };

  return (
    <AppShell
      title={`${t("common.campagne")} : ${campaign.name}`}
      subtitle={`${CAMPAIGN_STATUS_LABEL[campaign.status]} · ${st.executionRate} % ${t("pages.campaigns.executed")} · ${campaign.environment}`}
      breadcrumb={[t("nav.execution"), t("pages.campaigns.campaigns"), campaign.name]}
      tabs={campaignTabs(campaignId)}
      actions={
        <>
          <ManageMembersButton campaign={campaign} />
          <CampaignActions
            campaign={campaign}
            st={st}
            onExport={onExport}
            onTransition={onTransition}
            onExportTemplate={onExportTemplate}
          />
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryPanel st={st} />
        <InfoPanel campaign={campaign} product={product} project={project} />
        <FailedTestsPanel failedTests={failedTests} />
      </div>
      <CampaignTestsTable
        list={st.list}
        campaignId={campaign.id}
        onDelete={(t) => setToDeleteTest(t)}
      />

      <AlertDialog open={toDeleteTest !== null} onOpenChange={(o) => !o && setToDeleteTest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("pages.campaign_detail.supprimer_cas_test_question")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toDeleteTest ? (
                <>
                  {t("pages.campaign_detail.suppression_confirme_debut")}{" "}
                  <span className="font-medium">{toDeleteTest.id}</span>{" "}
                  <span className="font-medium">{toDeleteTest.name}</span>{" "}
                  {t("pages.campaign_detail.suppression_confirme_fin")}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDeleteTest(null)}>
              {t("actions.annuler")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90 text-white"
              onClick={confirmDelete}
            >
              {t("actions.supprimer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

export const Route = createFileRoute("/campagnes/$campaignId")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const c = campaigns.find((x) => x.id === params.campaignId);
    return { name: c?.name ?? "Campagne" };
  },

  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Campagne"} — DHI Quality Platform` },
      {
        name: "description",
        content: "Suivi détaillé d'une campagne de tests : exécution, réussite, anomalies.",
      },
      { property: "og:title", content: `${loaderData?.name ?? "Campagne"} — DHI Quality Platform` },
      { property: "og:description", content: "Avancement et résultats de la campagne de tests." },
    ],
  }),
  component: CampaignDetail,
});
