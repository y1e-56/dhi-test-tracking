import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { FolderKanban, FlaskConical, Rocket, ListChecks } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { useStore } from "@/lib/dhi-store";
import { loadSession } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard-chef")({
  beforeLoad: () => {
    const session = loadSession();
    if (!session || session.role !== "chef_projet") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard Chef de Projet — DHI Quality Platform" },
      {
        name: "description",
        content: "Espace dédié aux chefs de projet : gestion de projets et campagnes.",
      },
    ],
  }),
  component: ChefDashboard,
});

function ChefDashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { projects, campaigns, products, features } = useStore();
  const session = loadSession();

  const myProjects = projects; // Tous les projets sont visibles pour le chef
  const activeProjects = myProjects.filter((p) => p.status === "encours");

  const myCampaigns = campaigns.filter((c) => myProjects.some((p) => p.id === c.projectId));

  const activeCampaigns = myCampaigns.filter(
    (c) => c.status === "encours" || c.status === "planifiee",
  ).length;

  return (
    <AppShell
      title={t("dashboard.project_lead.title")}
      subtitle={t("dashboard.project_lead.subtitle")}
      breadcrumb={["Chef de Projet", "Dashboard"]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("dashboard.project_lead.projects")}
          value={myProjects.length}
          icon={<FolderKanban className="size-4" />}
          hint={t("dashboard.project_lead.active_projects")}
          onClick={() => void navigate({ to: "/projets" })}
        />
        <KpiCard
          label={t("dashboard.project_lead.active_projects")}
          value={activeProjects.length}
          tone="info"
          hint={t("common.actif")}
          onClick={() => void navigate({ to: "/projets" })}
        />
        <KpiCard
          label={t("dashboard.project_lead.campaigns")}
          value={myCampaigns.length}
          icon={<FlaskConical className="size-4" />}
          hint={t("dashboard.project_lead.active_campaigns")}
          onClick={() => void navigate({ to: "/campagnes" })}
        />
        <KpiCard
          label={t("dashboard.project_lead.active_campaigns")}
          value={activeCampaigns}
          tone={activeCampaigns ? "success" : "warning"}
          hint={t("pages.campaigns.in_progress_hint")}
          onClick={() => void navigate({ to: "/campagnes" })}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("dashboard.executive.active_projects")}
          actions={
            <Link
              to="/projets"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.executive.all_projects")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {activeProjects.slice(0, 5).map((pr) => {
              const product = products.find((p) => p.id === pr.productId);
              return (
                <li key={pr.id}>
                  <Link
                    to="/projets/$projectId"
                    params={{ projectId: pr.id }}
                    className="-mx-4 block px-4 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{pr.name}</p>
                      <span className="num text-xs text-muted-foreground">{pr.progress} %</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product?.name ?? t("common.produit")} · {t("common.version")}{" "}
                      {pr.targetVersion}
                    </p>
                  </Link>
                </li>
              );
            })}
            {activeProjects.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.executive.none")}
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          title={t("pages.campaigns.title")}
          actions={
            <Link
              to="/campagnes"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("pages.campaigns.all_campaigns")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {myCampaigns.slice(0, 5).map((c) => {
              const project = projects.find((p) => p.id === c.projectId);
              return (
                <li key={c.id}>
                  <Link
                    to="/campagnes/$campaignId"
                    params={{ campaignId: c.id }}
                    className="-mx-4 block px-4 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{c.name}</p>
                      <span className="text-xs text-muted-foreground">{c.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project?.name ?? t("common.projet")} · v{c.version} · {c.environment}
                    </p>
                  </Link>
                </li>
              );
            })}
            {myCampaigns.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.executive.none")}
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel title={t("dashboard.tester.quick_actions")}>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/projets"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FolderKanban className="mr-2 size-4" /> {t("dashboard.project_lead.manage_projects")}
          </Link>
          <Link
            to="/campagnes"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <FlaskConical className="mr-2 size-4" /> {t("dashboard.project_lead.view_campaigns")}
          </Link>
          <Link
            to="/fonctionnalites"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ListChecks className="mr-2 size-4" /> {t("dashboard.project_lead.manage_features")}
          </Link>
          <Link
            to="/go-live"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Rocket className="mr-2 size-4" /> {t("dashboard.project_lead.go_live")}
          </Link>
        </div>
      </Panel>
    </AppShell>
  );
}
