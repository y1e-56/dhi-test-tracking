import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, QualityBar } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  CRITICALITY_LABEL,
  TEST_TYPES,
  type Criticality,
  type TestType,
} from "@/lib/dhi-data";
import { useStore } from "@/lib/dhi-store";

const QUALITY_TABS = [
  { to: "/produits", label: "Produits" },
  { to: "/fonctionnalites", label: "Fonctionnalités" },
  { to: "/couverture", label: "Couverture" },
];

export const Route = createFileRoute("/fonctionnalites")({
  head: () => ({
    meta: [
      { title: "Registre des fonctionnalités — DHI Quality Platform" },
      {
        name: "description",
        content: "Registre des fonctionnalités : criticité, couverture de tests et trous détectés.",
      },
      { property: "og:title", content: "Registre des fonctionnalités — DHI Quality Platform" },
      { property: "og:description", content: "Criticité et couverture de tests par fonctionnalité." },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  const { features, products, addFeature } = useStore();
  const [productFilter, setProductFilter] = useState("all");
  const [critFilter, setCritFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    productId: string;
    criticality: Criticality;
    description: string;
    coverage: Set<TestType>;
  }>({ name: "", productId: "p-paiement", criticality: "moyenne", description: "", coverage: new Set() });

  const rows = useMemo(
    () =>
      features
        .filter((f) => productFilter === "all" || f.productId === productFilter)
        .filter((f) => critFilter === "all" || f.criticality === critFilter),
    [features, productFilter, critFilter],
  );

  const coveragePct = (f: (typeof features)[number]) => {
    const total = TEST_TYPES.length;
    const covered = TEST_TYPES.filter((t) => f.coverage[t.id]).length;
    return Math.round((covered / total) * 100);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Le nom de la fonctionnalité est requis.");
      return;
    }
    const coverage: Partial<Record<TestType, boolean>> = {};
    for (const t of TEST_TYPES) coverage[t.id] = form.coverage.has(t.id);
    addFeature({
      productId: form.productId,
      name: form.name.trim(),
      description: form.description,
      criticality: form.criticality,
      coverage,
    });
    toast.success(`Fonctionnalité « ${form.name.trim()} » ajoutée.`);
    setOpen(false);
    setForm({ name: "", productId: "p-paiement", criticality: "moyenne", description: "", coverage: new Set() });
  };

  return (
    <AppShell
      title="Registre des fonctionnalités"
      subtitle="Fonctionnalités, criticité et couverture de tests"
      breadcrumb={["Qualité", "Fonctionnalités"]}
      tabs={QUALITY_TABS}
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nouvelle fonctionnalité
        </Button>
      }
    >
      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
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
          <Select value={critFilter} onValueChange={setCritFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Criticité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes criticités</SelectItem>
              {(Object.keys(CRITICALITY_LABEL) as Criticality[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {CRITICALITY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-sm text-muted-foreground">{rows.length} fonctionnalités</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fonctionnalité</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Criticité</TableHead>
              <TableHead>Tests couverts</TableHead>
              <TableHead className="w-56">Couverture</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => {
              const pct = coveragePct(f);
              const product = products.find((p) => p.id === f.productId);
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    <p className="font-medium">{f.name}</p>
                    <p className="max-w-xs truncate text-xs text-muted-foreground">
                      {f.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                  <TableCell>
                    <CriticalityBadge level={f.criticality} />
                  </TableCell>
                  <TableCell className="num text-sm">
                    {TEST_TYPES.filter((t) => f.coverage[t.id]).length} / {TEST_TYPES.length} types
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <QualityBar value={pct} className="flex-1" />
                      <span className="num w-12 text-right text-sm">{pct} %</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle fonctionnalité</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="f-name">Nom</Label>
              <Input
                id="f-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex. Authentification"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-desc">Description</Label>
              <Input
                id="f-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Produit</Label>
                <Select
                  value={form.productId}
                  onValueChange={(v) => setForm((f) => ({ ...f, productId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Criticité</Label>
                <Select
                  value={form.criticality}
                  onValueChange={(v) => setForm((f) => ({ ...f, criticality: v as Criticality }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CRITICALITY_LABEL) as Criticality[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CRITICALITY_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Types de tests couvrant cette fonctionnalité</Label>
              <div className="grid grid-cols-2 gap-2">
                {TEST_TYPES.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.coverage.has(t.id)}
                      onCheckedChange={(checked) =>
                        setForm((f) => {
                          const next = new Set(f.coverage);
                          if (checked) next.add(t.id);
                          else next.delete(t.id);
                          return { ...f, coverage: next };
                        })
                      }
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
