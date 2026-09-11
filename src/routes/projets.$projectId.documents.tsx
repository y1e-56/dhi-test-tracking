import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { FolderOpen, FileText, Plus, Trash2 } from "lucide-react";
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
import { PROJECT_DOC_TYPE_LABEL, projects as seedProjects } from "@/lib/dhi-data";
import { projectTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import {
  canDeleteProjectDoc,
  canReadProjectDoc,
  canUploadAnyProjectDoc,
} from "@/lib/document-permissions";
import { ProjectAccessDenied } from "@/components/dhi/AccessDenied";
import { api, mapBackendEvidence, type BackendEvidence } from "@/lib/api";

export const Route = createFileRoute("/projets/$projectId/documents")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const projects = snapshot?.projects ?? seedProjects;
    const pr = projects.find((x) => x.id === params.projectId);
    return { name: pr?.name ?? "Projet" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Documents · ${loaderData?.name ?? "Projet"} — DHI Quality Platform` }],
  }),
  component: ProjectDocuments,
});

function ProjectDocuments() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const { products, projects, projectDocuments, deleteProjectDocument, replaceProjectDocuments } = useStore();
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (!localStorage.getItem("token") || !/^\d+$/.test(projectId)) return;
    void api<BackendEvidence[]>(`/evidence/by-entity/project/${projectId}`)
      .then((items) => replaceProjectDocuments(items.map((item) => ({ ...mapBackendEvidence(item), projectId }))))
      .catch((error) => console.error("[Documents] Impossible de charger les documents projet", error));
  }, [projectId, replaceProjectDocuments]);

  const docs = projectDocuments.filter((d) => d.projectId === projectId);

  if (project && !canReadProjectDoc(project, products)) {
    return <ProjectAccessDenied subject={project.name} />;
  }

  const crossLink =
    project?.productId && projects.some((p) => p.id === project.productId) ? (
      <Link
        to={"/produits/$productId/documents"}
        params={{ productId: project.productId }}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <FolderOpen className="size-4" /> {t("pages.documents.view_product_docs")}
      </Link>
    ) : undefined;

  return (
    <AppShell
      title={project?.name ?? t("nav.project_documents")}
      subtitle={t("nav.project_documents")}
      breadcrumb={[
        t("nav.qualite"),
        t("nav.projets"),
        project?.name ?? "",
        t("nav.project_documents"),
      ]}
      tabs={projectTabs(projectId)}
      actions={
        canUploadAnyProjectDoc() ? (
          <Button size="sm" asChild>
            <Link to="/projets/$projectId/documents/ajouter" params={{ projectId }}>
              <Plus className="size-4" /> {t("pages.documents.add_project")}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex items-center justify-end">{crossLink}</div>
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
                    {PROJECT_DOC_TYPE_LABEL[d.type as keyof typeof PROJECT_DOC_TYPE_LABEL] ??
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
                  {canDeleteProjectDoc(d.type) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteProjectDocument(d.id);
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
                  {t("pages.documents.empty_project")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
