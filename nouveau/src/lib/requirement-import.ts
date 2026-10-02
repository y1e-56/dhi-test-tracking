import type { Criticality, Feature, RequirementStatus } from "@/lib/dhi-data";
import { CSV_SEP, parseCsvLine } from "@/lib/test-import";

/**
 * Format d'import des exigences (séparateur `;`, encodage UTF-8).
 *
 * Colonnes attendues :
 *   titre           (obligatoire)  le titre de l'exigence
 *   description                     texte libre
 *   fonctionnalites                 noms ou ids de fonctionnalités, séparés par |
 *   categorie                       voir CATEGORIES
 *   priorite                        basse | moyenne | haute | critique
 *   statut                          brouillon | validee | couverte
 *
 * Les en-têtes sont tolérants : les synonymes listés ci-dessous sont acceptés
 * pour éviter d'imposer un renommage de colonnes au fichier fourni.
 */
export const REQUIREMENT_TEMPLATE_HEADERS = [
  "titre",
  "description",
  "fonctionnalites",
  "categorie",
  "priorite",
  "statut",
];

export const CATEGORIES = [
  "fonctionnelle",
  "securite",
  "performance",
  "disponibilite",
  "ergonomie",
  "accessibilite",
  "maintenabilite",
  "compatibilite",
  "resilience",
  "observabilite",
  "documentation",
  "testabilite",
  "custom",
] as const;

export type RequirementCategory = (typeof CATEGORIES)[number];

/** Synonymes acceptés par colonne, tous en minuscules et sans accent. */
const HEADER_ALIASES: Record<string, string[]> = {
  titre: ["titre", "title", "libelle", "exigence", "nom", "intitule", "short_description"],
  description: ["description", "detail", "texte", "commentaire", "long_description"],
  fonctionnalites: [
    "fonctionnalites",
    "fonctionnalite",
    "features",
    "feature",
    "module",
    "modules",
    "rattachement",
  ],
  categorie: ["categorie", "category", "type_exigence", "nature"],
  priorite: ["priorite", "priority", "criticite", "importance"],
  statut: ["statut", "status", "etat", "state", "validation"],
};

const PRIORITY_ALIASES: Record<string, Criticality> = {
  basse: "basse",
  low: "basse",
  min: "basse",
  normale: "moyenne",
  moyenne: "moyenne",
  medium: "moyenne",
  moderee: "moyenne",
  haute: "haute",
  high: "haute",
  elevee: "haute",
  critique: "critique",
  critical: "critique",
  majeure: "critique",
};

const STATUS_ALIASES: Record<string, RequirementStatus> = {
  brouillon: "brouillon",
  proposed: "brouillon",
  a_valider: "brouillon",
  en_cours: "brouillon",
  validee: "validee",
  validated: "validee",
  valide: "validee",
  approuvee: "validee",
  couverte: "couverte",
  approved: "couverte",
  couvert: "couverte",
  implementee: "couverte",
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim();

/** Associe chaque colonne canonique à son index réel dans le fichier. */
function mapHeaders(headerCells: string[]): Record<string, number> {
  const normalized = headerCells.map(slug);
  const mapping: Record<string, number> = {};
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    const aliasSet = new Set(aliases.map(slug));
    const index = normalized.findIndex((h) => aliasSet.has(h));
    if (index >= 0) mapping[canonical] = index;
  }
  return mapping;
}

export type ParsedRequirementRow = {
  line: number;
  title: string;
  description: string;
  featureIds: string[];
  unknownFeatures: string[];
  category: RequirementCategory | "";
  priority: Criticality;
  status: RequirementStatus;
  errors: string[];
};

export type RequirementImportResult = {
  rows: ParsedRequirementRow[];
  missingColumns: string[];
  totalLines: number;
};

/**
 * Résolution d'une fonctionnalité référencée dans le fichier.
 * Par code CDC d'abord (features.module, ex. FCT-01), puis par identifiant, puis par nom.
 * Jamais de repli silencieux : une référence inconnue est signalée, car un rattachement
 * à la mauvaise fonctionnalité est plus grave qu'une ligne refusée.
 */
function resolveFeature(value: string, features: Feature[]): string | null {
  const v = value.trim();
  if (!v) return null;

  const byModule = features.find((f) => f.module && f.module.trim().toLowerCase() === v.toLowerCase());
  if (byModule) return byModule.id;

  const byId = features.find((f) => f.id.toLowerCase() === v.toLowerCase());
  if (byId) return byId.id;

  const inner = v.match(/\(([^)]+)\)\s*$/);
  if (inner?.[1]) {
    const innerValue = inner[1].trim();
    const byInnerModule = features.find(
      (f) => f.module && f.module.trim().toLowerCase() === innerValue.toLowerCase(),
    );
    if (byInnerModule) return byInnerModule.id;
    const byInnerId = features.find((f) => f.id.toLowerCase() === innerValue.toLowerCase());
    if (byInnerId) return byInnerId.id;
  }

  const target = slug(v);
  const byName = features.find((f) => slug(f.name) === target);
  if (byName) return byName.id;
  const byPartial = features.find((f) => slug(f.name).includes(target) || target.includes(slug(f.name)));
  return byPartial?.id ?? null;
}

