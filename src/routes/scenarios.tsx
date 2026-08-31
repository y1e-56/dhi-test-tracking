import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, KpiCard, Panel } from "@/components/dhi/indicators";
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
import { CRITICALITY_LABEL, type Criticality } from "@/lib/dhi-data";
import { EXECUTION_TABS } from "@/lib/dhi-nav";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/scenarios")({
  head: () => ({ meta: [{ title: "Scénarios de test — DHI Quality Platform" }] }),
  component: ScenariosPage,
});

const CRITS: Criticality[] = ["critique", "haute", "moyenne", "basse"];

function ScenariosPage() {
  const { scenarios, campaigns, tests, addScenario, deleteScenario, addScenarioTest, removeScenarioTest } =
    useStore();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [criticality, setCriticality] = useState<Criticality>("haute");
  const [owner, setOwner] = useState("Marie Martin");

  const testsByCampaign = (cid: string) => tests.filter((t) => t.campaignId === cid);

  const lastUpdate = scenarios.length ? "Aujourd'hui" : "—";

  return (
    <AppShell
      title="Scénarios de test"
      subtitle="Regroupe les cas de tests en parcours métier ou technique (cahier des charges §6.8)."
      breadcrumb="Exécution"
      tabs={EXECUTION_TABS}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Scénarios" value={scenarios.length} />
        <KpiCard
          label="Critiques"
          value={scenarios.filter((s) => s.criticality === "critique").length}
          tone="danger"
        />
        <KpiCard label="Dernière mise à jour" value={lastUpdate} tone="info" />
      </div>

      <div className="mb-4 flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" /> Nouveau scénario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau scénario de test</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Nom</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Parcours de paiement complet" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du chemin à valider" />
              </div>
              <div>
                <Label>Campagne</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Criticité</Label>
                <Select value={criticality} onValueChange={(v) => setCriticality(v as Criticality)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CRITS.map((c) => (
                      <SelectItem key={c} value={c}>{CRITICALITY_LABEL[c]}</SelectItem>
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
                disabled={!name.trim() || !campaignId}
                onClick={() => {
                  addScenario({ campaignId, name, description, criticality, testIds: [], owner });
                  setName("");
                  setDescription("");
                  toast.success("Scénario créé.");
                  setOpen(false);
                }}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {scenarios.map((s) => {
          const assigned = testsByCampaign(s.campaignId).filter((t) => s.testIds.includes(t.id));
          const available = testsByCampaign(s.campaignId).filter((t) => !s.testIds.includes(t.id));
          return (
            <Panel key={s.id} title={s.name}>
              <div className="mb-2 flex items-center gap-2">
                <CriticalityBadge criticality={s.criticality} />
                <span className="text-xs text-muted-foreground">
                  {s.testIds.length} cas rattachés · {campaigns.find((c) => c.id === s.campaignId)?.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  onClick={() => {
                    deleteScenario(s.id);
                    toast.success("Scénario supprimé.");
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{s.description}</p>

              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cas rattachés
                </p>
                {assigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun cas rattaché.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead className="text-right">Retirer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assigned.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="num">{t.id}</TableCell>
                          <TableCell className="text-sm">
                            <Link to="/execution/$testId" params={{ testId: t.id }} className="hover:underline">
                              {t.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeScenarioTest(s.id, t.id)}
                            >
                              <Trash2 className="size-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cas disponibles
                </p>
                {available.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun cas disponible à rattacher.</p>
                ) : (
                  <Table>
                    <TableBody>
                      {available.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="num">{t.id}</TableCell>
                          <TableCell className="text-sm">{t.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                addScenarioTest(s.id, t.id);
                                toast.success("Cas rattaché.");
                              }}
                            >
                              Associer
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </AppShell>
  );
}
