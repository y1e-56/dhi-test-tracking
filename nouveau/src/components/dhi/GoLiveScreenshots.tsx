import { EvidenceThumbnails } from "@/components/dhi/EvidenceThumbnails";
import { useI18n } from "@/lib/i18n";

/**
 * Affiche les captures d'ecran rattachees a une decision Go Live.
 * L'affichage (vignettes authentifiees par Bearer) est delegue a
 * EvidenceThumbnails, partage avec les preuves des anomalies.
 */
export function GoLiveScreenshots({
  backendId,
}: {
  backendId: number | null | undefined;
}) {
  const { t } = useI18n();
  return (
    <EvidenceThumbnails
      entityType="go_live_decision"
      backendId={backendId}
      label={t("pages.go_live.decision_screenshots")}
    />
  );
}