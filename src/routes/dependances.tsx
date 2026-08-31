import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowDown, ArrowRight, Ban, Link2, Plus, ShieldAlert, Trash2 } from "lucide-react";
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
import { DEPENDENCY_LABEL, type DependencyKind } from "@/lib/dhi-data";
import { EXECUTION_TABS } from "@/lib/dhi-nav";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/dependances")({
  head: () => ({ meta: [{ title: "Dépendances & graphe de tests — DHI Quality Platform" }] }),
  component: DependenciesPage,
});

const KINDS: DependencyKind[] = [
  "before",
  "after",
  "requires_success",
  "blocks",
  "depends_functionally",
];

function DependenciesPage() {
  const { dependencies, tests, addDependency, deleteDependency } = useStore();

  const [open, setOpen] = useState(false);
  const [fromId, setFromId] = useState(tests[0]?.id ?? "");
  const [toId, setToId] = useState(tests[1]?.id ?? "");
  const [kind, setKind] = useState<DependencyKind>("requires_success");
  const [rationale, setRationale] = useState("");

  const nameOf = (id: string) => tests.find((t) => t.id === id)?.name ?? id;
  const idOf = (id: string) => tests.find((t) => t.id === id)?.id ?? id;

  const chains = dependencies.filter((d) => d.kind === "requires_success" || d.kind === "before");

  return (
    <AppShell
      title="Dépendances & graphe de tests"
      subtitle="Graphe et ordre d'exécution des tests (cahier des charges §20)."
      breadcrumb="Exécution"
      tabs={EXECUTION_TABS}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Dépendances" value={dependencies.length} icon={<Link2 className="size-4" />} />
        <KpiCard
          label="Liens bloquants"
          value={dependencies.filter((d) => d.kind === "blocks").length}
          tone="danger"
          icon={<Ban className="size-4" />}
        />
        <KpiCard
          label="Nécessite réussite"
          value={dependencies.filter((d) => d.kind === "requires_success").length}
          tone="warning"
          icon={<ShieldAlert className="size-4" />}
        />
      </div>

      <div className="mb-4 flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Nouvelle dépendance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle dépendance entre tests</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Test source (depuis)</Label>
                <Select value={fromId} onValueChange={setFromId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tests.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.id} — {t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Test cible (vers)</Label>
                <Select value={toId} onValueChange={setToId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tests.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.id} — {t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type de lien</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as DependencyKind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k} value={k}>{DEPENDENCY_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Justification</Label>
                <Input value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Pourquoi cette dépendance ?" />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!fromId || !toId || fromId === toId}
                onClick={() => {
                  addDependency({ fromTestId: fromId, toTestId: toId, kind, rationale });
                  setRationale("");
                  toast.success("Dépendance ajoutée.");
                  setOpen(false);
                }}
              >
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Panel title="Vue graphe — ordre d'exécution recommandé">
        <div className="flex flex-wrap items-center gap-2">
          {chains.map((d, i) => (
            <div key={d.id} className="flex items-center gap-2">
              {i > 0 && <ArrowDown className="size-4 text-muted-foreground" />}
              <Link to="/execution/$testId" params={{ testId: idOf(d.fromTestId) }} className="rounded-md border border-border bg-subtle px-3 py-1.5 text-sm font-medium hover:bg-muted">
                {idOf(d.fromTestId).replace("TC-", "")}
              </Link>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Link to="/execution/$testId" params={{ testId: idOf(d.toTestId) }} className="rounded-md border border-border bg-subtle px-3 py-1.5 text-sm font-medium hover:bg-muted">
                {idOf(d.toTestId).replace("TC-", "")}
              </Link>
            </div>
          ))}
          {chains.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun lien d'ordre défini pour l'instant.</p>
          )}
        </div>
      </Panel>

      <div className="panel overflow-hidden">
        <div className="flex h-11 items-center border-b border-border bg-subtle px-4">
          <h2 className="text-[13px] font-semibold tracking-tight">Liste des dépendances</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Lien</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead>Justification</TableHead>
              <TableHead className="text-right">Suppr.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dependencies.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="num font-medium">{d.id}</TableCell>
                <TableCell className="text-sm">{idOf(d.fromTestId)} · {nameOf(d.fromTestId)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-subtle px-2 py-0.5 text-xs">
                    {DEPENDENCY_LABEL[d.kind]}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{idOf(d.toTestId)} · {nameOf(d.toTestId)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.rationale || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      deleteDependency(d.id);
                      toast.success("Dépendance supprimée.");
                    }}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
