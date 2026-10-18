import { createFileRoute, Link, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, VerdictBadge } from "@/components/dhi/indicators";
import { QuickVerdictButtons } from "@/components/dhi/QuickVerdict";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSession, loadSnapshot, useStore } from "@/lib/dhi-store";
import { isInteractiveClick } from "@/lib/clickable-row";
import { campaigns as seedCampaigns } from "@/lib/dhi-data";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import {
  api,
  mapBackendTestCase,
  type BackendTestCase,
  type BackendTestExecution,
} from "@/lib/api";
import { canManageOperational, canManageCampaign, canExecuteTest } from "@/lib/role-protection";
import type { TestCase } from "@/lib/dhi-data";

export const Route = createFileRoute("/campagnes/$campaignId/tests")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const campaign = campaigns.find((item) => item.id === params.campaignId);
    return { name: campaign?.name ?? "Campagne" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Cas de test · ${loaderData?.name ?? "Campagne"} — DHI Quality Platform` }],
  }),
  component: CampaignTests,
});

function CampaignTests() {
  const { campaignId } = Route.useParams();
  const matches = useMatches();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { campaigns, tests, updateTest, users } = useStore();
  const [backendTests, setBackendTests] = useState<TestCase[] | null>(null);
  const [search, setSearch] = useState("");
  const exact = matches[matches.length - 1]?.pathname === `/campagnes/${campaignId}/tests`;

  const campaign = campaigns.find((item) => item.id === campaignId);
  const locked = campaign?.status === "terminee";
  const session = loadSession();
  // Resolution en un clic reservee au testeur, sur une campagne demarree, et
  // uniquement sur un cas encore joue : un clic ne doit pas ecraser un verdict
  // deja rendu. La revision passe par "Executer".
  const quickResolve = !locked && campaign?.status === "encours" && canManageOperational();

  /**
   * Recharge la liste depuis le backend : apres un verdict, c'est la seule
   * source de verite, l'execution venant d'etre creee n'est pas dans l'etat
   * local.
   */
  const loadBackend = useCallback(() => {
    if (!localStorage.getItem("token") || !/^\d+$/.test(campaignId)) return;
    void Promise.all([
      api<BackendTestCase[]>(`/test-cases?campaignId=${campaignId}`),
      api<{ data: BackendTestExecution[] }>(`/test-executions?campaignId=${campaignId}&limit=200`),
    ])
      .then(([items, executionPage]) => {
        const latestExecution = new Map<number, BackendTestExecution>();
        for (const execution of executionPage.data) {
          if (!latestExecution.has(execution.test_case_id)) {
            latestExecution.set(execution.test_case_id, execution);
          }
        }
        setBackendTests(
          items.map((item) => mapBackendTestCase(item, latestExecution.get(item.id))),
        );
      })
      .catch((error) =>
        console.error("[CampaignTests] Impossible de charger les cas de test", error),
      );
  }, [campaignId]);

  // Seuls les testeurs de la campagne peuvent etre affectes. On travaille sur des
  // ids et non des noms : la colonne backend est une reference users(id), donc
  // afficher un nom sans pouvoir le resoudre rendrait l'affectation non persistee.
  const assignees = useMemo(() => {
    const names = new Set(campaign?.testers ?? []);
    return users
      .filter((user) => names.has(user.name))
      .map((user) => ({ id: user.id, name: user.name }))
      .filter((user) => Number.isInteger(Number(user.id)) && Number(user.id) > 0);
  }, [campaign?.testers, users]);

  const onAssign = (testId: string, value: string) => {
    if (value === "__none__") {
      updateTest(testId, { tester: undefined, assignedTo: null });
      return;
    }
    const user = users.find((u) => u.id === value);
    if (!user) return;
    updateTest(testId, { tester: user.name, assignedTo: Number(value) });
  };

  useEffect(() => {
    loadBackend();
  }, [loadBackend]);

  // Un testeur ne voit que ses propres cas : cette page est un ecran de
  // pilotage, y exposer la charge des collegues lui allowait de juger le
  // travail d'autrui. Le chef de testeur garde la vue complete pour la
  // repartition, et lui seul peut affecter.
  const canDistribute = canManageCampaign();
  const myUserId = session?.id ?? null;
  const myName = session?.name ?? null;

  const availableTests = backendTests ?? tests;
  const rows = useMemo(() => {
    // Tous les cas de test de la campagne, pas seulement les 10 derniers executes :
    // une affectation doit etre possible sur n'importe quel cas, execute ou non.
    // Tri par id (donc par ordre de creation) pour que la liste reste stable :
    // trier par date d'execution ferait sauter les lignes a chaque verdict saisi.
    const all = availableTests
      .filter((test) => test.campaignId === campaignId)
      .filter(
        (test) =>
          canDistribute ||
          (myUserId != null && String(test.assignedTo ?? "") === String(myUserId)) ||
          test.tester === myName,
      )
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    const query = search.trim().toLowerCase();
    return query
      ? all.filter(
          (test) =>
            test.id.toLowerCase().includes(query) || test.name.toLowerCase().includes(query),
        )
      : all;
  }, [availableTests, campaignId, canDistribute, myUserId, myName, search]);

  // Garde place apres tous les hooks : un retour conditionnel avant un useMemo
  // ferait varyer le nombre de hooks selon le routeur et casser React.
  if (!exact) return <Outlet />;

  return (
    <AppShell
      title={campaign?.name ?? t("nav.campaign_tests")}
      subtitle={t("nav.campaign_tests")}
      breadcrumb={[
        t("nav.execution"),
        t("nav.campagnes"),
        campaign?.name ?? "",
        t("nav.campaign_tests"),
      ]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel">
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("pages.campaign_detail.rechercher_cas_test")} className="pl-8" />
            </div>
            {!locked && canManageCampaign() ? (
              <Button asChild size="sm">
                <Link
                  to="/campagnes/$campaignId/tests/ajouter"
                  params={{ campaignId }}
                  className="[&_svg]:size-3.5"
                >
                  <Plus /> {t("pages.campaign_detail.ajouter_un_test")}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
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
              <TableHead>{t("quick_verdict.resolution_rapide")}</TableHead>
              <TableHead className="text-right">{t("pages.campaign_detail.execution")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((tc) => (
              <TableRow
                key={tc.id}
                className="cursor-pointer"
                onClick={(e) => {
                  if (isInteractiveClick(e)) return;
                  void navigate({ to: "/execution/$testId", params: { testId: tc.id } });
                }}
              >
                <TableCell className="num font-medium">{tc.id}</TableCell>
                <TableCell className="max-w-xs truncate">{tc.name}</TableCell>
                <TableCell>
                  <CriticalityBadge level={tc.criticality} />
                </TableCell>
                <TableCell className="text-sm capitalize">{tc.type.replace(/_/g, " ")}</TableCell>
                <TableCell>
                  <VerdictBadge verdict={tc.verdict} />
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <span
                    className="block truncate text-sm"
                    title={
                      [tc.observed, tc.comment].filter(Boolean).join(" — ") ||
                      t("pages.campaign_detail.vide_paren")
                    }
                  >
                    {tc.observed || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  <SearchableSelect
                    value={tc.assignedTo != null ? String(tc.assignedTo) : "__none__"}
                    onValueChange={(v) => onAssign(tc.id, v)}
                    disabled={locked || !canManageCampaign()}
                    options={[
                      { value: "__none__", label: t("pages.campaign_detail.unassigned") },
                      ...assignees.map((u) => ({ value: u.id, label: u.name })),
                    ]}
                    placeholder={t("pages.campaign_detail.unassigned")}
                    className="h-8 w-40"
                  />
                </TableCell>
                <TableCell>
                  {quickResolve && tc.verdict === "NOT_RUN" ? (
                    <QuickVerdictButtons test={tc} onResolved={loadBackend} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {campaign?.status === "terminee" ? (
                    <span className="text-xs text-muted-foreground">
                      {t("pages.campaign_detail.campagne_verrouillee")}
                    </span>
                  ) : !canManageOperational() ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : campaign?.status !== "encours" ? (
                    <span className="text-xs text-muted-foreground">
                      {t("pages.campaign_detail.campagne_non_demarree")}
                    </span>
                  ) : !canExecuteTest(tc.verdict) ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <Link
                      to="/execution/$testId"
                      params={{ testId: tc.id }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t("pages.campaign_detail.executer")}
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  {t("pages.product_detail.no_campaigns_for_product")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
