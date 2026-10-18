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

/** Une ligne importable ne porte aucune erreur, a un nom et une fonctionnalite. */
export function isImportableRow(row: ParsedTestRow): boolean {
  return row.errors.length === 0 && row.name.trim().length > 0 && row.featureId.length > 0;
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
    } else if (c === CSV_SEP && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

/**
 * Separateur d'un CSV, deduit de sa ligne d'en-tete : `;` (Excel francais),
 * `,` (Google Sheets, Excel anglais) ou tabulation. `;` par defaut.
 */
export function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  let best = CSV_SEP;
  let bestCount = 0;
  for (const sep of [CSV_SEP, ",", "\t"]) {
    let count = 0;
    let inQuotes = false;
    for (const c of firstLine) {
      if (c === '"') inQuotes = !inQuotes;
      else if (c === sep && !inQuotes) count++;
    }
    if (count > bestCount) {
      best = sep;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Lit un CSV complet en enregistrements. Contrairement a un decoupage ligne par
 * ligne, une cellule entre guillemets peut contenir des retours a la ligne
 * (cellule Excel saisie avec Alt+Entree) sans casser la ligne en plusieurs
 * faux enregistrements. Les lignes entierement vides sont ignorees.
 */
export function parseCsvRecords(text: string): string[][] {
  const sep = detectSeparator(text);
  const records: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  const endRow = () => {
    row.push(cur);
    if (row.some((cell) => cell.trim().length > 0)) records.push(row);
    row = [];
    cur = "";
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      cur += c;
    } else if (c === sep) {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      endRow();
    } else if (c !== "\r") {
      cur += c;
    }
  }
  endRow();
  return records;
}

function normalizeCrit(value: string, errors: string[]): Criticality {
  const c = value.trim().toLowerCase() as Criticality;
  if (CRITICALITIES.includes(c)) return c;
  if (c) errors.push(`Criticité invalide: ${c}`);
  return "moyenne";
}

function normalizeType(value: string, errors: string[]): TestType {
  const c = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_") as TestType;
  if (TEST_TYPES.includes(c)) return c;
  if (c) errors.push(`Type invalide: ${c.replace(/_/g, " ")}`);
  return "fonctionnel";
}

export function resolveFeatureId(value: string, features: Feature[]): string {
  const v = value.trim();
  if (!v) return features[0]?.id ?? "";
  const byModule = features.find(
    (f) => f.module && f.module.trim().toLowerCase() === v.toLowerCase(),
  );
  if (byModule) return byModule.id;
  const byId = features.find((f) => f.id.toLowerCase() === v.toLowerCase());
  if (byId) return byId.id;
  const m = v.match(/\(([^)]+)\)\s*$/);
  if (m && m[1]) {
    const innerId = m[1].trim();
    const byInnerModule = features.find(
      (f) => f.module && f.module.trim().toLowerCase() === innerId.toLowerCase(),
    );
    if (byInnerModule) return byInnerModule.id;
    const byInner = features.find((f) => f.id.toLowerCase() === innerId.toLowerCase());
    if (byInner) return byInner.id;
  }
  const byName = features.find((f) => f.name.toLowerCase() === v.toLowerCase());
  if (byName) return byName.id;
  const byPartial = features.find((f) => f.name.toLowerCase().includes(v.toLowerCase()));
  return byPartial?.id ?? features[0]?.id ?? "";
}

function splitPipe(s: string): string[] {
  return s
    // `|` (un ou plusieurs, l'ancien modele utilisait `|||`), retour a la ligne,
    // `##` ou `;;`.
    .split(/\|+|\n|##|;\s*;/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Rubriques et champs reconnus dans un bloc NOR (`Cle: valeur`), sans accent. */
type NorKey = "pre" | "steps" | "expected" | "observed" | "comment" | "crit" | "type" | "tester";

const NOR_KEYS: Record<string, NorKey> = {
  preconditions: "pre",
  precondition: "pre",
  prerequis: "pre",
  etapes: "steps",
  etape: "steps",
  steps: "steps",
  "resultats attendus": "expected",
  "resultat attendu": "expected",
  attendu: "expected",
  "resultat obtenu": "observed",
  "resultats obtenus": "observed",
  obtenu: "observed",
  commentaire: "comment",
  commentaires: "comment",
  criticite: "crit",
  priorite: "crit",
  type: "type",
  testeur: "tester",
};

/** Reconnait une ligne `Rubrique:` ou `Champ: valeur` ; null sinon. */
function norKey(line: string): { key: NorKey; rest: string } | null {
  const m = line.match(/^([^:]{1,40}):\s*(.*)$/);
  if (!m?.[1]) return null;
  const key = NOR_KEYS[slug(m[1])];
  return key ? { key, rest: (m[2] ?? "").trim() } : null;
}

/** Contenu du dernier groupe de parentheses en fin de titre (imbrication geree). */
function trailingParenthesis(title: string): string | null {
  if (!title.endsWith(")")) return null;
  let depth = 0;
  for (let i = title.length - 1; i >= 0; i--) {
    if (title[i] === ")") depth++;
    else if (title[i] === "(") {
      depth--;
      if (depth === 0) return title.slice(i + 1, -1).trim() || null;
    }
  }
  return null;
}

type NorBlock = {
  title: string;
  crit: string;
  type: string;
  tester: string;
  pre: string[];
  steps: string[];
  expected: string[];
  observed: string[];
  comment: string[];
};

const BULLET = /^[-*●•]\s+/;
const NUMBERED = /^\d+[.)]\s+/;
const stripItem = (line: string) => line.replace(BULLET, "").replace(/^\d+[.)]\s*/, "").trim();

/**
 * Format NOR (.txt) : un test par bloc, les blocs separes par une ligne vide.
 *
 *   Titre du test (CODE-FONCTIONNALITE)
 *   Criticité: haute            (optionnel)
 *   Type: fonctionnel           (optionnel)
 *   Testeur: Marie Martin       (optionnel)
 *   Préconditions: / Étapes: / Résultats attendus: / Résultat obtenu: / Commentaire:
 *   - éléments en liste, numérotés ou non
 *
 * Une ligne de texte simple ouvre un nouveau test si elle suit une ligne vide
 * (ou si aucune rubrique n'est encore ouverte) ; sinon elle prolonge la
 * rubrique courante. La fonctionnalite, entre parentheses en fin de titre, est
 * resolue strictement, comme en CSV : inconnue ou absente, la ligne est en erreur.
 */
function parseNor(text: string, features: Feature[]): ParsedTestRow[] {
  const rows: ParsedTestRow[] = [];
  let block: NorBlock | null = null;
  let section: NorKey | null = null;
  let prevBlank = true;

  const flush = () => {
    if (!block) return;
    const errors: string[] = [];
    const ref = trailingParenthesis(block.title);
    let featureId = "";
    if (!ref) {
      errors.push("Fonctionnalité non indiquée : ajoutez son code entre parenthèses en fin de titre");
    } else {
      featureId = resolveFeatureStrict(ref, features);
      if (!featureId) errors.push(`Fonctionnalité introuvable : ${ref}`);
    }
    rows.push({
      name: block.title,
      featureId,
      criticality: normalizeCrit(block.crit, errors),
      type: normalizeType(block.type, errors),
      tester: block.tester,
      preconditions: block.pre,
      steps: block.steps,
      expected: block.expected,
      observed: block.observed,
      comment: block.comment.join("\n").trim(),
      _raw: {},
      errors,
    });
    block = null;
  };

  const addItem = (target: NorBlock, key: NorKey, line: string) => {
    if (key === "comment") target.comment.push(line);
    else if (key === "pre" || key === "steps" || key === "expected" || key === "observed") {
      const item = stripItem(line);
      if (item) target[key].push(item);
    }
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^[-=_*+#]{3,}$/.test(line)) {
      prevBlank = true;
      continue;
    }

    const kv = norKey(line);
    if (kv && block) {
      const current: NorBlock = block;
      if (kv.key === "crit" || kv.key === "type" || kv.key === "tester") {
        current[kv.key] = kv.rest;
      } else {
        section = kv.key;
        if (kv.rest) addItem(current, kv.key, kv.rest);
      }
      prevBlank = false;
      continue;
    }

    const listItem = BULLET.test(line) || NUMBERED.test(line);
    if (!block || (!listItem && (section === null || prevBlank))) {
      flush();
      block = {
        title: line,
        crit: "",
        type: "",
        tester: "",
        pre: [],
        steps: [],
        expected: [],
        observed: [],
        comment: [],
      };
      section = null;
    } else if (section) {
      addItem(block, section, line);
    }
    prevBlank = false;
  }
  flush();
  return rows;
}

/**
 * Résolution stricte, utilisée par le parseur CSV qui dispose d'une colonne
 * fonctionnalité : une référence non vide mais inconnue renvoie "" pour que la
 * ligne soit signalée en erreur, plutôt que rattachée à la première
 * fonctionnalité du produit. Un code FCT-99 mal saisi ne doit pas devenir
 * silencieusement le test d'une autre fonctionnalité.
 */
function resolveFeatureStrict(value: string, features: Feature[]): string {
  const v = value.trim();
  if (!v) return features[0]?.id ?? "";
  const direct = features.find(
    (f) =>
      (f.module && f.module.trim().toLowerCase() === v.toLowerCase()) ||
      f.id.toLowerCase() === v.toLowerCase() ||
      f.name.toLowerCase() === v.toLowerCase(),
  );
  if (direct) return direct.id;
  const inner = v.match(/\(([^)]+)\)\s*$/);
  if (inner?.[1]) {
    const innerValue = inner[1].trim().toLowerCase();
    const byInner = features.find(
      (f) =>
        (f.module && f.module.trim().toLowerCase() === innerValue) ||
        f.id.toLowerCase() === innerValue,
    );
    if (byInner) return byInner.id;
  }
  const target = v.toLowerCase();
  const byPartial = features.find((f) => f.name.toLowerCase().includes(target));
  return byPartial?.id ?? "";
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim();

/**
 * Synonymes acceptés par colonne, tous en minuscules et sans accent :
 * même tolérance que les imports exigences / fonctionnalités, pour qu'un
 * en-tête « Criticité » ou « Préconditions » issu d'Excel ne soit pas
 * ignoré silencieusement.
 */
const HEADER_ALIASES: Record<string, string[]> = {
  nom: ["nom", "name", "titre", "libelle", "intitule"],
  fonctionnalite: ["fonctionnalite", "fonctionnalites", "feature", "features", "module", "modules"],
  criticite: ["criticite", "priorite", "priority", "importance"],
  type: ["type", "categorie", "category"],
  testeur: ["testeur", "tester", "responsable", "owner", "affecte"],
  preconditions: ["preconditions", "prerequis", "prerequisites"],
  steps: ["steps", "etapes", "pas", "procedure"],
  resultat_attendu: ["resultat_attendu", "expected", "attendu"],
  resultat_obtenu: ["resultat_obtenu", "observed", "obtenu"],
  commentaires: ["commentaires", "commentaire", "comment", "remarque"],
};

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

function parseCsv(text: string, features: Feature[]): ParsedTestRow[] {
  const records = parseCsvRecords(text);
  if (records.length < 2) return [];
  const headerCells = (records[0] ?? []).map((h) => h.trim());
  const columns = mapHeaders(headerCells);
  if (columns["nom"] === undefined) return [];

  const cell = (cells: string[], key: string) => {
    const i = columns[key];
    return i === undefined ? "" : (cells[i] ?? "").trim();
  };

  const rows: ParsedTestRow[] = [];
  for (let ln = 1; ln < records.length; ln++) {
    const cells = records[ln] ?? [];
    const errors: string[] = [];
    const raw: Record<string, string> = {};
    headerCells.forEach((h, i) => (raw[h.toLowerCase()] = (cells[i] ?? "").trim()));

    const name = cell(cells, "nom");
    if (!name) errors.push("Nom vide");

    // La fonctionnalité est la clé de jointure : jamais de repli silencieux
    // sur la première fonctionnalité du produit (colonne absente ou valeur
    // vide doit être signalée, pas rattachée au hasard).
    let fid = "";
    if (columns["fonctionnalite"] === undefined) {
      errors.push("Colonne « fonctionnalite » absente de l'en-tête");
    } else {
      const featureVal = cell(cells, "fonctionnalite");
      if (!featureVal) {
        errors.push("Fonctionnalité vide : renseignez son nom ou son code");
      } else {
        fid = resolveFeatureStrict(featureVal, features);
        if (!fid) errors.push(`Fonctionnalité introuvable : ${featureVal}`);
      }
    }

    const criticality = normalizeCrit(cell(cells, "criticite"), errors);
    const type = normalizeType(cell(cells, "type"), errors);
    const tester = cell(cells, "testeur");
    const preconditions = splitPipe(cell(cells, "preconditions"));
    const steps = splitPipe(cell(cells, "steps"));
    const expected = splitPipe(cell(cells, "resultat_attendu"));
    const observed = splitPipe(cell(cells, "resultat_obtenu"));
    const comment = cell(cells, "commentaires");
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

export function parseImportText(
  text: string,
  features: Feature[],
  filename: string,
): ParsedTestRow[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".txt")) {
    return parseNor(text, features);
  }
  return parseCsv(text, features);
}

/**
 * Colonnes du modele d'import des cas de test, dans l'ordre de saisie.
 *
 * - fonctionnalite : le CODE de la fonctionnalite (FCT-01), comme dans les
 *   imports fonctionnalites / exigences — jamais un identifiant interne.
 * - preconditions, etapes, resultat_attendu : plusieurs valeurs separees par
 *   `|` ou par des retours a la ligne dans la cellule (Alt+Entree sous Excel).
 * - testeur : e-mail (ou nom) d'un testeur de la campagne, optionnel.
 *
 * Le resultat obtenu et les commentaires relevent de l'execution : ils ne
 * figurent plus dans le modele (encore acceptes a l'import, par compatibilite).
 */
export const TEST_TEMPLATE_HEADERS = [
  "nom",
  "fonctionnalite",
  "type",
  "criticite",
  "preconditions",
  "etapes",
  "resultat_attendu",
  "testeur",
];

const csvCell = (v: string) =>
  v.includes(CSV_SEP) || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;

/** Reference d'une fonctionnalite dans un fichier d'import : son code, a defaut son nom. */
export const featureRef = (feature: Feature | undefined) =>
  feature?.module?.trim() || feature?.name || "FCT-01";

/** Modele CSV des cas de test, illustre avec les fonctionnalites reelles de la campagne. */
export function buildTestCsvTemplate(featureList: Feature[], sampleTester = ""): string {
  const first = featureRef(featureList[0]);
  const second = featureRef(featureList[1] ?? featureList[0]);
  const rows = [
    [
      "Connexion avec mot de passe valide",
      first,
      "fonctionnel",
      "critique",
      "Utilisateur enregistré | Page de connexion ouverte",
      "Saisir l'e-mail | Saisir le mot de passe | Cliquer sur Se connecter",
      "Accès au tableau de bord",
      sampleTester,
    ],
    [
      "Connexion refusée avec mot de passe erroné",
      first,
      "securite",
      "haute",
      "Utilisateur enregistré",
      "Saisir l'e-mail\nSaisir un mauvais mot de passe\nCliquer sur Se connecter",
      "Message d'erreur affiché\nAucun accès accordé",
      "",
    ],
    ["Export du rapport au format PDF", second, "regression", "moyenne", "", "Ouvrir le rapport | Cliquer sur Exporter", "Fichier PDF téléchargé", ""],
  ];
  return [TEST_TEMPLATE_HEADERS.join(CSV_SEP), ...rows.map((r) => r.map(csvCell).join(CSV_SEP))].join(
    "\n",
  );
}

export function exportCsvTemplate(featureList: Feature[], sampleTester = ""): void {
  // BOM UTF-8 : sans lui, Excel affiche les accents du modele de travers.
  const blob = new Blob(["﻿", buildTestCsvTemplate(featureList, sampleTester), "\n"], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-import-tests.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Modele NOR (.txt) : un test par bloc, blocs separes par une ligne vide, le
 * code de la fonctionnalite entre parentheses en fin de titre. Comme le CSV,
 * il ne contient que la conception (pas de resultat obtenu).
 */
export function buildNorTemplate(featureList: Feature[], sampleTester = ""): string {
  const first = featureRef(featureList[0]);
  return [
    `Connexion avec mot de passe valide (${first})`,
    "Type: fonctionnel",
    "Criticité: critique",
    ...(sampleTester ? [`Testeur: ${sampleTester}`] : []),
    "Préconditions:",
    "- Utilisateur enregistré",
    "- Page de connexion ouverte",
    "Étapes:",
    "1. Saisir l'e-mail",
    "2. Saisir le mot de passe",
    "3. Cliquer sur Se connecter",
    "Résultats attendus:",
    "- Accès au tableau de bord",
    "",
    `Connexion refusée avec mot de passe erroné (${first})`,
    "Type: securite",
    "Criticité: haute",
    "Étapes:",
    "1. Saisir l'e-mail",
    "2. Saisir un mauvais mot de passe",
    "Résultats attendus:",
    "- Message d'erreur affiché",
  ].join("\n");
}

export function exportNorTemplate(featureList: Feature[], sampleTester = ""): void {
  const content = buildNorTemplate(featureList, sampleTester).split("\n");
  const blob = new Blob([content.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-import-tests-nor.txt";
  a.click();
  URL.revokeObjectURL(url);
}
