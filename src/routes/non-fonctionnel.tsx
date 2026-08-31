import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Activity, Gauge, CheckCircle2, Plus, ShieldCheck, Timer, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { useStore } from "@/lib/dhi-store";
import { NF_DOMAIN_LABEL, NF_DOMAIN_ICON_HINT, type NFDomain } from "@/lib/dhi-data";

export const Route = createFileRoute("/non-fonctionnel")({
  head: () => ({
    meta: [
      { title: "Pilotage non-fonctionnel — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Pilotage du non-fonctionnel : performance, charge, sécurité et résilience avec seuils et verdicts calculés.",
      },
    ],
  }),
  component: NonFunctionalPage,
});

const DOMAIN_ICON: Record<NFDomain, React.ReactNode> = {
  performance: <Timer className="size-4" />,
  charge: <Activity className="size-4" />,
  securite: <ShieldCheck className="size-4" />,
  resilience: <Gauge className="size-4" />,
};

const operatorLabel = (op: string) =>
  ({ "<": "<", "<=": "≤", "=": "=", ">=": "≥", ">": ">" })[op] ?? op;

function conforms(n: { operator: string; measured: number; threshold: number }): boolean {
  const m = n.measured;
  const t = n.threshold;
  switch (n.operator) {
    case "<":
      return m < t;
    case "<=":
      return m <= t;
    case "=":
      return m === t;
    case ">=":
      return m >= t;
    case ">":
      return m > t;
    default:
      return true;
  }
}

function NonFunctionalPage() {
  const { nonFunctional, products, addNF, updateNF, deleteNF } = useStore();

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<NFDomain>("performance");
  const [subType, setSubType] = useState("");
  const [metric, setMetric] = useState("");
  const [unit, setUnit] = useState("");
  const [threshold, setThreshold] = useState(0);
  const [operator, setOperator] = useState<"<=" | ">=">("<=");

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const byDomain = (d: NFDomain) => nonFunctional.filter((n) => n.domain === d);
  const allCount = (d: NFDomain) => byDomain(d).length;
  const okCount = (d: NFDomain) => byDomain(d).filter((n) => conforms(n)).length;

  return (
    <AppShell
      title="Pilotage non-fonctionnel"
      subtitle="Performance, charge, sécurité et résilience — seuils et verdicts calculés automatiquement."
      breadcrumb="Qualité"
      tabs={QUALITY_TABS}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Nouveau test non-fonctionnel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau test non-fonctionnel</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Produit</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titre</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Domaine</Label>
                <Select value={domain} onValueChange={(v) => setDomain(v as NFDomain)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(NF_DOMAIN_LABEL) as NFDomain[]).map((d) => (
                      <SelectItem key={d} value={d}>{NF_DOMAIN_LABEL[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sous-type</Label>
                <Input value={subType} onChange={(e) => setSubType(e.target.value)} placeholder="Ex : P95, Charge maximale, RPO…" />
              </div>
              <div>
                <Label>Métrique</Label>
                <Input value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="Ex : Temps de réponse, Utilisateurs simulés…" />
              </div>
              <div>
                <Label>Unité</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex : ms, u, min…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Opérateur</Label>
                  <Select value={operator} onValueChange={(v) => setOperator(v as "<=" | ">=")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<=">≤</SelectItem>
                      <SelectItem value=">=">≥</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Seuil</Label>
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!title.trim()}
                onClick={() => {
                  addNF({
                    productId,
                    title,
                    domain,
                    subType,
                    metric,
                    unit,
                    threshold,
                    operator,
                    measured: 0,
                    status: "planifie",
                  });
                  setTitle("");
                  setSubType("");
                  setMetric("");
                  setUnit("");
                  setThreshold(0);
                  toast.success("Test non-fonctionnel créé.");
                  setOpen(false);
                }}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(NF_DOMAIN_LABEL) as NFDomain[]).map((d) => (
          <KpiCard
            key={d}
            label={NF_DOMAIN_LABEL[d]}
            value={`${okCount(d)}/${allCount(d)}`}
            tone={allCount(d) > 0 && okCount(d) < allCount(d) ? "danger" : "success"}
            icon={DOMAIN_ICON[d]}
            hint={NF_DOMAIN_ICON_HINT[d]}
          />
        ))}
      </div>

      <Panel title="Tableau des tests non-fonctionnels">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Domaine</TableHead>
              <TableHead>Titre / Sous-type</TableHead>
              <TableHead>Seuil</TableHead>
              <TableHead>Mesuré</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Suppr.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nonFunctional.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="num font-medium">{n.id}</TableCell>
                <TableCell className="text-sm">{productName(n.productId)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    {DOMAIN_ICON[n.domain]} {NF_DOMAIN_LABEL[n.domain]}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.metric} · {n.subType}</p>
                </TableCell>
                <TableCell className="num text-sm">
                  {operatorLabel(n.operator)} {n.threshold} {n.unit}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      className="h-8 w-24"
                      value={n.measured}
                      onChange={(e) => {
                        updateNF(n.id, { measured: Number(e.target.value), status: "realise" });
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{n.unit}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {conforms(n) ? (
                      <><CheckCircle2 className="size-4 text-success" /> Conforme</>
                    ) : (
                      <><XCircle className="size-4 text-danger" /> Non conforme</>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {n.status === "planifie" ? "Planifié" : n.status === "realise" ? "Réalisé" : "Échoué"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      deleteNF(n.id);
                      toast.success("Test non-fonctionnel supprimé.");
                    }}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {nonFunctional.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Aucun test non-fonctionnel. Cliquez sur « Nouveau test non-fonctionnel ».
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
