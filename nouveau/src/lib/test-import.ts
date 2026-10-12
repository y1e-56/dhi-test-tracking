import type { Criticality, Feature, TestType } from "@/lib/dhi-data";

export const CSV_SEP = ";";

export const CRITICALITIES: Criticality[] = ["critique", "haute", "moyenne", "basse"];

export const TEST_TYPES: TestType[] = [
  "fonctionnel",
  "regression",
  "integration",
  "api",
  "recette_metier",
  "smoke",
  "sanity",
  "exploratoire",
  "securite",
  "penetration",
  "performance",
  "charge",
  "endurance",
  "volumetrie",
  "robustesse",
  "accessibilite",
  "compatibilite",
  "conformite",
];

export type ParsedTestRow = {
  name: string;
  featureId: string;
  criticality: Criticality;
  type: TestType;
  tester: string;
  preconditions: string[];
  steps: string[];
  expected: string[];
  observed: string[];
  comment: string;
  _raw: Record<string, string>;
  errors: string[];
};

/** Une ligne importable ne doit porter aucune erreur de validation. */
export function isImportableRow(row: ParsedTestRow): boolean {
  return row.errors.length === 0 && row.name.trim().length > 0 && row.featureId.length > 0;
}

/** Normalise une valeur : minuscules, sans accents, sans espaces superflus. */
function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === CSV_SEP || c === "\t") && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

/** Découpe l'intégralité d'un CSV en enregistrements (gère les guillemets, `;`/tabulations et retours à la ligne encadrés). */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === CSV_SEP || c === "\t") {
      cells.push(cur);
      cur = "";
    } else if (c === "\n") {
      cells.push(cur);
      records.push(cells);
      cells = [];
      cur = "";
    } else if (c === "\r") {
      if (text[i + 1] !== "\n") {
        cells.push(cur);
        records.push(cells);
        cells = [];
        cur = "";
      }
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  records.push(cells);
  return records.filter((r) => r.some((c) => c.trim().length > 0));
}

function normalizeCrit(value: string, errors: string[]): Criticality {
  const c = normalizeToken(value) as Criticality;
  if (!c) return "moyenne";
  if (CRITICALITIES.includes(c)) return c;
  errors.push(`Criticité invalide: ${value.trim()}`);
  return "moyenne";
}

function normalizeType(value: string, errors: string[]): TestType {
  const c = normalizeToken(value).replace(/[\s-]+/g, "_") as TestType;
  if (!c) return "fonctionnel";
  if (TEST_TYPES.includes(c)) return c;
  errors.push(`Type invalide: ${value.trim().replace(/_/g, " ")}`);
  return "fonctionnel";
}

/**
 * Résout une fonctionnalité à partir d'un ID exact (`f-auth`), d'un nom,
 * d'un code CDC (`FCT-01`, stocké dans `module`), du format « Nom (ID) »
 * (même imbriqué) ou d'une correspondance partielle.
 * Renvoie "" si la valeur non vide ne correspond à aucune fonctionnalité.
 */
export function resolveFeatureId(value: string, features: Feature[]): string {
  const v = value.trim();
  if (!v) return features[0]?.id ?? "";
  const lv = normalizeToken(v);

  const byId = features.find((f) => normalizeToken(f.id) === lv);
  if (byId) return byId.id;

  const byModule = features.find((f) => f.module && normalizeToken(f.module) === lv);
  if (byModule) return byModule.id;

  const byParen = features.find(
    (f) =>
      new RegExp(`\\(\\s*${escapeRegExp(f.id)}\\s*\\)`, "i").test(v) ||
      (f.module ? new RegExp(`\\(\\s*${escapeRegExp(f.module)}\\s*\\)`, "i").test(v) : false),
  );
  if (byParen) return byParen.id;

  const byName = features.find((f) => normalizeToken(f.name) === lv);
  if (byName) return byName.id;

  const byContains = features.find(
    (f) =>
      lv.includes(normalizeToken(f.id)) ||
      lv.includes(normalizeToken(f.name)) ||
      (f.module ? lv.includes(normalizeToken(f.module)) : false),
  );
  return byContains?.id ?? "";
}

function hasFeatureRef(value: string, features: Feature[]): boolean {
  const lv = normalizeToken(value);
  if (!lv) return false;
  return features.some(
    (f) =>
      lv.includes(normalizeToken(f.id)) ||
      lv.includes(normalizeToken(f.name)) ||
      (f.module ? lv.includes(normalizeToken(f.module)) : false),
  );
}

function splitPipe(s: string): string[] {
  return s
    .split(/\|\|\||\n|##|;\s*;/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function stripBullet(line: string): string {
  return line.replace(/^[-*●•]\s+/, "").replace(/^\d+[.)]\s*/, "").trim();
}

type NorSection = "preconditions" | "steps" | "expected" | "observed" | "comment";

