import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { DefectStatusBadge, SeverityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DEFECT_STATUS_LABEL,
  DEFECT_TRANSITIONS,
  defects as seedDefects,
  type DefectStatus,
} from "@/lib/dhi-data";
import { SYSTEM_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { loadSnapshot, useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/anomalies/$defectId")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const defects = snapshot?.defects ?? seedDefects;
    const d = defects.find((x) => x.id === params.defectId);
    if (!d) throw notFound();
    return { title: d.title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Anomalie"} — DHI Quality Platform` },
      {
        name: "description",
        content: "Détail d'une anomalie : gravité, statut, affectation et capitalisation.",
      },
    ],
  }),
  component: DefectDetailPage,
});

function DefectDetailPage() {
  const { defectId } = Route.useParams();
  const { t } = useI18n();
  const { defects, features, users, updateDefect, currentUser } = useStore();
  const defect = defects.find((d) => d.id === defectId);
  if (!defect) return null;
  const universe = users.filter((u) => u.active).map((u) => u.name);
  const devs = users.filter((u) => u.active && u.role === "developpeur").map((u) => u.name);

  const reassign = (v: string) => {
    updateDefect(defect.id, { assignee: v });
    toast.success(`${defect.id} ${t("pages.anomalies.reassigned")} ${v}.`);
  };

  const setDeveloper = (v: string) => {
    updateDefect(defect.id, { developer: v });
    toast.success(`${defect.id} ${t("pages.anomalies.assigned_to_developer")} ${v}.`);
  };

  const changeStatus = (v: DefectStatus) => {
    updateDefect(defect.id, { status: v });
    toast.success(`${t("pages.anomalies.status_updated")} : ${DEFECT_STATUS_LABEL[v]}.`);
  };

  const forbiddenRoles: string[] = ["developpeur"];
  const role = currentUser?.role;
  const canChangeStatus = !!role && !forbiddenRoles.includes(role);
  const allowedNext = DEFECT_TRANSITIONS[defect.status] ?? [];

  return (
    <AppShell
      title={`${defect.id} : ${defect.title}`}
      subtitle={t("pages.anomalies.subtitle")}
      breadcrumb={[t("nav.systeme"), t("nav.anomalies"), defect.id]}
      tabs={SYSTEM_TABS}
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link to="/anomalies">
            <ArrowLeft className="size-4" /> {t("pages.anomalies.title")}
          </Link>
        </Button>
      }
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="flex flex-wrap gap-2">
          <SeverityBadge level={defect.severity} />
          <DefectStatusBadge status={defect.status} />
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
            {features.find((f) => f.id === defect.featureId)?.name ?? defect.featureId}
          </span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("pages.anomalies.detail_detected_by")} {defect.reporter}{" "}
          {t("pages.anomalies.detail_detected_on")} {defect.createdAt} · {t("common.version")}{" "}
          {defect.version}
          {defect.testId ? ` · ${t("pages.anomalies.detail_test")} ${defect.testId}` : ""}
        </p>
        <Separator className="my-4" />
        <p className="text-sm text-muted-foreground">{defect.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel grid gap-1.5">
          <Label>{t("pages.anomalies.assignee")}</Label>
          {canChangeStatus ? (
            <Select value={defect.assignee} onValueChange={reassign}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {universe.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex h-9 items-center rounded-md border border-border px-3">
              <span className="text-sm font-medium">{defect.assignee}</span>
            </div>
          )}
        </div>
        <div className="panel grid gap-1.5">
          <Label>{t("pages.anomalies.developer")}</Label>
          {canChangeStatus ? (
            <Select value={defect.developer ?? ""} onValueChange={setDeveloper}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("pages.anomalies.developer_placeholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {devs.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex h-9 items-center rounded-md border border-border px-3">
              <span className="text-sm font-medium">{defect.developer ?? "—"}</span>
            </div>
          )}
        </div>
        <div className="panel grid gap-1.5">
          <Label>{t("common.statut")}</Label>
          {canChangeStatus ? (
            <Select value={defect.status} onValueChange={changeStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedNext.map((s) => (
                  <SelectItem key={s} value={s}>
                    {DEFECT_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex h-9 items-center rounded-md border border-border px-3">
              <span className="text-sm font-medium">{DEFECT_STATUS_LABEL[defect.status]}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
        <p className="font-medium">{t("pages.anomalies.capitalization")}</p>
        <p className="mt-1 text-muted-foreground">
          {t("pages.anomalies.regression_note")} : « {defect.title} » (version {defect.version}).
        </p>
      </div>
    </AppShell>
  );
}
