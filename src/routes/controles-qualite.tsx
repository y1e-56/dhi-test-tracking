import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, Plus, Trash2, XCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SYSTEM_TABS } from "@/lib/dhi-nav";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/controles-qualite")({
  head: () => ({ meta: [{ title: "Contrôles qualité & audits — DHI Quality Platform" }] }),
  component: QualityControlsPage,
});

type ControlStatus = "realise" | "encours" | "planifie";

const STATUS_LABEL: Record<string, string> = {
  realise: "Réalisé",
  encours: "En cours",
  planifie: "Planifié",
};

function QualityControlsPage() {
  const { controls, products, addControl, updateControl, deleteControl } = useStore();

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [expected, setExpected] = useState("");
  const [observed, setObserved] = useState("");
  const [conform, setConform] = useState(true);
  const [owner, setOwner] = useState("Marie Martin");
  const [status, setStatus] = useState<ControlStatus>("encours");

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  return (
    <AppShell
      title="Contrôles qualité & audits"
      subtitle="Audits et contrôles périodiques de conformité (cahier des charges §5 — Contrôle qualité)."
      breadcrumb="Système"
      tabs={SYSTEM_TABS}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Contrôles" value={controls.length} icon={<ClipboardCheck className="size-4" />} />
        <KpiCard
          label="Conformes"
          value={controls.filter((c) => c.conform).length}
          tone="success"
          icon={<CheckCircle2 className="size-4" />}
        />
        <KpiCard
          label="Non conformes"
          value={controls.filter((c) => !c.conform).length}
          tone="danger"
          icon={<XCircle className="size-4" />}
        />
      </div>

      <div className="mb-4 flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Nouveau contrôle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau contrôle qualité</DialogTitle>
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
                <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Ex : Régression, Sécurité…" />
              </div>
              <div>
                <Label>Résultat attendu</Label>
                <Textarea value={expected} onChange={(e) => setExpected(e.target.value)} />
              </div>
              <div>
                <Label>Résultat observé</Label>
                <Textarea value={observed} onChange={(e) => setObserved(e.target.value)} />
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ControlStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsable</Label>
                <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!title.trim()}
                onClick={() => {
                  addControl({
                    productId,
                    title,
                    domain,
                    expected,
                    observed,
                    conform,
                    owner,
                    date: new Date().toISOString().slice(0, 10),
                    status,
                  });
                  setTitle("");
                  setDomain("");
                  setExpected("");
                  setObserved("");
                  toast.success("Contrôle créé.");
                  setOpen(false);
                }}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Panel title="Contrôles récents">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Titre / Domaine</TableHead>
              <TableHead>Conformité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Suppr.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {controls.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="num font-medium">{c.id}</TableCell>
                <TableCell className="text-sm">{productName(c.productId)}</TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.domain}</p>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={c.conform ? "text-success" : "text-danger"}
                    onClick={() => {
                      updateControl(c.id, { conform: !c.conform });
                      toast.success("Conformité mise à jour.");
                    }}
                  >
                    {c.conform ? (
                      <><CheckCircle2 className="size-4" /> Conforme</>
                    ) : (
                      <><XCircle className="size-4" /> Non conforme</>
                    )}
                  </Button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {STATUS_LABEL[c.status] ?? c.status}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      deleteControl(c.id);
                      toast.success("Contrôle supprimé.");
                    }}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
