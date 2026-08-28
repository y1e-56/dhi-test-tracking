import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { HealthBadge, ScoreValue } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
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
import { PEOPLE, healthOf } from "@/lib/dhi-data";
import { productScore, useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/produits")({
  head: () => ({
    meta: [
      { title: "Produits & Projets — DHI Quality Platform" },
      {
        name: "description",
        content: "Portefeuille de produits logiciels : scores qualité, santé et projets associés.",
      },
      { property: "og:title", content: "Produits & Projets — DHI Quality Platform" },
      { property: "og:description", content: "Scores qualité et santé de tous vos produits." },
    ],
  }),
  component: ProductsPage,
});

type SortKey = "name" | "score" | "lastUpdate";

function ProductsPage() {
  const { products, addProduct } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("score");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", owner: "", qaLead: "", description: "" });

  const rows = useMemo(() => {
    let list = products.map((p) => ({ p, score: productScore(p) }));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        ({ p }) => p.name.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q),
      );
    }
    if (healthFilter !== "all") list = list.filter(({ score }) => healthOf(score) === healthFilter);
    list.sort((a, b) =>
      sort === "name"
        ? a.p.name.localeCompare(b.p.name)
        : sort === "score"
          ? b.score - a.score
          : b.p.lastUpdate.localeCompare(a.p.lastUpdate),
    );
    return list;
  }, [products, search, sort, healthFilter]);

  const submit = () => {
    if (!form.name.trim() || !form.owner || !form.qaLead) {
      toast.error("Nom, propriétaire et responsable QA sont requis.");
      return;
    }
    addProduct({
      name: form.name.trim(),
      description: form.description,
      owner: form.owner,
      qaLead: form.qaLead,
      qaTeam: [form.qaLead],
      versions: ["1.0"],
      projects: 1,
      score: 80,
    });
    toast.success(`Produit « ${form.name.trim()} » créé.`);
    setOpen(false);
    setForm({ name: "", owner: "", qaLead: "", description: "" });
  };

  return (
    <AppShell
      title="Produits & Projets"
      subtitle="Portefeuille de produits logiciels"
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nouveau produit
        </Button>
      }
    >
      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-64 pl-8"
            />
          </div>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Santé" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les santés</SelectItem>
              <SelectItem value="sain">Sain</SelectItem>
              <SelectItem value="risque">À risque</SelectItem>
              <SelectItem value="critique">Critique</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score décroissant</SelectItem>
              <SelectItem value="name">Nom (A → Z)</SelectItem>
              <SelectItem value="lastUpdate">Dernière mise à jour</SelectItem>
            </SelectContent>
          </Select>
          <p className="ml-auto text-sm text-muted-foreground">
            {rows.length} produit{rows.length > 1 ? "s" : ""}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Santé</TableHead>
              <TableHead className="text-right">Projets</TableHead>
              <TableHead>Propriétaire</TableHead>
              <TableHead>Dernière mise à jour</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ p, score }) => (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate({ to: "/produits/$productId", params: { productId: p.id } })
                }
              >
                <TableCell>
                  <p className="font-medium">{p.name}</p>
                  <p className="max-w-md truncate text-xs text-muted-foreground">{p.description}</p>
                </TableCell>
                <TableCell>
                  <ScoreValue score={score} size="sm" />
                </TableCell>
                <TableCell>
                  <HealthBadge score={score} />
                </TableCell>
                <TableCell className="num text-right">{p.projects}</TableCell>
                <TableCell className="text-sm">{p.owner}</TableCell>
                <TableCell className="num text-sm text-muted-foreground">{p.lastUpdate}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aucun produit ne correspond aux filtres.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau produit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="p-name">Nom du produit</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex. Paiement Online"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Input
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Propriétaire</Label>
                <Select
                  value={form.owner}
                  onValueChange={(v) => setForm((f) => ({ ...f, owner: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PEOPLE.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Responsable QA</Label>
                <Select
                  value={form.qaLead}
                  onValueChange={(v) => setForm((f) => ({ ...f, qaLead: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PEOPLE.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Créer le produit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
