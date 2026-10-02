import { useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { downloadEvidence, fetchEvidenceObjectUrl, getEvidenceByEntity } from "@/lib/api";

/**
 * Affiche les captures d'ecran rattachees a une entite (decision Go Live,
 * anomalie, ...). Les preuves sont protegees par Bearer : un <img src> ne
 * recevrait pas le jeton, donc chaque vignette passe par un blob + object URL.
 */
export function EvidenceThumbnails({
  entityType,
  backendId,
  label,
  refreshKey,
  onCountChange,
}: {
  entityType: string;
  backendId: number | null | undefined;
  label?: string;
  refreshKey?: number;
  onCountChange?: (count: number) => void;
}) {
  const [urls, setUrls] = useState<{ id: number; name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backendId) return;
    let cancelled = false;
    const created: string[] = [];

    if (onCountChange) onCountChange(0);

    (async () => {
      setLoading(true);
      try {
        const images = (await getEvidenceByEntity(entityType, backendId))
          .data.filter((e) => e.file_type?.startsWith("image/"));
        if (cancelled || images.length === 0) {
          if (onCountChange) onCountChange(images.length);
          return;
        }
        const loaded = await Promise.all(
          images.map(async (e) => {
            const blob = await fetchEvidenceObjectUrl(e.id);
            return { id: e.id, name: e.file_name ?? "capture", url: blob };
          }),
        );
        if (cancelled) {
          for (const item of loaded) URL.revokeObjectURL(item.url);
          return;
        }
        for (const item of loaded) created.push(item.url);
        setUrls(loaded);
        if (onCountChange) onCountChange(loaded.length);
      } catch {
        // Une preuve illisible ne doit pas casser l'affichage.
        if (!cancelled) setUrls([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [entityType, backendId, refreshKey, onCountChange]);

  if (!backendId || (!loading && urls.length === 0)) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {loading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          {urls.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void downloadEvidence(item.id, item.name)}
              title={item.name}
              className="overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
            >
              <img src={item.url} alt={item.name} className="size-16 object-cover" />
            </button>
          ))}
          {label ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImageOff className="size-3" />
              {label}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}