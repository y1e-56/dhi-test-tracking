import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { CSV_SEP } from "@/lib/test-import";
import {
  CATEGORIES,
  REQUIREMENT_TEMPLATE_HEADERS,
  buildRequirementTemplate,
  parseRequirementImport,
  type ParsedRequirementRow,
} from "@/lib/requirement-import";
import {
  api,
  backendIdOf,
  toBackendRequirementPriority,
  toBackendRequirementStatus,
  type BackendRequirement,
} from "@/lib/api";

export const Route = createFileRoute("/exigences/importer")({
  head: () => ({
    meta: [{ title: "Importer des exigences — DHI Quality Platform" }],
  }),
  component: ImportRequirementsPage,
});

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {n}
    </span>
  );
}

function ImportRequirementsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { features, products, reloadFromBackend } = useStore();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRequirementRow[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const productFeatures = useMemo(
    () => features.filter((f) => f.productId === productId),
    [features, productId],
  );

  // Le magasin est hydraté de façon asynchrone : sans ce repli, le sélecteur
  // resterait vide si la page est rendue avant l'arrivée des produits.
  useEffect(() => {
    const first = products[0];
    if (!productId && first) setProductId(first.id);
  }, [products, productId]);

  const valid = rows.filter((r) => r.errors.length === 0);
  const invalid = rows.filter((r) => r.errors.length > 0);

  const handleFilePick = async (file: File) => {
    setDone(null);
    const text = await file.text();
    const result = parseRequirementImport(text, productFeatures);
    setFileName(file.name);
    setRows(result.rows);
    setMissingColumns(result.missingColumns);
  };

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF", buildRequirementTemplate()], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modele-import-exigences.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const runImport = async () => {
    if (valid.length === 0) return;
    const productBackend = backendIdOf(productId);
    setBusy(true);
    try {
      const items = valid.map((r) => ({
        title: r.title,
        description: r.description,
        ...(r.category ? { category: r.category } : {}),
        status: toBackendRequirementStatus(r.status),
        priority: toBackendRequirementPriority(r.priority),
        product_id: productBackend ?? null,
        feature_ids: r.featureIds.map((f) => backendIdOf(f)).filter((f): f is number => f != null),
      }));

      const response = await api<{ created: number; requirements: BackendRequirement[] }>(
        "/requirements/bulk",
        { method: "POST", body: JSON.stringify({ items }) },
      );
      setDone(response.created);
      toast.success(
        t("pages.requirements.import_done").replace("{count}", String(response.created)),
      );
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
      title={t("pages.requirements.title")}
      subtitle={t("pages.requirements.subtitle")}
      breadcrumb={t("pages.requirements.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/exigences" })} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("nav.exigences")}
          </Button>
        </div>

        <div className="max-w-5xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{t("pages.requirements.import_title")}</h2>
            <p className="text-sm text-muted-foreground">{t("pages.requirements.import_subtitle")}</p>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex gap-3">
              <StepNumber n={1} />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">{t("pages.requirements.import_step_product")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("pages.requirements.import_product_hint")}
                  </p>
                </div>
                <Select
                  value={productId}
                  onValueChange={(v) => {
                    setProductId(v);
                    setRows([]);
                    setFileName("");
                    setMissingColumns([]);
                  }}
                >
                  <SelectTrigger className="w-full sm:max-w-xs">
                    <SelectValue placeholder={t("pages.requirements.import_product")} />
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
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex gap-3">
              <StepNumber n={2} />
              <div className="min-w-0 flex-1 space-y-3">
                <Label className="text-sm font-semibold">{t("pages.requirements.import_step_file")}</Label>
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
                      ? t("pages.requirements.import_other_file")
                      : t("pages.requirements.import_choose_file")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                    <FileUp className="size-4 mr-1.5" />
                    {t("pages.requirements.import_template")}
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
                      {t("pages.requirements.import_format_details")}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="rounded-md bg-subtle/50 p-3 text-xs text-muted-foreground leading-relaxed space-y-1.5">
                    <p>
                      Colonnes :{" "}
                      <code className="text-[11px]">{REQUIREMENT_TEMPLATE_HEADERS.join(` ${CSV_SEP} `)}</code>
                      {" — séparateur "}
                      <strong>{CSV_SEP}</strong>
                    </p>
                    <p>
                      <strong>titre</strong> est obligatoire.{" "}
                      <strong>fonctionnalites</strong> accepte plusieurs valeurs séparées par <code>|</code>{" "}
                      et peut rester vide (exigence non rattachée).{" "}
                      <strong>categorie</strong> : {CATEGORIES.join(", ")}.
                    </p>
                    <p>
                      Les en-têtes sont tolérés (<code>titre</code>/<code>libelle</code>/<code>intitule</code>,{" "}
                      <code>criticite</code> pour <code>priorite</code>, <code>etat</code> pour <code>statut</code>…).{" "}
                      La priorité accepte basse, moyenne, haute, critique.
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
                {t("pages.requirements.import_missing_columns").replace(
                  "{columns}",
                  missingColumns.join(", "),
                )}
              </p>
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-medium">
                  {t("pages.requirements.import_summary").replace("{valid}", String(valid.length)).replace("{invalid}", String(invalid.length))}
                </span>
                <Button size="sm" onClick={() => void runImport()} disabled={busy || valid.length === 0}>
                  {busy
                    ? t("pages.requirements.import_running")
                    : t("pages.requirements.import_action").replace("{count}", String(valid.length))}
                </Button>
                {invalid.length > 0 && (
                  <span className="text-muted-foreground">
                    {t("pages.requirements.import_skip_invalid")}
                  </span>
                )}
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">L.</TableHead>
                      <TableHead>{t("pages.requirements.form_title")}</TableHead>
                      <TableHead>{t("pages.requirements.fonctionnalites_couvertes")}</TableHead>
                      <TableHead>{t("pages.requirements.priorite")}</TableHead>
                      <TableHead>{t("common.statut")}</TableHead>
                      <TableHead>{t("pages.requirements.import_check")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.line} className={r.errors.length > 0 ? "bg-danger-soft/40" : undefined}>
                        <TableCell className="text-muted-foreground text-xs">{r.line}</TableCell>
                        <TableCell className="text-xs font-medium max-w-xs">
                          <span className="line-clamp-2">{r.title || "—"}</span>
                          {r.description ? (
                            <span className="line-clamp-1 text-[11px] text-muted-foreground">{r.description}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.featureIds.length > 0 ? (
                            <span className="font-mono text-[11px]">{r.featureIds.join(", ")}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <CriticalityBadge level={r.priority} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {t(
                            (
                              {
                                brouillon: "pages.requirements.status_brouillon",
                                validee: "pages.requirements.status_validee",
                                couverte: "pages.requirements.status_couverte",
                              } as const
                            )[r.status]
                          )}
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
              <p>{t("pages.requirements.import_done").replace("{count}", String(done))}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
