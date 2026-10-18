import type { ReferentialRule, RuleComparator, RuleMode, RuleUnit } from "@/lib/dhi-data";

/**
 * Regles du referentiel cote interface : miroir de backend/services/rulesEngine.js.
 * Memes libelles et meme evaluation, pour que l'interface annonce exactement ce
 * que le serveur appliquera.
 */

const UNIT_SUFFIX: Record<RuleUnit, string> = {
  score: "/100",
  percent: " %",
  days: " jours",
  count: "",
};
const COMPARATOR_SIGN: Record<RuleComparator, string> = { gte: "≥", lte: "≤" };

export const RULE_UNIT_LABEL: Record<RuleUnit, string> = {
  score: "/100",
  percent: "%",
  days: "jours",
  count: "",
};

export const RULE_MODE_LABEL: Record<RuleMode, string> = {
  blocking: "Bloquant",
  warning: "Avertissement",
};

/** « ≥ 95 % », « ≤ 7 jours », « ≥ 85/100 » ; "" sans seuil structure. */
export function formatThreshold(rule: {
  value?: number | null;
  unit?: RuleUnit | null;
  comparator?: RuleComparator | null;
}): string {
  const { value, unit, comparator } = rule;
  if (value === null || value === undefined || !unit || !comparator) return "";
  const shown = Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
  const suffix = unit === "days" && value <= 1 ? " jour" : UNIT_SUFFIX[unit];
  return `${COMPARATOR_SIGN[comparator]} ${shown}${suffix}`.trim();
}

/** Libelle du seuil : structure s'il existe, sinon le texte historique. */
export const thresholdLabel = (rule: ReferentialRule) => formatThreshold(rule) || rule.threshold;

export type RuleVerdict = {
  id: string;
  label: string;
  mode: RuleMode;
  threshold: string;
  actual: number;
  ok: boolean;
  message: string;
};

/** null si la regle est absente, inactive ou sans seuil structure. */
export function evaluateRule(
  rule: ReferentialRule | undefined,
  actual: number,
): RuleVerdict | null {
  if (
    !rule ||
    !rule.active ||
    rule.value === null ||
    rule.value === undefined ||
    !rule.comparator
  ) {
    return null;
  }
  const ok = rule.comparator === "gte" ? actual >= rule.value : actual <= rule.value;
  const threshold = formatThreshold(rule);
  const measured = formatThreshold({ ...rule, comparator: "gte", value: actual }).replace("≥ ", "");
  return {
    id: rule.id,
    label: rule.label,
    mode: rule.mode === "blocking" ? "blocking" : "warning",
    threshold,
    actual,
    ok,
    message: `${rule.id} — ${rule.label} : ${measured} (attendu ${threshold})`,
  };
}

/**
 * Ou chaque regle s'applique dans l'application. `control` : la regle peut
 * bloquer ou avertir une action (le mode a un sens) ; sinon elle sert de seuil
 * d'affichage.
 */
export const RULE_SCOPES: Record<string, { where: string; control: boolean }> = {
  "RG-1": { where: "Badges de santé des produits", control: false },
  "RG-2": { where: "Badges de santé des produits", control: false },
  "RG-3": { where: "Badges de santé des produits", control: false },
  "RG-4": { where: "Clôture d'une campagne", control: true },
  "RG-5": { where: "Clôture d'une campagne", control: true },
  "RG-6": { where: "Matrice de couverture et score produit", control: true },
  "RG-7": { where: "Conformité d'une fonctionnalité critique", control: true },
  "RG-8": { where: "Échéance de correction des anomalies hautes", control: true },
  "RG-9": { where: "Décision Go-Live", control: true },
  "RG-10": { where: "Décision Go-Live", control: true },
};

const DAY_MS = 86_400_000;

/**
 * Echeance de correction proposee a la creation d'une anomalie : RG-8 jours
 * pour une gravite haute (si la regle est active), 7 jours sinon.
 */
export function defaultCorrectionDate(
  severity: string,
  rules: ReferentialRule[],
  today: Date = new Date(),
): string {
  const rg8 = rules.find((r) => r.id === "RG-8");
  const days = severity === "haute" && rg8?.active && typeof rg8.value === "number" ? rg8.value : 7;
  return new Date(today.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Anomalie de gravite haute, non fermee, dont l'echeance de correction est depassee. */
export function isCorrectionOverdue(
  defect: { severity: string; status: string; targetDate?: string | undefined },
  today: Date = new Date(),
): boolean {
  if (defect.severity !== "haute" || defect.status === "fermee" || !defect.targetDate) return false;
  return today.toISOString().slice(0, 10) > defect.targetDate.slice(0, 10);
}
