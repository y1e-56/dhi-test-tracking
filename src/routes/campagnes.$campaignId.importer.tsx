import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, FileUp, Upload, X } from "lucide-react";
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
import { getUser, campaignVisibleTo } from "@/lib/access";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import { campaigns as seedCampaigns } from "@/lib/dhi-data";
import {
  CSV_SEP,
  exportCsvTemplate,
  exportNorTemplate,
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

function ImportTestsPage() {
  const { campaignId } = Route.useParams();
  const store = useStore();
  const { campaigns, features, products, addTestCase } = store;
  const { t } = useI18n();
  const navigate = useNavigate();
  const campaign = campaigns.find((c) => c.id === campaignId);

  const [importFileName, setImportFileName] = useState("");
  const [importPreview, setImportPreview] = useState<ParsedTestRow[]>([]);
  const [importReady, setImportReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const campaignFeatures = useMemo(
    () => features.filter((f) => f.productId === campaign?.productId),
    [features, campaign?.productId],
  );

  if (campaign && !campaignVisibleTo(campaign, products, getUser())) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (!campaign) return null;

  const handleFilePick = (file: File) => {
    setImportFileName(file.name);
    setImportPreview([]);
    setImportReady(false);
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
          file.name.toLowerCase().endsWith(".txt")
            ? t("pages.campaign_detail.fichier_invalide")
            : t("pages.campaign_detail.colonne_nom_introuvable"),
        );
        return;
      }
      setImportPreview(parsed);
      setImportReady(parsed.some((p) => !p.errors.length));
      const ok = parsed.filter((p) => p.errors.length === 0).length;
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

  const handleImportSubmit = () => {
    const validRows = importPreview.filter(
      (r) => r.name.trim().length > 0 && r.featureId.length > 0,
    );
    if (validRows.length === 0) {
      toast.error(t("pages.campaign_detail.aucune_ligne_valide"));
      return;
    }
    let created = 0;
    for (const row of validRows) {
      addTestCase({
        campaignId: campaign.id,
        featureId: row.featureId,
        name: row.name.trim(),
        criticality: row.criticality,
        type: row.type,
        tester: row.tester || undefined,
        preconditions: row.preconditions,
        steps: row.steps,
        expected: row.expected,
      });
      created++;
    }
    toast.success(t("pages.campaign_detail.import_success").replace("{n}", String(created)));
    navigate({ to: "/campagnes/$campaignId", params: { campaignId: campaign.id } });
  };

  const importValidCount = importPreview.filter(
    (r) => r.name.trim().length > 0 && r.featureId.length > 0,
  ).length;

  return (
    <AppShell
      title={`${t("common.campagne")} : ${campaign.name}`}
      subtitle={t("campagne_import.title")}
      breadcrumb={[t("nav.execution"), t("pages.campaigns.campaigns"), campaign.name]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                to: "/campagnes/$campaignId",
                params: { campaignId: campaign.id },
              })
            }
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("pages.campaigns.campaigns")}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{t("campagne_import.title")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("campagne_import.format_colonnes")} :{" "}
              <code className="text-[11px]">
                nom ; fonctionnalite ; criticite ; type ; testeur ; preconditions ; steps ; expected
              </code>
              . {t("campagne_import.separateur")} : <strong>{CSV_SEP}</strong>.{" "}
              {t("pages.campaign_detail.multilignes")}. Format <strong>NOR (.txt)</strong> : titres
              de sections <em>Préconditions:</em>, <em>Étapes:</em>, <em>Résultats attendus:</em>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,.txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFilePick(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4 mr-1.5" />
              {importFileName
                ? t("campagne_import.autre_fichier")
                : t("campagne_import.choisir_fichier")}
            </Button>
            {importFileName ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success-soft border border-success/30 rounded-md px-2 py-1">
                <CheckCircle2 className="size-3.5" />
                {importFileName}
              </span>
            ) : null}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportCsvTemplate(campaignFeatures)}
                title="Modèle CSV"
              >
                <FileUp className="size-4 mr-1.5" /> {t("campagne_import.telecharger_modele")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportNorTemplate(campaignFeatures)}
                title="Modèle NOR (.txt)"
              >
                <FileUp className="size-4 mr-1.5" /> NOR (.txt)
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border bg-subtle/50 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">{t("campagne_import.aide_titre")} :</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                <code>fonctionnalite</code> {t("pages.campaign_detail.aide_fonctionnalite")}
              </li>
              <li>
                <code>criticite</code> : critique, haute, moyenne, basse.
              </li>
              <li>
                <code>type</code> : fonctionnel, regression, securite, performance, etc.
              </li>
              <li>
                <code>preconditions / steps / expected</code> :{" "}
                {t("pages.campaign_detail.aide_separateurs")}
              </li>
            </ul>
          </div>

          <div className="overflow-auto rounded-md border border-border">
            {importPreview.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-muted-foreground">
                <FileUp className="size-10 opacity-50" />
                <p className="text-sm">{t("campagne_import.aucun_fichier")}</p>
                <p className="text-xs">{t("pages.campaign_detail.choisir_csv_preview")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-subtle/90 backdrop-blur">
                  <TableRow>
                    <TableHead className="text-[11px]">#</TableHead>
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
                  {importPreview.map((row, i) => (
                    <TableRow
                      key={i}
                      className={row.errors.length ? "bg-danger-soft/40" : undefined}
                    >
                      <TableCell className="num text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs max-w-[220px] truncate" title={row.name}>
                        <span className="font-medium truncate">
                          {row.name || t("pages.campaign_detail.vide_paren")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">
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
                      <TableCell className="text-xs max-w-[200px]">
                        {row.errors.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 className="size-3.5" /> {t("common.ok")}
                          </span>
                        ) : (
                          <div className="flex flex-col text-danger" title={row.errors.join(" — ")}>
                            {row.errors.slice(0, 1).map((err, j) => (
                              <span key={j} className="truncate">
                                ⚠ {err}
                              </span>
                            ))}
                            {row.errors.length > 1 ? (
                              <span className="text-[10px] text-muted-foreground">
                                +{row.errors.length - 1} {t("campagne_import.avertissements")}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <div className="flex-1 text-xs text-muted-foreground">
              {importPreview.length > 0 ? (
                <>
                  {t("pages.campaign_detail.lignes_importables")
                    .replace(
                      "{ok}",
                      String(importPreview.filter((r) => r.errors.length === 0).length),
                    )
                    .replace("{total}", String(importPreview.length))}{" "}
                  {t("campagne_import.ignorer_lignes")}
                </>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate({
                  to: "/campagnes/$campaignId",
                  params: { campaignId: campaign.id },
                })
              }
              className="h-11 px-6"
            >
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
