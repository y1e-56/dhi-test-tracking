import type { Criticality } from "@/lib/dhi-data";
import { CSV_SEP, parseCsvLine } from "@/lib/test-import";

/**
 * Format d'import des fonctionnalités (par campagne, séparateur `;`, UTF-8).
 *
 *   code     (recommandé)  code de référence du CDC, stocké dans features.module
 *                          c'est la clé de jointure utilisée par les imports
 *                          exigences et tests
 *   nom      (obligatoire)
 *   description
 *   priorite                basse | moyenne | haute | critique
 *
 * Le nom doit être unique dans la campagne : la base l'impose.
 */
export const FEATURE_TEMPLATE_HEADERS = ["code", "nom", "description", "priorite"];

const HEADER_ALIASES: Record<string, string[]> = {
  code: ["code", "reference", "ref", "id", "identifiant", "code_fonctionnalite", "module"],
  nom: ["nom", "name", "libelle", "intitule", "fonctionnalite", "feature"],
  description: ["description", "detail", "texte", "commentaire"],
  priorite: ["priorite", "priority", "criticite", "importance"],
};

const PRIORITY_ALIASES: Record<string, Criticality> = {
  basse: "basse",
  low: "basse",
  min: "basse",
  normale: "moyenne",
  moyenne: "moyenne",
  medium: "moyenne",
  moderee: "moyenne",
  standard: "moyenne",
  haute: "haute",
  high: "haute",
  elevee: "haute",
  importante: "haute",
  critique: "critique",
  critical: "critique",
  majeure: "critique",
  bloquante: "critique",
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim();

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

export type ParsedFeatureRow = {
  line: number;
  code: string;
  name: string;
  description: string;
  priority: Criticality;
  errors: string[];
};

export type FeatureImportResult = {
  rows: ParsedFeatureRow[];
  missingColumns: string[];
  totalLines: number;
  duplicatedCodes: string[];
};

export function parseFeatureImport(text: string): FeatureImportResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], missingColumns: ["nom"], totalLines: 0, duplicatedCodes: [] };

  const headerCells = parseCsvLine(lines[0] ?? "").map((h) => h.trim());
  const columns = mapHeaders(headerCells);
  const missingColumns = Object.keys(HEADER_ALIASES).filter((k) => columns[k] === undefined);

  const cell = (cells: string[], key: string) => {
    const i = columns[key];
    return i === undefined ? "" : (cells[i] ?? "").trim();
  };

  const rows: ParsedFeatureRow[] = [];
  const codeCount = new Map<string, number>();

  for (let ln = 1; ln < lines.length; ln++) {
    const cells = parseCsvLine(lines[ln] ?? "");
    const errors: string[] = [];

    const name = cell(cells, "nom");
    if (!name) errors.push("Nom vide");

    const code = cell(cells, "code");
    if (code) {
      const key = code.toLowerCase();
      codeCount.set(key, (codeCount.get(key) ?? 0) + 1);
    }

    const rawPriority = slug(cell(cells, "priorite"));
    let priority: Criticality = "moyenne";
    if (rawPriority) {
      const hit = PRIORITY_ALIASES[rawPriority];
      if (hit) priority = hit;
      else errors.push(`Priorité inconnue : ${cell(cells, "priorite")}`);
    }

    rows.push({ line: ln + 1, code, name, description: cell(cells, "description"), priority, errors });
  }

  // Détecte les codes répétés : ils casseraient la jointure des imports suivants
  const duplicatedCodes = [...codeCount.entries()].filter(([, n]) => n > 1).map(([c]) => c);
  for (const row of rows) {
    if (row.code && duplicatedCodes.includes(row.code.toLowerCase())) {
      row.errors.push(`Code en double : ${row.code}`);
    }
  }

  return { rows, missingColumns, totalLines: lines.length - 1, duplicatedCodes };
}

function csvCell(value: string): string {
  return value.includes(CSV_SEP) || value.includes('"') || value.includes("\n")
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

const SAMPLE_ROWS: string[][] = [
  ["FCT-01", "Authentification", "Connexion par identifiant et mot de passe, inscription, réinitialisation.", "haute"],
  ["FCT-02", "Gestion des projets", "Création, consultation et clôture d'un projet.", "moyenne"],
  ["FCT-03", "Tableau de bord", "Indicateurs et tableaux de bord par périmètre utilisateur.", "moyenne"],
  ["FCT-04", "Export PDF", "Génération et téléchargement des exports au format PDF.", "basse"],
];

/** Modèle CSV à remettre pour le découpage fonctionnel. */
export function buildFeatureTemplate(): string {
  const header = FEATURE_TEMPLATE_HEADERS.join(CSV_SEP);
  const rows = SAMPLE_ROWS.map((r) => r.map(csvCell).join(CSV_SEP));
  return [header, ...rows, "", ""].join("\n");
}
