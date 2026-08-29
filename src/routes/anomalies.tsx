import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { DefectStatusBadge, KpiCard, SeverityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFECT_STATUS_LABEL,
  PEOPLE,
  SEVERITY_LABEL,
  type Defect,
  type DefectStatus,
  type Severity,
} from "@/lib/dhi-data";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/anomalies")({
  head: () => ({
    meta: [
      { title: "Anomalies & Incidents — DHI Quality Platform" },
      {
        name: "description",
        content: "Suivi des anomalies et incidents : gravité, priorité, statut, affectation et capitalisation.",
      },
      { property: "og:title", content: "Anomalies & Incidents — DHI Quality Platform" },
      { property: "og:description", content: "Traquez et résolvez les anomalies de vos produits." },
    ],
  }),
  component: DefectsPage,
});

function DefectsPage() {
  const { defects, products, features, addDefect, updateDefect } = useStore();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Defect | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "moyenne" as Severity,
    priority: "moyenne" as Severity,
    productId: "p-paiement",
    featureId: "f-paiement",
    assignee: "Pierre Durand",
  });

  const rows = useMemo(
    () =>
      defects
        .filter((d) => severityFilter === "all" || d.severity === severityFilter)
        .filter((d) => statusFilter === "all" || d.status === statusFilter)
        .filter(
          (d) =>
            !search ||
            d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.id.toLowerCase().includes(search.toLowerCase()),
        ),
    [defects, search, severityFilter, statusFilter],
  );

  const exportCsv = () => {
    const header = "id;titre;gravite;priorite;statut;version;affecte;cree\n";
    const body = rows
      .map(
        (d) =>
          `${d.id};"${d.title}";${d.severity};${d.priority};${d.status};${d.version};"${d.assignee}";${d.createdAt}`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rapport-anomalies.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport des anomalies exporté (CSV).");
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    const id = addDefect({
      productId: form.productId,
      title: form.title.trim(),
      description: form.description,
      severity: form.severity,
      priority: form.priority,
      status: "nouvelle",
      featureId: form.featureId,
      version: "4.12",
      reporter: "Marie Martin",
      assignee: form.assignee,
      createdAt: new Date().toISOString().slice(0, 10),
      targetDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    });
    toast.success(`Anomalie ${id} créée.`);
    setCreateOpen(false);
    setForm({ ...form, title: "", description: "" });
  };

  return (
    <AppShell
      title="Anomalies & Incidents"
      subtitle="Tracer, affecter et capitaliser les bugs"
      breadcrumb={["Système", "Anomalies"]}
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> Exporter
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Nouvelle anomalie
          </Button>
        </div>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ouvertes"
          value={defects.filter((d) => d.status !== "fermee").length}
          tone="warning"
          hint="Tous produits"
        />
        <KpiCard
          label="Gravité haute"
          value={defects.filter((d) => d.severity === "haute" && d.status !== "fermee").length}
          tone="danger"
          hint="À traiter en priorité"
        />
        <KpiCard
          label="En correction"
          value={defects.filter((d) => d.status === "encorrection").length}
          tone="info"
          hint="Prises en charge"
        />
        <KpiCard
          label="Fermées"
          value={defects.filter((d) => d.status === "fermee").length}
          tone="success"
          hint="Capitalisées"
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (id, titre)…"
              className="w-64 pl-8"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Gravité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes gravités</SelectItem>
              {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SEVERITY_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {(Object.keys(DEFECT_STATUS_LABEL) as DefectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {DEFECT_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-sm text-muted-foreground">{rows.length} anomalie(s)</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Gravité</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Affectée à</TableHead>
              <TableHead>Créée le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.id} className="cursor-pointer" onClick={() => setSelected(d)}>
                <TableCell className="num font-medium">{d.id}</TableCell>
                <TableCell className="max-w-sm truncate">{d.title}</TableCell>
                <TableCell>
                  <SeverityBadge level={d.severity} />
                </TableCell>
                <TableCell>
                  <SeverityBadge level={d.priority} />
                </TableCell>
                <TableCell>
                  <DefectStatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-sm">{d.assignee}</TableCell>
                <TableCell className="num text-sm text-muted-foreground">{d.createdAt}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Aucune anomalie ne correspond aux filtres.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {/* Détail */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.id} : {selected.title}
                </DialogTitle>
                <DialogDescription>
                  Détectée par {selected.reporter} le {selected.createdAt} · Version {selected.version}
                  {selected.testId ? ` · Test ${selected.testId}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                <SeverityBadge level={selected.severity} />
                <DefectStatusBadge status={selected.status} />
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
                  {features.find((f) => f.id === selected.featureId)?.name ?? selected.featureId}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Affectée à</Label>
                  <Select
                    value={selected.assignee}
                    onValueChange={(v) => {
                      updateDefect(selected.id, { assignee: v });
                      setSelected({ ...selected, assignee: v });
                      toast.success(`${selected.id} réaffectée à ${v}.`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>Statut</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => {
                      updateDefect(selected.id, { status: v as DefectStatus });
                      setSelected({ ...selected, status: v as DefectStatus });
                      toast.success(`Statut mis à jour : ${DEFECT_STATUS_LABEL[v as DefectStatus]}.`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DEFECT_STATUS_LABEL) as DefectStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {DEFECT_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
                <p className="font-medium">Capitalisation</p>
                <p className="mt-1 text-muted-foreground">
                  Un test de non-régression devrait couvrir ce cas : « {selected.title} »
                  (version {selected.version}).
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Création */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nouvelle anomalie</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="d-title">Titre</Label>
              <Input
                id="d-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex. Export PDF : crash en format paysage"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="d-desc">Description</Label>
              <Textarea
                id="d-desc"
                rows={3}
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
                <Label>Fonctionnalité</Label>
                <Select
                  value={form.featureId}
                  onValueChange={(v) => setForm((f) => ({ ...f, featureId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {features.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Gravité</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) => setForm((f) => ({ ...f, severity: v as Severity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {SEVERITY_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Priorité</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Severity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {SEVERITY_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Affectée à</Label>
                <Select
                  value={form.assignee}
                  onValueChange={(v) => setForm((f) => ({ ...f, assignee: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Créer l'anomalie</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
