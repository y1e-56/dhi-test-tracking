import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ScreenshotPickerLabels = {
  add: string;
  count: string;
  remove: string;
  imageOnly: string;
  nonImageIgnored: string;
  tooBig: string;
  maxReached: string;
};

/** Taille maximale par image, alignée sur la limite serveur des preuves. */
const MAX_BYTES = 10 * 1024 * 1024;

type Shot = { file: File; url: string };

/**
 * Selection et apercu local de captures d'ecran (images uniquement, 10 Mo max,
 * `max` au plus). Les apercus sont creees ici et liberes au demontage.
 */
export function ScreenshotPicker({
  onChange,
  max = 5,
  labels,
}: {
  onChange: (files: File[]) => void;
  max?: number;
  labels: ScreenshotPickerLabels;
}) {
  const [shots, setShots] = useState<Shot[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Lu uniquement au démontage : un cleanup dépendant de `shots` révoquerait
  // les aperçus déjà affichés à chaque nouvel ajout.
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  useEffect(() => {
    return () => {
      for (const shot of shotsRef.current) URL.revokeObjectURL(shot.url);
    };
  }, []);

  const commit = (next: Shot[]) => {
    setShots(next);
    onChange(next.map((s) => s.file));
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const all = Array.from(fileList);
    const images = all.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      toast.error(labels.imageOnly);
      return;
    }
    if (images.length < all.length) {
      toast.warning(labels.nonImageIgnored);
    }
    // Garde-fou côté client ; le serveur n'applique aujourd'hui aucune limite.
    const tooBig = images.filter((f) => f.size > MAX_BYTES);
    const accepted = images.filter((f) => f.size <= MAX_BYTES);
    if (tooBig.length > 0) {
      toast.error(labels.tooBig.replace("{n}", String(tooBig.length)));
    }
    if (accepted.length === 0) return;
    if (shots.length + accepted.length > max) {
      toast.error(labels.maxReached.replace("{n}", String(max)));
      return;
    }
    commit([
      ...shots,
      ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(shots[index]?.url ?? "");
    commit(shots.filter((_, i) => i !== index));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          // Reset pour pouvoir resélectionner le même fichier ensuite.
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={shots.length >= max}
        >
          <ImagePlus className="size-4" />
          {labels.add}
        </Button>
        <span className="text-xs text-muted-foreground">
          {labels.count
            .replace("{n}", String(shots.length))
            .replace("{max}", String(max))}
        </span>
      </div>
      {shots.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {shots.map((shot, index) => (
            <li key={shot.url} className="relative">
              <img
                src={shot.url}
                alt={shot.file.name}
                className="size-20 rounded-md border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={labels.remove}
                className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}