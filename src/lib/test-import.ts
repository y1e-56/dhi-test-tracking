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
  _raw: Record<string, string>;
  errors: string[];
};

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

function normalizeCrit(value: string, errors: string[]): Criticality {
  const c = value.trim().toLowerCase() as Criticality;
  if (CRITICALITIES.includes(c)) return c;
  if (c) errors.push(`Criticité invalide: ${c}`);
  return "moyenne";
}

function normalizeType(value: string, errors: string[]): TestType {
  const c = value.trim().toLowerCase().replace(/[\s-]+/g, "_") as TestType;
  if (TEST_TYPES.includes(c)) return c;
  if (c) errors.push(`Type invalide: ${c.replace(/_/g, " ")}`);
  return "fonctionnel";
}

export function resolveFeatureId(value: string, features: Feature[]): string {
  const v = value.trim();
  if (!v) return features[0]?.id ?? "";
  const byId = features.find((f) => f.id.toLowerCase() === v.toLowerCase());
  if (byId) return byId.id;
  const m = v.match(/\(([^)]+)\)\s*$/);
  if (m && m[1]) {
    const innerId = m[1].trim();
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
    .split(/\|\|\||\n|##|;\s*;/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function isNorHeader(line: string): string {
  const l = line.trim().toLowerCase();
  for (const k of [
    "préconditions:",
    "preconditions:",
    "étapes:",
    "etapes:",
    "résultats attendus:",
    "resultats attendus:",
    "résultat attendu:",
  ]) {
    if (l.startsWith(k)) return k;
  }
  return "";
}

function parseNor(text: string, features: Feature[]): ParsedTestRow[] {
  const lines = text.split(/\r?\n/);
  const rows: ParsedTestRow[] = [];
  let errors: string[] = [];
  let cur = "";
  let preconditions: string[] = [];
  let steps: string[] = [];
  let expected: string[] = [];
  let section = "";

  const flush = () => {
    if (cur.trim()) {
      const normalizedP = splitLines(preconditions.join("\n"));
      const normalizedS = steps
        .map((s) => s.replace(/^\d+[.)]\s*/, ""))
        .filter(Boolean);
      const rowErrors = [...errors];
      if (!cur.trim()) rowErrors.push("Nom vide");
      const fid = resolveFeatureId(cur, features);
      if (!fid) rowErrors.push("Fonctionnalité introuvable");
      rows.push({
        name: cur.trim(),
        featureId: fid,
        criticality: "moyenne",
        type: "fonctionnel",
        tester: "",
        preconditions: normalizedP,
        steps: normalizedS,
        expected: splitLines(expected.join("\n")),
        _raw: {},
        errors: rowErrors,
      });
    }
    errors = [];
    cur = "";
    preconditions = [];
    steps = [];
    expected = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const header = isNorHeader(line);
    if (header) {
      section = header;
      continue;
    }
    const horiz = /^[-=_*+#]{3,}$/.test(line);
    if (horiz) continue;
    const numbered = /^\d+[.)]\s+/.test(line);
    const bullet = /^[-*●•]\s+/.test(line);

    // Simple "titre de test" = ligne "Texte (id-feature)" au niveau 1
    if (!section && !bullet && !numbered) {
      flush();
      cur = line;
      continue;
    }

    if (section.startsWith("pré") || section.startsWith("pre")) {
      if (bullet) preconditions.push(line.replace(/^[-*●•]\s+/, ""));
      else preconditions.push(line.replace(/^\d+[.)]\s*/, ""));
    } else if (section.startsWith("ét") || section.startsWith("et")) {
      if (bullet) steps.push(line.replace(/^[-*●•]\s+/, ""));
      else steps.push(line);
    } else if (section.startsWith("rés") || section.startsWith("res")) {
      if (bullet) expected.push(line.replace(/^[-*●•]\s+/, ""));
      else expected.push(line.replace(/^\d+[.)]\s*/, ""));
    }
  }
  flush();
  return rows;
}

function parseCsv(text: string, features: Feature[]): ParsedTestRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headerCells = parseCsvLine(lines[0] ?? "").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headerCells.indexOf(name);
  const iNom = idx("nom");
  const iFeat = idx("fonctionnalite");
  const iCrit = idx("criticite");
  const iType = idx("type");
  const iTesteur = idx("testeur");
  const iPrec = idx("preconditions");
  const iSteps = idx("steps");
  const iExp = idx("expected");
  if (iNom < 0) return [];

  const rows: ParsedTestRow[] = [];
  for (let ln = 1; ln < lines.length; ln++) {
    const cells = parseCsvLine(lines[ln] ?? "");
    const errors: string[] = [];
    const raw: Record<string, string> = {};
    headerCells.forEach((h, i) => (raw[h] = (cells[i] ?? "").trim()));
    const name = raw["nom"] ?? "";
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
    rows.push({ name, featureId: fid, criticality, type, tester, preconditions, steps, expected, _raw: raw, errors });
  }
  return rows;
}

export function parseImportText(text: string, features: Feature[], filename: string): ParsedTestRow[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".txt")) {
    return parseNor(text, features);
  }
  return parseCsv(text, features);
}

export function exportCsvTemplate(featureList: Feature[]): void {
  const headers = ["nom", "fonctionnalite", "criticite", "type", "testeur", "preconditions", "steps", "expected"];
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
  ];
  const blob = new Blob([content.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-import-tests-nor.txt";
  a.click();
  URL.revokeObjectURL(url);
}
