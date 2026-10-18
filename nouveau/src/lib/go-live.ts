import type { Campaign, Defect, GoLiveVerdict, ReferentialRule } from "@/lib/dhi-data";
import { evaluateRule, type RuleVerdict } from "@/lib/rules";

/**
 * Règles du référentiel appliquées à une décision Go Live (miroir de
 * backend/src/services/goLiveGuard.js) :
 * - RG-9  : anomalies de gravité haute encore ouvertes sur la release ;
 * - RG-10 : complétude pondérée de la checklist.
 * Un GO est refusé par une règle bloquante ; les avertissements (et toute règle
 * non respectée sur un GO conditionnel) demandent une confirmation.
 */
export const GATED_VERDICTS: GoLiveVerdict[] = ["GO", "GO_CONDITIONNEL"];

export interface GoLiveCheck {
  verdicts: RuleVerdict[];
  refused: RuleVerdict[];
  warnings: string[];
}

/**
 * Anomalies hautes ouvertes qui visent cette version du produit. Le produit et
 * la version portés par l'anomalie font foi : un approbateur ne voit pas
 * forcément les campagnes, et RG-9 doit compter comme le serveur. Les campagnes
 * connues complètent pour une anomalie sans version.
 */
export function releaseOpenHighDefects(
  defects: Defect[],
  campaigns: Campaign[],
  productId: string | undefined,
  version: string | undefined,
): Defect[] {
  if (!productId || !version) return [];
  const ids = new Set(
    campaigns.filter((c) => c.productId === productId && c.version === version).map((c) => c.id),
  );
  const onRelease = (d: Defect) =>
    d.version ? d.productId === productId && d.version === version : ids.has(d.campaignId);
  return defects.filter((d) => onRelease(d) && d.severity === "haute" && d.status !== "fermee");
}

export function goLiveCheck(
  verdict: GoLiveVerdict,
  openHigh: number,
  completion: number,
  rules: ReferentialRule[],
): GoLiveCheck {
  const rule = (id: string) => rules.find((r) => r.id === id);
  const verdicts = [
    evaluateRule(rule("RG-9"), openHigh),
    evaluateRule(rule("RG-10"), completion),
  ].filter((v): v is RuleVerdict => v !== null);
  if (!GATED_VERDICTS.includes(verdict)) return { verdicts, refused: [], warnings: [] };
  const failing = verdicts.filter((v) => !v.ok);
  const refused = verdict === "GO" ? failing.filter((v) => v.mode === "blocking") : [];
  const warnings = failing.filter((v) => !refused.includes(v)).map((v) => v.message);
  return { verdicts, refused, warnings };
}
