import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied({ subject }: { subject?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Accès restreint</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {subject
            ? `Vous n'avez pas accès à « ${subject} ». Cette ressource n'est pas affectée à votre compte.`
            : "Vous n'avez pas accès à cette ressource."}
        </p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to="/">
          <ArrowLeft className="size-4" /> Retour à l'accueil
        </Link>
      </Button>
    </div>
  );
}

export function ProductAccessDenied({ subject }: { subject?: string }) {
  return <AccessDenied subject={subject} />;
}

export function ProjectAccessDenied({ subject }: { subject?: string }) {
  return <AccessDenied subject={subject} />;
}

export function CampaignAccessDenied({ subject }: { subject?: string }) {
  return <AccessDenied subject={subject} />;
}
