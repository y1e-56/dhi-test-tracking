import { CSV_SEP } from "@/lib/test-import";

/**
 * Lecture d'un fichier de découpage, quel que soit son format.
 *
 * Les parseurs métier (tests, exigences, fonctionnalités) n'attendent qu'une
 * chose : soit des lignes tabulaires (CSV `;`), soit du texte NOR. Ce module
 * isole la seule partie dépendante du format — transformer un fichier
 * `csv | txt | xlsx | docx | pdf` en lignes ou en texte — afin que les pages
 * d'import restent identiques d'un format à l'autre.
 *
 * Les bibliothèques lourdes (`read-excel-file`, `mammoth`, `pdfjs-dist`) sont
 * chargées dynamiquement : elles n'entrent dans le bundle qu'au moment où
 * l'utilisateur choisit réellement un fichier de ce type.
 */
export type ImportSource =
  | { kind: "table"; rows: string[][] }
  | { kind: "csv"; text: string }
  | { kind: "nor"; text: string };

/** `accept` commun aux trois imports. */
export const IMPORT_ACCEPT = [
  ".csv",
  ".txt",
  ".xlsx",
  ".docx",
  ".pdf",
  "text/csv",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
].join(",");

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export async function readImportSource(file: File): Promise<ImportSource> {
  switch (fileExtension(file.name)) {
    case "xlsx":
    case "xls":
      return { kind: "table", rows: await readSpreadsheet(file) };
    case "docx":
      return await readWord(file);
    case "pdf":
      return await readPdf(file);
    case "txt":
    case "text":
    case "md":
    case "log":
    case "nor":
      return { kind: "nor", text: decodeText(await file.arrayBuffer()) };
    default:
      return { kind: "csv", text: decodeText(await file.arrayBuffer()) };
  }
}

/**
 * Decode un fichier texte : UTF-8 s'il est valide, sinon Windows-1252. Le
 * « CSV (separateur : point-virgule) » d'Excel sous Windows est enregistre en
 * ANSI : lu de force en UTF-8, ses accents devenaient illisibles.
 */
export function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function quoteCell(value: string): string {
  return value.includes(CSV_SEP) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

/** Sérialise des lignes tabulaires au format CSV attendu par les parseurs. */
export function rowsToCsv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => quoteCell(cell)).join(CSV_SEP)).join("\n");
}

/**
 * Reconstitue des lignes tabulaires depuis du texte (Word/PDF sans tableau),
 * en coupant sur les tabulations ou sur les groupes de 2 espaces et plus.
 * Renvoie `[]` si aucune structure de colonnes n'est détectable.
 */
export function textToRows(text: string): string[][] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(splitTextRow);
  return rows.some((row) => row.length > 1) ? rows : [];
}

function splitTextRow(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((cell) => cell.trim());
  }
  const parts = line
    .split(/\s{2,}/)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
  return parts.length > 1 ? parts : [line];
}

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function normalizeGrid(rows: readonly (readonly unknown[])[]): string[][] {
  return rows.map((row) => row.map(normalizeCell));
}

/**
 * Renvoie le contenu d'un fichier sous forme de texte CSV (`;`), pour les
 * imports purement tabulaires (fonctionnalités, exigences). Un document
 * Word/PDF sans tableau exploitable donne une chaîne vide.
 */
export async function readImportCsvText(file: File): Promise<string> {
  const source = await readImportSource(file);
  if (source.kind === "table") return rowsToCsv(source.rows);
  if (source.kind === "csv") return source.text;
  return rowsToCsv(textToRows(source.text));
}

async function readSpreadsheet(file: File): Promise<string[][]> {
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const sheets = await readXlsxFile(file);
  const first = sheets[0];
  if (!first) return [];
  return normalizeGrid(first.data);
}

type MammothApi = {
  convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

async function readWord(file: File): Promise<ImportSource> {
  const mod = await import("mammoth");
  const mammoth = ((mod as { default?: unknown }).default ?? mod) as MammothApi;
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  const rows = htmlToTableRows(html);
  if (rows.length > 0) return { kind: "table", rows };
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });
  return { kind: "nor", text: text.trim() };
}

/** Extrait le tableau le plus fourni d'un fragment HTML produit par mammoth. */
function htmlToTableRows(html: string): string[][] {
  if (typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"));
  if (tables.length === 0) return [];
  const best = tables.reduce((a, b) =>
    b.querySelectorAll("tr").length > a.querySelectorAll("tr").length ? b : a,
  );
  const rows: string[][] = [];
  for (const tr of Array.from(best.querySelectorAll("tr"))) {
    const cells = Array.from(tr.querySelectorAll("th,td")).map((cell) =>
      (cell.textContent ?? "").trim(),
    );
    if (cells.some((cell) => cell.length > 0)) rows.push(cells);
  }
  return rows;
}

type PdfItem = { str: string; x: number; y: number; width: number };

async function readPdf(file: File): Promise<ImportSource> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const lines: PdfItem[][] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items: PdfItem[] = [];
    for (const raw of content.items) {
      if (!("str" in raw)) continue;
      const transform = raw.transform as number[];
      items.push({
        str: raw.str,
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        width: raw.width,
      });
    }
    lines.push(...groupPdfLines(items));
  }

  const textLines = lines
    .map((cells) => pdfLineToText(cells))
    .filter((line) => line.trim().length > 0);
  const tabbed = textLines.filter((line) => line.includes("\t"));
  if (tabbed.length >= 2) {
    return { kind: "table", rows: textToRows(textLines.join("\n")) };
  }
  return { kind: "nor", text: textLines.join("\n") };
}

function groupPdfLines(items: PdfItem[]): PdfItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PdfItem[][] = [];
  let current: PdfItem[] = [];
  let currentY = 0;
  const flush = () => {
    if (current.length > 0) {
      current.sort((a, b) => a.x - b.x);
      lines.push(current);
      current = [];
    }
  };
  for (const item of sorted) {
    if (current.length === 0) {
      current.push(item);
      currentY = item.y;
    } else if (Math.abs(item.y - currentY) <= 2.5) {
      current.push(item);
    } else {
      flush();
      current.push(item);
      currentY = item.y;
    }
  }
  flush();
  return lines;
}

function pdfLineToText(cells: PdfItem[]): string {
  let out = "";
  let previousEnd: number | null = null;
  for (const cell of cells) {
    if (previousEnd !== null) {
      const gap = cell.x - previousEnd;
      if (gap > 8) out += "\t";
      else if (gap > 1.5) out += " ";
    }
    out += cell.str;
    previousEnd = cell.x + cell.width;
  }
  return out.replace(/[ \t]+$/, "");
}
