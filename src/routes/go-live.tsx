/* ==============================
   1. Imports
   ============================== */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GOLIVE_VERDICT_LABEL, PEOPLE, type GoLiveVerdict } from "@/lib/dhi-data";
import { DECISION_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { campaignStats, useStore } from "@/lib/dhi-store";
import { cn } from "@/lib/utils";

/* ==============================
   2. Helpers / utilitaires
   ============================== */

/* ==============================
   3. Sous-composants
   ============================== */

/* ==============================
   4. Composant Route principal
   ============================== */
function GoLivePage() {
  const { t } = useI18n();
  const {
    products,
    projects,
    releases,
    campaigns,
    tests,
    defects,
    goLiveChecklist,
    goLiveDecisions,
    toggleChecklistItem,
    addGoLiveDecision,
  } = useStore();

  const pending = releases.filter((r) => r.status !== "livree");
  const [releaseId, setReleaseId] = useState(pending[0]?.id ?? releases[0]?.id ?? "");
  const [verdict, setVerdict] = useState<GoLiveVerdict>("GO");
  const [decider, setDecider] = useState("Jean Dupont");
  const [justification, setJustification] = useState("");

  const release = releases.find((r) => r.id === releaseId);
  const project = projects.find((p) => p.id === release?.projectId);
  const product = products.find((p) => p.id === project?.productId);
  const checklist = goLiveChecklist[releaseId] ?? [];
  const doneWeight = checklist.filter((i) => i.checked).reduce((s, i) => s + i.weight, 0);
  const totalWeight = checklist.reduce((s, i) => s + i.weight, 0) || 1;
  const completion = Math.round((doneWeight / totalWeight) * 100);

  const projCampaigns = campaigns.filter((c) => c.projectId === project?.id);
  const failedCritical = tests.filter(
    (t) =>
      projCampaigns.some((c) => c.id === t.campaignId) &&
      t.verdict === "FAIL" &&
      t.criticality === "critique",
  );
  const openHigh = defects.filter(
    (d) => d.productId === product?.id && d.status !== "fermee" && d.severity === "haute",
  );
  const execAvg = projCampaigns.length
    ? Math.round(
        projCampaigns.reduce((s, c) => s + campaignStats(tests, c.id).executionRate, 0) /
          projCampaigns.length,
      )
    : 0;

  const gates = useMemo(
    () => [
      {
        ok: failedCritical.length === 0,
        label: t("pages.go_live.no_critical_fail"),
        detail: failedCritical.length
          ? t("pages.go_live.test_count").replace("{count}", String(failedCritical.length))
          : "OK",
      },
      {
        ok: openHigh.length === 0,
        label: t("pages.go_live.no_high_open"),
        detail: openHigh.length
          ? t("pages.go_live.open_count").replace("{count}", String(openHigh.length))
          : "OK",
      },
      {
        ok: execAvg >= 95 || projCampaigns.length === 0,
        label: t("pages.go_live.exec_campaigns"),
        detail: `${execAvg} %`,
      },
    ],
    [failedCritical.length, openHigh.length, execAvg, projCampaigns.length, t],
  );
  const blocked = gates.some((g) => !g.ok);

  const decide = () => {
    if (!releaseId) {
      toast.error(t("pages.go_live.select_release"));
      return;
    }
    if (!justification.trim()) {
      toast.error(t("pages.go_live.justification_required"));
      return;
    }
    if (verdict === "GO" && blocked) {
      toast.error(t("pages.go_live.gate_blocked"));
      return;
    }
    addGoLiveDecision(releaseId, verdict, decider, justification.trim());
    toast.success(`${t("pages.go_live.decision_saved")} ${GOLIVE_VERDICT_LABEL[verdict]}.`);
    setJustification("");
  };

  const history = goLiveDecisions.filter((d) => (release ? d.releaseId === release.id : true));

  return (
    <AppShell
      title={t("pages.go_live.title")}
      subtitle={t("pages.go_live.subtitle")}
      breadcrumb={t("pages.go_live.breadcrumb")}
      tabs={DECISION_TABS}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("pages.go_live.pending_releases")}
          value={pending.length}
          hint={t("pages.go_live.not_delivered")}
        />
        <KpiCard
          label={t("pages.go_live.checklist")}
          value={`${completion} %`}
          tone={completion >= 85 ? "success" : completion >= 50 ? "warning" : "danger"}
          hint={t("pages.go_live.current_session")}
        />
        <KpiCard
          label={t("pages.go_live.blocking_gates")}
          value={gates.filter((g) => !g.ok).length}
          tone={blocked ? "danger" : "success"}
          hint={t("pages.go_live.independent_score")}
        />
        <KpiCard
          label={t("pages.go_live.decisions")}
          value={goLiveDecisions.length}
          hint={t("pages.go_live.historized")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("pages.go_live.session")} className="lg:col-span-1">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>{t("pages.go_live.release")}</Label>
              <Select value={releaseId} onValueChange={setReleaseId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("pages.go_live.choose")} />
                </SelectTrigger>
                <SelectContent>
                  {releases.map((r) => {
                    const pr = projects.find((p) => p.id === r.projectId);
                    return (
                      <SelectItem key={r.id} value={r.id}>
                        {r.version} — {pr?.name ?? r.projectId}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t("pages.go_live.product")}</dt>
                <dd className="font-medium">
                  {product ? (
                    <Link
                      to="/produits/$productId"
                      params={{ productId: product.id }}
                      className="text-primary hover:underline"
                    >
                      {product.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t("pages.go_live.project")}</dt>
                <dd className="font-medium">
                  {project ? (
                    <Link
                      to="/projets/$projectId"
                      params={{ projectId: project.id }}
                      className="text-primary hover:underline"
                    >
                      {project.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t("pages.go_live.environment")}</dt>
                <dd>{release?.environment ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </Panel>

        <Panel title={t("pages.go_live.blocking_gates_title")} className="lg:col-span-2">
          <ul className="space-y-2">
            {gates.map((g) => (
              <li
                key={g.label}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                  g.ok ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft",
                )}
              >
                <span>{g.label}</span>
                <span className="num font-medium">{g.detail}</span>
              </li>
            ))}
          </ul>
          {failedCritical[0] ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("pages.go_live.example")} :{" "}
              <Link
                to="/execution/$testId"
                params={{ testId: failedCritical[0].id }}
                className="text-primary hover:underline"
              >
                {failedCritical[0].id}
              </Link>
            </p>
          ) : null}
        </Panel>
      </div>

      <Panel title={t("pages.go_live.validation_checklist")}>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-md border border-border px-3 py-2"
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleChecklistItem(releaseId, item.id)}
                className="mt-0.5"
              />
              <div className="flex min-w-0 flex-1 justify-between gap-2 text-sm">
                <span>{item.label}</span>
                <span className="num shrink-0 text-muted-foreground">{item.weight} %</span>
              </div>
            </li>
          ))}
          {checklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("pages.go_live.no_checklist")}</p>
          ) : null}
        </ul>
      </Panel>

      <Panel title={t("pages.go_live.save_decision")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>{t("pages.go_live.verdict")}</Label>
            <Select value={verdict} onValueChange={(v) => setVerdict(v as GoLiveVerdict)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GOLIVE_VERDICT_LABEL) as GoLiveVerdict[]).map((v) => (
                  <SelectItem key={v} value={v}>
                    {GOLIVE_VERDICT_LABEL[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("pages.go_live.decider")}</Label>
            <Select value={decider} onValueChange={setDecider}>
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
          <div className="md:col-span-2 grid gap-1.5">
            <Label>{t("pages.go_live.justification")}</Label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              placeholder={t("pages.go_live.justification_placeholder")}
            />
          </div>
        </div>
        <Button className="mt-4" onClick={decide}>
          {t("pages.go_live.record_decision")}
        </Button>
      </Panel>

      <Panel title={t("pages.go_live.history_title")}>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("pages.go_live.no_decision")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0"
              >
                <div>
                  <p className="text-sm font-medium">{GOLIVE_VERDICT_LABEL[d.verdict]}</p>
                  <p className="text-sm text-muted-foreground">{d.justification}</p>
                </div>
                <p className="num text-xs text-muted-foreground">
                  {d.date} · {d.decider} · checklist {d.checklistCompletion} %
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}

export const Route = createFileRoute("/go-live")({
  head: () => ({
    meta: [
      { title: "Go Live Center — DHI Quality Platform" },
      {
        name: "description",
        content: "Sessions de validation Go / No-Go par produit, projet et release.",
      },
    ],
  }),
  component: GoLivePage,
});
