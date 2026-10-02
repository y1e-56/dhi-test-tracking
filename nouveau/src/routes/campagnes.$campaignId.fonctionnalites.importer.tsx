import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileUp,
  Upload,
  X,
} from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/dhi-store";
import { campaignVisibleTo, getUser } from "@/lib/access";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import { canManageCampaign } from "@/lib/role-protection";
import { useI18n } from "@/lib/i18n";
import { CSV_SEP } from "@/lib/test-import";
import {
  FEATURE_TEMPLATE_HEADERS,
  buildFeatureTemplate,
  parseFeatureImport,
  type ParsedFeatureRow,
} from "@/lib/feature-import";
import { api, toBackendPriority, backendIdOf } from "@/lib/api";

export const Route = createFileRoute("/campagnes/$campaignId/fonctionnalites/importer")({
  head: () => ({
    meta: [{ title: "Importer des fonctionnalités — DHI Quality Platform" }],
  }),
  component: ImportFeaturesPage,
});

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {n}
    </span>
  );
}

function ImportFeaturesPage() {
  const { campaignId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { campaigns, products, reloadFromBackend } = useStore();

  const campaign = campaigns.find((c) => c.id === campaignId);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedFeatureRow[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (campaign && !campaignVisibleTo(campaign, products, getUser())) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (campaign && !canManageCampaign()) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }

  const valid = rows.filter((r) => r.errors.length === 0);
  const invalid = rows.filter((r) => r.errors.length > 0);

  const handleFilePick = async (file: File) => {
    setDone(null);
    const result = parseFeatureImport(await file.text());
    setFileName(file.name);
    setRows(result.rows);
    setMissingColumns(result.missingColumns);
  };

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF", buildFeatureTemplate()], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modele-import-fonctionnalites.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const runImport = async () => {
    if (valid.length === 0 || !campaign) return;
    const campaignBackend = backendIdOf(campaign.id);
    if (campaignBackend === undefined) {
      toast.error(t("pages.features.import_not_saved_campaign"));
      return;
    }
    setBusy(true);
    try {
      const response = await api<{ created: number }>("/features/bulk", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: campaignBackend,
          items: valid.map((r) => ({
            name: r.name,
            description: r.description,
            priority: toBackendPriority(r.priority),
            ...(r.code ? { module: r.code } : {}),
          })),
        }),
      });
      setDone(response.created);
      toast.success(t("pages.features.import_done").replace("{count}", String(response.created)));
      setRows([]);
      setFileName("");
      reloadFromBackend();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.erreur"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title={campaign?.name ?? t("pages.features.title")}
      breadcrumb={t("nav.campagnes")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/campagnes/$campaignId", params: { campaignId } })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("nav.campagnes")}
          </Button>
        </div>

        <div className="max-w-5xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{t("pages.features.import_title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("pages.features.import_subtitle")} {campaign?.name}
            </p>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex gap-3">
              <StepNumber n={1} />
              <div className="min-w-0 flex-1 space-y-3">
                <Label className="text-sm font-semibold">{t("pages.features.import_step_file")}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFilePick(f);
                      e.target.value = "";
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-4 mr-1.5" />
                    {fileName
                      ? t("pages.features.import_other_file")
                      : t("pages.features.import_choose_file")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                    <FileUp className="size-4 mr-1.5" />
                    {t("pages.features.import_template")}
                  </Button>
                  {fileName ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success-soft border border-success/30 rounded-md px-2 py-1">
                      <CheckCircle2 className="size-3.5" />
                      {fileName}
                    </span>
                  ) : null}
                </div>

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-2 h-7 gap-1.5 text-xs text-muted-foreground">
                      <ChevronDown className="size-3.5" />
                      {t("pages.features.import_format_details")}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="rounded-md bg-subtle/50 p-3 text-xs text-muted-foreground leading-relaxed space-y-1.5">
                    <p>
                      Colonnes :{" "}
                      <code className="text-[11px]">{FEATURE_TEMPLATE_HEADERS.join(` ${CSV_SEP} `)}</code>
                      {" — séparateur "}
                      <strong>{CSV_SEP}</strong>
                    </p>
                    <p>
                      <strong>nom</strong> est obligatoire et doit être unique dans la campagne.{" "}
                      <strong>code</strong> est le code de référence du CDC (FCT-01) : il est enregistré et sert
                      ensuite à rattacher les exigences et les cas de test, préférez le renseigner.{" "}
                      <strong>priorite</strong> accepte basse, moyenne, haute, critique.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>

          {missingColumns.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-xs">
              <AlertTriangle className="size-4 shrink-0 text-danger" />
              <p>
                {t("pages.features.import_missing_columns").replace("{columns}", missingColumns.join(", "))}
              </p>
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-medium">
                  {t("pages.features.import_summary")
                    .replace("{valid}", String(valid.length))
                    .replace("{invalid}", String(invalid.length))}
                </span>
                <Button size="sm" onClick={() => void runImport()} disabled={busy || valid.length === 0}>
                  {busy
                    ? t("pages.features.import_running")
                    : t("pages.features.import_action").replace("{count}", String(valid.length))}
                </Button>
                {invalid.length > 0 && (
                  <span className="text-muted-foreground">{t("pages.features.import_skip_invalid")}</span>
                )}
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">L.</TableHead>
                      <TableHead>{t("pages.features.import_code")}</TableHead>
                      <TableHead>{t("pages.features.feature_name")}</TableHead>
                      <TableHead>{t("pages.requirements.priorite")}</TableHead>
                      <TableHead>{t("pages.features.import_check")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow
                        key={r.line}
                        className={r.errors.length > 0 ? "bg-danger-soft/40" : undefined}
                      >
                        <TableCell className="text-muted-foreground text-xs">{r.line}</TableCell>
                        <TableCell className="font-mono text-[11px]">{r.code || "—"}</TableCell>
                        <TableCell className="text-xs font-medium max-w-xs">
                          <span className="line-clamp-2">{r.name || "—"}</span>
                          {r.description ? (
                            <span className="line-clamp-1 text-[11px] text-muted-foreground">
                              {r.description}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <CriticalityBadge level={r.priority} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.errors.length === 0 ? (
                            <CheckCircle2 className="size-4 text-success" />
                          ) : (
                            <span className="flex items-start gap-1.5 text-danger">
                              <X className="size-4 shrink-0" />
                              <span className="text-[11px]">{r.errors.join(" ; ")}</span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {done !== null && (
            <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success-soft px-3 py-2.5 text-xs">
              <CheckCircle2 className="size-4 text-success" />
              <p>{t("pages.features.import_done").replace("{count}", String(done))}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
