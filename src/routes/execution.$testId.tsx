import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, Panel, VerdictBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { VERDICT_LABEL, type TestCase, type Verdict } from "@/lib/dhi-data";
import { EXECUTION_TABS } from "@/lib/dhi-nav";

const VERDICTS: Verdict[] = [
  "PASS",
  "PASS_WITH_RESERVATION",
  "FAIL",
  "BLOCKED",
  "NOT_RUN",
  "NOT_APPLICABLE",
];

type DraftState = {
  verdict: Verdict;
  observed: string;
  comment: string;
  measuredValue: string;
};

type CurrentState = DraftState;

function ContextPanel({
  test,
  featureName,
  verdict,
}: {
  test: TestCase;
  featureName: string | undefined;
  verdict: Verdict;
}) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.execution_detail.contexte")}>
      <div className="flex flex-wrap items-center gap-2">
        <CriticalityBadge level={test.criticality} />
        <VerdictBadge verdict={verdict} />
        <span className="text-sm text-muted-foreground">
          {t("common.fonctionnalite")} : {featureName ?? "—"} · {t("common.type")} : {test.type}
        </span>
      </div>
    </Panel>
  );
}

function PreconditionsPanel({ preconditions }: { preconditions: TestCase["preconditions"] }) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.execution_detail.preconditions")}>
      <ul className="list-inside list-disc space-y-1 text-sm">
        {preconditions.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </Panel>
  );
}

function StepsListPanel({ steps }: { steps: TestCase["steps"] }) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.execution_detail.etapes")}>
      <ol className="list-inside list-decimal space-y-1 text-sm">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </Panel>
  );
}

function ExpectedResultsPanel({ expected }: { expected: TestCase["expected"] }) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.execution_detail.resultat_attendu")}>
      <ul className="list-inside list-disc space-y-1 text-sm">
        {expected.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </Panel>
  );
}

function MeasuresPanel({
  expectedValue,
  measuredValue,
  verdict,
  onMeasuredValueChange,
}: {
  expectedValue: string | undefined;
  measuredValue: string;
  verdict: Verdict;
  onMeasuredValueChange: (value: string) => void;
}) {
  const { t } = useI18n();
  if (!expectedValue) return null;
  return (
    <Panel title={t("pages.execution_detail.mesures")}>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("pages.execution_detail.valeur_attendue")}</dt>
          <dd className="num font-medium">{expectedValue}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">{t("pages.execution_detail.valeur_observee")}</dt>
          <input
            className="num w-32 rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
            value={measuredValue}
            onChange={(e) => onMeasuredValueChange(e.target.value)}
            placeholder={t("pages.execution_detail.example_unit_placeholder")}
          />
        </div>
      </dl>
      {measuredValue && verdict === "FAIL" ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-danger-soft px-2 py-1 text-xs font-semibold text-danger">
          <XCircle className="size-3.5" /> {t("pages.execution_detail.non_conforme")}
        </p>
      ) : null}
    </Panel>
  );
}

function ObservedPanel({
  observed,
  onObservedChange,
}: {
  observed: string;
  onObservedChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.execution_detail.comportement_observe")}>
      <Textarea
        rows={4}
        value={observed}
        onChange={(e) => onObservedChange(e.target.value)}
        placeholder={t("pages.execution_detail.observed_placeholder")}
      />
    </Panel>
  );
}

