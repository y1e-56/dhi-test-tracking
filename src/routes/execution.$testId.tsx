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
import type { TestCase, Verdict } from "@/lib/dhi-data";

export const Route = createFileRoute("/execution/$testId")({
  head: () => ({
    meta: [
      { title: "Exécution de test — DHI Quality Platform" },
      {
        name: "description",
        content: "Exécution d'un cas de test : étapes, résultat attendu, preuves, verdict et anomalies.",
      },
      { property: "og:title", content: "Exécution de test — DHI Quality Platform" },
      { property: "og:description", content: "Enregistrez verdict, preuves et anomalies d'un test." },
    ],
  }),
  component: ExecutionPage,
});

const VERDICTS: Verdict[] = ["PASS", "FAIL", "BLOCKED", "NOT_RUN"];

function ExecutionPage() {
  const { testId } = Route.useParams();
  const { tests, features, campaigns, defects, updateTest, addDefect } = useStore();
  const test = tests.find((t) => t.id === testId);
  const feature = features.find((f) => f.id === test?.featureId);
  const campaign = campaigns.find((c) => c.id === test?.campaignId);
  const linkedDefects = defects.filter((d) => d.testId === testId);

  const [draft, setDraft] = useState<{
    verdict: Verdict;
    observed: string;
    comment: string;
    measuredValue: string;
  } | null>(null);

  if (!test) return null;
  const current = draft ?? {
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
    toast.success(`Résultat de ${test.id} enregistré (${current.verdict}).`);
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
    toast.info("Exécution réinitialisée.");
  };

  const removeEvidence = (evId: string) => {
    updateTest(test.id, { evidence: test.evidence.filter((e) => e.id !== evId) });
    toast.success("Preuve supprimée.");
  };

  const addEvidence = (file: File) => {
    const size = file.size > 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1000))} KB`;
    const kind = file.type.startsWith("image/")
      ? ("image" as const)
      : file.type.startsWith("video/")
        ? ("video" as const)
        : ("log" as const);
    updateTest(test.id, {
      evidence: [...test.evidence, { id: `e-${Date.now()}`, name: file.name, size, kind }],
    });
    toast.success(`Preuve « ${file.name} » ajoutée.`);
  };

  const createDefect = () => {
    const id = addDefect({
      productId: campaign?.productId ?? "p-paiement",
      title: `Détection lors de ${test.id} — ${test.name}`,
      description: current.observed || "Anomalie créée depuis l'écran d'exécution.",
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
    toast.success(`Anomalie ${id} créée.`);
  };

  return (
    <AppShell
      title={`Exécution du test — ${test.id}`}
      subtitle={`${test.name} · ${campaign ? `${campaign.name} · v${campaign.version} · ${campaign.environment}` : ""}`}
      actions={
        <Link
          to={campaign ? "/campagnes/$campaignId" : "/campagnes"}
          params={campaign ? { campaignId: campaign.id } : {}}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Retour
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel title="Contexte">
            <div className="flex flex-wrap items-center gap-2">
              <CriticalityBadge level={test.criticality} />
              <VerdictBadge verdict={current.verdict} />
              <span className="text-sm text-muted-foreground">
                Feature : {feature?.name ?? "—"} · Type : {test.type}
              </span>
            </div>
          </Panel>

          <Panel title="Préconditions">
            <ul className="list-inside list-disc space-y-1 text-sm">
              {test.preconditions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Panel>

          <Panel title="Étapes">
            <ol className="list-inside list-decimal space-y-1 text-sm">
              {test.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </Panel>

          <Panel title="Résultat attendu">
            <ul className="list-inside list-disc space-y-1 text-sm">
              {test.expected.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Panel>

          {test.expectedValue ? (
            <Panel title="Mesures">
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Valeur attendue</dt>
                  <dd className="num font-medium">{test.expectedValue}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Valeur observée</dt>
                  <input
                    className="num w-32 rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
                    value={current.measuredValue}
                    onChange={(e) => setDraft((d) => ({ ...(d ?? current), measuredValue: e.target.value }))}
                    placeholder="ex. 942 ms"
                  />
                </div>
              </dl>
              {current.measuredValue && current.verdict === "FAIL" ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-danger-soft px-2 py-1 text-xs font-semibold text-danger">
                  <XCircle className="size-3.5" /> NON CONFORME
                </p>
              ) : null}
            </Panel>
          ) : null}
        </div>

        <div className="space-y-4">
          <Panel title="Comportement observé">
            <Textarea
              rows={4}
              value={current.observed}
              onChange={(e) => setDraft((d) => ({ ...(d ?? current), observed: e.target.value }))}
              placeholder="Décrire le comportement constaté…"
            />
          </Panel>

          <Panel title="Verdict">
            <RadioGroup
              value={current.verdict}
              onValueChange={(v) => setDraft((d) => ({ ...(d ?? current), verdict: v as Verdict }))}
              className="flex flex-wrap gap-4"
            >
              {VERDICTS.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <RadioGroupItem value={v} id={`v-${v}`} />
                  <Label htmlFor={`v-${v}`} className="num font-medium">
                    {v === "NOT_RUN" ? "NOT RUN" : v}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Label htmlFor="exec-comment" className="mt-4 block">
              Commentaire
            </Label>
            <Textarea
              id="exec-comment"
              rows={3}
              className="mt-1.5"
              value={current.comment}
              onChange={(e) => setDraft((d) => ({ ...(d ?? current), comment: e.target.value }))}
              placeholder="Contexte, hypothèses, pistes d'investigation…"
            />
          </Panel>

          <Panel
            title="Preuves"
            actions={
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) addEvidence(f);
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <Plus className="size-3.5" /> Ajouter une preuve
                </span>
              </label>
            }
          >
            {test.evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune preuve jointe.</p>
            ) : (
              <ul className="space-y-2">
                {test.evidence.map((e) => (
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
                      onClick={() => removeEvidence(e.id)}
                      className="text-muted-foreground transition-colors hover:text-danger"
                      aria-label={`Supprimer ${e.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Anomalies détectées"
            actions={
              <button
                onClick={createDefect}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="size-3.5" /> Créer une anomalie
              </button>
            }
          >
            {linkedDefects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune anomalie liée à ce test.</p>
            ) : (
              <ul className="space-y-2">
                {linkedDefects.map((d) => (
                  <li key={d.id} className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-danger">
                        {d.id} : {d.title}
                      </p>
                      <Link to="/anomalies" className="text-xs font-medium text-primary hover:underline">
                        Détail
                      </Link>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Gravité : {d.severity} · Priorité : {d.priority} · Statut : {d.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Traçabilité">
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Testeur</dt>
                <dd className="font-medium">{test.tester ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Date</dt>
                <dd className="num font-medium">{test.executedAt ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Durée</dt>
                <dd className="num font-medium">{test.duration ?? "—"}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={restart}>
                <RotateCcw className="size-4" /> Recommencer
              </Button>
              <Button size="sm" onClick={save}>
                Enregistrer le résultat
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
