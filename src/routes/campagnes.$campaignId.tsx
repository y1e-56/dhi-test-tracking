import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, Panel, QualityBar, StatusBadge, VerdictBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { campaignStats, useStore } from "@/lib/dhi-store";
import { campaigns as seedCampaigns, CAMPAIGN_STATUS_LABEL } from "@/lib/dhi-data";

export const Route = createFileRoute("/campagnes/$campaignId")({
  loader: ({ params }) => {
    const c = seedCampaigns.find((x) => x.id === params.campaignId);
    return { name: c?.name ?? "Campagne" };
  },
  
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Campagne"} — DHI Quality Platform` },
      { name: "description", content: "Suivi détaillé d'une campagne de tests : exécution, réussite, anomalies." },
      { property: "og:title", content: `${loaderData?.name ?? "Campagne"} — DHI Quality Platform` },
      { property: "og:description", content: "Avancement et résultats de la campagne de tests." },
    ],
  }),
  component: CampaignDetail,
});

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const { campaigns, tests, updateCampaign } = useStore();
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) return null;

  const st = campaignStats(tests, campaign.id);
  const failedTests = st.list.filter((t) => t.verdict === "FAIL");

  const exportCsv = () => {
    const header = "id;nom;criticite;verdict;testeur;date\n";
    const rows = st.list
      .map(
        (t) =>
          `${t.id};"${t.name}";${t.criticality};${t.verdict};${t.tester ?? ""};${t.executedAt ?? ""}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${campaign.name.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport de campagne exporté (CSV).");
  };

  const transition = () => {
    if (campaign.status === "planifiee" || campaign.status === "avenir") {
      updateCampaign(campaign.id, { status: "encours" });
      toast.success("Campagne démarrée.");
    } else if (campaign.status === "encours") {
      updateCampaign(campaign.id, { status: "terminee" });
      toast.success("Campagne clôturée.");
    }
  };

  return (
    <AppShell
      title={`Campagne : ${campaign.name}`}
      subtitle={`${CAMPAIGN_STATUS_LABEL[campaign.status]} · ${st.executionRate} % exécutée · Environnement ${campaign.environment}`}
      actions={
        <div className="flex items-center gap-2">
          {campaign.status !== "terminee" ? (
            <Button size="sm" variant="outline" onClick={transition}>
              <PlayCircle className="size-4" />
              {campaign.status === "encours" ? "Clôturer" : "Démarrer"}
            </Button>
          ) : null}
          <Button size="sm" onClick={exportCsv}>
            <Download className="size-4" /> Générer le rapport
          </Button>
          <Link
            to="/campagnes"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> Campagnes
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Résumé d'exécution">
          <ul className="space-y-2 text-sm">
            {[
              ["Tests totaux", String(st.total)],
              ["Exécutés", `${st.executed} (${st.executionRate} %)`],
              ["Réussis", `${st.passed} (${st.successRate} %)`],
              ["Échoués", String(st.failed)],
              ["Bloqués", String(st.blocked)],
              ["Non exécutés", String(st.notRun)],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="num font-medium">{value}</span>
              </li>
            ))}
          </ul>
          <QualityBar value={st.executionRate} neutral className="mt-4" />
        </Panel>

        <Panel title="Informations">
          <dl className="grid gap-3 text-sm">
            {[
              ["Type", campaign.type],
              ["Version", campaign.version],
              ["Environnement", campaign.environment],
              ["Responsable", campaign.owner],
              ["Période", `${campaign.startDate} → ${campaign.endDate}`],
              ["Testeurs", campaign.testers.join(", ") || "—"],
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

        <Panel title="Tests échoués">
          {failedTests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun test en échec. 🎉</p>
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
                    Détail
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Tous les tests de la campagne" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Criticité</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead>Testeur</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {st.list.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="num font-medium">{t.id}</TableCell>
                <TableCell className="max-w-xs truncate">{t.name}</TableCell>
                <TableCell>
                  <CriticalityBadge level={t.criticality} />
                </TableCell>
                <TableCell className="text-sm capitalize">{t.type}</TableCell>
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
                    Exécuter
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
