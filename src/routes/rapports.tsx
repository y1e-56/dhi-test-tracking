import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { BarChart3, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PILOTAGE_TABS } from "@/lib/dhi-nav";
import { useStore, campaignStats } from "@/lib/dhi-store";
import { healthOf, NF_DOMAIN_LABEL, type Health } from "@/lib/dhi-data";

export const Route = createFileRoute("/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports & exports — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Rapports exportables : scores qualité par produit, avancement des campagnes et couverture.",
      },
    ],
  }),
  component: ReportsPage,
});

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const HEALTH_LABEL: Record<Health, string> = {
  sain: "Sain",
  surveiller: "À surveiller",
  risque: "À risque",
  critique: "Critique",
};

function ReportsPage() {
  const { products, campaigns, tests, features } = useStore();

  const exportScores = () => {
    const header = "Produit;Score;État de santé;Résultats;Couverture;Criticité;Incidents;Non-fonctionnel;Testabilité;Contrôles\n";
    const body = products
      .map(
        (p) =>
          `${p.name};${p.score};${HEALTH_LABEL[healthOf(p.score)]};${p.breakdown.results};${p.breakdown.coverage};${p.breakdown.critical};${p.breakdown.incidents};${p.breakdown.nonFunctional};${p.breakdown.testability};${p.breakdown.qualityControl}`,
      )
      .join("\n");
    download("rapport_scores_qualite.csv", header + body, "text/csv;charset=utf-8;");
    toast.success("Rapport des scores exporté.");
  };

  const exportCampaigns = () => {
    const header = "Campagne;Produit;Type;Environnement;Total;Exécuté;Taux exécution;Réussis;Échoués;Bloqués;Taux réussite\n";
    const body = campaigns
      .map((c) => {
        const s = campaignStats(tests, c.id);
        const p = products.find((x) => x.id === c.productId)?.name ?? c.productId;
        return `${c.name};${p};${c.type};${c.environment};${s.total};${s.executed};${s.executionRate}%;${s.passed};${s.failed};${s.blocked};${s.successRate}%`;
      })
      .join("\n");
    download("rapport_campagnes.csv", header + body, "text/csv;charset=utf-8;");
    toast.success("Rapport des campagnes exporté.");
  };

  const exportCoverage = () => {
    const header = "Fonctionnalité;Produit;Criticité;Nombre de tests;Exécutés;Réussis\n";
    const body = features
      .map((f) => {
        const p = products.find((x) => x.id === f.productId)?.name ?? f.productId;
        const ftests = tests.filter((t) => t.featureId === f.id);
        const executed = ftests.filter((t) => t.verdict !== "NOT_RUN" && t.verdict !== "NOT_APPLICABLE").length;
        const passed = ftests.filter((t) => t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION").length;
        return `${f.name};${p};${f.criticality};${ftests.length};${executed};${passed}`;
      })
      .join("\n");
    download("rapport_couverture.csv", header + body, "text/csv;charset=utf-8;");
    toast.success("Rapport de couverture exporté.");
  };

  const exportJson = () => {
    const data = {
      produits: products.map((p) => ({
        id: p.id,
        nom: p.name,
        score: p.score,
        sante: HEALTH_LABEL[healthOf(p.score)],
        details: p.breakdown,
      })),
      campagnes: campaigns.map((c) => ({ id: c.id, nom: c.name, stats: campaignStats(tests, c.id) })),
    };
    download("rapport_complet.json", JSON.stringify(data, null, 2), "application/json");
    toast.success("Rapport JSON exporté.");
  };

  const nfLabel = (domain: string) => NF_DOMAIN_LABEL[domain as keyof typeof NF_DOMAIN_LABEL] ?? domain;

  return (
    <AppShell
      title="Rapports & exports"
      subtitle="Exports des scores qualité, de l'avancement des campagnes et de la couverture (cahier des charges §5 — Rapports)."
      breadcrumb="Pilotage"
      tabs={PILOTAGE_TABS}
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportScores}>
            <FileSpreadsheet className="size-4" /> Scores
          </Button>
          <Button size="sm" variant="outline" onClick={exportCampaigns}>
            <FileSpreadsheet className="size-4" /> Campagnes
          </Button>
          <Button size="sm" variant="outline" onClick={exportCoverage}>
            <FileSpreadsheet className="size-4" /> Couverture
          </Button>
          <Button size="sm" variant="outline" onClick={exportJson}>
            <FileJson className="size-4" /> JSON
          </Button>
        </div>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Produits" value={products.length} icon={<BarChart3 className="size-4" />} />
        <KpiCard
          label="Campagnes"
          value={campaigns.length}
          tone="info"
          icon={<FileSpreadsheet className="size-4" />}
        />
        <KpiCard
          label="Cas de tests"
          value={tests.length}
          tone="success"
          icon={<BarChart3 className="size-4" />}
        />
        <KpiCard
          label="Score moyen"
          value={products.length ? Math.round(products.reduce((s, p) => s + p.score, 0) / products.length) : 0}
          tone="warning"
          icon={<Download className="size-4" />}
        />
      </div>

      <Panel title="Scores qualité par produit">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Score / 100</TableHead>
              <TableHead>État</TableHead>
              <TableHead>Résultats</TableHead>
              <TableHead>Couverture</TableHead>
              <TableHead>Criticité</TableHead>
              <TableHead>Incidents</TableHead>
              <TableHead>Non-fonct.</TableHead>
              <TableHead>Testabilité</TableHead>
              <TableHead>Contrôles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm font-medium">{p.name}</TableCell>
                <TableCell className="num font-semibold">{p.score}</TableCell>
                <TableCell className="text-sm">{HEALTH_LABEL[healthOf(p.score)]}</TableCell>
                <TableCell className="num text-sm">{p.breakdown.results}</TableCell>
                <TableCell className="num text-sm">{p.breakdown.coverage}</TableCell>
                <TableCell className="num text-sm">{p.breakdown.critical}</TableCell>
                <TableCell className="num text-sm">{p.breakdown.incidents}</TableCell>
                <TableCell className="num text-sm">{p.breakdown.nonFunctional}</TableCell>
                <TableCell className="num text-sm">{p.breakdown.testability}</TableCell>
                <TableCell className="num text-sm">{p.breakdown.qualityControl}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <div className="mt-4">
        <Panel title="Avancement des campagnes">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campagne</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Exécution</TableHead>
                <TableHead>Réussite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const s = campaignStats(tests, c.id);
                const p = products.find((x) => x.id === c.productId)?.name ?? c.productId;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{p}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{nfLabel(c.type)}</TableCell>
                    <TableCell className="num text-sm">{s.total}</TableCell>
                    <TableCell className="num text-sm">{s.executionRate}%</TableCell>
                    <TableCell className="num text-sm">{s.successRate}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </AppShell>
  );
}
