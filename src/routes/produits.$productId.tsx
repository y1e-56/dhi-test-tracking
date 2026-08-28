import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Users, GitBranch } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import {
  CriticalityBadge,
  HealthBadge,
  Panel,
  QualityBar,
  ScoreValue,
  StatusBadge,
} from "@/components/dhi/indicators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { campaignStats, productScore, useStore } from "@/lib/dhi-store";
import { products } from "@/lib/dhi-data";

export const Route = createFileRoute("/produits/$productId")({
  loader: ({ params }) => {
    const p = products.find((x) => x.id === params.productId);
    if (!p) throw notFound();
    return { name: p.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Produit"} — DHI Quality Platform` },
      { name: "description", content: "Fiche produit : score qualité, couverture, campagnes et indicateurs clés." },
      { property: "og:title", content: `${loaderData?.name ?? "Produit"} — DHI Quality Platform` },
      { property: "og:description", content: "Score qualité détaillé, couverture et campagnes du produit." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { productId } = Route.useParams();
  const { products: allProducts, features, campaigns, tests, defects } = useStore();
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return null;

  const score = productScore(product);
  const b = product.breakdown;
  const prodFeatures = features.filter((f) => f.productId === product.id);
  const prodCampaigns = campaigns.filter((c) => c.productId === product.id);
  const prodDefects = defects.filter((d) => d.productId === product.id && d.status !== "fermee");
  const failed = tests.filter((t) => t.verdict === "FAIL").length;

  const weights: { key: keyof typeof b; label: string; w: number }[] = [
    { key: "results", label: "Résultats des tests", w: 30 },
    { key: "coverage", label: "Couverture", w: 25 },
    { key: "critical", label: "Éléments critiques", w: 20 },
    { key: "incidents", label: "Incidents / anomalies", w: 15 },
    { key: "nonFunctional", label: "Non-fonctionnel", w: 10 },
  ];

  return (
    <AppShell
      title={product.name}
      subtitle={`Fiche produit · ${product.description}`}
      actions={
        <Link
          to="/produits"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Retour au portefeuille
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Identité & responsabilités" className="lg:col-span-2">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Propriétaire
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Users className="size-4 text-muted-foreground" /> {product.owner}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Responsable QA
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-muted-foreground" /> {product.qaLead}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Équipe QA
              </dt>
              <dd className="mt-1 text-sm">{product.qaTeam.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Versions actives
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {product.versions.map((v) => (
                  <span
                    key={v}
                    className="num inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium"
                  >
                    <GitBranch className="size-3" /> {v}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Score qualité">
          <div className="flex items-center justify-between">
            <ScoreValue score={score} size="lg" />
            <HealthBadge score={score} />
          </div>
          <ul className="mt-4 space-y-3">
            {weights.map(({ key, label, w }) => (
              <li key={key}>
                <div className="flex items-center justify-between text-sm">
                  <span>{label}</span>
                  <span className="num text-muted-foreground">
                    {b[key]}/100 · {w} %
                  </span>
                </div>
                <QualityBar value={b[key]} className="mt-1" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Couverture & trous de tests">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Couverture globale</p>
            <p className="num text-xl font-semibold text-success">{b.coverage} %</p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Fonctionnalités</span>
              <span className="num">{prodFeatures.length} recensées</span>
            </li>
            <li className="flex justify-between">
              <span>Avec tests</span>
              <span className="num">
                {prodFeatures.filter((f) => f.coverage.fonctionnel).length} / {prodFeatures.length}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Éléments critiques couverts</span>
              <span className="num">
                {
                  prodFeatures.filter(
                    (f) => f.criticality === "critique" && f.coverage.fonctionnel,
                  ).length
                }{" "}
                / {prodFeatures.filter((f) => f.criticality === "critique").length}
              </span>
            </li>
          </ul>
          <div className="mt-4 rounded-md border border-warning/40 bg-warning-soft p-3 text-sm">
            <p className="font-medium">Trous détectés</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
              {prodFeatures.flatMap((f) =>
                Object.entries(f.coverage)
                  .filter(([, ok]) => !ok)
                  .map(([type]) => (
                    <li key={`${f.id}-${type}`}>
                      « {f.name} » : pas de test {type}
                    </li>
                  )),
              )}
              {prodFeatures.every((f) => Object.values(f.coverage).every(Boolean)) && (
                <li>Aucun trou de couverture détecté.</li>
              )}
            </ul>
          </div>
        </Panel>

        <Panel title="Indicateurs clés">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-danger/30 bg-danger-soft p-3">
              <p className="num text-2xl font-semibold text-danger">{failed}</p>
              <p className="text-xs text-muted-foreground">Tests échoués</p>
            </div>
            <div className="rounded-md border border-warning/40 bg-warning-soft p-3">
              <p className="num text-2xl font-semibold text-warning">{prodDefects.length}</p>
              <p className="text-xs text-muted-foreground">Anomalies ouvertes</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="num text-2xl font-semibold">
                {prodDefects.filter((d) => d.severity === "haute").length}
              </p>
              <p className="text-xs text-muted-foreground">Incidents critiques</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="num text-2xl font-semibold">{product.lastUpdate}</p>
              <p className="text-xs text-muted-foreground">Dernière mise à jour</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Dernières campagnes" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campagne</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>État</TableHead>
              <TableHead>Avancement</TableHead>
              <TableHead className="text-right">Taux de réussite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prodCampaigns.map((c) => {
              const st = campaignStats(tests, c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to="/campagnes/$campaignId"
                      params={{ campaignId: c.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="num">{c.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="w-48">
                    <QualityBar value={st.executionRate} neutral />
                  </TableCell>
                  <TableCell className="num text-right">{st.successRate} %</TableCell>
                </TableRow>
              );
            })}
            {prodCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucune campagne pour ce produit.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Fonctionnalités" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fonctionnalité</TableHead>
              <TableHead>Criticité</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prodFeatures.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>
                  <CriticalityBadge level={f.criticality} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{f.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
