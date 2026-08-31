import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  PlayCircle,
  Plus,
  Pencil,
  Trash2,
  Upload,
  FileUp,
  X,
  CheckCircle2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import {
  CriticalityBadge,
  Panel,
  QualityBar,
  StatusBadge,
  VerdictBadge,
} from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { campaignStats, loadSnapshot, useStore } from "@/lib/dhi-store";
import {
  campaigns as seedCampaigns,
  CAMPAIGN_STATUS_LABEL,
  type Criticality,
  type Feature,
  type TestCase,
  type TestType,
} from "@/lib/dhi-data";
import { EXECUTION_TABS } from "@/lib/dhi-nav";
import { useI18n, type TranslationKey } from "@/lib/i18n";

type TestStats = ReturnType<typeof campaignStats>;
type Campaign = (typeof seedCampaigns)[number];

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

type TranslateFn = (key: TranslationKey, fallback?: string) => string;

function emptyTestForm(campaignId: string, features: Feature[]): TestForm {
  const campaignFeatures = features.length > 0 ? features : [];
  return {
    name: "",
    featureId: campaignFeatures[0]?.id ?? "",
    criticality: "moyenne",
    type: "fonctionnel",
    tester: "",
    preconditions: "",
    steps: "",
    expected: "",
  };
}

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
  "ux",
  "localisation",
  "installation",
  "migration_donnees",
  "reprise",
  "conformite",
];

