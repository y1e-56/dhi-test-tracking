import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { Wrench, Bug, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { DefectStatusBadge, KpiCard, Panel, SeverityBadge } from "@/components/dhi/indicators";
import { useStore } from "@/lib/dhi-store";
import { loadSession } from "@/lib/dhi-store";
import { DEFECT_STATUS_LABEL, type DefectStatus } from "@/lib/dhi-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard-developpeur")({
  beforeLoad: () => {
    const session = loadSession();
    if (!session || session.role !== "developpeur") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard Développeur — DHI Quality Platform" },
      {
        name: "description",
        content: "Espace dédié aux développeurs : anomalies à corriger et suivi de correction.",
      },
    ],
  }),
  component: DeveloperDashboard,
});

function DeveloperDashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { defects, updateDefect } = useStore();
  const session = loadSession();

  const myDefects = defects.filter(
    (d) => d.assignee === session?.name || d.developer === session?.name,
  );

  const openDefects = myDefects.filter((d) => d.status !== "fermee").length;
  const inCorrection = myDefects.filter((d) => d.status === "encorrection").length;
  const toValidate = myDefects.filter((d) => d.status === "avalider").length;

  const nextStatus = (d: { id: string; status: DefectStatus }): DefectStatus => {
    if (d.status === "affectee" || d.status === "encorrection" || d.status === "avalider") {
      return "a_retester";
    }
    return d.status;
  };

  const advance = (d: { id: string; status: DefectStatus }) => {
    const ns = nextStatus(d);
    updateDefect(d.id, { status: ns });
    toast.success(`${d.id} → ${DEFECT_STATUS_LABEL[ns]}`);
  };

  return (
    <AppShell
      title={t("dashboard.developer.title")}
      subtitle={t("dashboard.developer.subtitle")}
      breadcrumb={["Développeur", "Dashboard"]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("dashboard.developer.my_assigned_defects")}
          value={myDefects.length}
          icon={<Wrench className="size-4" />}
          hint={t("dashboard.developer.open_defects")}
          onClick={() => void navigate({ to: "/anomalies" })}
        />
        <KpiCard
          label={t("dashboard.developer.open_defects")}
          value={openDefects}
          tone={openDefects ? "warning" : "success"}
          icon={<Bug className="size-4" />}
          onClick={() => void navigate({ to: "/anomalies" })}
        />
        <KpiCard
          label={t("dashboard.developer.in_correction")}
          value={inCorrection}
          tone="info"
          onClick={() => void navigate({ to: "/anomalies" })}
        />
        <KpiCard
          label={t("dashboard.developer.to_validate")}
          value={toValidate}
          tone={toValidate ? "warning" : "success"}
          icon={<CheckCircle2 className="size-4" />}
          onClick={() => void navigate({ to: "/anomalies" })}
        />
      </div>

      <Panel
        title={t("dashboard.developer.my_assigned_defects")}
        actions={
          <Link
            to="/anomalies"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("dashboard.developer.all_defects")}
          </Link>
        }
      >
        <ul className="divide-y divide-border">
          {myDefects.slice(0, 6).map((d) => {
            const canAdvance = nextStatus({ id: d.id, status: d.status }) !== d.status;
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/anomalies/$defectId"
                      params={{ defectId: d.id }}
                      className="text-sm font-medium hover:underline"
                    >
                      {d.id} · {d.title}
                    </Link>
                    <SeverityBadge level={d.severity} />
                    <DefectStatusBadge status={d.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {d.version} · {d.assignee}
                  </p>
                </div>
                {canAdvance && (
                  <button
                    onClick={() => advance({ id: d.id, status: d.status })}
                    className="shrink-0 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {t("dashboard.developer.mark_fixed")}
                  </button>
                )}
              </li>
            );
          })}
          {myDefects.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.developer.no_assigned_defects")}
            </li>
          )}
        </ul>
      </Panel>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          to="/anomalies"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Bug className="mr-2 size-4" /> {t("dashboard.developer.view_my_defects")}
        </Link>
      </div>
    </AppShell>
  );
}
