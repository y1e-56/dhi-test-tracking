import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, QualityBar } from "@/components/dhi/indicators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { projects as seedProjects, TEST_TYPES } from "@/lib/dhi-data";
import { projectTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/projets/$projectId/fonctionnalites")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const projects = snapshot?.projects ?? seedProjects;
    const pr = projects.find((x) => x.id === params.projectId);
    return { name: pr?.name ?? "Projet" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Fonctionnalités · ${loaderData?.name ?? "Projet"} — DHI Quality Platform` }],
  }),
  component: ProjectFeatures,
});

const coveragePct = (f: ReturnType<typeof useStore>["features"][number]) => {
  const total = TEST_TYPES.length;
  const covered = TEST_TYPES.filter((t) => f.coverage[t.id]).length;
  return Math.round((covered / total) * 100);
};

function ProjectFeatures() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const { projects, features } = useStore();
  const project = projects.find((p) => p.id === projectId);

  const productId = project?.productId;
  const rows = features.filter((f) => f.productId === productId);

  return (
    <AppShell
      title={project?.name ?? t("nav.project_features")}
      subtitle={t("nav.project_features")}
      breadcrumb={[t("nav.qualite"), t("nav.projets"), project?.name ?? "", t("nav.project_features")]}
      tabs={projectTabs(projectId)}
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.fonctionnalite")}</TableHead>
              <TableHead>{t("common.criticite")}</TableHead>
              <TableHead>{t("pages.features.tests_covered")}</TableHead>
              <TableHead className="w-56">{t("pages.features.coverage")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => {
              const pct = coveragePct(f);
              const covered = TEST_TYPES.filter((x) => f.coverage[x.id]).length;
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    <p className="font-medium">{f.name}</p>
                    <p className="max-w-xs truncate text-xs text-muted-foreground">
                      {f.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <CriticalityBadge level={f.criticality} />
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
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {t("pages.features.no_features")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}