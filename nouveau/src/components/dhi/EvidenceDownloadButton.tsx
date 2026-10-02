import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadEvidence } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

/**
 * Bouton de telechargement d'une preuve.
 *
 * Masque pour les documents purement locaux (identifiant non numerique) : ils
 * n'existent que dans le navigateur et n'ont aucun fichier cote serveur.
 */
export function EvidenceDownloadButton({
  id,
  fileName,
}: {
  id: string;
  fileName?: string;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const isBackendDoc = /^\d+$/.test(id);

  if (!isBackendDoc) return null;

  const handleClick = async () => {
    setBusy(true);
    try {
      await downloadEvidence(Number(id), fileName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.erreur"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleClick}
      disabled={busy}
      aria-label={`${t("pages.documents.download")} ${fileName ?? ""}`}
      title={t("pages.documents.download")}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
    </Button>
  );
}
