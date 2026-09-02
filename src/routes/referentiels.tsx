import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel, QualityBar } from "@/components/dhi/indicators";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RULE_LEVEL_LABEL,
  SCORE_LABELS,
  SCORE_WEIGHTS,
  TEST_TYPES,
  type RuleLevel,
  type ScoreBreakdown,
} from "@/lib/dhi-data";
import { SYSTEM_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/referentiels")({
  head: () => ({
    meta: [{ title: "Référentiels & règles — DHI Quality Platform" }],
  }),
  component: ReferentialsPage,
});

function ReferentialsPage() {
  const { t } = useI18n();
  const {
    rules,
    updateRule,
    criteria,
    typeRules,
    updateCriterion,
    addCriterion,
    deleteCriterion,
    updateTypeRule,
  } = useStore();
  const active = rules.filter((r) => r.active).length;

  const [critOpen, setCritOpen] = useState(false);
  const [critLabel, setCritLabel] = useState("");
  const [critWeight, setCritWeight] = useState(10);
  const [critBlocking, setCritBlocking] = useState(false);

  const totalWeight = criteria.reduce((s, c) => s + c.weight * 100, 0);

  return (
    <AppShell
      title={t("pages.referentials.title")}
      subtitle={t("pages.referentials.subtitle")}
      breadcrumb={t("pages.referentials.breadcrumb")}
      tabs={SYSTEM_TABS}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={t("pages.referentials.rules")}
          value={rules.length}
          hint={t("pages.referentials.global_scope")}
        />
        <KpiCard
          label={t("pages.referentials.active")}
          value={active}
          tone="success"
          hint={t("pages.referentials.applied_in_calc")}
        />
        <KpiCard
          label={t("pages.referentials.inactive")}
          value={rules.length - active}
          hint={t("pages.referentials.kept_unused")}
        />
      </div>

      <Panel title={t("pages.referentials.score_comp")}>
        <ul className="space-y-3">
          {(Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdown)[]).map((key) => (
            <li key={key}>
              <div className="flex justify-between text-sm">
                <span>{SCORE_LABELS[key]}</span>
                <span className="num text-muted-foreground">
                  {Math.round(SCORE_WEIGHTS[key] * 100)} %
                </span>
              </div>
              <QualityBar value={SCORE_WEIGHTS[key] * 100} className="mt-1" />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("pages.referentials.blocking_criterion")}
        </p>
      </Panel>

      <div className="panel overflow-hidden">
        <div className="flex h-11 items-center border-b border-border bg-subtle px-4">
          <h2 className="text-[13px] font-semibold tracking-tight">
            {t("pages.referentials.operational_rules")}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t("pages.referentials.domain")}</TableHead>
              <TableHead>{t("pages.referentials.rule")}</TableHead>
              <TableHead>{t("pages.referentials.threshold")}</TableHead>
              <TableHead className="text-right">{t("pages.referentials.active_short")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num font-medium">{r.id}</TableCell>
                <TableCell className="text-sm">{r.domain}</TableCell>
                <TableCell className="text-sm">{r.label}</TableCell>
                <TableCell className="text-sm">
                  {["RG-1", "RG-2", "RG-3"].includes(r.id) ? (
                    <div className="flex items-center gap-2">
                      <Input
                        defaultValue={r.threshold}
                        className="h-8 w-32 text-sm"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== r.threshold) {
                            updateRule(r.id, { threshold: v });
                            toast.success(`${r.id} seuil mis à jour : ${v}`);
                          }
                        }}
                      />
                      <span className="text-[11px] text-muted-foreground">{t("pages.referentials.editable")}</span>
                    </div>
                  ) : (
                    <span className="num text-sm">{r.threshold}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={r.active}
                    onCheckedChange={(v) => {
                      updateRule(r.id, { active: v });
                      toast.success(
                        `${r.id} ${v ? t("pages.referentials.enabled") : t("pages.referentials.disabled")}.`,
                      );
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Panel
        title="Référentiel des critères qualité pondérés"
        actions={
          <Dialog open={critOpen} onOpenChange={setCritOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Ajouter un critère
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau critère qualité</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Libellé</Label>
                  <Input value={critLabel} onChange={(e) => setCritLabel(e.target.value)} placeholder="Ex : Accessibilité" />
                </div>
                <div>
                  <Label>Pondération (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={critWeight}
                    onChange={(e) => setCritWeight(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={critBlocking} onCheckedChange={setCritBlocking} />
                  <span className="text-sm">Critère bloquant (bloque le Go/No-Go en cas d'échec)</span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!critLabel.trim()}
                  onClick={() => {
                    addCriterion({
                      key: `custom-${Date.now()}`,
                      label: critLabel,
                      weight: critWeight / 100,
                      blocking: critBlocking,
                      active: true,
                      scope: "product",
                    });
                    setCritLabel("");
                    setCritWeight(10);
                    setCritBlocking(false);
                    toast.success("Critère ajouté.");
                    setCritOpen(false);
                  }}
                >
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        <ul className="space-y-3">
          {criteria.map((c) => (
            <li key={c.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>{c.label}</span>
                  {c.blocking && (
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                      bloquant
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(c.weight * 100)}
                    onChange={(e) =>
                      updateCriterion(c.id, { weight: Number(e.target.value) / 100 })
                    }
                    className="h-8 w-20 text-right"
                  />
                  <span className="num text-muted-foreground">%</span>
                  <Switch
                    checked={c.blocking}
                    onCheckedChange={(v) => updateCriterion(c.id, { blocking: v })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => deleteCriterion(c.id)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <QualityBar value={c.weight * 100} className="mt-1" />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Somme des pondérations : <span className="num font-medium">{Math.round(totalWeight)} %</span>.
          Un critère marqué "bloquant" conditionne la décision de mise en production indépendamment de son
          poids (cahier des charges §9, BF-010/011/012/013).
        </p>
      </Panel>

      <div className="panel overflow-hidden">
        <div className="flex h-11 items-center border-b border-border bg-subtle px-4">
          <h2 className="text-[13px] font-semibold tracking-tight">
            Règles par type de test (BF-040)
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Règle</TableHead>
              <TableHead>Niveau</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeRules.map((r) => {
              const typeLabel = TEST_TYPES.find((tt) => tt.id === r.testType)?.label ?? r.testType;
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{typeLabel}</TableCell>
                  <TableCell className="text-sm">{r.label}</TableCell>
                  <TableCell>
                    <select
                      className="h-8 rounded-md border border-border bg-card px-2 text-sm"
                      value={r.level}
                      onChange={(e) =>
                        updateTypeRule(r.id, { level: e.target.value as RuleLevel })
                      }
                    >
                      {Object.entries(RULE_LEVEL_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
