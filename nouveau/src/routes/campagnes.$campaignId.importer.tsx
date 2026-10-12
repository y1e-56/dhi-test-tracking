import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fragment, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Upload,
  X,
} from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { getUser, campaignVisibleTo, campaignTesterOptions } from "@/lib/access";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import { canManageCampaign } from "@/lib/role-protection";
import { campaigns as seedCampaigns } from "@/lib/dhi-data";
import { cn } from "@/lib/utils";
import {
  exportCsvTemplate,
  exportNorTemplate,
  isImportableRow,
  parseImportText,
  type ParsedTestRow,
} from "@/lib/test-import";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/campagnes/$campaignId/importer")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const c = campaigns.find((x) => x.id === params.campaignId);
    return { name: c?.name ?? "Campagne" };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Importer des tests — ${loaderData?.name ?? "Campagne"} — DHI Quality Platform`,
      },
    ],
  }),
  component: ImportTestsPage,
});

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function Stepper({
  labels,
  active,
  onSelect,
}: {
  labels: string[];
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {labels.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <Fragment key={label}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              title={label}
              className="flex cursor-pointer items-center gap-2 rounded-full px-1.5 py-1 outline-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span
                className={cn(
                  "num flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                  done && "border-success bg-success text-success-foreground",
                  current && "border-primary bg-primary text-primary-foreground",
                  !done && !current && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  i <= active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
            {i < labels.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1 rounded-full transition-colors",
                  i < active ? "bg-success/50" : "bg-border",
                )}
              />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "danger";
}) {
  const dot =
    tone === "success" ? "bg-success" : tone === "danger" ? "bg-danger" : "bg-border-strong";
  return (
    <div className="panel-flat flex flex-col gap-1.5 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={cn("size-1.5 rounded-full", dot)} />
        <p className="label-eyebrow truncate">{label}</p>
      </div>
      <span
        className={cn(
          "num text-2xl font-semibold leading-none tracking-tight",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ImportTestsPage() {
  const { campaignId } = Route.useParams();
  const store = useStore();
  const { campaigns, features, products, addTestCase, users } = store;
  const { t } = useI18n();
  const navigate = useNavigate();

  /** Testeurs sélectionnables : uniquement ceux enregistrés dans la campagne (campaign.testers). */
  const campaign = campaigns.find((c) => c.id === campaignId);
  const testerOptions = useMemo(
    () => campaignTesterOptions(users, campaign?.testers),
    [users, campaign?.testers],
  );

  const [importFileName, setImportFileName] = useState("");
  const [importFileSize, setImportFileSize] = useState(0);
  const [importPreview, setImportPreview] = useState<ParsedTestRow[]>([]);
  const [importReady, setImportReady] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importFormat, setImportFormat] = useState<"csv" | "nor" | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const campaignFeatures = useMemo(() => {
    const productFeatures = features.filter((f) => f.productId === campaign?.productId);
    const linkedIds = new Set(campaign?.featureIds ?? []);
    const extraLinked = features.filter(
      (f) => linkedIds.has(f.id) && f.productId !== campaign?.productId,
    );
    return [...productFeatures, ...extraLinked];
  }, [features, campaign?.productId, campaign?.featureIds]);

  if (campaign && !campaignVisibleTo(campaign, products, getUser())) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (campaign && !canManageCampaign()) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (campaign?.status === "terminee") {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (!campaign) return null;

  const goBack = () =>
    navigate({ to: "/campagnes/$campaignId", params: { campaignId: campaign.id } });

  const goToStep = (i: number) => {
    // Sans fonctionnalité, on guide vers la page de rattachement.
    if (campaignFeatures.length === 0) {
      navigate({
        to: "/campagnes/$campaignId/fonctionnalites",
        params: { campaignId: campaign.id },
      });
      return;
    }
    // Sans fichier chargé, toute étape ouvre le sélecteur de fichier.
    if (i === 0 || importPreview.length === 0) {
      fileInputRef.current?.click();
      return;
    }
    if (i === 1) {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    footerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleFilePick = (file: File) => {
    setImportFileName(file.name);
    setImportFileSize(file.size);
    setImportPreview([]);
    setImportReady(false);
    setImportFormat(null);
    const reader = new FileReader();
    reader.onerror = () => {
      toast.error(t("pages.campaign_detail.erreur_lecture_csv"));
    };
    reader.onload = () => {
      const text = String(reader.result ?? "");
      if (!text.trim()) {
        toast.error(t("pages.campaign_detail.fichier_invalide"));
        return;
      }
      const parsed = parseImportText(text, campaignFeatures, file.name);
      if (parsed.length === 0) {
        toast.error(
          /\.(txt|text|md|log|nor|tab)$/.test(file.name.toLowerCase())
            ? t("pages.campaign_detail.fichier_invalide")
            : t("pages.campaign_detail.colonne_nom_introuvable"),
        );
        return;
      }
      setImportPreview(parsed);
      setImportReady(parsed.some(isImportableRow));
      setImportFormat(
        Object.keys(parsed[0]?._raw ?? {}).length > 0 ? "csv" : "nor",
      );
      const ok = parsed.filter(isImportableRow).length;
      const bad = parsed.length - ok;
      toast(
        bad
          ? t("pages.campaign_detail.import_ok_bad")
              .replace("{ok}", String(ok))
              .replace("{bad}", String(bad))
          : t("pages.campaign_detail.import_ok_clean").replace("{ok}", String(ok)),
        {
          description: bad ? t("campagne_import.ignorer_lignes") : t("campagne_import.pret_import"),
          icon: bad ? undefined : <CheckCircle2 className="size-4 text-success" />,
        },
      );
    };
    reader.readAsText(file, "UTF-8");
  };

  const clearFile = () => {
    setImportFileName("");
    setImportFileSize(0);
    setImportPreview([]);
    setImportReady(false);
    setImportFormat(null);
  };

  const handleImportSubmit = () => {
    const validRows = importPreview.filter(isImportableRow);
    if (validRows.length === 0) {
      toast.error(t("pages.campaign_detail.aucune_ligne_valide"));
      return;
    }
    let created = 0;
    let unassigned = 0;
    for (const row of validRows) {
      // Résolution du nom de testeur issu du CSV vers un compte réel : sans id
      // numérique, l'affectation ne peut pas être enregistrée.
      const wanted = (row.tester ?? "").trim().toLowerCase();
      const match = testerOptions.find((o) => o.name.toLowerCase() === wanted);
      if (wanted && !match) unassigned++;
      addTestCase({
        campaignId: campaign.id,
        featureId: row.featureId,
        name: row.name.trim(),
        criticality: row.criticality,
        type: row.type,
        tester: match?.name,
        assignedTo: match ? Number(match.id) : null,
        preconditions: row.preconditions,
        steps: row.steps,
        expected: row.expected,
        observed: row.observed?.join("\n") ?? "",
        comment: row.comment ?? "",
      });
      created++;
    }
    toast.success(t("pages.campaign_detail.import_success").replace("{n}", String(created)));
    if (unassigned > 0) {
      toast.error(`${t("pages.campaign_detail.tester_inconnu")} (${unassigned})`);
    }
    navigate({ to: "/campagnes/$campaignId", params: { campaignId: campaign.id } });
  };

  const importValidCount = importPreview.filter(isImportableRow).length;
  const importErrorCount = importPreview.length - importValidCount;
  const hasFeatures = campaignFeatures.length > 0;
  const activeStep = importPreview.length > 0 ? 2 : importFileName ? 1 : 0;

  return (
    <AppShell
      title={`${t("common.campagne")} : ${campaign.name}`}
      subtitle={t("campagne_import.title")}
      breadcrumb={[t("nav.execution"), t("pages.campaigns.campaigns"), campaign.name]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goBack} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("pages.campaigns.campaigns")}
          </Button>
        </div>

        <div className="mx-auto max-w-5xl space-y-6">
          <h2 className="text-lg font-semibold tracking-tight">{t("campagne_import.title")}</h2>

          <Stepper
            labels={[
              t("campagne_import.etape_fichier"),
              t("campagne_import.etape_apercu"),
              t("campagne_import.etape_import"),
            ]}
            active={activeStep}
            onSelect={goToStep}
          />

          {!hasFeatures ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft/40 p-3.5 text-xs text-danger">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <strong>{t("pages.campaign_detail.aucune_fonctionnalite")}</strong> —{" "}
                {t("campagne_import.aucune_fonctionnalite_detail")}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/campagnes/$campaignId/fonctionnalites",
                    params: { campaignId: campaign.id },
                  })
                }
              >
                {t("campagne_import.rattacher_fonctionnalites")}
              </Button>
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,.tsv,.tab,.txt,.text,.md,.log,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFilePick(f);
              e.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={hasFeatures ? 0 : -1}
            aria-disabled={!hasFeatures}
            onClick={() => hasFeatures && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && hasFeatures) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              if (!hasFeatures) return;
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (!hasFeatures) return;
              const f = e.dataTransfer.files?.[0];
              if (f) handleFilePick(f);
            }}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed px-6 py-9 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
              dragOver
                ? "border-primary bg-secondary/70"
                : "border-border-strong bg-subtle/40 hover:border-foreground/40 hover:bg-subtle",
              !hasFeatures && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="grid-faint pointer-events-none absolute inset-0" aria-hidden />
            <span
              className={cn(
                "relative flex size-11 items-center justify-center rounded-full border transition-all",
                dragOver
                  ? "border-primary bg-primary text-primary-foreground scale-105"
                  : "border-border bg-card text-foreground group-hover:scale-105",
              )}
            >
              <Upload className="size-5" />
            </span>
            <div className="relative space-y-1">
              <p className="text-sm font-medium">
                {dragOver ? t("campagne_import.drop_actif") : t("campagne_import.drop_titre")}
              </p>
              <p className="pt-0.5 text-[11px] text-muted-foreground">
                {t("campagne_import.drop_formats")}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!hasFeatures}
              className="relative mt-1"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileUp className="size-3.5" /> {t("campagne_import.choisir_fichier_cta")}
            </Button>
          </div>

          {importFileName ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success-soft/50 px-3.5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-success/30 bg-card text-success">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-xs font-medium text-foreground">
                  <span className="truncate">{importFileName}</span>
                  {importFormat ? (
                    <span
                      className={cn(
                        "shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide",
                        importFormat === "csv"
                          ? "border-primary/30 bg-primary/5 text-primary"
                          : "border-success/30 bg-success/10 text-success",
                      )}
                    >
                      {importFormat === "csv" ? "CSV" : "NOR (.txt)"}
                    </span>
                  ) : null}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(importFileSize)} ·{" "}
                  {importPreview.length > 0
                    ? t("pages.campaign_detail.lignes_importables")
                        .replace("{ok}", String(importValidCount))
                        .replace("{total}", String(importPreview.length))
                    : t("campagne_import.pret_import")}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!hasFeatures}
                >
                  <FileUp className="size-3.5" /> {t("campagne_import.remplacer_fichier")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearFile}
                  title={t("campagne_import.retirer_fichier")}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          <p className="label-eyebrow">{t("campagne_import.exemple_titre")}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel-flat flex items-center gap-3 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-subtle text-foreground">
                <FileSpreadsheet className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold tracking-tight">
                  {t("campagne_import.format_csv_titre")}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {t("campagne_import.format_csv_desc")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCsvTemplate(campaignFeatures)}
                disabled={!hasFeatures}
              >
                <FileUp className="size-3.5" /> {t("campagne_import.exemple_csv")}
              </Button>
            </div>

            <div className="panel-flat flex items-center gap-3 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-subtle text-foreground">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold tracking-tight">
                  {t("campagne_import.format_nor_titre")}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {t("campagne_import.format_nor_desc")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportNorTemplate(campaignFeatures)}
                disabled={!hasFeatures}
              >
                <FileUp className="size-3.5" /> {t("campagne_import.exemple_txt")}
              </Button>
            </div>
          </div>

          {importPreview.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatTile label={t("campagne_import.lignes_detectees")} value={importPreview.length} />
                <StatTile label={t("campagne_import.lignes_ok")} value={importValidCount} tone="success" />
                <StatTile label={t("campagne_import.lignes_erreurs")} value={importErrorCount} tone="danger" />
              </div>

              <div ref={previewRef} className="scroll-mt-6 space-y-2">
                <p className="label-eyebrow">{t("campagne_import.apercu_titre")}</p>
                <div className="overflow-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-subtle/90 backdrop-blur">
                      <TableRow>
                        <TableHead className="w-10 text-[11px]">#</TableHead>
                        <TableHead className="text-[11px]">{t("common.nom")}</TableHead>
                        <TableHead className="text-[11px]">{t("common.fonctionnalite")}</TableHead>
                        <TableHead className="text-[11px]">
                          {t("pages.campaign_detail.crit_short")}
                        </TableHead>
                        <TableHead className="text-[11px]">{t("common.type")}</TableHead>
                        <TableHead className="text-[11px]">
                          {t("pages.campaign_detail.etapes")}
                        </TableHead>
                        <TableHead className="text-[11px]">{t("common.statut")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((row, i) => {
                        const valid = isImportableRow(row);
                        return (
                          <TableRow key={i} className={!valid ? "bg-danger-soft/40" : undefined}>
                            <TableCell className="num text-xs text-muted-foreground">
                              {i + 1}
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate text-xs" title={row.name}>
                              <span className="font-medium">
                                {row.name || t("pages.campaign_detail.vide_paren")}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-xs">
                              {features.find((f) => f.id === row.featureId)?.name ??
                                (row.featureId ? `ID:${row.featureId}` : "—")}
                            </TableCell>
                            <TableCell className="text-xs">
                              <CriticalityBadge level={row.criticality} />
                            </TableCell>
                            <TableCell className="text-xs capitalize">
                              {row.type.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell className="num text-xs">
                              {row.steps.length}{" "}
                              {row.steps.length > 1
                                ? t("pages.campaign_detail.steps_plural")
                                : t("pages.campaign_detail.step_singular")}
                            </TableCell>
                            <TableCell className="max-w-[220px] text-xs">
                              {valid ? (
                                <span className="inline-flex items-center gap-1 text-success">
                                  <CheckCircle2 className="size-3.5" /> {t("common.ok")}
                                </span>
                              ) : (
                                <div
                                  className="flex flex-col gap-0.5 text-danger"
                                  title={row.errors.join(" — ")}
                                >
                                  {row.errors.map((err, j) => (
                                    <span key={j} className="inline-flex items-start gap-1">
                                      <AlertTriangle className="mt-px size-3 shrink-0" />
                                      <span className="truncate">{err}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}

          <div
            ref={footerRef}
            className="scroll-mt-6 flex items-center justify-end gap-3 border-t border-border pt-4"
          >
            <Button type="button" variant="outline" onClick={goBack} className="h-11 px-6">
              <X className="size-4 mr-1.5" /> {t("actions.annuler")}
            </Button>
            <Button
              type="button"
              onClick={handleImportSubmit}
              disabled={!importReady}
              className="h-11 px-6"
            >
              <CheckCircle2 className="size-4 mr-1.5" />
              {t("actions.importer")} {importValidCount}{" "}
              {importValidCount > 1
                ? t("pages.campaign_detail.tests")
                : t("pages.campaign_detail.test")}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