function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

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
          {failedTests.map((t) => (
            <li
              key={t.id}
              className="flex items-start justify-between gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2"
            >
              <div className="text-sm">
                <p className="num font-medium text-danger">{t.id}</p>
                <p className="text-muted-foreground">{t.name}</p>
              </div>
              <Link
                to="/execution/$testId"
                params={{ testId: t.id }}
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

function TestCaseFormFields({
  form,
  setForm,
  features,
}: {
  form: TestForm;
  setForm: (f: TestForm) => void;
  features: Feature[];
}) {
  const { t } = useI18n();
  return (
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
          <Select value={form.featureId} onValueChange={(v) => setForm({ ...form, featureId: v })}>
            <SelectTrigger>
              <SelectValue placeholder={t("pages.campaign_detail.selectionner_fonctionnalite")} />
            </SelectTrigger>
            <SelectContent>
              {features.length === 0 ? (
                <SelectItem value="" disabled>
                  {t("pages.campaign_detail.aucune_fonctionnalite")}
                </SelectItem>
              ) : (
                features.map((f) => (
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
              {TEST_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t.replace(/_/g, " ")}
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
  );
}

function CampaignTestsTable({
  list,
  onEdit,
  onDelete,
}: {
  list: TestStats["list"];
  onEdit: (t: TestCase) => void;
  onDelete: (t: TestCase) => void;
}) {
  const { t } = useI18n();
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
          {list.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="num font-medium">{t.id}</TableCell>
              <TableCell className="max-w-xs truncate">{t.name}</TableCell>
              <TableCell>
                <CriticalityBadge level={t.criticality} />
              </TableCell>
              <TableCell className="text-sm capitalize">{t.type.replace(/_/g, " ")}</TableCell>
              <TableCell>
                <VerdictBadge verdict={t.verdict} />
              </TableCell>
              <TableCell className="text-sm">{t.tester ?? "—"}</TableCell>
              <TableCell className="text-right">
                <Link
                  to="/execution/$testId"
                  params={{ testId: t.id }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("pages.campaign_detail.executer")}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => onEdit(t)}
                    title={t("pages.campaign_detail.modifier_cas_test")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() => onDelete(t)}
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
  onAddTest,
  onImport,
  onExportTemplate,
}: {
  campaign: Campaign;
  st: TestStats;
  onExport: () => void;
  onTransition: () => void;
  onAddTest: () => void;
  onImport: () => void;
  onExportTemplate: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {campaign.status !== "terminee" ? (
        <Button size="sm" onClick={onAddTest}>
          <Plus className="size-4" /> {t("pages.campaign_detail.ajouter_un_test")}
        </Button>
      ) : null}
      {campaign.status !== "terminee" ? (
        <Button size="sm" variant="outline" onClick={onImport}>
          <Upload className="size-4" /> {t("pages.campaign_detail.importer_csv")}
        </Button>
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

type ParsedTestRow = {
  name: string;
  featureId: string;
  criticality: Criticality;
  type: TestType;
  tester: string;
  preconditions: string[];
  steps: string[];
  expected: string[];
  _raw: Record<string, string>;
  errors: string[];
};

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

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === CSV_SEP && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

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

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const {
    campaigns,
    tests,
    products,
    projects,
    features,
    updateCampaign,
    addTestCase,
    updateTest,
    deleteTest,
  } = useStore();
  const { t } = useI18n();
  const campaign = campaigns.find((c) => c.id === campaignId);

  const [openCreate, setOpenCreate] = useState(false);
  const [formCreate, setFormCreate] = useState<TestForm>(() => emptyTestForm(campaignId ?? "", []));

  const [editingTest, setEditingTest] = useState<TestCase | null>(null);
  const [formEdit, setFormEdit] = useState<TestForm | null>(null);

  const [toDeleteTest, setToDeleteTest] = useState<TestCase | null>(null);

  const [openImport, setOpenImport] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importPreview, setImportPreview] = useState<ParsedTestRow[]>([]);
  const [importReady, setImportReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const campaignFeatures = useMemo(
    () => features.filter((f) => f.productId === campaign?.productId),
    [features, campaign?.productId],
  );

  if (!campaign) return null;
  const product = products.find((p) => p.id === campaign.productId);
  const project = projects.find((p) => p.id === campaign.projectId);

  const st = campaignStats(tests, campaign.id);
  const failedTests = st.list.filter((t) => t.verdict === "FAIL");

  const onExport = () => exportCsv(st.list, campaign.name, t);
  const onTransition = () => transitionCampaign(campaign, updateCampaign, t);
  const onExportTemplate = () => exportTemplateCsv(campaignFeatures, t);

  const openAddTest = () => {
    setFormCreate(emptyTestForm(campaign.id, campaignFeatures));
    setOpenCreate(true);
  };

  const resolveFeatureId = (value: string): string => {
    const v = value.trim();
    if (!v) return campaignFeatures[0]?.id ?? "";
    const byId = campaignFeatures.find((f) => f.id.toLowerCase() === v.toLowerCase());
    if (byId) return byId.id;
    const m = v.match(/\(([^)]+)\)\s*$/);
    if (m && m[1]) {
      const innerId = m[1].trim();
      const byInner = campaignFeatures.find((f) => f.id.toLowerCase() === innerId.toLowerCase());
      if (byInner) return byInner.id;
    }
    const byName = campaignFeatures.find((f) => f.name.toLowerCase() === v.toLowerCase());
    if (byName) return byName.id;
    const byPartial = campaignFeatures.find((f) => f.name.toLowerCase().includes(v.toLowerCase()));
    return byPartial?.id ?? campaignFeatures[0]?.id ?? "";
  };

  const handleCreate = () => {
    if (!formCreate.name.trim()) {
      toast.error(t("pages.campaign_detail.nom_test_obligatoire"));
      return;
    }
    const id = addTestCase({
      campaignId: campaign.id,
      featureId: formCreate.featureId,
      name: formCreate.name.trim(),
      criticality: formCreate.criticality,
      type: formCreate.type,
      preconditions: splitLines(formCreate.preconditions),
      steps: splitLines(formCreate.steps),
      expected: splitLines(formCreate.expected),
      tester: formCreate.tester.trim() || undefined,
    });
    toast.success(t("pages.campaign_detail.cas_test_creer").replace("{id}", id));
    setOpenCreate(false);
  };

  const openEditTest = (t: TestCase) => {
    setEditingTest(t);
    setFormEdit({
      name: t.name,
      featureId: t.featureId,
      criticality: t.criticality,
      type: t.type,
      tester: t.tester ?? "",
      preconditions: t.preconditions.join("\n"),
      steps: t.steps.join("\n"),
      expected: t.expected.join("\n"),
    });
  };

  const handleEdit = () => {
    if (!editingTest || !formEdit) return;
    if (!formEdit.name.trim()) {
      toast.error(t("pages.campaign_detail.nom_test_obligatoire"));
      return;
    }
    updateTest(editingTest.id, {
      name: formEdit.name.trim(),
      featureId: formEdit.featureId,
      criticality: formEdit.criticality,
      type: formEdit.type,
      tester: formEdit.tester.trim() || undefined,
      preconditions: splitLines(formEdit.preconditions),
      steps: splitLines(formEdit.steps),
      expected: splitLines(formEdit.expected),
    });
    toast.success(t("pages.campaign_detail.cas_test_modifier").replace("{id}", editingTest.id));
    setEditingTest(null);
    setFormEdit(null);
  };

  const confirmDelete = () => {
    if (!toDeleteTest) return;
    deleteTest(toDeleteTest.id);
    toast.success(t("pages.campaign_detail.cas_test_supprimer").replace("{id}", toDeleteTest.id));
    setToDeleteTest(null);
  };

  const openImportDialog = () => {
    setImportPreview([]);
    setImportReady(false);
    setImportFileName("");
    setOpenImport(true);
  };

  const handleFilePick = (file: File) => {
    setImportFileName(file.name);
    setImportPreview([]);
    setImportReady(false);
    const reader = new FileReader();
    reader.onerror = () => {
      toast.error(t("pages.campaign_detail.erreur_lecture_csv"));
    };
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        toast.error(t("pages.campaign_detail.fichier_invalide"));
        return;
      }
      const headerLine = lines[0] ?? "";
      const headerCells = parseCsvLine(headerLine).map((h) => h.trim().toLowerCase());
      const idx = (name: string) => headerCells.indexOf(name);
      const iNom = idx("nom");
      const iFeat = idx("fonctionnalite");
      const iCrit = idx("criticite");
      const iType = idx("type");
      const iTesteur = idx("testeur");
      const iPrec = idx("preconditions");
      const iSteps = idx("steps");
      const iExp = idx("expected");
      if (iNom < 0) {
        toast.error(t("pages.campaign_detail.colonne_nom_introuvable"));
        return;
      }
      const parsed: ParsedTestRow[] = [];
      for (let ln = 1; ln < lines.length; ln++) {
        const currentLine = lines[ln] ?? "";
        const cells = parseCsvLine(currentLine);
        const errors: string[] = [];
        const raw: Record<string, string> = {};
        headerCells.forEach((h, i) => (raw[h] = (cells[i] ?? "").trim()));
        const name = raw["nom"] ?? "";
        if (!name) errors.push(t("pages.campaign_detail.nom_vide"));
        const featureVal = iFeat >= 0 ? (cells[iFeat] ?? "") : "";
        const fid = resolveFeatureId(featureVal);
        if (!fid) errors.push(t("pages.campaign_detail.fonctionnalite_introuvable"));
        const critCell = iCrit >= 0 ? (cells[iCrit] ?? "moyenne") : "moyenne";
        const critRaw = critCell.trim().toLowerCase() as Criticality;
        const criticality = CRITICALITIES.includes(critRaw) ? critRaw : "moyenne";
        if (!CRITICALITIES.includes(critRaw))
          errors.push(t("pages.campaign_detail.criticite_invalide").replace("{value}", critRaw));
        const typeCell = iType >= 0 ? (cells[iType] ?? "fonctionnel") : "fonctionnel";
        const typeRaw = typeCell.trim().toLowerCase() as TestType;
        const type = TEST_TYPES.includes(typeRaw) ? typeRaw : "fonctionnel";
        if (!TEST_TYPES.includes(typeRaw))
          errors.push(t("pages.campaign_detail.type_invalide").replace("{value}", typeRaw));
        const tester = iTesteur >= 0 ? (cells[iTesteur] ?? "").trim() : "";
        const splitPipe = (s: string) =>
          s
            .split(/\|\|\||\n|##/)
            .map((x) => x.trim())
            .filter(Boolean);
        const preconditions = iPrec >= 0 ? splitPipe(cells[iPrec] ?? "") : [];
        const stepsCsv = iSteps >= 0 ? splitPipe(cells[iSteps] ?? "") : [];
        const expected = iExp >= 0 ? splitPipe(cells[iExp] ?? "") : [];
        parsed.push({
          name,
          featureId: fid,
          criticality,
          type,
          tester,
          preconditions,
          steps: stepsCsv,
          expected,
          _raw: raw,
          errors,
        });
      }
      setImportPreview(parsed);
      setImportReady(parsed.some((p) => !p.errors.length));
      const ok = parsed.filter((p) => p.errors.length === 0).length;
      const bad = parsed.length - ok;
      toast(
        bad
          ? t("pages.campaign_detail.import_ok_bad")
              .replace("{ok}", String(ok))
              .replace("{bad}", String(bad))
          : t("pages.campaign_detail.import_ok_clean").replace("{ok}", String(ok)),
        {
          description: bad ? t("campagne_import.ignorer_lignes") : t("campagne_import.pret_import"),
          icon: bad ? undefined : <CheckCircle2 className="size-4 text-success" />,
        },
      );
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImportSubmit = () => {
    if (!campaign) return;
    const validRows = importPreview.filter(
      (r) => r.name.trim().length > 0 && r.featureId.length > 0,
    );
    if (validRows.length === 0) {
      toast.error(t("pages.campaign_detail.aucune_ligne_valide"));
      return;
    }
    let created = 0;
    for (const row of validRows) {
      addTestCase({
        campaignId: campaign.id,
        featureId: row.featureId,
        name: row.name.trim(),
        criticality: row.criticality,
        type: row.type,
        tester: row.tester || undefined,
        preconditions: row.preconditions,
        steps: row.steps,
        expected: row.expected,
      });
      created++;
    }
    toast.success(t("pages.campaign_detail.import_success").replace("{n}", String(created)));
    setOpenImport(false);
    setImportPreview([]);
    setImportReady(false);
    setImportFileName("");
  };

  const importValidCount = importPreview.filter(
    (r) => r.name.trim().length > 0 && r.featureId.length > 0,
  ).length;

  return (
    <AppShell
      title={`${t("common.campagne")} : ${campaign.name}`}
      subtitle={`${CAMPAIGN_STATUS_LABEL[campaign.status]} · ${st.executionRate} % ${t("pages.campaigns.executed")} · ${campaign.environment}`}
      breadcrumb={[t("nav.execution"), t("pages.campaigns.campaigns"), campaign.name]}
      tabs={EXECUTION_TABS}
      actions={
        <CampaignActions
          campaign={campaign}
          st={st}
          onExport={onExport}
          onTransition={onTransition}
          onAddTest={openAddTest}
          onImport={openImportDialog}
          onExportTemplate={onExportTemplate}
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryPanel st={st} />
        <InfoPanel campaign={campaign} product={product} project={project} />
        <FailedTestsPanel failedTests={failedTests} />
      </div>
      <CampaignTestsTable
        list={st.list}
        onEdit={openEditTest}
        onDelete={(t) => setToDeleteTest(t)}
      />

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("pages.campaign_detail.ajouter_un_cas_de_test")}</DialogTitle>
          </DialogHeader>
          <TestCaseFormFields
            form={formCreate}
            setForm={setFormCreate}
            features={campaignFeatures}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              {t("actions.annuler")}
            </Button>
            <Button onClick={handleCreate}>{t("pages.campaign_detail.creer_le_cas_test")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingTest !== null}
        onOpenChange={(o) => !o && (setEditingTest(null), setFormEdit(null))}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("pages.campaign_detail.modifier_cas_test")} {editingTest?.id ?? ""}
            </DialogTitle>
          </DialogHeader>
          {formEdit ? (
            <TestCaseFormFields form={formEdit} setForm={setFormEdit} features={campaignFeatures} />
          ) : null}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingTest(null);
                setFormEdit(null);
              }}
            >
              {t("actions.annuler")}
            </Button>
            <Button onClick={handleEdit}>{t("actions.enregistrer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={openImport} onOpenChange={(o) => !o && setOpenImport(false)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("campagne_import.title")}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {t("campagne_import.format_colonnes")} :{" "}
              <code className="text-[11px]">
                nom ; fonctionnalite ; criticite ; type ; testeur ; preconditions ; steps ; expected
              </code>
              . {t("campagne_import.separateur")} : <strong>{CSV_SEP}</strong>.{" "}
              {t("pages.campaign_detail.multilignes")}
            </p>
          </DialogHeader>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFilePick(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4 mr-1.5" />
                {importFileName
                  ? t("campagne_import.autre_fichier")
                  : t("campagne_import.choisir_fichier")}
              </Button>
              {importFileName ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success-soft border border-success/30 rounded-md px-2 py-1">
                  <CheckCircle2 className="size-3.5" />
                  {importFileName}
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExportTemplate()}
                className="ml-auto"
              >
                <FileUp className="size-4 mr-1.5" /> {t("campagne_import.telecharger_modele")}
              </Button>
            </div>
          </div>

          <div className="my-2 rounded-md border border-border bg-subtle/50 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">{t("campagne_import.aide_titre")} :</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                <code>fonctionnalite</code> {t("pages.campaign_detail.aide_fonctionnalite")}
              </li>
              <li>
                <code>criticite</code> : critique, haute, moyenne, basse.
              </li>
              <li>
                <code>type</code> : fonctionnel, regression, securite, performance, etc.
              </li>
              <li>
                <code>preconditions / steps / expected</code> :{" "}
                {t("pages.campaign_detail.aide_separateurs")}
              </li>
            </ul>
          </div>

          <div className="flex-1 overflow-auto rounded-md border border-border mt-1">
            {importPreview.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-muted-foreground">
                <FileUp className="size-10 opacity-50" />
                <p className="text-sm">{t("campagne_import.aucun_fichier")}</p>
                <p className="text-xs">{t("pages.campaign_detail.choisir_csv_preview")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-subtle/90 backdrop-blur">
                  <TableRow>
                    <TableHead className="text-[11px]">#</TableHead>
                    <TableHead className="text-[11px]">{t("common.nom")}</TableHead>
                    <TableHead className="text-[11px]">{t("common.fonctionnalite")}</TableHead>
                    <TableHead className="text-[11px]">
                      {t("pages.campaign_detail.crit_short")}
                    </TableHead>
                    <TableHead className="text-[11px]">{t("common.type")}</TableHead>
                    <TableHead className="text-[11px]">
                      {t("pages.campaign_detail.etapes")}
                    </TableHead>
                    <TableHead className="text-[11px]">{t("common.statut")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreview.map((row, i) => (
                    <TableRow
                      key={i}
                      className={row.errors.length ? "bg-danger-soft/40" : undefined}
                    >
                      <TableCell className="num text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs max-w-[220px] truncate" title={row.name}>
                        <span className="font-medium truncate">
                          {row.name || t("pages.campaign_detail.vide_paren")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">
                        {features.find((f) => f.id === row.featureId)?.name ??
                          (row.featureId ? `ID:${row.featureId}` : "—")}
                      </TableCell>
                      <TableCell className="text-xs">
                        <CriticalityBadge level={row.criticality} />
                      </TableCell>
                      <TableCell className="text-xs capitalize">
                        {row.type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="num text-xs">
                        {row.steps.length}{" "}
                        {row.steps.length > 1
                          ? t("pages.campaign_detail.steps_plural")
                          : t("pages.campaign_detail.step_singular")}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px]">
                        {row.errors.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 className="size-3.5" /> {t("common.ok")}
                          </span>
                        ) : (
                          <div className="flex flex-col text-danger" title={row.errors.join(" — ")}>
                            {row.errors.slice(0, 1).map((err, j) => (
                              <span key={j} className="truncate">
                                ⚠ {err}
                              </span>
                            ))}
                            {row.errors.length > 1 ? (
                              <span className="text-[10px] text-muted-foreground">
                                +{row.errors.length - 1} {t("campagne_import.avertissements")}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="gap-2 pt-3 mt-2 shrink-0">
            <div className="flex-1 text-xs text-muted-foreground">
              {importPreview.length > 0 ? (
                <>
                  {t("pages.campaign_detail.lignes_importables")
                    .replace(
                      "{ok}",
                      String(importPreview.filter((r) => r.errors.length === 0).length),
                    )
                    .replace("{total}", String(importPreview.length))}{" "}
                  {t("campagne_import.ignorer_lignes")}
                </>
              ) : null}
            </div>
            <Button variant="outline" onClick={() => setOpenImport(false)}>
              <X className="size-4 mr-1.5" /> {t("actions.annuler")}
            </Button>
            <Button onClick={handleImportSubmit} disabled={!importReady}>
              <CheckCircle2 className="size-4 mr-1.5" />
              {t("actions.importer")} {importValidCount}{" "}
              {importValidCount > 1
                ? t("pages.campaign_detail.tests")
                : t("pages.campaign_detail.test")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
