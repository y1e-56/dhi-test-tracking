import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { HealthBadge, ScoreValue } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PEOPLE, PROJECT_STATUS_LABEL, type Project, type ProjectStatus } from "@/lib/dhi-data";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { productScore, useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/projets")({
  head: () => ({
    meta: [
      { title: "Projets — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Initiatives d'évolution rattachées à un produit : objectif, version cible, campagnes et readiness Go Live.",
      },
    ],
  }),
  component: ProjectsPage,
});

type ProjectForm = {
  name: string;
  objective: string;
  productId: string;
  targetVersion: string;
  manager: string;
  qaLead: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  progress: number;
};

const emptyProjectForm = (products: { id: string }[]): ProjectForm => ({
  name: "",
  objective: "",
  productId: products[0]?.id ?? "p-paiement",
  targetVersion: "",
  manager: PEOPLE[0] ?? "",
  qaLead: PEOPLE[1] ?? "",
  status: "planifie",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  progress: 0,
});

function ProjectsPage() {
  const { t } = useI18n();
  const { products, projects, campaigns, releases, addProject, updateProject, deleteProject } =
    useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");

  const [openCreate, setOpenCreate] = useState(false);
  const [formCreate, setFormCreate] = useState<ProjectForm>(emptyProjectForm(products));

  const [editing, setEditing] = useState<Project | null>(null);
  const [formEdit, setFormEdit] = useState<ProjectForm>(emptyProjectForm(products));
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const rows = useMemo(() => {
    return projects.filter((pr) => {
      if (productFilter !== "all" && pr.productId !== productFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return pr.name.toLowerCase().includes(q) || pr.objective.toLowerCase().includes(q);
    });
  }, [projects, productFilter, search]);

  const submitCreate = () => {
    if (!formCreate.name.trim() || !formCreate.productId) {
      toast.error(t("pages.projects.required"));
      return;
    }
    addProject({
      productId: formCreate.productId,
      name: formCreate.name.trim(),
      objective: formCreate.objective,
      targetVersion: formCreate.targetVersion || "1.0",
      status: formCreate.status,
      startDate: formCreate.startDate,
      endDate: formCreate.endDate,
      manager: formCreate.manager,
      qaLead: formCreate.qaLead,
      progress: formCreate.progress,
    });
    toast.success(`${t("pages.projects.created")} « ${formCreate.name.trim()} »`);
    setOpenCreate(false);
    setFormCreate(emptyProjectForm(products));
  };

  const startEdit = (p: Project) => {
    setEditing(p);
    setFormEdit({
      name: p.name,
      objective: p.objective,
      productId: p.productId,
      targetVersion: p.targetVersion,
      manager: p.manager,
      qaLead: p.qaLead,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      progress: p.progress,
    });
  };

  const submitEdit = () => {
    if (!editing) return;
    if (!formEdit.name.trim() || !formEdit.productId) {
      toast.error(t("pages.projects.required"));
      return;
    }
    updateProject(editing.id, formEdit);
    toast.success(`${t("pages.projects.updated")} « ${formEdit.name.trim()} »`);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteProject(toDelete.id);
    toast.success(`${t("pages.projects.deleted")} « ${toDelete.name} »`);
    setToDelete(null);
  };

  return (
    <AppShell
      title={t("pages.projects.title")}
      subtitle={t("pages.projects.subtitle")}
      breadcrumb={t("pages.projects.breadcrumb")}
      tabs={QUALITY_TABS}
      actions={
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus className="size-4" /> {t("pages.projects.new_project")}
        </Button>
      }
    >
      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pages.projects.search_placeholder")}
              className="w-64 pl-8"
            />
          </div>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("pages.projects.product")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.projects.all_products")}</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-sm text-muted-foreground">
            {rows.length} {t("common.projet")}
            {rows.length > 1 ? "s" : ""}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.projet")}</TableHead>
              <TableHead>{t("common.produit")}</TableHead>
              <TableHead>{t("common.version")}</TableHead>
              <TableHead>{t("common.statut")}</TableHead>
              <TableHead>{t("pages.projects.campaigns")}</TableHead>
              <TableHead>{t("pages.projects.releases")}</TableHead>
              <TableHead>{t("pages.projects.quality_health")}</TableHead>
              <TableHead>{t("pages.projects.manager")}</TableHead>
              <TableHead className="text-right">{t("pages.projects.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((pr) => {
              const product = products.find((p) => p.id === pr.productId);
              const score = product ? productScore(product) : 0;
              const nCamp = campaigns.filter((c) => c.projectId === pr.id).length;
              const nRel = releases.filter((r) => r.projectId === pr.id).length;
              return (
                <TableRow key={pr.id}>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({ to: "/projets/$projectId", params: { projectId: pr.id } })
                    }
                  >
                    <p className="font-medium">{pr.name}</p>
                    <p className="max-w-md truncate text-xs text-muted-foreground">
                      {pr.objective}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                  <TableCell className="num">{pr.targetVersion}</TableCell>
                  <TableCell className="text-sm">{PROJECT_STATUS_LABEL[pr.status]}</TableCell>
                  <TableCell className="num">{nCamp}</TableCell>
                  <TableCell className="num">{nRel}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ScoreValue score={score} size="sm" />
                      <HealthBadge score={score} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{pr.manager}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => startEdit(pr)}
                        aria-label={`${t("actions.editer")} ${pr.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-danger hover:text-danger"
                        onClick={() => setToDelete(pr)}
                        aria-label={`${t("actions.supprimer")} ${pr.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  {t("pages.projects.no_results")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages.projects.new_project")}</DialogTitle>
          </DialogHeader>
          <ProjectFormFields form={formCreate} setForm={setFormCreate} products={products} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              {t("actions.annuler")}
            </Button>
            <Button onClick={submitCreate}>{t("pages.projects.new_project")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actions.modifier")}</DialogTitle>
          </DialogHeader>
          <ProjectFormFields form={formEdit} setForm={setFormEdit} products={products} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("actions.annuler")}
            </Button>
            <Button onClick={submitEdit}>{t("actions.enregistrer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("pages.projects.delete_title").replace("{name}", toDelete?.name ?? "")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("pages.projects.delete_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.annuler")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-danger hover:bg-danger/90">
              {t("actions.supprimer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function ProjectFormFields({
  form,
  setForm,
  products,
}: {
  form: ProjectForm;
  setForm: (f: ProjectForm) => void;
  products: { id: string; name: string }[];
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="pfp-name">{t("pages.projects.name_label")}</Label>
        <Input
          id="pfp-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t("pages.projects.name_placeholder")}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pfp-obj">{t("pages.projects.objective")}</Label>
        <Input
          id="pfp-obj"
          value={form.objective}
          onChange={(e) => setForm({ ...form, objective: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>{t("pages.projects.parent_product")}</Label>
          <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
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
          <Label htmlFor="pfp-ver">{t("pages.projects.target_version")}</Label>
          <Input
            id="pfp-ver"
            value={form.targetVersion}
            onChange={(e) => setForm({ ...form, targetVersion: e.target.value })}
            placeholder="4.12"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>{t("common.statut")}</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planifie">{t("pages.projects.status_planifie")}</SelectItem>
              <SelectItem value="encours">{t("pages.projects.status_encours")}</SelectItem>
              <SelectItem value="termine">{t("pages.projects.status_termine")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>{t("pages.projects.progress")}</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.progress}
            onChange={(e) =>
              setForm({
                ...form,
                progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
              })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="pfp-start">{t("pages.projects.start_date")}</Label>
          <Input
            id="pfp-start"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pfp-end">{t("pages.projects.end_date")}</Label>
          <Input
            id="pfp-end"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>{t("pages.projects.manager_label")}</Label>
          <Select value={form.manager} onValueChange={(v) => setForm({ ...form, manager: v })}>
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
          <Label>{t("pages.projects.qa_lead")}</Label>
          <Select value={form.qaLead} onValueChange={(v) => setForm({ ...form, qaLead: v })}>
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
  );
}
