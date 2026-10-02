import { createFileRoute, Link, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
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
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { MemberMultiSelect, type MemberOption } from "@/components/dhi/MemberMultiSelect";
import { ImportMenu } from "@/components/dhi/ImportMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { getUser, campaignVisibleTo, isTesterRole } from "@/lib/access";
import { canManageOperational, canManageCampaign } from "@/lib/role-protection";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import { api, type BackendCampaign } from "@/lib/api";
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

function csvField(value: string): string {
  return value.includes(";") || value.includes('"') || value.includes("\n")
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

function exportCsv(list: TestStats["list"], campaignName: string, t: TranslateFn) {
  const header =
    "id;nom;criticite;type;verdict;testeur;preconditions;steps;resultat_attendu;resultat_obtenu;commentaires;date\n";
  const rows = list
    .map((x) =>
      [
        x.id,
        csvField(x.name),
        x.criticality,
        x.type,
        x.verdict,
        csvField(x.tester ?? ""),
        csvField(x.preconditions.join("|||")),
        csvField(x.steps.join("|||")),
        csvField(x.expected.join("|||")),
        csvField(x.observed ?? ""),
        csvField(x.comment ?? ""),
        csvField(x.executedAt ?? ""),
      ].join(";"),
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

async function transitionCampaign(
  campaign: Campaign,
  updateCampaign: ReturnType<typeof useStore>["updateCampaign"],
  t: TranslateFn,
) {
  const nextStatus = campaign.status === "encours" ? "completed" : "in_progress";
  if (/^\d+$/.test(campaign.id) && localStorage.getItem("token")) {
    try {
      await api(`/campaigns/${campaign.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.erreur"));
      return;
    }
  }
  updateCampaign(campaign.id, { status: nextStatus === "completed" ? "terminee" : "encours" });
  toast.success(nextStatus === "completed" ? t("pages.campaign_detail.campagne_cloturee") : t("pages.campaign_detail.campagne_demarree"));
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
          [t("pages.campaign_detail.chefs_test"), (campaign.testLeads ?? []).join(", ") || "—"],
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
  locked,
}: {
  list: TestStats["list"];
  campaignId: string;
  onDelete: (t: TestCase) => void;
  locked: boolean;
}) {
  const { t } = useI18n();
  const { campaigns, updateTest, users } = useStore();
  const campaign = campaigns.find((c) => c.id === campaignId);
  const assignees = campaign?.testers ?? [];
  const canManage = canManageCampaign();

  const reassign = (testId: string, testerName: string) => {
    if (testerName === "__none__") {
      // Retirer l'affectation : `assignedTo: null` est distingue de l'absence de cle
      // côté store, donc le retrait est bien envoye au backend.
      updateTest(testId, { tester: undefined, assignedTo: null });
      toast.success(
        `${testId} ${t("pages.campaign_detail.reassigned")} ${
          t("pages.campaign_detail.unassigned")
        }.`,
      );
      return;
    }
    // La colonne backend est une reference users(id) : on resout le nom en id.
    const user = users.find((u) => u.name === testerName);
    const userId = user ? Number(user.id) : Number.NaN;
    if (!user || !Number.isInteger(userId) || userId <= 0) {
      toast.error(`${testerName} : ${t("pages.campaign_detail.user_not_resolved")}`);
      return;
    }
    updateTest(testId, { tester: testerName, assignedTo: userId });
    toast.success(`${testId} ${t("pages.campaign_detail.reassigned")} ${testerName}.`);
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
            <TableHead>{t("pages.campaign_detail.resultat_obtenu")}</TableHead>
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
              <TableCell><CriticalityBadge level={tc.criticality} /></TableCell>
              <TableCell className="text-sm capitalize">{tc.type.replace(/_/g, " ")}</TableCell>
<TableCell>
                <VerdictBadge verdict={tc.verdict} />
              </TableCell>
              <TableCell className="max-w-[200px]">
                <span
                  className="block truncate text-sm"
                  title={
                    [tc.observed, tc.comment].filter(Boolean).join(" — ") || t("pages.campaign_detail.vide_paren")
                  }
                >
                  {tc.observed || "—"}
                </span>
              </TableCell>
              <TableCell className="text-sm">
                <Select value={tc.tester ?? ""} onValueChange={(v) => reassign(tc.id, v)} disabled={locked || !canManage}>
                  <SelectTrigger className="h-8 w-40"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("pages.campaign_detail.unassigned")}</SelectItem>
                    {assignees.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                {locked ? (
                  <span className="text-xs text-muted-foreground">{t("pages.campaign_detail.campagne_verrouillee")}</span>
                ) : !canManageOperational() ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : campaign && campaign.status !== "encours" ? (
                  <span className="text-xs text-muted-foreground">{t("pages.campaign_detail.campagne_non_demarree")}</span>
                ) : (
                  <Link to="/execution/$testId" params={{ testId: tc.id }} className="text-xs font-medium text-primary hover:underline">{t("pages.campaign_detail.executer")}</Link>
                )}
              </TableCell>
              <TableCell>
                {!locked && canManage ? <div className="flex justify-end gap-1">
                  <Link to="/campagnes/$campaignId/tests/$testId/modifier" params={{ campaignId, testId: tc.id }} title={t("pages.campaign_detail.modifier_cas_test")}>
                    <Button size="icon" variant="ghost" className="size-7"><Pencil className="size-4" /></Button>
                  </Link>
                  <Button size="icon" variant="ghost" className="size-7 text-danger hover:bg-danger/10 hover:text-danger" onClick={() => onDelete(tc)} title={t("pages.campaign_detail.supprimer_cas_test")}>
                    <Trash2 className="size-4" />
                  </Button>
                </div> : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

/*
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
*/
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
  const canManage = canManageCampaign();
  const navigate = useNavigate();
  const [membersOpen, setMembersOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManage && campaign.status !== "terminee" ? (
        <Button
          size="sm"
          className="[&_svg]:size-3.5"
          onClick={() =>
            navigate({ to: "/campagnes/$campaignId/tests/ajouter", params: { campaignId: campaign.id } })
          }
        >
          <Plus /> {t("pages.campaign_detail.ajouter_un_test")}
        </Button>
      ) : null}
      {canManage && campaign.status !== "terminee" ? (
        <ImportMenu
          label={t("actions.importer")}
          descriptionLabel={t("pages.campaign_detail.import_choisir")}
          options={[
            {
              key: "tests",
              label: t("campagne_import.menu_title"),
              description: t("campagne_import.menu_description"),
              icon: Upload,
              onSelect: () =>
                navigate({
                  to: "/campagnes/$campaignId/importer",
                  params: { campaignId: campaign.id },
                }),
            },
            {
              key: "features",
              label: t("pages.features.menu_title"),
              description: t("pages.features.import_menu_description"),
              icon: FileUp,
              onSelect: () =>
                navigate({
                  to: "/campagnes/$campaignId/fonctionnalites/importer",
                  params: { campaignId: campaign.id },
                }),
            },
          ]}
          secondaryLabel={t("pages.campaign_detail.modele_menu_titre")}
          secondary={[
            {
              key: "template-tests",
              label: t("pages.campaign_detail.modele_csv"),
              description: t("pages.campaign_detail.modele_menu_description"),
              icon: FileUp,
              onSelect: onExportTemplate,
            },
          ]}
        />
      ) : null}
      {/*
       * Memoire des membres, transition de statut et generation du rapport
       * convergent ici : ce sont des actions utiles mais peu frequentes, qui
       * donnaient trois boutons alignes pour une seule action courante.
       */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={t("actions.plus")}
            title={t("actions.plus")}
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {canManage && campaign.status !== "terminee" ? (
            <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
              <Users className="size-3.5 text-muted-foreground" />
              {t("pages.add_campaign.gerer_membres")}
            </DropdownMenuItem>
          ) : null}
          {canManage && campaign.status !== "terminee" ? (
            <DropdownMenuItem onSelect={onTransition}>
              <PlayCircle className="size-3.5 text-muted-foreground" />
              {campaign.status === "encours" ? t("actions.cloturer") : t("actions.demarrer")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={onExport}>
            <Download className="size-3.5 text-muted-foreground" />
            {t("actions.rapport")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ManageMembersDialog
        campaign={campaign}
        open={membersOpen}
        onOpenChange={setMembersOpen}
      />
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
  "resultat_attendu",
  "resultat_obtenu",
  "commentaires",
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
    "Comportement conforme (ou à renseigner à l'exécution)",
    "Commentaire optionnel",
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

/**
 * Dialogue de gestion des membres, pilote par le parent.
 *
 * Le declencheur vit dans le menu d'actions de la campagne : le dialogue est
 * donc expose en mode controle plutot que de porter son propre bouton.
 */
function ManageMembersDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const { users, updateCampaign, campaigns, replaceCampaigns } = useStore();
  const [testLeads, setTestLeads] = useState<Set<string>>(new Set(campaign.testLeads ?? (campaign.owner ? [campaign.owner] : [])));
  const [testers, setTesters] = useState<Set<string>>(new Set(campaign.testers));
  const [developers, setDevelopers] = useState<Set<string>>(new Set(campaign.developers ?? []));

  const memberOptions: MemberOption[] = users.map((u) => ({
    name: u.name,
    role: u.role,
    roles: u.roles ?? [u.role],
    active: u.active,
  }));
  const leadOptions = memberOptions.filter((o) => o.active && (o.roles ? o.roles : [o.role]).some((r) => r === "chef_testeur" || r === "quality_manager" || r === "qa_lead"));
  const testerOptions = memberOptions.filter((o) => o.active && isTesterRole(o.roles, o.role));
  const devOptions = memberOptions.filter((o) => o.active && (o.roles ? o.roles : [o.role]).includes("developpeur"));

  const save = async () => {
    const leadNames = [...testLeads];
    if (/^\d+$/.test(campaign.id) && localStorage.getItem("token")) {
      try {
        const idsOf = (names: Set<string>) =>
          users.filter((user) => names.has(user.name)).map((user) => Number(user.id));
        const response = await api<{ campaign: BackendCampaign }>(`/campaigns/${campaign.id}`, {
          method: "PUT",
          body: JSON.stringify({ test_lead_ids: idsOf(testLeads), testers: idsOf(testers), developers: idsOf(developers) }),
        });
        if (response.campaign) {
          replaceCampaigns(campaigns.map((c) => (c.id === campaign.id ? { ...c, testLeads: (response.campaign.test_lead_names ?? []).map(String), owner: (response.campaign.test_lead_names ?? []).map(String)[0] ?? c.owner, testers: (response.campaign.tester_names ?? []).map(String), developers: (response.campaign.developer_names ?? []).map(String) } : c)));
          toast.success(t("pages.add_campaign.membres_update_ok"));
          onOpenChange(false);
          return;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("common.erreur"));
        return;
      }
    }
    updateCampaign(campaign.id, { testLeads: leadNames, owner: leadNames[0] ?? campaign.owner, testers: [...testers], developers: [...developers] });
    toast.success(t("pages.add_campaign.membres_update_ok"));
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages.add_campaign.gerer_membres")}</DialogTitle>
            <DialogDescription>{campaign.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">{t("pages.add_campaign.membres_chefs_test")}</Label>
              <MemberMultiSelect
                value={testLeads}
                onChange={setTestLeads}
                options={leadOptions}
                showRole={false}
                placeholder={t("pages.add_campaign.aucun_membre")}
                selectionLabel={{
                  label: t("pages.add_campaign.membre"),
                  labelPlural: t("pages.add_campaign.membres"),
                }}
              />
            </div>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
      actions={<CampaignActions
            campaign={campaign}
            st={st}
            onExport={onExport}
            onTransition={onTransition}
            onExportTemplate={onExportTemplate}
          />}
    >
      <Link
        to="/campagnes"
        dir="ltr"
        className="inline-flex flex-row items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> {t("pages.campaigns.campaigns")}
      </Link>
      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryPanel st={st} />
        <InfoPanel campaign={campaign} product={product} project={project} />
        <FailedTestsPanel failedTests={failedTests} />
      </div>
      <CampaignTestsTable
        list={st.list}
        campaignId={campaign.id}
        onDelete={(t) => setToDeleteTest(t)}
        locked={campaign.status === "terminee"}
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
