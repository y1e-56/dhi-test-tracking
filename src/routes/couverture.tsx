import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { Panel } from "@/components/dhi/indicators";
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
import { TEST_TYPES } from "@/lib/dhi-data";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/couverture")({
  head: () => ({
    meta: [
      { title: "Matrice de couverture — DHI Quality Platform" },
      {
        name: "description",
        content: "Matrice de couverture 2D : fonctionnalités × types de tests, avec alertes sur les trous.",
      },
      { property: "og:title", content: "Matrice de couverture — DHI Quality Platform" },
      { property: "og:description", content: "Visualisez les trous de couverture de tests par fonctionnalité." },
    ],
  }),
  component: CoveragePage,
});

function CoveragePage() {
  const { features, products } = useStore();
  const [productFilter, setProductFilter] = useState("all");

  const rows = useMemo(
    () => features.filter((f) => productFilter === "all" || f.productId === productFilter),
    [features, productFilter],
  );

  const totalCells = rows.length * TEST_TYPES.length;
  const missingCells = rows.flatMap((f) =>
    TEST_TYPES.filter((t) => !f.coverage[t.id]).map((t) => ({ f, t })),
  );
  const missingPct = totalCells ? Math.round((missingCells.length / totalCells) * 100) : 0;

  return (
    <AppShell title="Matrice de couverture" subtitle="Fonctionnalités × types de tests">
      <Panel
        title="Grille de couverture"
        actions={
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Produit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les produits</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fonctionnalité</TableHead>
              {TEST_TYPES.map((t) => (
                <TableHead key={t.id} className="text-center">
                  {t.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                {TEST_TYPES.map((t) => {
                  const covered = !!f.coverage[t.id];
                  return (
                    <TableCell key={t.id} className="text-center">
                      <span
                        className={
                          covered
                            ? "inline-flex size-7 items-center justify-center rounded-md bg-success-soft text-success"
                            : "inline-flex size-7 items-center justify-center rounded-md bg-danger-soft text-danger"
                        }
                        title={`${f.name} · ${t.label} : ${covered ? "couvert" : "non couvert"}`}
                      >
                        {covered ? <Check className="size-4" /> : <X className="size-4" />}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Légende : <span className="font-medium text-success">✓ couvert</span> ·{" "}
            <span className="font-medium text-danger">✗ non couvert</span>
          </p>
          <p className="num text-sm font-medium">
            Cases manquantes : {missingCells.length} / {totalCells} ({missingPct} %)
          </p>
        </div>
      </Panel>

      <Panel title="Alertes de couverture" className="mt-4">
        {missingCells.length === 0 ? (
          <p className="text-sm text-muted-foreground">Couverture complète. 🎉</p>
        ) : (
          <ul className="space-y-2">
            {missingCells.slice(0, 10).map(({ f, t }) => (
              <li
                key={`${f.id}-${t.id}`}
                className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 text-warning" />
                <span>
                  « {f.name} » : pas de test <span className="font-medium">{t.label.toLowerCase()}</span>
                </span>
              </li>
            ))}
            {missingCells.length > 10 ? (
              <li className="text-sm text-muted-foreground">
                … et {missingCells.length - 10} autres trous de couverture.
              </li>
            ) : null}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
