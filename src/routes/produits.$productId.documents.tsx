import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { PRODUCT_DOC_TYPE_LABEL, products as seedProducts } from "@/lib/dhi-data";
import { productTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { canDeleteProductDoc, canUploadAnyProductDoc } from "@/lib/document-permissions";
import { getUser, productVisibleTo } from "@/lib/access";
import { ProductAccessDenied } from "@/components/dhi/AccessDenied";
import { api, mapBackendEvidence, type BackendEvidence } from "@/lib/api";

export const Route = createFileRoute("/produits/$productId/documents")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Documents · ${loaderData?.name ?? "Produit"} — DHI Quality Platform` }],
  }),
  component: ProductDocuments,
});

function ProductDocuments() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const { products, productDocuments, deleteProductDocument, replaceProductDocuments } = useStore();
  const product = products.find((p) => p.id === productId);

  useEffect(() => {
    if (!localStorage.getItem("token") || !/^\d+$/.test(productId)) return;
    void api<BackendEvidence[]>(`/evidence/by-entity/product/${productId}`)
      .then((items) => replaceProductDocuments(items.map((item) => ({ ...mapBackendEvidence(item), productId }))))
      .catch((error) => console.error("[Documents] Impossible de charger les documents produit", error));
  }, [productId, replaceProductDocuments]);

  if (product && !productVisibleTo(product, getUser())) {
    return <ProductAccessDenied subject={product.name} />;
  }

  const docs = productDocuments.filter((d) => d.productId === productId);

  return (
    <AppShell
      title={product?.name ?? t("nav.product_documents")}
      subtitle={t("nav.product_documents")}
      breadcrumb={[
        t("nav.qualite"),
        t("nav.produits"),
        product?.name ?? "",
        t("nav.product_documents"),
      ]}
      tabs={productTabs(productId)}
      actions={
        canUploadAnyProductDoc() ? (
          <Button size="sm" asChild>
            <Link to="/produits/$productId/documents/ajouter" params={{ productId }}>
              <Plus className="size-4" /> {t("pages.documents.add_product")}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.documents.type")}</TableHead>
              <TableHead>{t("pages.documents.name")}</TableHead>
              <TableHead>{t("pages.documents.file")}</TableHead>
              <TableHead>{t("pages.documents.uploaded_by")}</TableHead>
              <TableHead>{t("pages.documents.uploaded_at")}</TableHead>
              <TableHead className="text-right">{t("pages.documents.delete")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <FileText className="size-4 text-muted-foreground" />
                    {PRODUCT_DOC_TYPE_LABEL[d.type as keyof typeof PRODUCT_DOC_TYPE_LABEL] ??
                      d.type}
                  </span>
                  {d.content ? (
                    <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                      {d.content}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.fileName}</TableCell>
                <TableCell className="text-sm">{d.uploadedBy}</TableCell>
                <TableCell className="num text-sm">{d.uploadedAt}</TableCell>
                <TableCell className="text-right">
                  {canDeleteProductDoc(d.type) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteProductDocument(d.id);
                        toast.success(t("pages.documents.deleted"));
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t("pages.documents.empty_product")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
