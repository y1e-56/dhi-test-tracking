import type { WatchLevel, WatchPoint } from "@/lib/dhi-data";

/**
 * Recherche, filtres et tri des points à surveiller. Les filtres vivent dans
 * l'URL de la page (?q=&produit=&niveau=&responsable=&mine=1) : une vue filtrée
 * se partage et survit à un rechargement.
 */
export interface WatchFilters {
  q?: string | undefined;
  produit?: string | undefined;
  niveau?: WatchLevel | undefined;
  responsable?: string | undefined;
  mine?: boolean | undefined;
}

/** Du plus grave au moins grave : un point critique remonte toujours en tête. */
export const LEVEL_ORDER: Record<WatchLevel, number> = { critique: 0, vigilance: 1, info: 2 };

/** Nombre de points clos affichés avant « Voir tout ». */
export const CLOSED_PREVIEW = 10;

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function hasActiveFilters(f: WatchFilters): boolean {
  return Boolean(f.q?.trim() || f.produit || f.niveau || f.responsable || f.mine);
}

/**
 * Filtre les points : recherche plein texte (titre, description, responsable,
 * produit, fonctionnalité — sans tenir compte des accents ni de la casse),
 * puis produit, criticité, responsable et « mes points ».
 */
export function filterWatchPoints(
  points: WatchPoint[],
  f: WatchFilters,
  ctx: {
    productName: (id: string) => string;
    featureName: (id: string | undefined) => string;
    me: string | undefined;
  },
): WatchPoint[] {
  const terms = normalize(f.q?.trim() ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return points.filter((w) => {
    if (f.produit && w.productId !== f.produit) return false;
    if (f.niveau && w.level !== f.niveau) return false;
    if (f.responsable && w.owner !== f.responsable) return false;
    if (f.mine && (!ctx.me || w.owner !== ctx.me)) return false;
    if (terms.length === 0) return true;
    const haystack = normalize(
      [w.title, w.description, w.owner, ctx.productName(w.productId), ctx.featureName(w.featureId)]
        .filter(Boolean)
        .join(" "),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

/** Criticité décroissante, puis les plus récents d'abord. */
export function sortWatchPoints(points: WatchPoint[]): WatchPoint[] {
  return [...points].sort(
    (a, b) =>
      LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  );
}
