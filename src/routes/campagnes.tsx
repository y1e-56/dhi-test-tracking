import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { QualityBar, StatusBadge } from "@/components/dhi/indicators";
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
import { PEOPLE, type CampaignStatus } from "@/lib/dhi-data";
import { campaignStats, useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/campagnes")({
  head: () => ({
    meta: [
      { title: "Campagnes de tests — DHI Quality Platform" },
      {
        name: "description",
        content: "Créer, planifier et suivre les campagnes de tests : avancement, taux de réussite et environnements.",
      },
      { property: "og:title", content: "Campagnes de tests — DHI Quality Platform" },
      { property: "og:description", content: "Suivi des campagnes de tests et de leur avancement." },
    ],
  }),
  component: CampaignsPage,
});

const CAMPAIGN_TYPES = ["Recette", "Régression", "Sécurité", "Performance", "Exploratoire"];
const ENVIRONMENTS = ["RECETTE", "PREPROD", "DEV", "PROD"];

function CampaignsPage() {
  const { campaigns, tests, products, addCampaign } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Recette",
    productId: "p-paiement",
    version: "4.13",
    environment: "RECETTE",
    owner: "Marie Martin",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    clone: true,
    cloneFrom: "c-recette-412",
    testers: new Set<string>(["Marie Martin"]),
  });

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Le nom de la campagne est requis.");
      return;
    }
    const id = addCampaign(
      {
        productId: form.productId,
        name: form.name.trim(),
        type: form.type,
        version: form.version,
        environment: form.environment,
        owner: form.owner,
        status: "planifiee" as CampaignStatus,
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        testers: [...form.testers],
      },
      form.clone ? form.cloneFrom : undefined,
    );
    toast.success(`Campagne « ${form.name.trim()} » créée.`);
    setOpen(false);
    navigate({ to: "/campagnes/$campaignId", params: { campaignId: id } });
  };

  return (
    <AppShell
      title="Campagnes de tests"
      subtitle="Créer, gérer et suivre les campagnes"
      breadcrumb={["Exécution", "Campagnes"]}
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nouvelle campagne
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Campagnes" value={campaigns.length} hint="Toutes versions" />
        <KpiCard
          label="En cours"
          value={campaigns.filter((c) => c.status === "encours").length}
          tone="info"
          hint="Exécution active"
        />
        <KpiCard
          label="Planifiées"
          value={campaigns.filter((c) => c.status === "planifiee" || c.status === "avenir").length}
          hint="À démarrer"
        />
        <KpiCard
          label="Exécution moyenne"
          value={`${avgExecution} %`}
          tone={avgExecution >= 85 ? "success" : avgExecution >= 60 ? "warning" : "danger"}
          hint="Tous périmètres"
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex h-11 items-center justify-between gap-2 border-b border-border bg-subtle px-4">
          <h2 className="text-[13px] font-semibold tracking-tight">Toutes les campagnes</h2>
          <p className="label-eyebrow">{campaigns.length} entrées</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campagne</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>État</TableHead>
              <TableHead className="w-56">Avancement</TableHead>
              <TableHead className="text-right">Réussite</TableHead>
              <TableHead>Responsable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => {
              const st = campaignStats(tests, c.id);
              const product = products.find((p) => p.id === c.productId);
              return (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ to: "/campagnes/$campaignId", params: { campaignId: c.id } })
                  }
                >
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                  <TableCell className="num">{c.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <QualityBar value={st.executionRate} neutral className="flex-1" />
                      <span className="num w-10 text-right text-sm">{st.executionRate} %</span>
                    </div>
                  </TableCell>
                  <TableCell className="num text-right">
                    {st.executionRate > 0 ? `${st.successRate} %` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{c.owner}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer une campagne</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="c-name">Nom</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex. Recette v4.13"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Label htmlFor="c-version">Version</Label>
                <Input
                  id="c-version"
                  value={form.version}
                  onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Environnement</Label>
                <Select
                  value={form.environment}
                  onValueChange={(v) => setForm((f) => ({ ...f, environment: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENTS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Responsable</Label>
                <Select
                  value={form.owner}
                  onValueChange={(v) => setForm((f) => ({ ...f, owner: v }))}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="c-start">Date de début</Label>
                <Input
                  id="c-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-end">Date de fin</Label>
                <Input
                  id="c-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="rounded-md border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={form.clone}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, clone: !!v }))}
                />
                Recréer les tests depuis une campagne existante
              </label>
              {form.clone ? (
                <Select
                  value={form.cloneFrom}
                  onValueChange={(v) => setForm((f) => ({ ...f, cloneFrom: v }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>Testeurs affectés</Label>
              <div className="grid grid-cols-2 gap-2">
                {PEOPLE.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.testers.has(p)}
                      onCheckedChange={(checked) =>
                        setForm((f) => {
                          const next = new Set(f.testers);
                          if (checked) next.add(p);
                          else next.delete(p);
                          return { ...f, testers: next };
                        })
                      }
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Créer la campagne</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