function VerdictPickerPanel({
  verdict,
  comment,
  onVerdictChange,
  onCommentChange,
}: {
  verdict: Verdict;
  comment: string;
  onVerdictChange: (v: Verdict) => void;
  onCommentChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Panel title={t("common.verdict")}>
      <RadioGroup
        value={verdict}
        onValueChange={(v) => onVerdictChange(v as Verdict)}
        className="flex flex-wrap gap-4"
      >
        {VERDICTS.map((v) => (
          <div key={v} className="flex items-center gap-2">
            <RadioGroupItem value={v} id={`v-${v}`} />
            <Label htmlFor={`v-${v}`} className="num font-medium">
              {VERDICT_LABEL[v]}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <Label htmlFor="exec-comment" className="mt-4 block">
        {t("pages.execution_detail.commentaire")}
      </Label>
      <Textarea
        id="exec-comment"
        rows={3}
        className="mt-1.5"
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder={t("pages.execution_detail.comment_placeholder")}
      />
    </Panel>
  );
}

function EvidenceListPanel({
  evidence,
  onAddEvidence,
  onRemoveEvidence,
}: {
  evidence: TestCase["evidence"];
  onAddEvidence: (file: File) => void;
  onRemoveEvidence: (evId: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Panel
      title={t("pages.execution_detail.preuves")}
      actions={
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onAddEvidence(f);
              e.target.value = "";
            }}
          />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Plus className="size-3.5" /> {t("pages.execution_detail.ajouter_preuve")}
          </span>
        </label>
      }
    >
      {evidence.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("pages.execution_detail.aucune_preuve")}</p>
      ) : (
        <ul className="space-y-2">
          {evidence.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              {e.kind === "image" ? (
                <ImageIcon className="size-4 text-info" />
              ) : e.kind === "video" ? (
                <Video className="size-4 text-warning" />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{e.name}</span>
              <span className="num text-xs text-muted-foreground">{e.size}</span>
              <button
                onClick={() => onRemoveEvidence(e.id)}
                className="text-muted-foreground transition-colors hover:text-danger"
                aria-label={`${t("actions.supprimer")} ${e.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DefectsListPanel({
  defects,
  onCreateDefect,
}: {
  defects: ReturnType<typeof useStore>["defects"];
  onCreateDefect: () => void;
}) {
  const { t } = useI18n();
  return (
    <Panel
      title={t("pages.execution_detail.anomalies_detectees")}
      actions={
        <button
          onClick={onCreateDefect}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="size-3.5" /> {t("pages.execution_detail.creer_anomalie")}
        </button>
      }
    >
      {defects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("pages.execution_detail.aucune_anomalie")}
        </p>
      ) : (
        <ul className="space-y-2">
          {defects.map((d) => (
            <li
              key={d.id}
              className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-danger">
                  {d.id} : {d.title}
                </p>
                <Link to="/anomalies" className="text-xs font-medium text-primary hover:underline">
                  {t("pages.execution_detail.detail")}
                </Link>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("pages.execution_detail.gravite")} : {d.severity} ·{" "}
                {t("pages.execution_detail.priorite")} : {d.priority} · {t("common.statut")} :{" "}
                {d.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function TraceabilityPanel({
  test,
  onRestart,
  onSave,
}: {
  test: TestCase;
  onRestart: () => void;
  onSave: () => void;
}) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.execution_detail.traceabilite")}>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t("common.testeur")}</dt>
          <dd className="font-medium">{test.tester ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("common.date")}</dt>
          <dd className="num font-medium">{test.executedAt ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("pages.execution_detail.duree")}</dt>
          <dd className="num font-medium">{test.duration ?? "—"}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onRestart}>
          <RotateCcw className="size-4" /> {t("pages.execution_detail.recommencer")}
        </Button>
        <Button size="sm" onClick={onSave}>
          {t("pages.execution_detail.enregistrer_resultat")}
        </Button>
      </div>
    </Panel>
  );
}

function ExecutionPage() {
  const { testId } = Route.useParams();
  const { t } = useI18n();
  const { tests, features, campaigns, defects, updateTest, addDefect } = useStore();
  const test = tests.find((t) => t.id === testId);
  const feature = features.find((f) => f.id === test?.featureId);
  const campaign = campaigns.find((c) => c.id === test?.campaignId);
  const linkedDefects = defects.filter((d) => d.testId === testId);

  const [draft, setDraft] = useState<DraftState | null>(null);

  if (!test) return null;
  const current: CurrentState = draft ?? {
    verdict: test.verdict,
    observed: test.observed,
    comment: test.comment,
    measuredValue: test.measuredValue ?? "",
  };

  const save = () => {
    const now = new Date();
    updateTest(test.id, {
      verdict: current.verdict,
      observed: current.observed,
      comment: current.comment,
      measuredValue: current.measuredValue || undefined,
      tester: "Marie Martin",
      executedAt: now.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
      duration: test.duration ?? "4 min 10 sec",
    });
    setDraft(null);
    toast.success(
      t("pages.execution_detail.result_saved")
        .replace("{id}", test.id)
        .replace("{verdict}", current.verdict),
    );
  };

  const restart = () => {
    updateTest(test.id, {
      verdict: "NOT_RUN",
      observed: "",
      comment: "",
      measuredValue: undefined,
      tester: undefined,
      executedAt: undefined,
      duration: undefined,
    });
    setDraft(null);
    toast.info(t("pages.execution_detail.execution_reset"));
  };

  const removeEvidence = (evId: string) => {
    updateTest(test.id, { evidence: test.evidence.filter((e) => e.id !== evId) });
    toast.success(t("pages.execution_detail.evidence_removed"));
  };

  const addEvidence = (file: File) => {
    const size =
      file.size > 1_000_000
        ? `${(file.size / 1_000_000).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1000))} KB`;
    const kind = file.type.startsWith("image/")
      ? ("image" as const)
      : file.type.startsWith("video/")
        ? ("video" as const)
        : ("log" as const);
    updateTest(test.id, {
      evidence: [...test.evidence, { id: `e-${Date.now()}`, name: file.name, size, kind }],
    });
    toast.success(t("pages.execution_detail.evidence_added").replace("{name}", file.name));
  };

  const createDefect = () => {
    const id = addDefect({
      productId: campaign?.productId ?? "p-paiement",
      title: t("pages.execution_detail.defect_title_prefix")
        .replace("{id}", test.id)
        .replace("{name}", test.name),
      description: current.observed || t("pages.execution_detail.defect_created_from"),
      severity: test.criticality === "critique" ? "haute" : "moyenne",
      priority: test.criticality === "critique" ? "haute" : "moyenne",
      status: "nouvelle",
      featureId: test.featureId,
      version: campaign?.version ?? "4.12",
      testId: test.id,
      reporter: "Marie Martin",
      assignee: "Pierre Durand",
      createdAt: new Date().toISOString().slice(0, 10),
      targetDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    });
    toast.success(t("pages.execution_detail.defect_created").replace("{id}", id));
  };

  return (
    <AppShell
      title={`${t("pages.execution_detail.title_prefix")} — ${test.id}`}
      subtitle={`${test.name} · ${campaign ? `${campaign.name} · v${campaign.version} · ${campaign.environment}` : ""}`}
      breadcrumb={[
        t("nav.execution"),
        campaign?.name ?? t("pages.execution_detail.breadcrumb"),
        test.id,
      ]}
      tabs={EXECUTION_TABS}
      actions={
        <Link
          to={campaign ? "/campagnes/$campaignId" : "/campagnes"}
          params={campaign ? { campaignId: campaign.id } : {}}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> {t("actions.retour")}
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ContextPanel test={test} featureName={feature?.name} verdict={current.verdict} />
          <PreconditionsPanel preconditions={test.preconditions} />
          <StepsListPanel steps={test.steps} />
          <ExpectedResultsPanel expected={test.expected} />
          <MeasuresPanel
            expectedValue={test.expectedValue}
            measuredValue={current.measuredValue}
            verdict={current.verdict}
            onMeasuredValueChange={(value) =>
              setDraft((d) => ({ ...(d ?? current), measuredValue: value }))
            }
          />
        </div>

        <div className="space-y-4">
          <ObservedPanel
            observed={current.observed}
            onObservedChange={(value) => setDraft((d) => ({ ...(d ?? current), observed: value }))}
          />
          <VerdictPickerPanel
            verdict={current.verdict}
            comment={current.comment}
            onVerdictChange={(v) => setDraft((d) => ({ ...(d ?? current), verdict: v }))}
            onCommentChange={(value) => setDraft((d) => ({ ...(d ?? current), comment: value }))}
          />
          <EvidenceListPanel
            evidence={test.evidence}
            onAddEvidence={addEvidence}
            onRemoveEvidence={removeEvidence}
          />
          <DefectsListPanel defects={linkedDefects} onCreateDefect={createDefect} />
          <TraceabilityPanel test={test} onRestart={restart} onSave={save} />
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/execution/$testId")({
  head: () => ({
    meta: [
      { title: "Exécution de test — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Exécution d'un cas de test : étapes, résultat attendu, preuves, verdict et anomalies.",
      },
      { property: "og:title", content: "Exécution de test — DHI Quality Platform" },
      {
        property: "og:description",
        content: "Enregistrez verdict, preuves et anomalies d'un test.",
      },
    ],
  }),
  component: ExecutionPage,
});
