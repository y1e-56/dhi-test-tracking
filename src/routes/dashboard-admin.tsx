import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { Settings, Users, AlertTriangle, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { useStore } from "@/lib/dhi-store";
import { loadSession } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard-admin")({
  beforeLoad: () => {
    const session = loadSession();
    if (!session || session.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard Admin — DHI Quality Platform" },
      {
        name: "description",
        content: "Espace d'administration : gestion des utilisateurs et du système.",
      },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { users, alerts, rules } = useStore();

  const activeUsers = users.filter((u) => u.active).length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  return (
    <AppShell
      title={t("dashboard.admin.title")}
      subtitle={t("dashboard.admin.subtitle")}
      breadcrumb={["Administration", "Dashboard"]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("dashboard.admin.users")}
          value={users.length}
          icon={<Users className="size-4" />}
          hint={t("dashboard.admin.active_users")}
          onClick={() => void navigate({ to: "/administration" })}
        />
        <KpiCard
          label={t("dashboard.admin.active_users")}
          value={activeUsers}
          tone="success"
          hint={t("dashboard.admin.full_admin")}
          onClick={() => void navigate({ to: "/administration" })}
        />
        <KpiCard
          label={t("dashboard.admin.system_alerts")}
          value={unreadAlerts}
          tone={unreadAlerts ? "warning" : "success"}
          icon={<AlertTriangle className="size-4" />}
          hint={t("common.non_lu")}
          onClick={() => void navigate({ to: "/alertes" })}
        />
        <KpiCard
          label={t("dashboard.admin.business_rules")}
          value={rules.length}
          icon={<ShieldCheck className="size-4" />}
          hint={t("dashboard.admin.business_rules")}
          onClick={() => void navigate({ to: "/referentiels" })}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("dashboard.admin.user_management")}
          actions={
            <Link
              to="/administration"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.admin.full_admin")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {users.slice(0, 5).map((u) => {
              return (
                <li key={u.id}>
                  <div className="-mx-4 block px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{u.name}</p>
                      <span
                        className={`text-xs ${u.active ? "text-success" : "text-muted-foreground"}`}
                      >
                        {u.active ? t("common.actif") : t("common.inactif")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {u.email} · {u.role}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title={t("dashboard.admin.recent_system_alerts")}
          actions={
            <Link
              to="/alertes"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.admin.all_alerts")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {alerts.slice(0, 5).map((a) => {
              return (
                <li key={a.id}>
                  <div className="-mx-4 block px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{a.message}</p>
                      <span
                        className={`text-xs ${a.read ? "text-muted-foreground" : "text-warning"}`}
                      >
                        {a.read ? t("common.lu") : t("common.non_lu")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                </li>
              );
            })}
            {alerts.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.admin.system_alerts")}
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel title={t("dashboard.admin.quick_actions")}>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/administration"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Users className="mr-2 size-4" /> {t("dashboard.admin.manage_users")}
          </Link>
          <Link
            to="/referentiels"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ShieldCheck className="mr-2 size-4" /> {t("dashboard.admin.configure_rules")}
          </Link>
          <Link
            to="/audit"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Settings className="mr-2 size-4" /> {t("dashboard.admin.audit")}
          </Link>
        </div>
      </Panel>
    </AppShell>
  );
}
