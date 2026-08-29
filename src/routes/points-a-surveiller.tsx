import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/dhi-store";
import {
  PEOPLE,
  WATCH_LEVEL_LABEL,
  WATCH_STATUS_LABEL,
  type WatchLevel,
  type WatchStatus,
} from "@/lib/dhi-data";

export const Route = createFileRoute("/points-a-surveiller")({
  head: () => ({
    meta: [
      { title: "Points à surveiller — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Registre des points de vigilance qualité : dettes techniques, zones fragiles et risques à suivre avant mise en production.",
      },
      { property: "og:title", content: "Points à surveiller — DHI Quality Platform" },
      { property: "og:description", content: "Registre des risques qualité et de leur suivi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WatchPointsPage,
});

const LEVEL_STYLE: Record<WatchLevel, string> = {
  critique: "border-danger/30 bg-danger-soft text-danger",
  vigilance: "border-warning/40 bg-warning-soft text-warning",
  info: "border-border bg-secondary text-secondary-foreground",
};

const COLUMNS: WatchStatus[] = ["ouvert", "suivi", "clos"];

function WatchPointsPage() {
  const { watchPoints, products, addWatchPoint, updateWatchPoint } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    productId: products[0]?.id ?? "",
    level: "vigilance" as WatchLevel,
    owner: PEOPLE[0] ?? "",
  });

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Le titre du point est requis.");
      return;
    }
    addWatchPoint({
      productId: form.productId,
      title: form.title.trim(),
      description: form.description,
      level: form.level,
      status: "ouvert",
      owner: form.owner,
    });
    toast.success("Point à surveiller enregistré.");
    setOpen(false);
    setForm({ ...form, title: "", description: "" });
  };

  return (
    <AppShell
      title="Points à surveiller"
      subtitle="Risques et zones fragiles à suivre jusqu'à clôture"
      breadcrumb={["Décision", "Points à surveiller"]}
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nouveau point
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Points suivis" value={watchPoints.length} hint="Tous produits" />
        <KpiCard
          label="Critiques ouverts"
          value={watchPoints.filter((w) => w.level === "critique" && w.status !== "clos").length}
          tone="danger"
          hint="Bloquants Go Live"
        />
        <KpiCard
          label="En cours de suivi"
          value={watchPoints.filter((w) => w.status === "suivi").length}
          tone="info"
          hint="Avec plan d'action"
        />
        <KpiCard
          label="Clos"
          value={watchPoints.filter((w) => w.status === "clos").length}
          tone="success"
          hint="Risque levé"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = watchPoints.filter((w) => w.status === col);
          return (
            <Panel
              key={col}
              title={WATCH_STATUS_LABEL[col]}
              actions={<span className="label-eyebrow">{items.length}</span>}
            >
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucun point.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((w) => (
                    <li key={w.id} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{w.title}</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
                            LEVEL_STYLE[w.level],
                          )}
                        >
                          {WATCH_LEVEL_LABEL[w.level]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{w.description}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="num text-xs text-muted-foreground/80">
                          {products.find((p) => p.id === w.productId)?.name ?? "—"} · {w.owner}
                        </p>
                        <Select
                          value={w.status}
                          onValueChange={(v) => {
                            updateWatchPoint(w.id, { status: v as WatchStatus });
                            toast.success(
                              `${w.title} → ${WATCH_STATUS_LABEL[v as WatchStatus]}.`,
                            );
                          }}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMNS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {WATCH_STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau point à surveiller</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="w-title">Titre</Label>
              <Input
                id="w-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex. Latence du webhook marchand"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="w-desc">Description</Label>
              <Textarea
                id="w-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
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
                <Label>Niveau</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) => setForm((f) => ({ ...f, level: v as WatchLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(WATCH_LEVEL_LABEL) as WatchLevel[]).map((l) => (
                      <SelectItem key={l} value={l}>
                        {WATCH_LEVEL_LABEL[l]}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
