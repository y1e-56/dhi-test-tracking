/* ==============================
   1. Imports
   ============================== */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { GoLiveScreenshots } from "@/components/dhi/GoLiveScreenshots";
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
import { GOLIVE_VERDICT_LABEL, type GoLiveVerdict } from "@/lib/dhi-data";

import { useI18n } from "@/lib/i18n";
import { campaignStats, useStore } from "@/lib/dhi-store";
import { cn } from "@/lib/utils";

/* ==============================
   2. Helpers / utilitaires
   ============================== */

/** Nombre maximal de captures jointes à une décision. */
const MAX_SCREENSHOTS = 5;
/** Taille maximale par image, alignée sur la limite serveur des preuves. */
const MAX_SHOT_BYTES = 10 * 1024 * 1024;

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
    currentUser,
    toggleChecklistItem,
    addGoLiveDecision,
  } = useStore();

  const pending = releases.filter((r) => r.status !== "released");
  const [releaseId, setReleaseId] = useState(pending[0]?.id ?? releases[0]?.id ?? "");
  const [verdict, setVerdict] = useState<GoLiveVerdict>("GO");
  const [decider, setDecider] = useState<string>(currentUser?.name ?? "Jean Dupont");
  const [justification, setJustification] = useState("");
  /** Captures d'écran jointes à la décision, avec leur aperçu local. */
  const [shots, setShots] = useState<{ file: File; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const shotsInputRef = useRef<HTMLInputElement | null>(null);
  // Lu uniquement au démontage : un cleanup dépendant de `shots` révoquerait
  // les aperçus déjà affichés à chaque nouvel ajout.
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  // Les URL d' aperçu créées à la main fuient si on ne les libère pas.
  useEffect(() => {
    return () => {
      for (const shot of shotsRef.current) URL.revokeObjectURL(shot.url);
    };
  }, []);

  const addShots = (files: FileList | null) => {
    if (!files?.length) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      toast.error(t("pages.go_live.image_only"));
      return;
    }
    if (images.length < files.length) {
      toast.warning(t("pages.go_live.non_image_ignored"));
    }
    // Garde-fou côté client ; le serveur n'applique aujourd'hui aucune limite.
    const tooBig = images.filter((f) => f.size > MAX_SHOT_BYTES);
    const accepted = images.filter((f) => f.size <= MAX_SHOT_BYTES);
    if (tooBig.length > 0) {
      toast.error(
        t("pages.go_live.image_too_big").replace("{n}", String(tooBig.length)),
      );
    }
    if (accepted.length === 0) return;
    if (shots.length + accepted.length > MAX_SCREENSHOTS) {
      toast.error(
        t("pages.go_live.max_screenshots").replace("{n}", String(MAX_SCREENSHOTS)),
      );
      return;
    }
    setShots((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const removeShot = (index: number) => {
    setShots((prev) => {
      URL.revokeObjectURL(prev[index]?.url ?? "");
      return prev.filter((_, i) => i !== index);
    });
  };

  const decisionRoles: string[] = ["admin", "chef_testeur", "quality_manager", "qa_lead", "approver"];
  const userRoles = currentUser
    ? Array.isArray(currentUser.roles) && currentUser.roles.length > 0
      ? currentUser.roles
      : [currentUser.role]
    : [];
  const canDecide = !!currentUser && userRoles.some((r) => decisionRoles.includes(r));

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

  const decide = async () => {
    if (saving) return;
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
    if (shots.length > 0 && !localStorage.getItem("token")) {
      // Les captures sont jointes côté serveur : sans session, elles seraient
      // perdues au rechargement. Mieux vaut le dire que les accepter pour rien.
      toast.error(t("pages.go_live.login_required_for_images"));
      return;
    }
    setSaving(true);
    try {
      await addGoLiveDecision(
        releaseId,
        verdict,
        decider,
        justification.trim(),
        shots.map((s) => s.file),
      );
      toast.success(`${t("pages.go_live.decision_saved")} ${GOLIVE_VERDICT_LABEL[verdict]}.`);
      setJustification("");
      for (const shot of shots) URL.revokeObjectURL(shot.url);
      setShots([]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("pages.go_live.decision_failed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const history = goLiveDecisions.filter((d) => (release ? d.releaseId === release.id : true));

  return (
    <AppShell
      title={t("pages.go_live.title")}
      subtitle={t("pages.go_live.subtitle")}
      breadcrumb={t("pages.go_live.breadcrumb")}
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
              {canDecide ? (
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleChecklistItem(releaseId, item.id)}
                className="mt-0.5"
              />
            ) : (
              <span
                className={cn(
                  "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                  item.checked
                    ? "border-success bg-success text-white"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {item.checked ? "✓" : ""}
              </span>
            )}
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
        {canDecide ? (
          <>
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
                <div className="flex h-9 items-center rounded-md border border-border px-3">
                  <span className="text-sm font-medium">{decider}</span>
                </div>
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
              <div className="md:col-span-2 grid gap-1.5">
                <Label>{t("pages.go_live.screenshots")}</Label>
                <input
                  ref={shotsInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addShots(e.target.files);
                    // Reset pour pouvoir resélectionner le même fichier ensuite.
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => shotsInputRef.current?.click()}
                    disabled={shots.length >= MAX_SCREENSHOTS}
                  >
                    <ImagePlus className="size-4" />
                    {t("pages.go_live.add_screenshots")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t("pages.go_live.screenshots_count")
                      .replace("{n}", String(shots.length))
                      .replace("{max}", String(MAX_SCREENSHOTS))}
                  </span>
                </div>
                {shots.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {shots.map((shot, index) => (
                      <li key={shot.url} className="relative">
                        <img
                          src={shot.url}
                          alt={shot.file.name}
                          className="size-20 rounded-md border border-border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeShot(index)}
                          className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-danger text-white shadow-sm hover:opacity-90"
                          aria-label={t("pages.go_live.remove_screenshot")}
                          title={shot.file.name}
                        >
                          <X className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {t("pages.go_live.screenshots_hint")}
                </p>
              </div>
            </div>
            <Button className="mt-4" onClick={() => void decide()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {t("pages.go_live.record_decision")}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("pages.go_live.no_permission")}
          </p>
        )}
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
                  <GoLiveScreenshots backendId={d.backendId} />
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
