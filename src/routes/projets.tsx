import { createFileRoute, Link, useNavigate, Outlet, useMatches } from "@tanstack/react-router";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { HealthBadge, ScoreValue } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
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
import { PROJECT_STATUS_LABEL, type Project } from "@/lib/dhi-data";
import { visibleProjects, getUser } from "@/lib/access";
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

function ProjectsPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/projets") return <Outlet />;
  return <ProjectsList />;
}

function ProjectsList() {
  const { t } = useI18n();
  const { products, projects, campaigns, releases, deleteProject } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");

  const [toDelete, setToDelete] = useState<Project | null>(null);

  const rows = useMemo(() => {
    return visibleProjects(projects, products, getUser()).filter((pr) => {
      if (productFilter !== "all" && pr.productId !== productFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return pr.name.toLowerCase().includes(q) || pr.objective.toLowerCase().includes(q);
    });
  }, [projects, products, productFilter, search]);

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
        <Link to="/projets/ajouter">
          <Button size="sm">
            <Plus className="size-4" /> {t("pages.projects.new_project")}
          </Button>
        </Link>
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
                      <Link
                        to="/projets/$projectId/modifier"
                        params={{ projectId: pr.id }}
                        aria-label={`${t("actions.modifier")} ${pr.name}`}
                      >
                        <Button size="icon" variant="ghost" className="size-7">
                          <Pencil className="size-3.5" />
                        </Button>
                      </Link>
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
