import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, KpiCard } from "@/components/dhi/indicators";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/dhi-store";
import {
  CRITICALITY_LABEL,
  REQUIREMENT_STATUS_LABEL,
  type Criticality,
  type RequirementStatus,
} from "@/lib/dhi-data";

const QUALITY_TABS = [
  { to: "/produits", label: "Produits" },
  { to: "/fonctionnalites", label: "Fonctionnalités" },
  { to: "/exigences", label: "Exigences" },
  { to: "/couverture", label: "Couverture" },
];

export const Route = createFileRoute("/exigences")({
  head: () => ({
    meta: [
      { title: "Exigences & traçabilité — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Référentiel des exigences produit : priorité, statut de validation et rattachement aux fonctionnalités testées.",
      },
      { property: "og:title", content: "Exigences & traçabilité — DHI Quality Platform" },
      {
        property: "og:description",
        content: "Traçabilité entre exigences métier et fonctionnalités couvertes par les tests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequirementsPage,
});

function StatusPill({ status }: { status: RequirementStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
        status === "couverte" && "border-success/30 bg-success-soft text-success",
        status === "validee" && "border-info/30 bg-info-soft text-info",
        status === "brouillon" && "border-border bg-secondary text-secondary-foreground",
      )}
    >
      {REQUIREMENT_STATUS_LABEL[status]}
    </span>
  );
}

function RequirementsPage() {
  const { requirements, products, features, addRequirement, updateRequirement } = useStore();
  const [productFilter, setProductFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    productId: products[0]?.id ?? "",
    priority: "moyenne" as Criticality,
  });

  const rows = requirements.filter(
    (r) => productFilter === "all" || r.productId === productFilter,
  );

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Le titre de l'exigence est requis.");
      return;
    }
    addRequirement({
      productId: form.productId,
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      status: "brouillon",
      featureIds: [],
    });
    toast.success("Exigence ajoutée au référentiel.");
    setOpen(false);
    setForm({ ...form, title: "", description: "" });
  };

  return (
    <AppShell
      title="Exigences & traçabilité"
      subtitle="Du besoin métier à la fonctionnalité testée"
      breadcrumb={["Qualité", "Exigences"]}
      tabs={QUALITY_TABS}
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nouvelle exigence
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Exigences" value={requirements.length} hint="Tous produits" />
        <KpiCard
          label="Couvertes"
          value={requirements.filter((r) => r.status === "couverte").length}
          tone="success"
          hint="Rattachées à des tests"
        />
        <KpiCard
          label="Validées"
          value={requirements.filter((r) => r.status === "validee").length}
          tone="info"
          hint="À couvrir"
        />
        <KpiCard
          label="Brouillons"
          value={requirements.filter((r) => r.status === "brouillon").length}
          tone="warning"
          hint="À valider"
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-2.5">
          <h2 className="text-[13px] font-semibold tracking-tight">Référentiel</h2>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-56">
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
          <p className="label-eyebrow ml-auto">{rows.length} exigences</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Exigence</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Fonctionnalités liées</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num font-medium">{r.id}</TableCell>
                <TableCell className="max-w-sm">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.description}</p>
                </TableCell>
                <TableCell className="text-sm">
                  {products.find((p) => p.id === r.productId)?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <CriticalityBadge level={r.priority} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.featureIds.length
                    ? r.featureIds
                        .map((id) => features.find((f) => f.id === id)?.name ?? id)
                        .join(", ")
                    : "Aucune"}
                </TableCell>
                <TableCell>
                  <Select
                    value={r.status}
                    onValueChange={(v) => {
                      updateRequirement(r.id, { status: v as RequirementStatus });
                      toast.success(
                        `${r.id} : ${REQUIREMENT_STATUS_LABEL[v as RequirementStatus]}.`,
                      );
                    }}
                  >
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <StatusPill status={r.status} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(REQUIREMENT_STATUS_LABEL) as RequirementStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {REQUIREMENT_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aucune exigence pour ce produit.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle exigence</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="r-title">Titre</Label>
              <Input
                id="r-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex. Le paiement doit aboutir en moins de 3 s"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-desc">Description</Label>
              <Textarea
                id="r-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
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
                <Label>Priorité</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Criticality }))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
