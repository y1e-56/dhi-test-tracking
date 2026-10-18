import { createFileRoute, Link, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isInteractiveClick } from "@/lib/clickable-row";
import { useStore } from "@/lib/dhi-store";
import { getUser, watchPointVisibleTo } from "@/lib/access";

import { useI18n } from "@/lib/i18n";
import { canManageCampaign, canManageOperational } from "@/lib/role-protection";
import {
  CLOSED_PREVIEW,
  filterWatchPoints,
  hasActiveFilters,
  sortWatchPoints,
  type WatchFilters,
} from "@/lib/watch-points";
import {
  WATCH_LEVEL_LABEL,
  WATCH_STATUS_LABEL,
  type WatchLevel,
  type WatchPoint,
  type WatchStatus,
} from "@/lib/dhi-data";

export const Route = createFileRoute("/points-a-surveiller")({
  // Filtres dans l'URL : une vue filtree se partage et survit a un rechargement.
  validateSearch: z.object({
    q: z.string().optional().catch(undefined),
    produit: z.string().optional().catch(undefined),
    niveau: z.enum(["critique", "vigilance", "info"]).optional().catch(undefined),
    responsable: z.string().optional().catch(undefined),
    mine: z.boolean().optional().catch(undefined),
  }),
  head: () => ({
    meta: [
      { title: "Points à surveiller — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Registre des points de vigilance qualité : dettes techniques, zones fragiles et risques à suivre avant mise en production.",
      },
      { property: "og:title", content: "Points à surveiller — DHI Quality Platform" },
      { property: "og:description", content: "Registre des risques qualité et de leur suivi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WatchPointsPage,
});

const LEVEL_STYLE: Record<WatchLevel, string> = {
  critique: "border-danger/30 bg-danger-soft text-danger",
  vigilance: "border-warning/40 bg-warning-soft text-warning",
  info: "border-border bg-secondary text-secondary-foreground",
};

const COLUMNS: WatchStatus[] = ["ouvert", "suivi", "clos"];
/** Valeur « tous » des selecteurs de filtre. */
const ALL = "__all";

function WatchPointDetailDialog({
  watchPoint,
  productName,
  featureName,
  open,
  onOpenChange,
}: {
  watchPoint: WatchPoint | null;
  productName: string;
  featureName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  if (!watchPoint) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <span className="min-w-0 flex-1">{watchPoint.title}</span>
            <span
              className={cn(
                "shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
                LEVEL_STYLE[watchPoint.level],
              )}
            >
              {WATCH_LEVEL_LABEL[watchPoint.level]}
            </span>
          </DialogTitle>
          <DialogDescription className="num">
            {t("pages.watchpoints.titre")} · {watchPoint.id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{watchPoint.description}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-muted-foreground">{t("pages.watchpoints.produit")}</dt>
            <dd>
              <Link
                to="/produits/$productId"
                params={{ productId: watchPoint.productId }}
                className="text-primary hover:underline"
              >
                {productName}
              </Link>
            </dd>
            <dt className="text-muted-foreground">{t("pages.watchpoints.feature")}</dt>
            <dd>{featureName}</dd>
            <dt className="text-muted-foreground">{t("pages.watchpoints.responsable")}</dt>
            <dd>{watchPoint.owner}</dd>
            <dt className="text-muted-foreground">{t("common.statut")}</dt>
            <dd>{WATCH_STATUS_LABEL[watchPoint.status]}</dd>
          </dl>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("actions.fermer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WatchPointsPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/points-a-surveiller") return <Outlet />;
  return <WatchPointsList />;
}

function WatchPointsList() {
  const { t } = useI18n();
  const { watchPoints, products, campaigns, features, updateWatchPoint } = useStore();
  // Visibles sur les produits ou l'utilisateur travaille (campagnes comprises) :
  // un chef testeur ou un testeur ne voyait aucun point.
  const user = getUser();
  const visibleWps = watchPoints.filter((w) => watchPointVisibleTo(w, products, campaigns, user));
  const [detail, setDetail] = useState<WatchPoint | null>(null);
  const [showAllClosed, setShowAllClosed] = useState(false);

  const filters: WatchFilters = Route.useSearch();
  const navigate = useNavigate({ from: "/points-a-surveiller" });
  const setFilter = (patch: Partial<WatchFilters>) =>
    void navigate({
      search: (prev: WatchFilters) => {
        const next: WatchFilters = { ...prev, ...patch };
        // Une valeur vide retire le filtre de l'URL.
        for (const key of Object.keys(next) as (keyof WatchFilters)[]) {
          if (next[key] === undefined || next[key] === "" || next[key] === false) delete next[key];
        }
        return next;
      },
      replace: true,
    });
  const resetFilters = () => void navigate({ search: {}, replace: true });
  const active = hasActiveFilters(filters);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "";
  const featureName = (id: string | undefined) =>
    id ? (features.find((f) => f.id === id)?.name ?? "") : "";
  const shown = sortWatchPoints(
    filterWatchPoints(visibleWps, filters, { productName, featureName, me: user?.name }),
  );
  const productOptions = [...new Set(visibleWps.map((w) => w.productId))]
    .map((id) => ({ value: id, label: productName(id) || id }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const ownerOptions = [...new Set(visibleWps.map((w) => w.owner).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((o) => ({ value: o, label: o }));

  return (
    <AppShell
      title={t("pages.watchpoints.title")}
      subtitle={t("pages.watchpoints.subtitle")}
      breadcrumb={t("pages.watchpoints.breadcrumb")}
      actions={
        canManageOperational() ? (
          <Link to="/points-a-surveiller/ajouter">
            <Button size="sm">
              <Plus className="size-4" /> {t("pages.watchpoints.new_point")}
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("pages.watchpoints.kpi_tracked")}
          value={visibleWps.length}
          hint={t("pages.watchpoints.kpi_tracked_hint")}
          onClick={resetFilters}
        />
        <KpiCard
          label={t("pages.watchpoints.kpi_critical")}
          value={visibleWps.filter((w) => w.level === "critique" && w.status !== "clos").length}
          tone="danger"
          hint={t("pages.watchpoints.kpi_critical_hint")}
          onClick={() => setFilter({ niveau: "critique" })}
        />
        <KpiCard
          label={t("pages.watchpoints.kpi_followup")}
          value={visibleWps.filter((w) => w.status === "suivi").length}
          tone="info"
          hint={t("pages.watchpoints.kpi_followup_hint")}
        />
        <KpiCard
          label={t("pages.watchpoints.kpi_closed")}
          value={visibleWps.filter((w) => w.status === "clos").length}
          tone="success"
          hint={t("pages.watchpoints.kpi_closed_hint")}
        />
      </div>

      <div className="panel mb-4 flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q ?? ""}
            onChange={(e) => setFilter({ q: e.target.value })}
            placeholder={t("pages.watchpoints.search_placeholder")}
            className="h-9 pl-8"
          />
        </div>
        <SearchableSelect
          value={filters.produit ?? ALL}
          onValueChange={(v) => setFilter({ produit: v === ALL ? undefined : v })}
          options={[{ value: ALL, label: t("pages.watchpoints.all_products") }, ...productOptions]}
          className="h-9 w-48"
        />
        <SearchableSelect
          value={filters.niveau ?? ALL}
          onValueChange={(v) => setFilter({ niveau: v === ALL ? undefined : (v as WatchLevel) })}
          options={[
            { value: ALL, label: t("pages.watchpoints.all_levels") },
            ...(["critique", "vigilance", "info"] as WatchLevel[]).map((l) => ({
              value: l,
              label: WATCH_LEVEL_LABEL[l],
            })),
          ]}
          className="h-9 w-40"
        />
        <SearchableSelect
          value={filters.responsable ?? ALL}
          onValueChange={(v) => setFilter({ responsable: v === ALL ? undefined : v })}
          options={[{ value: ALL, label: t("pages.watchpoints.all_owners") }, ...ownerOptions]}
          className="h-9 w-48"
        />
        <Button
          type="button"
          size="sm"
          variant={filters.mine ? "default" : "outline"}
          className="h-9"
          aria-pressed={filters.mine === true}
          onClick={() => setFilter({ mine: !filters.mine })}
        >
          {t("pages.watchpoints.mine")}
        </Button>
        {active ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 gap-1"
            onClick={resetFilters}
          >
            <X className="size-4" /> {t("pages.watchpoints.reset")}
          </Button>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">
          {t("pages.watchpoints.results").replace("{n}", String(shown.length))}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const all = shown.filter((w) => w.status === col);
          // « Clos » se consulte rarement : apercu des plus recents, le reste sur demande.
          const truncated = col === "clos" && !showAllClosed && all.length > CLOSED_PREVIEW;
          const items = truncated
            ? [...all]
                .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
                .slice(0, CLOSED_PREVIEW)
            : all;
          return (
            <Panel
              key={col}
              title={WATCH_STATUS_LABEL[col]}
              actions={<span className="label-eyebrow">{all.length}</span>}
            >
              {all.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {active ? t("pages.watchpoints.no_match") : t("pages.watchpoints.none")}
                </p>
              ) : (
                <>
                  <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                    {items.map((w) => (
                      <li
                        key={w.id}
                        className="cursor-pointer rounded-md border border-border p-3 transition-colors hover:border-border-strong"
                        onClick={(e) => {
                          if (isInteractiveClick(e)) return;
                          setDetail(w);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{w.title}</p>
                          <span
                            className={cn(
                              "shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
                              LEVEL_STYLE[w.level],
                            )}
                          >
                            {WATCH_LEVEL_LABEL[w.level]}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {w.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="num text-xs text-muted-foreground/80">
                            <Link
                              to="/produits/$productId"
                              params={{ productId: w.productId }}
                              className="text-primary hover:underline"
                            >
                              {products.find((p) => p.id === w.productId)?.name ?? "—"}
                            </Link>
                            {w.featureId && (
                              <>
                                {" · "}
                                {features.find((f) => f.id === w.featureId)?.name ?? "—"}
                              </>
                            )}
                            {" · "}
                            {w.owner}
                          </p>
                          {/* Modifier un point est reserve aux responsables de campagne,
                            comme cote serveur (requireWatchPointManager). */}
                          {canManageCampaign() ? (
                            <SearchableSelect
                              value={w.status}
                              onValueChange={(v) => {
                                updateWatchPoint(w.id, { status: v as WatchStatus });
                                toast.success(
                                  t("pages.watchpoints.status_changed")
                                    .replace("{title}", w.title)
                                    .replace("{status}", WATCH_STATUS_LABEL[v as WatchStatus]),
                                );
                              }}
                              options={COLUMNS.map((s) => ({
                                value: s,
                                label: WATCH_STATUS_LABEL[s],
                              }))}
                              className="h-7 w-28 text-xs"
                            />
                          ) : (
                            <span className="label-eyebrow">{WATCH_STATUS_LABEL[w.status]}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {col === "clos" && all.length > CLOSED_PREVIEW ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setShowAllClosed((v) => !v)}
                    >
                      {showAllClosed
                        ? t("pages.watchpoints.show_less")
                        : t("pages.watchpoints.show_all").replace("{n}", String(all.length))}
                    </Button>
                  ) : null}
                </>
              )}
            </Panel>
          );
        })}
      </div>

      <WatchPointDetailDialog
        watchPoint={detail}
        productName={products.find((p) => p.id === detail?.productId)?.name ?? "—"}
        featureName={
          detail?.featureId ? (features.find((f) => f.id === detail.featureId)?.name ?? "—") : "—"
        }
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      />
    </AppShell>
  );
}
