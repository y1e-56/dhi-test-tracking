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
import { type Product } from "@/lib/dhi-data";
import { canCreate } from "@/lib/role-protection";
import { visibleProducts, getUser } from "@/lib/access";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { productScore, useStore, useHealthOf } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/produits")({
  head: () => ({
    meta: [
      { title: "Produits & Projets — DHI Quality Platform" },
      {
        name: "description",
        content: "Portefeuille de produits logiciels : scores qualité, santé et projets associés.",
      },
      { property: "og:title", content: "Produits & Projets — DHI Quality Platform" },
      { property: "og:description", content: "Scores qualité et santé de tous vos produits." },
    ],
  }),
  component: ProductsPage,
});

type SortKey = "name" | "score" | "lastUpdate";

function ProductsPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/produits") return <Outlet />;
  return <ProductsList />;
}

function ProductsList() {
  const { t } = useI18n();
  const { products, projects, deleteProduct } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("score");
  const [healthFilter, setHealthFilter] = useState<string>("all");

  const [toDelete, setToDelete] = useState<Product | null>(null);
  const healthOf = useHealthOf();

  const rows = useMemo(() => {
    const viewable = visibleProducts(products, getUser());
    let list = viewable.map((p) => ({ p, score: productScore(p) }));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        ({ p }) => p.name.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q),
      );
    }
    if (healthFilter !== "all") list = list.filter(({ score }) => healthOf(score) === healthFilter);
    list.sort((a, b) =>
      sort === "name"
        ? a.p.name.localeCompare(b.p.name)
        : sort === "score"
          ? b.score - a.score
          : b.p.lastUpdate.localeCompare(a.p.lastUpdate),
    );
    return list;
  }, [products, search, sort, healthFilter, healthOf]);

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteProduct(toDelete.id);
    toast.success(t("pages.products.deleted"));
    setToDelete(null);
  };

  return (
    <AppShell
      title={t("pages.products.title")}
      subtitle={t("pages.products.subtitle")}
      breadcrumb={t("pages.products.breadcrumb")}
      tabs={QUALITY_TABS}
      actions={
        canCreate() ? (
          <Link to="/produits/ajouter">
            <Button size="sm">
              <Plus className="size-4" /> {t("pages.products.new_product")}
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pages.products.search_placeholder")}
              className="w-64 pl-8"
            />
          </div>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("pages.products.health")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.products.all_health")}</SelectItem>
              <SelectItem value="sain">Sain</SelectItem>
              <SelectItem value="surveiller">À surveiller</SelectItem>
              <SelectItem value="risque">À risque</SelectItem>
              <SelectItem value="critique">Critique</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("pages.products.sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">{t("pages.products.score_desc")}</SelectItem>
              <SelectItem value="name">{t("pages.products.name_asc")}</SelectItem>
              <SelectItem value="lastUpdate">{t("pages.products.last_update")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="ml-auto text-sm text-muted-foreground">
            {rows.length} {t("common.produit")}
            {rows.length > 1 ? "s" : ""}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.produit")}</TableHead>
              <TableHead>{t("pages.products.score")}</TableHead>
              <TableHead>{t("pages.products.health_label")}</TableHead>
              <TableHead className="text-right">{t("common.projets")}</TableHead>
              <TableHead>{t("pages.products.owner")}</TableHead>
              <TableHead>{t("pages.products.last_update")}</TableHead>
              <TableHead className="text-right">{t("pages.products.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ p, score }) => (
              <TableRow key={p.id}>
                <TableCell
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ to: "/produits/$productId", params: { productId: p.id } })
                  }
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="max-w-md truncate text-xs text-muted-foreground">{p.description}</p>
                </TableCell>
                <TableCell>
                  <ScoreValue score={score} size="sm" />
                </TableCell>
                <TableCell>
                  <HealthBadge score={score} />
                </TableCell>
                <TableCell className="num text-right">
                  {projects.filter((pr) => pr.productId === p.id).length}
                </TableCell>
                <TableCell className="text-sm">{p.owner}</TableCell>
                <TableCell className="num text-sm text-muted-foreground">{p.lastUpdate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to="/produits/$productId/modifier"
                      params={{ productId: p.id }}
                      aria-label={`${t("pages.products.edit")} ${p.name}`}
                    >
                      <Button size="icon" variant="ghost" className="size-7">
                        <Pencil className="size-3.5" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-danger hover:text-danger"
                      aria-label={`${t("pages.products.delete")} ${p.name}`}
                      onClick={() => setToDelete(p)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("pages.products.no_results")}
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
              {t("pages.products.delete_title").replace("{name}", toDelete?.name ?? "")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("pages.products.delete_description")}
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
