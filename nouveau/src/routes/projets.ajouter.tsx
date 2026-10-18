import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { AccessDenied } from "@/components/dhi/AccessDenied";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { projectForm } from "@/lib/forms/project-form";
import { useI18n } from "@/lib/i18n";
import { canCreateProject } from "@/lib/role-protection";

export const Route = createFileRoute("/projets/ajouter")({
  // Contexte d'entree optionnel : creation depuis une fiche produit
  // (`?productId=`) fige le produit dans le formulaire.
  validateSearch: z.object({
    productId: z.string().optional(),
  }),
  head: () => ({
    meta: [{ title: "Créer un projet — DHI Quality Platform" }],
  }),
  component: CreateProjectPage,
});

function CreateProjectPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { productId } = Route.useSearch();
  const seed = productId ? { productId } : undefined;
  const goToProjects = () => void navigate({ to: "/projets" });
  // Meme regle que le bouton « Nouveau projet » : pas de formulaire par l'URL directe.
  if (!canCreateProject()) return <AccessDenied subject={t("nav.projets")} />;

  return (
    <AppShell
      title={t("pages.projects.title")}
      subtitle={t("pages.projects.subtitle")}
      breadcrumb={t("pages.projects.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToProjects} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("common.projets")}
          </Button>
        </div>

        <EntityForm
          schema={projectForm}
          mode="create"
          seed={seed}
          onCancel={goToProjects}
          onSaved={goToProjects}
        />
      </div>
    </AppShell>
  );
}
