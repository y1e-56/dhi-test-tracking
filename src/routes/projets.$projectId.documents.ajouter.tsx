import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, loadSnapshot } from "@/lib/dhi-store";
import { projects as seedProjects, type ProjectDocumentType } from "@/lib/dhi-data";
import { projectTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { getUser, projectVisibleTo } from "@/lib/access";
import { canUploadProjectDoc } from "@/lib/document-permissions";
import { ProjectAccessDenied } from "@/components/dhi/AccessDenied";
import { uploadEvidence } from "@/lib/api";

export const Route = createFileRoute("/projets/$projectId/documents/ajouter")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const projects = snapshot?.projects ?? seedProjects;
    const pr = projects.find((x) => x.id === params.projectId);
    return { name: pr?.name ?? "Projet" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Ajouter un document · ${loaderData?.name ?? "Projet"} — DHI Quality Platform` },
    ],
  }),
  component: AddProjectDocument,
});

function AddProjectDocument() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products, projects, addProjectDocument } = useStore();
  const project = projects.find((p) => p.id === projectId);

  const [type, setType] = useState<ProjectDocumentType>("cdc_sprint");
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [reading, setReading] = useState(false);

  const backTo = `/projets/${projectId}/documents`;

  const handleFilePick = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.trim()) {
      toast.error(t("pages.documents.fill_required"));
      return;
    }
    setFileName(file.name);
    setFileSize(file.size);
    setFile(file);
    setReading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setReading(false);
      toast.error(t("pages.documents.read_error"));
    };
    reader.onload = () => {
      setReading(false);
      setContent(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUploadProjectDoc(type)) {
      toast.error(t("pages.documents.denied"));
      return;
    }
    if (!type.trim() || !name.trim() || !fileName.trim()) {
      toast.error(t("pages.documents.fill_required"));
      return;
    }
    if (localStorage.getItem("token") && /^\d+$/.test(projectId) && file) {
      try {
        await uploadEvidence("project", projectId, file, JSON.stringify({ name: name.trim(), type: type.trim() }));
        toast.success(t("pages.documents.added"));
        void navigate({ to: backTo });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("common.erreur"));
      }
      return;
    }
    addProjectDocument({
      projectId,
      type: type.trim(),
      name: name.trim(),
      fileName: fileName.trim(),
      content,
      uploadedBy: getUser()?.name ?? "—",
      uploadedAt: new Date().toISOString().slice(0, 10),
    });
    toast.success(t("pages.documents.added"));
    void navigate({ to: backTo });
  };

  if (project && !projectVisibleTo(project, products, getUser())) {
    return <ProjectAccessDenied subject={project.name} />;
  }

  return (
    <AppShell
      title={project?.name ?? t("nav.project_documents")}
      subtitle={t("nav.project_documents")}
      breadcrumb={[
        t("nav.qualite"),
        t("nav.projets"),
        project?.name ?? "",
        t("nav.project_documents"),
        t("pages.documents.add_project"),
      ]}
      tabs={projectTabs(projectId)}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Link to={backTo} className="inline-flex items-center gap-2">
            <ArrowLeft className="size-4" />
            <span className="text-sm font-medium">{t("pages.product_detail.portfolio")}</span>
          </Link>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.documents.add_project")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("pages.documents.subtitle")}</p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="d-type" className="text-sm font-medium">
                  {t("pages.documents.type")}
                </Label>
                <Input
                  id="d-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ProjectDocumentType)}
                  placeholder="Ex. Cahier des charges"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="d-name" className="text-sm font-medium">
                  {t("pages.documents.name")}
                </Label>
                <Input
                  id="d-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("pages.documents.name")}
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="d-file" className="text-sm font-medium">
                  {t("pages.documents.file")}
                </Label>
                <label
                  htmlFor="d-file"
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 transition-colors hover:border-primary/50"
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {fileName
                      ? `${fileName}${fileSize != null ? ` (${formatBytes(fileSize)})` : ""}`
                      : t("pages.documents.choose_file")}
                  </span>
                </label>
                <Input
                  id="d-file"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                />
                {reading ? (
                  <p className="text-xs text-muted-foreground">{t("pages.documents.reading")}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: backTo })}
              className="h-11 px-6"
            >
              {t("actions.annuler")}
            </Button>
            <Button type="submit" className="h-11 px-6" disabled={!canUploadProjectDoc(type)}>
              <FileUp className="size-4" />
              {t("pages.documents.save")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
