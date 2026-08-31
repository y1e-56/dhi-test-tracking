import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { FlaskConical, Bug, History } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { useStore } from "@/lib/dhi-store";
import { loadSession } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard-testeur")({
  beforeLoad: () => {
    const session = loadSession();
    if (!session || session.role !== "testeur") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard Testeur — DHI Quality Platform" },
      {
        name: "description",
        content: "Espace dédié aux testeurs : campagnes de tests et anomalies.",
      },
    ],
  }),
  component: TesteurDashboard,
});

function TesteurDashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { campaigns, tests, defects } = useStore();
  const session = loadSession();

  const myCampaigns = campaigns.filter(
    (c) => c.testers.some((t) => t === session?.name) || c.owner === session?.name,
  );

  const myTests = tests.filter((t) => myCampaigns.some((c) => c.id === t.campaignId));

  const myDefects = defects.filter(
    (d) => d.assignee === session?.name || d.reporter === session?.name,
  );

  const activeCampaigns = myCampaigns.filter(
    (c) => c.status === "encours" || c.status === "planifiee",
  ).length;

  const openDefects = myDefects.filter((d) => d.status !== "fermee").length;

  return (
    <AppShell
      title={t("dashboard.tester.title")}
      subtitle={t("dashboard.tester.subtitle")}
      breadcrumb={["Testeur", "Dashboard"]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={t("dashboard.tester.my_campaigns")}
          value={myCampaigns.length}
          icon={<FlaskConical className="size-4" />}
          hint={t("dashboard.tester.active_campaigns")}
          onClick={() => void navigate({ to: "/campagnes" })}
        />
        <KpiCard
          label={t("dashboard.tester.active_campaigns")}
          value={activeCampaigns}
          tone="info"
          hint={t("pages.campaigns.in_progress_hint")}
          onClick={() => void navigate({ to: "/campagnes" })}
        />
        <KpiCard
          label={t("dashboard.tester.my_defects")}
          value={myDefects.length}
          tone={openDefects ? "warning" : "success"}
          icon={<Bug className="size-4" />}
          hint={t("dashboard.tester.quick_actions")}
          onClick={() => void navigate({ to: "/anomalies" })}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("dashboard.tester.my_campaigns")}
          actions={
            <Link
              to="/campagnes"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.tester.all_campaigns")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {myCampaigns.slice(0, 5).map((c) => {
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
                      {c.type} · v{c.version} · {c.environment}
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

        <Panel
          title={t("dashboard.tester.my_defects")}
          actions={
            <Link
              to="/anomalies"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.tester.all_defects")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {myDefects
              .filter((d) => d.status !== "fermee")
              .slice(0, 5)
              .map((d) => {
                return (
                  <li key={d.id}>
                    <div className="-mx-4 block px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{d.title}</p>
                        <span className="text-xs text-muted-foreground">{d.severity}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.status} · {d.assignee || t("pages.dashboards.tester.unassigned")}
                      </p>
                    </div>
                  </li>
                );
              })}
            {myDefects.filter((d) => d.status !== "fermee").length === 0 && (
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
            to="/campagnes"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FlaskConical className="mr-2 size-4" /> {t("dashboard.tester.view_my_campaigns")}
          </Link>
          <Link
            to="/anomalies"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Bug className="mr-2 size-4" /> {t("dashboard.tester.view_my_defects")}
          </Link>
          <Link
            to="/audit"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <History className="mr-2 size-4" /> {t("dashboard.tester.my_history")}
          </Link>
        </div>
      </Panel>
    </AppShell>
  );
}
