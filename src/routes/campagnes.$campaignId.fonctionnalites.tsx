import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, QualityBar } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { campaigns as seedCampaigns, TEST_TYPES } from "@/lib/dhi-data";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/campagnes/$campaignId/fonctionnalites")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const c = campaigns.find((x) => x.id === params.campaignId);
    return { name: c?.name ?? "Campagne" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Fonctionnalités · ${loaderData?.name ?? "Campagne"} — DHI Quality Platform` }],
  }),
  component: CampaignFeatures,
});

const coveragePct = (f: ReturnType<typeof useStore>["features"][number]) => {
  const total = TEST_TYPES.length;
  const covered = TEST_TYPES.filter((t) => f.coverage[t.id]).length;
  return Math.round((covered / total) * 100);
};

function FeatureCells({ feature }: { feature: ReturnType<typeof useStore>["features"][number] }) {
  const { t } = useI18n();
  const pct = coveragePct(feature);
  const covered = TEST_TYPES.filter((x) => feature.coverage[x.id]).length;
  return (
    <>
      <TableCell>
        <p className="font-medium">{feature.name}</p>
        <p className="max-w-xs truncate text-xs text-muted-foreground">{feature.description}</p>
      </TableCell>
      <TableCell>
        <CriticalityBadge level={feature.criticality} />
      </TableCell>
      <TableCell className="num text-sm">
        {covered} / {TEST_TYPES.length} {t("pages.features.types")}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <QualityBar value={pct} className="flex-1" />
          <span className="num w-12 text-right text-sm">{pct} %</span>
        </div>
      </TableCell>
    </>
  );
}

function CampaignFeatures() {
  const { campaignId } = Route.useParams();
  const { t } = useI18n();
  const { campaigns, tests, features, updateCampaign } = useStore();
  const campaign = campaigns.find((c) => c.id === campaignId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [featureQuery, setFeatureQuery] = useState("");

  const importedIds = useMemo(() => new Set(campaign?.featureIds ?? []), [campaign?.featureIds]);
  const fromTests = useMemo(() => {
    const ids = new Set(tests.filter((x) => x.campaignId === campaignId).map((x) => x.featureId));
    return [...ids].filter((id) => !importedIds.has(id));
  }, [tests, campaignId, importedIds]);

  const importedRows = features.filter((f) => importedIds.has(f.id));
  const testRows = features.filter((f) => fromTests.includes(f.id));

  const productFeatures = useMemo(
    () => (campaign ? features.filter((f) => f.productId === campaign.productId) : []),
    [features, campaign],
  );

  const filteredFeatures = useMemo(() => {
    const q = featureQuery.trim().toLowerCase();
    if (!q) return productFeatures;
    return productFeatures.filter(
      (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q),
    );
  }, [productFeatures, featureQuery]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const attach = () => {
    if (selected.size === 0) {
      toast.info(t("pages.campaign_detail.aucune_selectionnee"));
      return;
    }
    const merged = new Set([...importedIds, ...selected]);
    updateCampaign(campaignId, { featureIds: [...merged] });
    toast.success(t("pages.campaign_detail.import_fonctionnalites_ok", { n: selected.size }));
    setSelected(new Set());
    setPickerOpen(false);
  };

  const remove = (id: string) => {
    const merged = new Set(importedIds);
    merged.delete(id);
    updateCampaign(campaignId, { featureIds: [...merged] });
    toast.success(t("pages.campaign_detail.retrait_fonctionnalite_ok"));
  };

  return (
    <AppShell
      title={campaign?.name ?? t("nav.campaign_features")}
      subtitle={t("nav.campaign_features")}
      breadcrumb={[t("nav.execution"), t("nav.campagnes"), campaign?.name ?? "", t("nav.campaign_features")]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="flex flex-col gap-6">
        <section className="panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t("pages.campaign_detail.fonctionnalites_importees")}</h3>
            <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t("pages.campaign_detail.importer_fonctionnalites")}
            </Button>
          </div>
          {importedRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("pages.campaign_detail.aucune_fonctionnalite_importee")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.fonctionnalite")}</TableHead>
                  <TableHead>{t("common.criticite")}</TableHead>
                  <TableHead>{t("pages.features.tests_covered")}</TableHead>
                  <TableHead className="w-56">{t("pages.features.coverage")}</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {importedRows.map((f) => (
                  <TableRow key={f.id}>
                    <FeatureCells feature={f} />
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => remove(f.id)} title={t("pages.campaign_detail.retirer")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <section className="panel">
          <h3 className="mb-4 text-sm font-semibold">{t("pages.campaign_detail.definies_par_tests")}</h3>
          <Table>
            <TableBody>
              {testRows.map((f) => (
                <TableRow key={f.id}>
                  <FeatureCells feature={f} />
                </TableRow>
              ))}
              {testRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    {t("pages.features.no_features")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </section>
      </div>

      <Dialog
        open={pickerOpen}
        onOpenChange={(o) => {
          setPickerOpen(o);
          if (!o) {
            setFeatureQuery("");
            setSelected(new Set());
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages.campaign_detail.importer_fonctionnalites")}</DialogTitle>
            <DialogDescription>{t("pages.campaign_detail.selectionner_fonctionnalites")}</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={featureQuery}
              onChange={(e) => setFeatureQuery(e.target.value)}
              placeholder={t("pages.campaign_detail.rechercher_fonctionnalite")}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {selected.size} {t("pages.add_campaign.selectionnes_compteur")} · {filteredFeatures.length} / {productFeatures.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected(new Set(filteredFeatures.map((f) => f.id)))}
                className="font-medium text-primary hover:underline"
              >
                {t("pages.add_campaign.tout_selectionner")}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="font-medium text-destructive hover:underline"
              >
                {t("pages.add_campaign.tout_effacer")}
              </button>
            </div>
          </div>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {filteredFeatures.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 hover:bg-muted"
              >
                <Checkbox checked={selected.has(f.id)} onCheckedChange={() => toggle(f.id)} className="mt-0.5" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{f.name}</span>
                  <span className="block max-w-md truncate text-xs text-muted-foreground">{f.description}</span>
                </span>
              </label>
            ))}
            {filteredFeatures.length === 0 ? (
              productFeatures.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("pages.features.no_features")}
                </p>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("pages.campaign_detail.aucun_resultat_fonctionnalite")}
                </p>
              )
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              {t("pages.campaign_detail.fermer")}
            </Button>
            <Button onClick={attach}>{t("pages.campaign_detail.rattacher")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}