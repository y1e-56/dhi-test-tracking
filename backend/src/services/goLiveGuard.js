import { AppError } from '../middleware/errorHandler.js';
import { evaluateRule } from './rulesEngine.js';

/**
 * Règles du référentiel appliquées à une décision Go Live.
 *
 * - RG-9  : anomalies de gravité haute encore ouvertes sur la release.
 * - RG-10 : complétude pondérée de la checklist de validation.
 *
 * Un GO doit respecter les règles bloquantes ; une règle en avertissement (ou
 * toute règle non respectée sur un GO conditionnel, qui assume des réserves)
 * demande une confirmation explicite. NO GO et AJOURNÉ ne sont jamais freinés.
 *
 * Référentiel pur et testable : n'accède jamais à la base.
 */

/** Verdicts soumis aux règles : ceux qui autorisent la mise en production. */
export const GATED_VERDICTS = ['GO', 'GO_CONDITIONNEL'];

export const GO_LIVE_MESSAGES = {
  refused: (reasons) => `Décision refusée : ${reasons.join(' ; ')}.`,
  toConfirm: (reasons) => `Décision à confirmer : ${reasons.join(' ; ')}.`,
};

/**
 * Complétude pondérée de la checklist, rapportée au modèle complet : un item
 * jamais coché n'a pas de ligne en base mais compte quand même au total.
 * @param {Array<{ id: string, weight: number }>} template
 * @param {Iterable<string>} checkedIds
 * @returns {number} pourcentage arrondi (0-100)
 */
export function checklistCompletion(template, checkedIds) {
  const checked = new Set(checkedIds);
  const total = template.reduce((s, item) => s + item.weight, 0);
  const done = template.filter((item) => checked.has(item.id)).reduce((s, item) => s + item.weight, 0);
  return total ? Math.round((done / total) * 100) : 0;
}

/**
 * Verdicts RG-9 / RG-10 pour une release (règles inactives ignorées).
 * @param {{ openHigh: number, completion: number, rules: Map<string, object> }} opts
 */
export function goLiveVerdicts({ openHigh, completion, rules }) {
  return [
    evaluateRule(rules.get('RG-9'), openHigh),
    evaluateRule(rules.get('RG-10'), completion),
  ].filter(Boolean);
}

/**
 * @param {{ verdict: string, verdicts: Array<{ ok: boolean, mode: string, message: string }> }} check
 * @param {boolean} confirmed - le décideur a confirmé malgré les avertissements
 * @throws {AppError} 409 « Décision refusée » si un GO viole une règle
 *   bloquante ; 409 « Décision à confirmer » s'il reste des réserves non confirmées
 */
export function assertGoLiveDecision({ verdict, verdicts }, confirmed) {
  if (!GATED_VERDICTS.includes(verdict)) return;
  const failing = verdicts.filter((v) => !v.ok);
  const blocking = verdict === 'GO' ? failing.filter((v) => v.mode === 'blocking') : [];
  if (blocking.length > 0) {
    throw new AppError(GO_LIVE_MESSAGES.refused(blocking.map((v) => v.message)), 409);
  }
  const warnings = failing.filter((v) => !blocking.includes(v)).map((v) => v.message);
  if (!confirmed && warnings.length > 0) {
    throw new AppError(GO_LIVE_MESSAGES.toConfirm(warnings), 409);
  }
}
