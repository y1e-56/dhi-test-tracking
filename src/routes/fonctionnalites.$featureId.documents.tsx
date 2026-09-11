import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
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
import { FEATURE_DOC_TYPE_LABEL, features as seedFeatures } from "@/lib/dhi-data";
import { useI18n } from "@/lib/i18n";
import {
  canDeleteFeatureDoc,
  canReadFeatureDoc,
  canUploadAnyFeatureDoc,
} from "@/lib/document-permissions";
import { api, mapBackendEvidence, type BackendEvidence } from "@/lib/api";

export const Route = createFileRoute("/fonctionnalites/$featureId/documents")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const features = snapshot?.features ?? seedFeatures;
    const feat = features.find((x) => x.id === params.featureId);
    return { name: feat?.name ?? "Fonctionnalité" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Documents · ${loaderData?.name ?? "Fonctionnalité"} — DHI Quality Platform` },
    ],
  }),
  component: FeatureDocuments,
});

function FeatureDocuments() {
  const { featureId } = Route.useParams();
  const { t } = useI18n();
  const { features, featureDocuments, deleteFeatureDocument, replaceFeatureDocuments } = useStore();
  const feature = features.find((f) => f.id === featureId);

  useEffect(() => {
    if (!localStorage.getItem("token") || !/^\d+$/.test(featureId)) return;
    void api<BackendEvidence[]>(`/evidence/by-entity/feature/${featureId}`)
      .then((items) =>
        replaceFeatureDocuments(items.map((item) => ({ ...mapBackendEvidence(item), featureId }))),
      )
      .catch((error) =>
        console.error("[Documents] Impossible de charger les documents fonctionnalité", error),
      );
  }, [featureId, replaceFeatureDocuments]);

  const docs = featureDocuments.filter((d) => d.featureId === featureId);

  return (
    <AppShell
      title={feature?.name ?? t("pages.documents.feature_docs")}
      subtitle={t("pages.documents.feature_docs")}
      breadcrumb={[
        t("nav.qualite"),
        t("nav.fonctionnalites"),
        feature?.name ?? "",
        t("pages.documents.feature_docs"),
      ]}
      actions={
        canReadFeatureDoc() && canUploadAnyFeatureDoc() ? (
          <Button size="sm" asChild>
            <Link to="/fonctionnalites/$featureId/documents/ajouter" params={{ featureId }}>
              <Plus className="size-4" /> {t("pages.documents.add_feature")}
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
                    {FEATURE_DOC_TYPE_LABEL[d.type as keyof typeof FEATURE_DOC_TYPE_LABEL] ??
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
                  {canDeleteFeatureDoc(d.type) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteFeatureDocument(d.id);
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
                  {t("pages.documents.empty_feature")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6">
        <Link
          to="/fonctionnalites"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("nav.fonctionnalites")}
        </Link>
      </div>
    </AppShell>
  );
}