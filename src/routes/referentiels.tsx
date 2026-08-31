import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel, QualityBar } from "@/components/dhi/indicators";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SCORE_LABELS, SCORE_WEIGHTS, type ScoreBreakdown } from "@/lib/dhi-data";
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
  const { rules, updateRule } = useStore();
  const active = rules.filter((r) => r.active).length;

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
                <TableCell className="num text-sm">{r.threshold}</TableCell>
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
    </AppShell>
  );
}