function norSection(line: string): NorSection | null {
  const l = normalizeToken(line);
  if (/^preconditions?\s*:/.test(l)) return "preconditions";
  if (/^etapes?\s*:/.test(l)) return "steps";
  if (/^resultats?\s+obtenus?\s*:/.test(l)) return "observed";
  if (/^resultats?\s+attendus?\s*:/.test(l)) return "expected";
  if (/^commentaires?\s*:/.test(l)) return "comment";
  return null;
}

function norMeta(line: string): { key: "criticality" | "type" | "tester"; value: string } | null {
  const m = line.match(/^\s*(criticité|criticite|type|testeur|tester)\s*[:=]\s*(.*)$/i);
  if (!m) return null;
  const k = normalizeToken(m[1] ?? "");
  const key = k === "criticite" ? "criticality" : k === "type" ? "type" : "tester";
  return { key, value: (m[2] ?? "").trim() };
}

function nextNonEmptyLine(lines: string[], from: number): string | null {
  for (let j = from + 1; j < lines.length; j++) {
    const s = (lines[j] ?? "").trim();
    if (s) return s;
  }
  return null;
}

function parseNor(text: string, features: Feature[]): ParsedTestRow[] {
  const lines = text.split(/\r?\n/);
  const rows: ParsedTestRow[] = [];

  let curTitle = "";
  let section: NorSection | null = null;
  let criticality: Criticality = "moyenne";
  let type: TestType = "fonctionnel";
  let tester = "";
  let draftErrors: string[] = [];
  let preconditions: string[] = [];
  let steps: string[] = [];
  let expected: string[] = [];
  let observed: string[] = [];
  let comment = "";

  const resetDraft = () => {
    curTitle = "";
    section = null;
    criticality = "moyenne";
    type = "fonctionnel";
    tester = "";
    draftErrors = [];
    preconditions = [];
    steps = [];
    expected = [];
    observed = [];
    comment = "";
  };

  const flush = () => {
    const title = curTitle.trim();
    if (!title) {
      resetDraft();
      return;
    }
    const rowErrors = [...draftErrors];
    let fid = resolveFeatureId(title, features);
    if (!fid && features.length === 1) fid = features[0]?.id ?? "";
    if (!fid) rowErrors.push("Fonctionnalité introuvable");
    rows.push({
      name: title,
      featureId: fid,
      criticality,
      type,
      tester,
      preconditions: [...preconditions],
      steps: [...steps],
      expected: [...expected],
      observed: [...observed],
      comment: comment.trim(),
      _raw: {},
      errors: rowErrors,
    });
    resetDraft();
  };

  let afterBlank = true;
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? "").trim();
    if (!line) {
      afterBlank = true;
      continue;
    }
    if (/^[-=_*+#]{3,}$/.test(line)) {
      afterBlank = false;
      continue;
    }

    const meta = norMeta(line);
    if (meta) {
      if (meta.key === "criticality") criticality = normalizeCrit(meta.value, draftErrors);
      else if (meta.key === "type") type = normalizeType(meta.value, draftErrors);
      else tester = meta.value;
      afterBlank = false;
      continue;
    }

    const sec = norSection(line);
    if (sec) {
      section = sec;
      afterBlank = false;
      continue;
    }

    const bullet = /^[-*●•]\s+/.test(line);
    const numbered = /^\d+[.)]\s+/.test(line);

    if (!bullet && !numbered) {
      const next = nextNonEmptyLine(lines, i);
      const startsBlock =
        !curTitle.trim() ||
        (afterBlank &&
          (hasFeatureRef(line, features) ||
            (next !== null && (norSection(next) !== null || norMeta(next) !== null))));
      if (startsBlock) {
        flush();
        curTitle = line;
        afterBlank = false;
        continue;
      }
    }

    const content = stripBullet(line);
    if (!content) {
      afterBlank = false;
      continue;
    }
    switch (section) {
      case "preconditions":
        preconditions.push(content);
        break;
      case "steps":
        steps.push(content);
        break;
      case "expected":
        expected.push(content);
        break;
      case "observed":
        observed.push(content);
        break;
      case "comment":
        comment = comment ? `${comment}\n${content}` : content;
        break;
      default:
        break;
    }
    afterBlank = false;
  }

  flush();
  return rows;
}

