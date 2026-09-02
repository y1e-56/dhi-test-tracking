import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/dhi/AppShell";
import { QualityBar, StatusBadge } from "@/components/dhi/indicators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { campaignStats, loadSnapshot, useStore } from "@/lib/dhi-store";
import { projects as seedProjects } from "@/lib/dhi-data";
import { projectTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/projets/$projectId/campagnes")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const projects = snapshot?.projects ?? seedProjects;
    const pr = projects.find((x) => x.id === params.projectId);
    return { name: pr?.name ?? "Projet" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Campagnes · ${loaderData?.name ?? "Projet"} — DHI Quality Platform` }],
  }),
  component: ProjectCampaigns,
});

function ProjectCampaigns() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const { projects, campaigns, tests } = useStore();
  const project = projects.find((p) => p.id === projectId);

  const rows = campaigns.filter((c) => c.projectId === projectId);

  return (
    <AppShell
      title={project?.name ?? t("nav.project_campaigns")}
      subtitle={t("nav.project_campaigns")}
      breadcrumb={[t("nav.qualite"), t("nav.projets"), project?.name ?? "", t("nav.project_campaigns")]}
      tabs={projectTabs(projectId)}
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.campagne")}</TableHead>
              <TableHead>{t("common.version")}</TableHead>
              <TableHead>{t("common.etat")}</TableHead>
              <TableHead>{t("pages.campaigns.progress")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const st = campaignStats(tests, c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to="/campagnes/$campaignId"
                      params={{ campaignId: c.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="num">{c.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <QualityBar value={st.executionRate} neutral />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {t("pages.project_detail.no_campaigns")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}