export function parseRequirementImport(text: string, features: Feature[]): RequirementImportResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], missingColumns: ["titre"], totalLines: 0 };
  if (lines.length === 1) return { rows: [], missingColumns: ["titre"], totalLines: 0 };

  const headerCells = parseCsvLine(lines[0] ?? "").map((h) => h.trim());
  const columns = mapHeaders(headerCells);
  const missingColumns = Object.keys(HEADER_ALIASES).filter((k) => columns[k] === undefined);

  const cell = (cells: string[], key: string) => {
    const i = columns[key];
    return i === undefined ? "" : (cells[i] ?? "").trim();
  };

  const rows: ParsedRequirementRow[] = [];
  for (let ln = 1; ln < lines.length; ln++) {
    const cells = parseCsvLine(lines[ln] ?? "");
    const errors: string[] = [];

    const title = cell(cells, "titre");
    if (!title) errors.push("Titre vide");

    const featureIds: string[] = [];
    const unknownFeatures: string[] = [];
    for (const raw of cell(cells, "fonctionnalites").split(/[|\n]/).map((s) => s.trim()).filter(Boolean)) {
      const resolved = resolveFeature(raw, features);
      if (resolved) {
        if (!featureIds.includes(resolved)) featureIds.push(resolved);
      } else {
        unknownFeatures.push(raw);
      }
    }

    const rawCategory = cell(cells, "categorie");
    let category: RequirementCategory | "" = "";
    if (rawCategory) {
      const target = slug(rawCategory).replace(/ /g, "_");
      if ((CATEGORIES as readonly string[]).includes(target)) {
        category = target as RequirementCategory;
      } else {
        errors.push(`Catégorie inconnue : ${rawCategory}`);
      }
    }

    const rawPriority = slug(cell(cells, "priorite"));
    let priority: Criticality = "moyenne";
    if (rawPriority) {
      const hit = PRIORITY_ALIASES[rawPriority];
      if (hit) priority = hit;
      else errors.push(`Priorité inconnue : ${cell(cells, "priorite")}`);
    }

    const rawStatus = slug(cell(cells, "statut"));
    let status: RequirementStatus = "brouillon";
    if (rawStatus) {
      const hit = STATUS_ALIASES[rawStatus];
      if (hit) status = hit;
      else errors.push(`Statut inconnu : ${cell(cells, "statut")}`);
    }

    if (unknownFeatures.length > 0) {
      errors.push(`Fonctionnalité(s) introuvable(s) : ${unknownFeatures.join(", ")}`);
    }

    rows.push({
      line: ln + 1,
      title,
      description: cell(cells, "description"),
      featureIds,
      unknownFeatures,
      category,
      priority,
      status,
      errors,
    });
  }

  return { rows, missingColumns, totalLines: lines.length - 1 };
}

function csvCell(value: string): string {
  return value.includes(CSV_SEP) || value.includes('"') || value.includes("\n")
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

const SAMPLE_ROWS: string[][] = [
  ["Connexion par mot de passe", "L'utilisateur saisit son identifiant et son mot de passe.", "Authentification", "securite", "haute", "validee"],
  ["Mot de passe oublié", "Un lien de réinitialisation est envoyé par email.", "Authentification", "securite", "haute", "couverte"],
  ["Déconnexion automatique", "La session expire après 15 minutes d'inactivité.", "Authentification", "securite", "moyenne", "validee"],
  ["Consultation du tableau de bord", "Chaque utilisateur voit les indicateurs de son périmètre.", "Tableau de bord", "fonctionnelle", "moyenne", "validee"],
  ["Horodatage des exports", "Chaque export porte la date de génération.", "Export PDF | Tableau de bord", "fonctionnelle", "basse", "brouillon"],
  ["Journalisation des accès", "Les connexions et échecs sont journalisés et conservés 12 mois.", "", "documentation", "critique", "validee"],
];

/** Modèle CSV à remettre à l'entreprise : 6 exemples commentés + une ligne vide. */
export function buildRequirementTemplate(): string {
  const header = REQUIREMENT_TEMPLATE_HEADERS.join(CSV_SEP);
  const rows = SAMPLE_ROWS.map((r) => r.map(csvCell).join(CSV_SEP));
  return [header, ...rows, "", ""].join("\n");
}