function parseCsv(text: string, features: Feature[]): ParsedTestRow[] {
  const records = parseCsvRecords(text);
  if (records.length < 2) return [];
  const headerCells = (records[0] ?? []).map((h) => normalizeToken(h));
  const idx = (name: string) => headerCells.indexOf(name);
  const iNom = idx("nom");
  const iFeat = idx("fonctionnalite");
  const iCrit = idx("criticite");
  const iType = idx("type");
  const iTesteur = idx("testeur");
  const iPrec = idx("preconditions");
  const iSteps = idx("steps");
  const iExp = idx("resultat_attendu") >= 0 ? idx("resultat_attendu") : idx("expected");
  const iObs = idx("resultat_obtenu") >= 0 ? idx("resultat_obtenu") : idx("observed");
  const iComment = idx("commentaires") >= 0 ? idx("commentaires") : idx("comment");
  if (iNom < 0) return [];

  const rows: ParsedTestRow[] = [];
  for (let ln = 1; ln < records.length; ln++) {
    const cells = records[ln] ?? [];
    const errors: string[] = [];
    const raw: Record<string, string> = {};
    headerCells.forEach((h, i) => (raw[h] = (cells[i] ?? "").trim()));
    const name = (cells[iNom] ?? "").trim();
    if (!name) errors.push("Nom vide");
    const featureVal = iFeat >= 0 ? cells[iFeat] ?? "" : "";
    const fid = resolveFeatureId(featureVal, features);
    if (!fid) errors.push("Fonctionnalité introuvable");
    const criticality = normalizeCrit(iCrit >= 0 ? cells[iCrit] ?? "" : "moyenne", errors);
    const type = normalizeType(iType >= 0 ? cells[iType] ?? "" : "fonctionnel", errors);
    const tester = iTesteur >= 0 ? (cells[iTesteur] ?? "").trim() : "";
    const preconditions = iPrec >= 0 ? splitPipe(cells[iPrec] ?? "") : [];
    const steps = iSteps >= 0 ? splitPipe(cells[iSteps] ?? "") : [];
    const expected = iExp >= 0 ? splitPipe(cells[iExp] ?? "") : [];
    const observed = iObs >= 0 ? splitPipe(cells[iObs] ?? "") : [];
    const comment = iComment >= 0 ? (cells[iComment] ?? "").trim() : "";
    rows.push({
      name,
      featureId: fid,
      criticality,
      type,
      tester,
      preconditions,
      steps,
      expected,
      observed,
      comment,
      _raw: raw,
      errors,
    });
  }
  return rows;
}

/**
 * Détecte le format à partir du contenu (avec l'extension comme indice) :
 * un fichier CSV possède un en-tête contenant la colonne « nom ».
 */
export function parseImportText(text: string, features: Feature[], filename: string): ParsedTestRow[] {
  const clean = text.replace(/^\uFEFF/, "");
  const lower = filename.toLowerCase();
  const headerCells = (parseCsvRecords(clean)[0] ?? []).map((h) => normalizeToken(h));
  const looksCsv = headerCells.length > 1 && headerCells.includes("nom");

  if (looksCsv) return parseCsv(clean, features);
  if (/\.(txt|text|md|log|tab|nor)$/.test(lower)) return parseNor(clean, features);
  const csvRows = parseCsv(clean, features);
  return csvRows.length > 0 ? csvRows : parseNor(clean, features);
}

export function exportCsvTemplate(featureList: Feature[]): void {
  const headers = [
    "nom",
    "fonctionnalite",
    "criticite",
    "type",
    "testeur",
    "preconditions",
    "steps",
    "resultat_attendu",
    "resultat_obtenu",
    "commentaires",
  ];
  const header = headers.join(CSV_SEP) + "\n";
  const sampleFeature = featureList[0] ? `${featureList[0].name} (${featureList[0].id})` : "Authentification (f-auth)";
  const sample = [
    "Connexion avec mot de passe valide",
    sampleFeature,
    "critique",
    "fonctionnel",
    "Marie Martin",
    "Utilisateur enregistré|||Page de connexion ouverte",
    "Saisir email|||Saisir mdp demo|||Cliquer sur Se connecter",
    "Champ email ok|||Champ mdp ok|||Redirection tableau de bord",
    "Comportement conforme (ou à renseigner à l'exécution)",
    "Test rapide à exécuter (commentaire optionnel)",
  ]
    .map((v) => (v.includes(CSV_SEP) || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v))
    .join(CSV_SEP);
  const blob = new Blob([header + sample + "\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-import-tests.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportNorTemplate(featureList: Feature[]): void {
  const sampleFeature = featureList[0] ? `${featureList[0].name} (${featureList[0].id})` : "Authentification (f-auth)";
  const content = [
    `Connexion avec mot de passe valide (${sampleFeature})`,
    "Criticité: critique",
    "Type: fonctionnel",
    "Testeur: Marie Martin",
    "",
    "Préconditions:",
    "- Utilisateur enregistré",
    "- Page de connexion ouverte",
    "",
    "Étapes:",
    "1. Saisir email",
    "2. Saisir mot de passe demo",
    "3. Cliquer sur Se connecter",
    "",
    "Résultats attendus:",
    "- Champ email OK",
    "- Champ mot de passe OK",
    "- Redirection vers le tableau de bord",
    "",
    "Résultat obtenu:",
    "- (à renseigner à l'exécution)",
    "",
    "Commentaire:",
    "(optionnel)",
  ];
  const blob = new Blob([content.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-import-tests-nor.txt";
  a.click();
  URL.revokeObjectURL(url);
}
