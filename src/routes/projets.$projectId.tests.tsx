import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, VerdictBadge } from "@/components/dhi/indicators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { projects as seedProjects } from "@/lib/dhi-data";
import { projectTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/projets/$projectId/tests")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const projects = snapshot?.projects ?? seedProjects;
    const pr = projects.find((x) => x.id === params.projectId);
    return { name: pr?.name ?? "Projet" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Cas de test · ${loaderData?.name ?? "Projet"} — DHI Quality Platform` }],
  }),
  component: ProjectTests,
});

function ProjectTests() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const { projects, campaigns, tests } = useStore();
  const project = projects.find((p) => p.id === projectId);

  const campaignIds = new Set(campaigns.filter((c) => c.projectId === projectId).map((c) => c.id));
  const rows = tests.filter((x) => campaignIds.has(x.campaignId));

  return (
    <AppShell
      title={project?.name ?? t("nav.project_tests")}
      subtitle={t("nav.project_tests")}
      breadcrumb={[t("nav.qualite"), t("nav.projets"), project?.name ?? "", t("nav.project_tests")]}
      tabs={projectTabs(projectId)}
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.id")}</TableHead>
              <TableHead>{t("pages.campaign_detail.test")}</TableHead>
              <TableHead>{t("common.campagne")}</TableHead>
              <TableHead>{t("common.criticite")}</TableHead>
              <TableHead>{t("common.verdict")}</TableHead>
              <TableHead>{t("common.testeur")}</TableHead>
              <TableHead className="text-right">{t("pages.campaign_detail.execution")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((tc) => {
              const camp = campaigns.find((c) => c.id === tc.campaignId);
              return (
                <TableRow key={tc.id}>
                  <TableCell className="num font-medium">{tc.id}</TableCell>
                  <TableCell className="max-w-xs truncate">{tc.name}</TableCell>
                  <TableCell className="text-sm">
                    {camp ? (
                      <Link
                        to="/campagnes/$campaignId"
                        params={{ campaignId: camp.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {camp.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <CriticalityBadge level={tc.criticality} />
                  </TableCell>
                  <TableCell>
                    <VerdictBadge verdict={tc.verdict} />
                  </TableCell>
                  <TableCell className="text-sm">{tc.tester ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/execution/$testId"
                      params={{ testId: tc.id }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t("pages.campaign_detail.executer")}
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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