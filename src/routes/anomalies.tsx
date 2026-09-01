// ============================================================
// 1. Imports
// ============================================================
import { createFileRoute, Link, useNavigate, Outlet, useMatches } from "@tanstack/react-router";
import { Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { DefectStatusBadge, KpiCard, SeverityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFECT_STATUS_LABEL, SEVERITY_LABEL, type Defect, type DefectStatus, type Severity } from "@/lib/dhi-data";
import { useStore } from "@/lib/dhi-store";
import { SYSTEM_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { getUser, visibleDefects } from "@/lib/access";

// ============================================================
// 2. Helpers utilitaires (toCSV, etc.)
// ============================================================

function exportToCsv(rows: Defect[], t: ReturnType<typeof useI18n>["t"]) {
  const header = `${t("pages.anomalies.csv_id")};${t("pages.anomalies.csv_titre")};${t("pages.anomalies.csv_gravite")};${t("pages.anomalies.csv_priorite")};${t("pages.anomalies.csv_statut")};${t("pages.anomalies.csv_version")};${t("pages.anomalies.csv_affecte")};${t("pages.anomalies.csv_cree")}\n`;
  const body = rows
    .map(
      (d) =>
        `${d.id};"${d.title}";${d.severity};${d.priority};${d.status};${d.version};"${d.assignee}";${d.createdAt}`,
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = t("pages.anomalies.export_filename");
  a.click();
  URL.revokeObjectURL(url);
  toast.success(t("pages.anomalies.export_success"));
}

// ============================================================
// 3. Sous-composants (Filtres, DefectDetailDialog, etc.)
// ============================================================

// ------------------------------------------------------------------
// Sous-composant : Barre de filtres (recherche + gravité + statut)
// ------------------------------------------------------------------
interface DefectFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  severityFilter: string;
  setSeverityFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  count: number;
}
function DefectFilters({
  search,
  setSearch,
  severityFilter,
  setSeverityFilter,
  statusFilter,
  setStatusFilter,
  count,
}: DefectFiltersProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-2.5">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("pages.anomalies.search_placeholder")}
          className="w-64 pl-8"
        />
      </div>
      <Select value={severityFilter} onValueChange={setSeverityFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t("pages.anomalies.severity")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.anomalies.all_severities")}</SelectItem>
          {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
            <SelectItem key={s} value={s}>
              {SEVERITY_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t("common.statut")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.anomalies.all_statuses")}</SelectItem>
          {(Object.keys(DEFECT_STATUS_LABEL) as DefectStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {DEFECT_STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="ml-auto text-sm text-muted-foreground">
        {count} {t("pages.anomalies.anomaly_count")}
      </p>
    </div>
  );
}

// ============================================================
// 4. Composant Route principal
// ============================================================

export const Route = createFileRoute("/anomalies")({
  head: () => ({
    meta: [
      { title: "Anomalies & Incidents — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Suivi des anomalies et incidents : gravité, priorité, statut, affectation et capitalisation.",
      },
      { property: "og:title", content: "Anomalies & Incidents — DHI Quality Platform" },
      { property: "og:description", content: "Traquez et résolvez les anomalies de vos produits." },
    ],
  }),
  component: DefectsPage,
});

function DefectsPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/anomalies") return <Outlet />;
  return <DefectsList />;
}

function DefectsList() {
  const { defects } = useStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const viewable = useMemo(() => visibleDefects(defects, getUser()), [defects]);

  const rows = useMemo(
    () =>
      viewable
        .filter((d) => severityFilter === "all" || d.severity === severityFilter)
        .filter((d) => statusFilter === "all" || d.status === statusFilter)
        .filter(
          (d) =>
            !search ||
            d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.id.toLowerCase().includes(search.toLowerCase()),
        ),
    [viewable, search, severityFilter, statusFilter],
  );

  return (
    <AppShell
      title={t("pages.anomalies.title")}
      subtitle={t("pages.anomalies.subtitle")}
      breadcrumb={[t("nav.systeme"), t("nav.anomalies")]}
      tabs={SYSTEM_TABS}
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => exportToCsv(rows, t)}>
            <Download className="size-4" /> {t("actions.exporter")}
          </Button>
          <Link to="/anomalies/ajouter">
            <Button size="sm">
              <Plus className="size-4" /> {t("pages.anomalies.new_anomaly")}
            </Button>
          </Link>
        </div>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("pages.anomalies.kpi_open")}
          value={viewable.filter((d) => d.status !== "fermee").length}
          tone="warning"
          hint={t("pages.anomalies.kpi_open_hint")}
        />
        <KpiCard
          label={t("pages.anomalies.kpi_high_severity")}
          value={viewable.filter((d) => d.severity === "haute" && d.status !== "fermee").length}
          tone="danger"
          hint={t("pages.anomalies.kpi_high_hint")}
        />
        <KpiCard
          label={t("pages.anomalies.kpi_fixing")}
          value={viewable.filter((d) => d.status === "encorrection").length}
          tone="info"
          hint={t("pages.anomalies.kpi_fixing_hint")}
        />
        <KpiCard
          label={t("pages.anomalies.kpi_closed")}
          value={viewable.filter((d) => d.status === "fermee").length}
          tone="success"
          hint={t("pages.anomalies.kpi_closed_hint")}
        />
      </div>

      <div className="panel overflow-hidden">
        <DefectFilters
          search={search}
          setSearch={setSearch}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          count={rows.length}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.id")}</TableHead>
              <TableHead>{t("pages.anomalies.defect_title")}</TableHead>
              <TableHead>{t("pages.anomalies.severity")}</TableHead>
              <TableHead>{t("pages.anomalies.priority")}</TableHead>
              <TableHead>{t("common.statut")}</TableHead>
              <TableHead>{t("pages.anomalies.assignee")}</TableHead>
              <TableHead>{t("pages.anomalies.created_on")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer"
                onClick={() => navigate({ to: "/anomalies/$defectId", params: { defectId: d.id } })}
              >
                <TableCell className="num font-medium">{d.id}</TableCell>
                <TableCell className="max-w-sm truncate">{d.title}</TableCell>
                <TableCell>
                  <SeverityBadge level={d.severity} />
                </TableCell>
                <TableCell>
                  <SeverityBadge level={d.priority} />
                </TableCell>
                <TableCell>
                  <DefectStatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-sm">{d.assignee}</TableCell>
                <TableCell className="num text-sm text-muted-foreground">{d.createdAt}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("pages.anomalies.no_results")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
