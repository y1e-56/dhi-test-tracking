import { createFileRoute, Link, useNavigate, Outlet, useMatches } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, QualityBar, StatusBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type CampaignStatus } from "@/lib/dhi-data";
import { canCreate } from "@/lib/role-protection";
import { visibleCampaigns, getUser } from "@/lib/access";
import { EXECUTION_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { campaignStats, useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/campagnes")({
  head: () => ({
    meta: [
      { title: "Campagnes de tests — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Créer, planifier et suivre les campagnes de tests : avancement, taux de réussite et environnements.",
      },
      { property: "og:title", content: "Campagnes de tests — DHI Quality Platform" },
      {
        property: "og:description",
        content: "Suivi des campagnes de tests et de leur avancement.",
      },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/campagnes") return <Outlet />;
  return <CampaignsList />;
}

function CampaignsList() {
  const { t } = useI18n();
  const { campaigns, tests, products, projects } = useStore();
  const navigate = useNavigate();

  const viewable = visibleCampaigns(campaigns, products, getUser());

  const avgExecution = viewable.length
    ? Math.round(
        viewable.reduce((sum, c) => sum + campaignStats(tests, c.id).executionRate, 0) /
          viewable.length,
      )
    : 0;

  return (
    <AppShell
      title={t("pages.campaigns.title")}
      subtitle={t("pages.campaigns.subtitle")}
      breadcrumb={t("pages.campaigns.breadcrumb")}
      tabs={EXECUTION_TABS}
      actions={
        canCreate() ? (
          <Button size="sm" asChild>
            <Link to="/campagnes/ajouter">
              <Plus className="size-4" /> {t("pages.campaigns.new_campaign")}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("common.campagne")}
          value={viewable.length}
          hint={t("pages.campaigns.all_versions")}
        />
        <KpiCard
          label={t("pages.campaigns.in_progress")}
          value={viewable.filter((c) => c.status === "encours").length}
          tone="info"
          hint={t("pages.campaigns.in_progress_hint")}
        />
        <KpiCard
          label={t("pages.campaigns.planned")}
          value={viewable.filter((c) => c.status === "planifiee" || c.status === "avenir").length}
          hint={t("pages.campaigns.to_start")}
        />
        <KpiCard
          label={t("pages.campaigns.avg_execution")}
          value={`${avgExecution} %`}
          tone={avgExecution >= 85 ? "success" : avgExecution >= 60 ? "warning" : "danger"}
          hint={t("pages.campaigns.all_scope")}
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex h-11 items-center justify-between gap-2 border-b border-border bg-subtle px-4">
          <h2 className="text-[13px] font-semibold tracking-tight">
            {t("pages.campaigns.all_campaigns")}
          </h2>
          <p className="label-eyebrow">
            {t("pages.campaigns.entries").replace("{count}", String(viewable.length))}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.campaigns.campaign")}</TableHead>
              <TableHead>{t("pages.campaigns.product")}</TableHead>
              <TableHead>{t("pages.campaigns.project")}</TableHead>
              <TableHead>{t("pages.campaigns.version")}</TableHead>
              <TableHead>{t("pages.campaigns.state")}</TableHead>
              <TableHead className="w-56">{t("pages.campaigns.progress")}</TableHead>
              <TableHead className="text-right">{t("pages.campaigns.success")}</TableHead>
              <TableHead>{t("pages.campaigns.owner")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewable.map((c) => {
              const st = campaignStats(tests, c.id);
              const product = products.find((p) => p.id === c.productId);
              const project = projects.find((p) => p.id === c.projectId);
              return (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ to: "/campagnes/$campaignId", params: { campaignId: c.id } })
                  }
                >
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm" onClick={(e) => e.stopPropagation()}>
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
                  </TableCell>
                  <TableCell className="text-sm" onClick={(e) => e.stopPropagation()}>
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
                  </TableCell>
                  <TableCell className="num">{c.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <QualityBar value={st.executionRate} neutral className="flex-1" />
                      <span className="num w-10 text-right text-sm">{st.executionRate} %</span>
                    </div>
                  </TableCell>
                  <TableCell className="num text-right">
                    {st.executionRate > 0 ? `${st.successRate} %` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{c.owner}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
