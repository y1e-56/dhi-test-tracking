import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/dhi-store";
import { useVisibleProductIds } from "@/lib/use-scope";
import { DECISION_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import {
  WATCH_LEVEL_LABEL,
  WATCH_STATUS_LABEL,
  type WatchLevel,
  type WatchStatus,
} from "@/lib/dhi-data";

export const Route = createFileRoute("/points-a-surveiller")({
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

function WatchPointsPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/points-a-surveiller") return <Outlet />;
  return <WatchPointsList />;
}

function WatchPointsList() {
  const { t } = useI18n();
  const { watchPoints, products, features, updateWatchPoint } = useStore();
  const visiblePIds = useVisibleProductIds(products);
  const visibleWps = watchPoints.filter((w) => visiblePIds.has(w.productId));

  return (
    <AppShell
      title={t("pages.watchpoints.title")}
      subtitle={t("pages.watchpoints.subtitle")}
      breadcrumb={t("pages.watchpoints.breadcrumb")}
      tabs={DECISION_TABS}
      actions={
        <Link to="/points-a-surveiller/ajouter">
          <Button size="sm">
            <Plus className="size-4" /> {t("pages.watchpoints.new_point")}
          </Button>
        </Link>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("pages.watchpoints.kpi_tracked")}
          value={visibleWps.length}
          hint={t("pages.watchpoints.kpi_tracked_hint")}
        />
        <KpiCard
          label={t("pages.watchpoints.kpi_critical")}
          value={visibleWps.filter((w) => w.level === "critique" && w.status !== "clos").length}
          tone="danger"
          hint={t("pages.watchpoints.kpi_critical_hint")}
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

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = visibleWps.filter((w) => w.status === col);
          return (
            <Panel
              key={col}
              title={WATCH_STATUS_LABEL[col]}
              actions={<span className="label-eyebrow">{items.length}</span>}
            >
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("pages.watchpoints.none")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((w) => (
                    <li key={w.id} className="rounded-md border border-border p-3">
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
                      <p className="mt-1 text-xs text-muted-foreground">{w.description}</p>
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
                        <Select
                          value={w.status}
                          onValueChange={(v) => {
                            updateWatchPoint(w.id, { status: v as WatchStatus });
                            toast.success(
                              t("pages.watchpoints.status_changed")
                                .replace("{title}", w.title)
                                .replace("{status}", WATCH_STATUS_LABEL[v as WatchStatus]),
                            );
                          }}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMNS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {WATCH_STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
    </AppShell>
  );
}
