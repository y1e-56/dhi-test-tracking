// ============================================================
// 1. Imports
// ============================================================
import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { DefectStatusBadge, KpiCard, SeverityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFECT_STATUS_LABEL,
  DEFECT_TRANSITIONS,
  PEOPLE,
  SEVERITY_LABEL,
  type Defect,
  type DefectStatus,
  type Severity,
} from "@/lib/dhi-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/lib/dhi-store";
import { SYSTEM_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

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

// ------------------------------------------------------------------
// Sous-composant : Dialogue de détail d'une anomalie
// ------------------------------------------------------------------
interface DefectDetailDialogProps {
  selected: Defect | null;
  setSelected: (d: Defect | null) => void;
  features: ReturnType<typeof useStore>["features"];
  updateDefect: ReturnType<typeof useStore>["updateDefect"];
}
function DefectDetailDialog({
  selected,
  setSelected,
  features,
  updateDefect,
}: DefectDetailDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
      <DialogContent className="max-w-xl">
        {selected ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {selected.id} : {selected.title}
              </DialogTitle>
              <DialogDescription>
                {t("pages.anomalies.detail_detected_by")} {selected.reporter}{" "}
                {t("pages.anomalies.detail_detected_on")} {selected.createdAt} ·{" "}
                {t("common.version")} {selected.version}
                {selected.testId ? ` · ${t("pages.anomalies.detail_test")} ${selected.testId}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              <SeverityBadge level={selected.severity} />
              <DefectStatusBadge status={selected.status} />
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
                {features.find((f) => f.id === selected.featureId)?.name ?? selected.featureId}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>{t("pages.anomalies.assignee")}</Label>
                <Select
                  value={selected.assignee}
                  onValueChange={(v) => {
                    updateDefect(selected.id, { assignee: v });
                    setSelected({ ...selected, assignee: v });
                    toast.success(`${selected.id} ${t("pages.anomalies.reassigned")} ${v}.`);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PEOPLE.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("common.statut")}</Label>
                <Select
                  value={selected.status}
                  onValueChange={(v) => {
                    updateDefect(selected.id, { status: v as DefectStatus });
                    setSelected({ ...selected, status: v as DefectStatus });
                    toast.success(
                      `${t("pages.anomalies.status_updated")} : ${DEFECT_STATUS_LABEL[v as DefectStatus]}.`,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DEFECT_STATUS_LABEL) as DefectStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {DEFECT_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
              <p className="font-medium">{t("pages.anomalies.capitalization")}</p>
              <p className="mt-1 text-muted-foreground">
                {t("pages.anomalies.regression_note")} : « {selected.title} » (version{" "}
                {selected.version}).
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>
                {t("actions.fermer")}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------
// Sous-composant : Dialogue de création d'une nouvelle anomalie
// ------------------------------------------------------------------
interface CreateDefectDialogProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: {
    title: string;
    description: string;
    severity: Severity;
    priority: Severity;
    productId: string;
    featureId: string;
    assignee: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      severity: Severity;
      priority: Severity;
      productId: string;
      featureId: string;
      assignee: string;
    }>
  >;
  onSubmit: () => void;
  products: ReturnType<typeof useStore>["products"];
  features: ReturnType<typeof useStore>["features"];
}
function CreateDefectDialog({
  open,
  setOpen,
  form,
  setForm,
  onSubmit,
  products,
  features,
}: CreateDefectDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("pages.anomalies.new_anomaly")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="d-title">{t("pages.anomalies.defect_title")}</Label>
            <Input
              id="d-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("pages.anomalies.title_placeholder")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="d-desc">{t("common.description")}</Label>
            <Textarea
              id="d-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>{t("common.produit")}</Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm((f) => ({ ...f, productId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("common.fonctionnalite")}</Label>
              <Select
                value={form.featureId}
                onValueChange={(v) => setForm((f) => ({ ...f, featureId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {features.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("pages.anomalies.severity")}</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => setForm((f) => ({ ...f, severity: v as Severity }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERITY_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("pages.anomalies.priority")}</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Severity }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERITY_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("pages.anomalies.assignee")}</Label>
              <Select
                value={form.assignee}
                onValueChange={(v) => setForm((f) => ({ ...f, assignee: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PEOPLE.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("actions.annuler")}
          </Button>
          <Button onClick={onSubmit}>{t("pages.anomalies.create_anomaly")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const { defects, products, features, addDefect, updateDefect } = useStore();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Defect | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "moyenne" as Severity,
    priority: "moyenne" as Severity,
    productId: "p-paiement",
    featureId: "f-paiement",
    assignee: "Pierre Durand",
  });

  const rows = useMemo(
    () =>
      defects
        .filter((d) => severityFilter === "all" || d.severity === severityFilter)
        .filter((d) => statusFilter === "all" || d.status === statusFilter)
        .filter(
          (d) =>
            !search ||
            d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.id.toLowerCase().includes(search.toLowerCase()),
        ),
    [defects, search, severityFilter, statusFilter],
  );

  const submit = () => {
    if (!form.title.trim()) {
      toast.error(t("pages.anomalies.title_required"));
      return;
    }
    const id = addDefect({
      productId: form.productId,
      title: form.title.trim(),
      description: form.description,
      severity: form.severity,
      priority: form.priority,
      status: "nouvelle",
      featureId: form.featureId,
      version: "4.12",
      reporter: "Marie Martin",
      assignee: form.assignee,
      createdAt: new Date().toISOString().slice(0, 10),
      targetDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    });
    toast.success(t("pages.anomalies.created_msg").replace("{id}", id));
    setCreateOpen(false);
    setForm({ ...form, title: "", description: "" });
  };

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
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> {t("pages.anomalies.new_anomaly")}
          </Button>
        </div>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("pages.anomalies.kpi_open")}
          value={defects.filter((d) => d.status !== "fermee").length}
          tone="warning"
          hint={t("pages.anomalies.kpi_open_hint")}
        />
        <KpiCard
          label={t("pages.anomalies.kpi_high_severity")}
          value={defects.filter((d) => d.severity === "haute" && d.status !== "fermee").length}
          tone="danger"
          hint={t("pages.anomalies.kpi_high_hint")}
        />
        <KpiCard
          label={t("pages.anomalies.kpi_fixing")}
          value={defects.filter((d) => d.status === "encorrection").length}
          tone="info"
          hint={t("pages.anomalies.kpi_fixing_hint")}
        />
        <KpiCard
          label={t("pages.anomalies.kpi_closed")}
          value={defects.filter((d) => d.status === "fermee").length}
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
              <TableRow key={d.id} className="cursor-pointer" onClick={() => setSelected(d)}>
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

      <DefectDetailDialog
        selected={selected}
        setSelected={setSelected}
        features={features}
        updateDefect={updateDefect}
      />

      <CreateDefectDialog
        open={createOpen}
        setOpen={setCreateOpen}
        form={form}
        setForm={setForm}
        onSubmit={submit}
        products={products}
        features={features}
      />
    </AppShell>
  );
}
