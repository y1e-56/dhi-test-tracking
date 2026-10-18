import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  FileText,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Trash2,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { EvidenceDownloadButton } from "@/components/dhi/EvidenceDownloadButton";
import { CriticalityBadge, Panel, VerdictBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/dhi-store";
import { isInteractiveClick } from "@/lib/clickable-row";
import { campaignDevelopers } from "@/lib/access";
import { useI18n } from "@/lib/i18n";
import {
  VERDICT_LABEL,
  SEVERITY_LABEL,
  canReportDefect,
  type TestCase,
  type Verdict,
  type Severity,
} from "@/lib/dhi-data";
import { canExecuteTest, canManageCampaign, canManageOperational } from "@/lib/role-protection";
import { defaultCorrectionDate } from "@/lib/rules";
import {
  api,
  ApiError,
  getEvidenceByEntity,
  uploadEvidence,
  deleteEvidence,
  mapBackendTestCase,
  type BackendEvidence,
  type BackendTestExecution,
  type BackendTestCase,
} from "@/lib/api";

const VERDICTS: Verdict[] = [
  "PASS",
  "PASS_WITH_RESERVATION",
  "FAIL",
  "BLOCKED",
  "NOT_RUN",
  "NOT_APPLICABLE",
];

type StepState = "pass" | "fail" | "pending";

type EvidenceItem = TestCase["evidence"][number];

function fileKind(file: File): EvidenceItem["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "log";
}

function formatFileSize(bytes: number): string {
  return bytes > 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function toEvidenceItem(proof: BackendEvidence): EvidenceItem {
  return {
    id: String(proof.id),
    name: proof.file_name ?? "—",
    size: proof.file_size ?? "",
    kind: proof.file_type?.startsWith("image/")
      ? "image"
      : proof.file_type?.startsWith("video/")
        ? "video"
        : "log",
  };
}

type DraftState = {
  verdict: Verdict;
  observed: string;
  comment: string;
  measuredValue: string;
  stepState: StepState[];
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

function StepsListPanel({
  steps,
  states,
  onSetStep,
  readOnly,
}: {
  steps: TestCase["steps"];
  states: StepState[];
  onSetStep: (index: number, state: StepState) => void;
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  const passed = states.filter((s) => s === "pass").length;
  const failed = states.filter((s) => s === "fail").length;
  const pending = steps.length - passed - failed;
  const allPassed = steps.length > 0 && pending === 0 && failed === 0;
  return (
    <Panel
      title={t("pages.execution_detail.etapes")}
      actions={
        readOnly ? null : (
          <button
            type="button"
            onClick={() => steps.forEach((_, i) => onSetStep(i, allPassed ? "pending" : "pass"))}
            className="text-xs font-medium text-primary hover:underline"
          >
            {allPassed
              ? t("pages.execution_detail.tout_reinitialiser")
              : t("pages.execution_detail.tout_valider")}
          </button>
        )
      }
    >
      <ol className="space-y-1.5 text-sm">
        {steps.map((s, i) => {
          const state = states[i] ?? "pending";
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                state === "pass"
                  ? "border-success/40 bg-success-soft/60"
                  : state === "fail"
                    ? "border-danger/40 bg-danger-soft/60"
                    : "border-border bg-subtle/40"
              }`}
            >
              <span className="num w-5 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
              <span
                className={`min-w-0 flex-1 ${
                  state === "pass"
                    ? "text-muted-foreground line-through decoration-success/60"
                    : "text-foreground"
                }`}
              >
                {s}
              </span>
              {readOnly ? (
                <span
                  className={`shrink-0 ${
                    state === "pass"
                      ? "text-success"
                      : state === "fail"
                        ? "text-danger"
                        : "text-muted-foreground"
                  }`}
                  title={
                    state === "pass"
                      ? t("pages.execution_detail.etape_validee")
                      : state === "fail"
                        ? t("pages.execution_detail.etape_echouee")
                        : t("pages.execution_detail.etape_en_attente")
                  }
                >
                  {state === "pass" ? (
                    <Check className="size-4" />
                  ) : state === "fail" ? (
                    <X className="size-4" />
                  ) : (
                    <span className="text-xs">—</span>
                  )}
                </span>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSetStep(i, state === "pass" ? "pending" : "pass")}
                    title={t("pages.execution_detail.etape_validee")}
                    aria-pressed={state === "pass"}
                    className={`inline-flex size-7 items-center justify-center rounded-md border transition-colors ${
                      state === "pass"
                        ? "border-success bg-success text-success-foreground"
                        : "border-border text-muted-foreground hover:border-success hover:text-success"
                    }`}
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetStep(i, state === "fail" ? "pending" : "fail")}
                    title={t("pages.execution_detail.etape_echouee")}
                    aria-pressed={state === "fail"}
                    className={`inline-flex size-7 items-center justify-center rounded-md border transition-colors ${
                      state === "fail"
                        ? "border-danger bg-danger text-white"
                        : "border-border text-muted-foreground hover:border-danger hover:text-danger"
                    }`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        {t("pages.execution_detail.steps_recap")
          .replace("{passed}", String(passed))
          .replace("{failed}", String(failed))
          .replace("{pending}", String(pending))}
      </p>
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
  readOnly,
}: {
  expectedValue: string | undefined;
  measuredValue: string;
  verdict: Verdict;
  onMeasuredValueChange: (value: string) => void;
  readOnly?: boolean;
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
            className="num w-32 rounded-md border border-input bg-background px-2 py-1 text-right text-sm read-only:bg-subtle read-only:text-muted-foreground"
            value={measuredValue}
            readOnly={readOnly}
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
  readOnly,
}: {
  observed: string;
  onObservedChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Panel title={t("pages.execution_detail.comportement_observe")}>
      <Textarea
        rows={4}
        value={observed}
        readOnly={readOnly}
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
  readOnly,
}: {
  verdict: Verdict;
  comment: string;
  onVerdictChange: (v: Verdict) => void;
  onCommentChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Panel title={t("common.verdict")}>
      <RadioGroup
        value={verdict}
        disabled={readOnly}
        onValueChange={(v) => onVerdictChange(v as Verdict)}
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
        readOnly={readOnly}
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
  readOnly,
}: {
  evidence: TestCase["evidence"];
  onAddEvidence: (file: File) => void;
  onRemoveEvidence: (evId: string) => void;
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Panel
      title={t("pages.execution_detail.preuves")}
      actions={
        readOnly ? null : (
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
        )
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
              <EvidenceDownloadButton id={e.id} fileName={e.name} />
              {readOnly ? null : (
                <button
                  onClick={() => onRemoveEvidence(e.id)}
                  className="text-muted-foreground transition-colors hover:text-danger"
                  aria-label={`${t("actions.supprimer")} ${e.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
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
  readOnly,
  canCreate,
}: {
  defects: ReturnType<typeof useStore>["defects"];
  onCreateDefect: () => void;
  readOnly?: boolean;
  /** Verdict enregistre en echec ou bloque : seule condition de declaration. */
  canCreate: boolean;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <Panel
      title={t("pages.execution_detail.anomalies_detectees")}
      actions={
        readOnly || !canCreate ? null : (
          <button
            onClick={onCreateDefect}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="size-3.5" /> {t("pages.execution_detail.creer_anomalie")}
          </button>
        )
      }
    >
      {!readOnly && !canCreate ? (
        <p className="mb-2 text-xs text-muted-foreground">
          {t("pages.execution_detail.defect_needs_failure")}
        </p>
      ) : null}
      {defects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("pages.execution_detail.aucune_anomalie")}
        </p>
      ) : (
        <ul className="space-y-2">
          {defects.map((d) => (
            <li
              key={d.id}
              className="cursor-pointer rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm"
              onClick={(e) => {
                if (isInteractiveClick(e)) return;
                void navigate({ to: "/anomalies/$defectId", params: { defectId: d.id } });
              }}
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
  readOnly,
  readOnlyNote,
}: {
  test: TestCase;
  onRestart: () => void;
  onSave: () => void;
  readOnly?: boolean;
  readOnlyNote: string;
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
      {readOnly ? (
        <p className="mt-4 rounded-md bg-subtle px-3 py-2 text-xs text-muted-foreground">
          {readOnlyNote}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onRestart}>
            <RotateCcw className="size-4" /> {t("pages.execution_detail.recommencer")}
          </Button>
          <Button size="sm" onClick={onSave}>
            {t("pages.execution_detail.enregistrer_resultat")}
          </Button>
        </div>
      )}
    </Panel>
  );
}

function ReassignPanel({
  assigneeId,
  options,
  onReassign,
}: {
  assigneeId: string;
  options: { value: string; label: string }[];
  onReassign: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Panel
      title={t("pages.execution_detail.reassign_title")}
      actions={<VerdictBadge verdict="FAIL" />}
    >
      <p className="mb-3 text-xs text-muted-foreground">
        {t("pages.execution_detail.reassign_hint")}
      </p>
      <Label className="mb-1.5 block text-xs">{t("pages.execution_detail.reassign_label")}</Label>
      <SearchableSelect
        value={assigneeId}
        onValueChange={onReassign}
        options={options}
        placeholder={t("pages.execution_detail.awaiting_assign")}
      />
    </Panel>
  );
}

function ExecutionPage() {
  const { testId } = Route.useParams();
  const { t } = useI18n();
  const { tests, features, campaigns, defects, users, currentUser, updateTest, addDefect, rules } =
    useStore();
  const localTest = tests.find((t) => t.id === testId);
  const [backendTest, setBackendTest] = useState<ReturnType<typeof mapBackendTestCase> | null>(
    null,
  );
  const [executionId, setExecutionId] = useState<string | null>(null);
  useEffect(() => {
    if (!localStorage.getItem("token") || !/^\d+$/.test(testId)) return;
    void (async () => {
      const [testCase, executions] = await Promise.all([
        api<BackendTestCase>(`/test-cases/${testId}`),
        api<BackendTestExecution[]>(`/test-executions/by-test-case/${testId}`),
      ]);
      const execution = executions[0];
      const mapped = mapBackendTestCase(testCase, execution);
      if (!execution) {
        setBackendTest(mapped);
        return;
      }
      setExecutionId(String(execution.id));
      // Les preuves sont rattachees a l'execution, pas au cas de test : sans
      // cet aller-retour, un cas non valide afficherait une liste vide apres
      // rechargement alors que les fichiers sont bien en base.
      const proofs = await getEvidenceByEntity("test_execution", execution.id).catch(() => null);
      setBackendTest({
        ...mapped,
        evidence: (proofs ?? []).map(toEvidenceItem),
      });
    })().catch((error) => console.error("[Execution] Impossible de charger le cas backend", error));
  }, [testId]);
  const test = backendTest ?? localTest;
  const feature = features.find((f) => f.id === test?.featureId);
  const campaign = campaigns.find((c) => c.id === test?.campaignId);
  const linkedDefects = defects.filter((d) => d.testId === testId);

  // Testeurs de la campagne resolus en ids utilisateurs : la colonne backend
  // `assigned_to` est une reference users(id), reaffecter par nom ne serait pas
  // persiste. Meme regle que la liste des cas de test.
  const reassignOptions = useMemo(() => {
    const names = new Set(campaign?.testers ?? []);
    return users
      .filter((user) => names.has(user.name))
      .map((user) => ({ value: user.id, label: user.name }))
      .filter((option) => Number.isInteger(Number(option.value)) && Number(option.value) > 0);
  }, [campaign?.testers, users]);

  const [draft, setDraft] = useState<DraftState | null>(null);
  // Dernier verdict reellement enregistre pendant la session : permet de ne pas
  // afficher d'erreur de separation des responsabilites quand l'utilisateur
  // re-enregistre un verdict identique.
  const lastSavedVerdict = useRef<Verdict | null>(null);
  // Etat de la boite de creation d'anomalie. Declare ici, avec les autres hooks :
  // place apres le `return` conditionnel ci-dessous, il rendrait le nombre de
  // hooks variable d'un rendu a l'autre (Rules of Hooks).
  const [createOpen, setCreateOpen] = useState(false);
  const [draftAnomaly, setDraftAnomaly] = useState<{
    title: string;
    description: string;
    severity: Severity;
    priority: Severity;
    developer: string;
  }>({
    title: "",
    description: "",
    severity: "moyenne",
    priority: "moyenne",
    developer: "",
  });

  if (!test) return null;
  // Un cas reste consultable par les membres de la campagne meme quand celle-ci
  // n'est pas demarree : seule l'execution (verdict, etapes, preuves, resultat)
  // est reservee aux campagnes "encours" et aux roles qui pilotent l'operationnel.
  const readOnly =
    campaign !== undefined && (campaign.status !== "encours" || !canManageOperational());
  // Une fois le verdict enregistre, un testeur ne peut plus rejouer le cas : meme
  // regle que le lien « Executer » de la liste (canExecuteTest), appliquee ici
  // pour que l'acces par clic sur la ligne ne la contourne pas. Seuls les
  // responsables de campagne peuvent encore modifier ou rouvrir l'execution.
  // La declaration d'anomalie reste ouverte : elle suit un verdict FAIL.
  // Un testeur simple n'execute que les cas qui lui sont affectes (ou ceux
  // encore sans affectation) : meme regle que le backend.
  const assignedToOther =
    !canManageCampaign() &&
    test.assignedTo != null &&
    String(test.assignedTo) !== String(currentUser?.id ?? "");
  const executionLocked = readOnly || assignedToOther || !canExecuteTest(test.verdict);
  const current: CurrentState = draft ?? {
    verdict: test.verdict,
    observed: test.observed,
    comment: test.comment,
    measuredValue: test.measuredValue ?? "",
    stepState: test.steps.map(() => (test.verdict === "PASS" ? "pass" : "pending")),
  };

  const setStep = (index: number, state: StepState) => {
    setDraft((d) => {
      const base = d ?? current;
      const next = base.stepState.slice();
      next[index] = state;
      const allPassed = next.length > 0 && next.every((s) => s === "pass");
      const anyFailed = next.some((s) => s === "fail");
      return {
        ...base,
        stepState: next,
        verdict: allPassed ? "PASS" : anyFailed ? "FAIL" : base.verdict,
      };
    });
  };

  const refreshEvidence = async (execId: string) => {
    const proofs = await getEvidenceByEntity("test_execution", Number(execId)).catch(() => null);
    if (!proofs) return;
    setBackendTest((prev) => (prev ? { ...prev, evidence: proofs.map(toEvidenceItem) } : prev));
  };

  // Cree l'execution si elle n'existe pas encore puis renvoie son id. Une
  // preuve peut etre jointe avant tout enregistrement de verdict : on cree
  // alors en "not_run" pour ne pas figer le verdict (le meme membre pourra
  // ensuite le saisir, la separation des responsabilites ne s'appliquant
  // qu'une fois un resultat reel enregistre).
  const ensureExecutionId = async (): Promise<string | null> => {
    if (executionId) return executionId;
    if (!(backendTest && campaign && /^\d+$/.test(campaign.id))) return null;
    const execution = await api<BackendTestExecution>("/test-executions", {
      method: "POST",
      body: JSON.stringify({
        test_case_id: Number(test.id),
        campaign_id: Number(campaign.id),
        result: "not_run",
      }),
    });
    setExecutionId(String(execution.id));
    return String(execution.id);
  };

  // Enregistre le verdict sur l'execution courante. On met a jour l'execution
  // existante au lieu d'en creer une nouvelle : les preuves sont rattachees a
  // une execution precise et la page n'affiche que la plus recente
  // (executions[0]). Un nouveau POST a chaque enregistrement orphelinait donc
  // les preuves deja envoyees.
  const persistExecution = async (): Promise<string | null> => {
    if (!(backendTest && campaign && /^\d+$/.test(campaign.id))) return null;
    const result = (
      {
        PASS: "passed",
        PASS_WITH_RESERVATION: "passed",
        FAIL: "failed",
        BLOCKED: "blocked",
        NOT_RUN: "not_run",
        NOT_APPLICABLE: "skipped",
      } as const
    )[current.verdict];
    const notes = current.comment || undefined;
    const actualBehavior = current.observed || undefined;
    const expectedBehavior = test.expected.join("\n") || undefined;
    if (executionId) {
      await api<BackendTestExecution>(`/test-executions/${executionId}`, {
        method: "PUT",
        body: JSON.stringify({
          result,
          notes,
          actual_behavior: actualBehavior,
          expected_behavior: expectedBehavior,
        }),
      });
      await refreshEvidence(executionId);
      return executionId;
    }
    const execution = await api<BackendTestExecution>("/test-executions", {
      method: "POST",
      body: JSON.stringify({
        test_case_id: Number(test.id),
        campaign_id: Number(campaign.id),
        result,
        notes,
        actual_behavior: actualBehavior,
        expected_behavior: expectedBehavior,
      }),
    });
    setExecutionId(String(execution.id));
    await refreshEvidence(String(execution.id));
    return String(execution.id);
  };

  const save = async () => {
    const now = new Date();
    const nextVerdict = current.verdict;
    if (backendTest && campaign && /^\d+$/.test(campaign.id)) {
      try {
        await persistExecution();
        lastSavedVerdict.current = nextVerdict;
      } catch (error) {
        // Re-enregistrer un verdict deja enregistre par soi-meme est refuse par
        // la separation des responsabilites : ce n'est pas une erreur bloquante,
        // la base est deja a jour.
        const alreadySaved =
          error instanceof ApiError &&
          error.status === 403 &&
          (lastSavedVerdict.current === nextVerdict || test.verdict === nextVerdict);
        if (!alreadySaved) {
          toast.error(
            error instanceof Error ? error.message : "Impossible d'enregistrer l'exécution",
          );
          return;
        }
      }
    }
    updateTest(test.id, {
      verdict: current.verdict,
      observed: current.observed,
      comment: current.comment,
      measuredValue: current.measuredValue || undefined,
      // Qui a execute, pas qui est affecte : l'affectation vit dans `assignedTo`
      // et ne doit pas etre overwritten par le fait d'avoir lance le test.
      tester: currentUser?.name ?? "—",
      executedAt: now.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
      duration: test.duration ?? "4 min 10 sec",
    });
    // L'etat backend prime sur le store local : sans cette mise a jour, la page
    // reafficherait le verdict charge avant l'enregistrement.
    setBackendTest((prev) =>
      prev
        ? {
            ...prev,
            verdict: current.verdict,
            observed: current.observed,
            comment: current.comment,
            measuredValue: current.measuredValue || undefined,
            tester: currentUser?.name ?? prev.tester,
            executedAt: now.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
          }
        : prev,
    );
    setDraft(null);
    toast.success(
      t("pages.execution_detail.result_saved")
        .replace("{id}", test.id)
        .replace("{verdict}", current.verdict),
    );
  };

  // Remet l'execution a « non executee ». Un verdict deja enregistre est aussi
  // rouvert cote backend : sans cet appel, il reapparaissait au rechargement.
  const restart = async () => {
    if (executionId && test.verdict !== "NOT_RUN") {
      try {
        await api<BackendTestExecution>(`/test-executions/${executionId}`, {
          method: "PUT",
          body: JSON.stringify({ result: "not_run", notes: null, actual_behavior: null }),
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("common.erreur"));
        return;
      }
      setBackendTest((prev) =>
        prev
          ? {
              ...prev,
              verdict: "NOT_RUN",
              observed: "",
              comment: "",
              measuredValue: undefined,
              executedAt: undefined,
            }
          : prev,
      );
    }
    lastSavedVerdict.current = null;
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

  // Réaffecte un cas échoué à un autre testeur et rouvre l'exécution (verdict
  // remis à « non exécuté ») pour qu'il puisse rejouer le cas. Deux appels au
  // store : le premier (sans verdict) persiste `assigned_to`, le second bascule
  // le verdict local ; la réouverture backend est faite explicitement car un
  // PUT de verdict passerait par la garde de séparation des responsabilités.
  const reassign = async (value: string) => {
    const user = users.find((u) => u.id === value);
    if (!user || String(test.assignedTo ?? "") === value) return;
    updateTest(test.id, { tester: user.name, assignedTo: Number(value) });
    updateTest(test.id, {
      verdict: "NOT_RUN",
      observed: "",
      comment: "",
      measuredValue: undefined,
      executedAt: undefined,
    });
    if (executionId) {
      try {
        await api<BackendTestExecution>(`/test-executions/${executionId}`, {
          method: "PUT",
          body: JSON.stringify({ result: "not_run", notes: null, actual_behavior: null }),
        });
        setBackendTest((prev) =>
          prev
            ? { ...prev, verdict: "NOT_RUN", observed: "", comment: "", tester: user.name }
            : prev,
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("pages.execution_detail.reassign_failed"),
        );
        return;
      }
    }
    setDraft(null);
    toast.success(t("pages.execution_detail.reassigned").replace("{name}", user.name));
  };

  const removeEvidence = async (evId: string) => {
    // Une preuve numerique vit en base : on la supprime cote backend puis on
    // relit la liste. Un id local (`e-...`) reste gere par le store.
    if (backendTest && /^\d+$/.test(evId)) {
      try {
        await deleteEvidence(Number(evId));
        if (executionId) await refreshEvidence(executionId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Suppression impossible");
        return;
      }
    } else {
      updateTest(test.id, { evidence: test.evidence.filter((e) => e.id !== evId) });
    }
    toast.success(t("pages.execution_detail.evidence_removed"));
  };

  const addEvidence = async (file: File) => {
    if (backendTest && campaign && /^\d+$/.test(campaign.id)) {
      try {
        const execId = await ensureExecutionId();
        if (!execId) return;
        await uploadEvidence(
          "test_execution",
          execId,
          file,
          JSON.stringify({ name: file.name, type: file.type }),
        );
        await refreshEvidence(execId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible d'ajouter la preuve");
        return;
      }
      toast.success(t("pages.execution_detail.evidence_added").replace("{name}", file.name));
      return;
    }
    updateTest(test.id, {
      evidence: [
        ...test.evidence,
        {
          id: `e-${Date.now()}`,
          name: file.name,
          size: formatFileSize(file.size),
          kind: fileKind(file),
        },
      ],
    });
    toast.success(t("pages.execution_detail.evidence_added").replace("{name}", file.name));
  };

  const sevOfCriticality = (c?: TestCase["criticality"]): Severity =>
    c === "critique" || c === "haute" ? "haute" : c === "basse" ? "basse" : "moyenne";

  // L'anomalie est affectée à un développeur de l'équipe de la campagne,
  // jamais à un développeur extérieur (le serveur refuse aussi).
  const devs = campaignDevelopers(campaign, users);

  const openCreateDialog = () => {
    const severity = sevOfCriticality(test.criticality);
    setDraftAnomaly({
      title: t("pages.execution_detail.defect_title_prefix")
        .replace("{id}", test.id)
        .replace("{name}", test.name),
      description: current.observed || "",
      severity,
      priority: severity,
      developer: devs[0] ?? "",
    });
    setCreateOpen(true);
  };

  const submitAnomaly = (e: React.FormEvent) => {
    e.preventDefault();
    // Le verdict enregistre peut avoir change depuis l'ouverture de la boite.
    if (!canReportDefect(test.verdict)) {
      toast.error(t("pages.anomalies.test_not_failed"));
      return;
    }
    if (!draftAnomaly.title.trim()) {
      toast.error(t("pages.anomalies.title_required"));
      return;
    }
    const id = addDefect({
      productId: campaign?.productId ?? "",
      campaignId: campaign?.id ?? "",
      title: draftAnomaly.title.trim(),
      description: draftAnomaly.description,
      severity: draftAnomaly.severity,
      priority: draftAnomaly.priority,
      status: "nouvelle",
      featureId: test.featureId,
      version: campaign?.version ?? "4.12",
      testId: test.id,
      reporter: currentUser?.name ?? "Marie Martin",
      assignee: draftAnomaly.developer,
      developer: draftAnomaly.developer,
      createdAt: new Date().toISOString().slice(0, 10),
      // RG-8 : delai de correction des anomalies hautes (7 jours sinon).
      targetDate: defaultCorrectionDate(draftAnomaly.severity, rules),
    });
    setCreateOpen(false);
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
      backTo={
        campaign
          ? { to: "/campagnes/$campaignId", params: { campaignId: campaign.id } }
          : { to: "/campagnes" }
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ContextPanel test={test} featureName={feature?.name} verdict={current.verdict} />
          <PreconditionsPanel preconditions={test.preconditions} />
          <StepsListPanel
            steps={test.steps}
            states={current.stepState}
            onSetStep={setStep}
            readOnly={executionLocked}
          />
          <ExpectedResultsPanel expected={test.expected} />
          <MeasuresPanel
            expectedValue={test.expectedValue}
            measuredValue={current.measuredValue}
            verdict={current.verdict}
            readOnly={executionLocked}
            onMeasuredValueChange={(value) =>
              setDraft((d) => ({ ...(d ?? current), measuredValue: value }))
            }
          />
        </div>

        <div className="space-y-4">
          <ObservedPanel
            observed={current.observed}
            readOnly={executionLocked}
            onObservedChange={(value) => setDraft((d) => ({ ...(d ?? current), observed: value }))}
          />
          <VerdictPickerPanel
            verdict={current.verdict}
            comment={current.comment}
            readOnly={executionLocked}
            onVerdictChange={(v) => setDraft((d) => ({ ...(d ?? current), verdict: v }))}
            onCommentChange={(value) => setDraft((d) => ({ ...(d ?? current), comment: value }))}
          />
          <EvidenceListPanel
            evidence={test.evidence}
            readOnly={executionLocked}
            onAddEvidence={addEvidence}
            onRemoveEvidence={removeEvidence}
          />
          <DefectsListPanel
            defects={linkedDefects}
            readOnly={readOnly}
            canCreate={canReportDefect(test.verdict)}
            onCreateDefect={openCreateDialog}
          />
          {test.verdict === "FAIL" &&
          !readOnly &&
          canManageCampaign() &&
          reassignOptions.length > 0 ? (
            <ReassignPanel
              assigneeId={test.assignedTo != null ? String(test.assignedTo) : ""}
              options={reassignOptions}
              onReassign={(value) => void reassign(value)}
            />
          ) : null}
          <TraceabilityPanel
            test={test}
            onRestart={() => void restart()}
            onSave={save}
            readOnly={executionLocked}
            readOnlyNote={
              readOnly
                ? t("pages.execution_detail.read_only_note")
                : assignedToOther
                  ? t("pages.execution_detail.not_assigned_note")
                  : t("pages.execution_detail.execution_done_note")
            }
          />
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("pages.execution_detail.creer_anomalie")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAnomaly} className="grid gap-4">
            <div className="space-y-2">
              <Label>{t("pages.anomalies.defect_title")}</Label>
              <Input
                value={draftAnomaly.title}
                placeholder={t("pages.anomalies.title_placeholder")}
                onChange={(e) => setDraftAnomaly((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("pages.execution_detail.comportement_observe")}</Label>
              <Textarea
                rows={3}
                value={draftAnomaly.description}
                onChange={(e) => setDraftAnomaly((d) => ({ ...d, description: e.target.value }))}
                placeholder={t("common.description")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pages.anomalies.severity")}</Label>
                <SearchableSelect
                  value={draftAnomaly.severity}
                  onValueChange={(v) => setDraftAnomaly((d) => ({ ...d, severity: v as Severity }))}
                  options={(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => ({
                    value: s,
                    label: SEVERITY_LABEL[s],
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.anomalies.priority")}</Label>
                <SearchableSelect
                  value={draftAnomaly.priority}
                  onValueChange={(v) => setDraftAnomaly((d) => ({ ...d, priority: v as Severity }))}
                  options={(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => ({
                    value: s,
                    label: SEVERITY_LABEL[s],
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.anomalies.developer")}</Label>
                <SearchableSelect
                  value={draftAnomaly.developer}
                  onValueChange={(v) => setDraftAnomaly((d) => ({ ...d, developer: v }))}
                  options={
                    devs.length > 0
                      ? devs.map((p) => ({ value: p, label: p }))
                      : [{ value: "", label: t("pages.anomalies.no_campaign_dev") }]
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t("actions.annuler")}
              </Button>
              <Button type="submit">{t("pages.anomalies.create_anomaly")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
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
