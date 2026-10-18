import { AppError } from '../middleware/errorHandler.js';
import { evaluateRule } from './rulesEngine.js';

/**
 * Cohérence anomalie ↔ cas de test.
 *
 * Une anomalie naît d'un cas de test non validé : elle n'est déclarable que
 * si la dernière exécution du cas, dans la campagne, est en échec ou bloquée.
 * Un cas réussi, non exécuté ou non applicable ne justifie pas d'anomalie.
 *
 * Référentiel pur et testable : n'accède jamais à la base.
 */

/** Résultats d'exécution qui autorisent la déclaration d'une anomalie. */
export const ANOMALY_ALLOWED_RESULTS = ['failed', 'blocked'];

export const ANOMALY_GUARD_MESSAGES = {
  assigneeNotCampaignDeveloper:
    "Une anomalie ne peut être affectée qu'à un développeur de l'équipe de sa campagne.",
  testCaseRequired: 'Une anomalie doit être rattachée à un cas de test.',
  testCaseMismatch:
    "Le cas de test n'appartient pas à la fonctionnalité ou à la campagne de l'anomalie.",
  testCaseNotFailed:
    "Une anomalie ne peut être déclarée que sur un cas de test en échec ou bloqué.",
};

/**
 * Vérifie qu'une anomalie peut être déclarée sur ce cas de test.
 * @param {object} opts
 * @param {object|null} opts.testCase    - cas de test ({ feature_id, campaign_id })
 * @param {number} opts.featureId        - fonctionnalité de l'anomalie
 * @param {number} opts.campaignId       - campagne de l'anomalie
 * @param {string|null} opts.latestResult- résultat de la dernière exécution du cas dans la campagne
 * @throws {AppError} 400 si le cas est absent, incohérent ou non en échec/bloqué
 */
export function assertCanReportAnomaly({ testCase, featureId, campaignId, latestResult }) {
  if (!testCase) throw new AppError(ANOMALY_GUARD_MESSAGES.testCaseRequired, 400);
  const sameFeature = testCase.feature_id == null || Number(testCase.feature_id) === Number(featureId);
  const sameCampaign =
    testCase.campaign_id == null || Number(testCase.campaign_id) === Number(campaignId);
  if (!sameFeature || !sameCampaign) {
    throw new AppError(ANOMALY_GUARD_MESSAGES.testCaseMismatch, 400);
  }
  if (!ANOMALY_ALLOWED_RESULTS.includes(latestResult)) {
    throw new AppError(ANOMALY_GUARD_MESSAGES.testCaseNotFailed, 400);
  }
}

/**
 * Affectation : seul un developpeur membre de l'equipe de la campagne de
 * l'anomalie peut la recevoir. Sans affecte (null / absent), rien a verifier.
 * @param {number|null|undefined} assigneeId
 * @param {number[]} campaignDeveloperIds - developpeurs de la campagne
 * @throws {AppError} 400 sinon
 */
export function assertAssigneeIsCampaignDeveloper(assigneeId, campaignDeveloperIds) {
  if (assigneeId === undefined || assigneeId === null) return;
  if (!campaignDeveloperIds.map(Number).includes(Number(assigneeId))) {
    throw new AppError(ANOMALY_GUARD_MESSAGES.assigneeNotCampaignDeveloper, 400);
  }
}

/** Valeurs de gravite / priorite d'une anomalie (enum priority_level). */
export const ANOMALY_LEVELS = ['low', 'medium', 'high', 'critical'];

/** Gravites soumises au delai de correction RG-8. */
export const HIGH_SEVERITIES = ['high', 'critical'];

const DAY_MS = 24 * 60 * 60 * 1000;

/** 400 si une gravite / priorite n'est pas une valeur connue. */
export function assertAnomalyLevel(value, field) {
  if (value !== undefined && !ANOMALY_LEVELS.includes(value)) {
    throw new AppError(`${field} invalide (low, medium, high ou critical)`, 400);
  }
}

/**
 * RG-8 — delai de correction d'une anomalie de gravite haute.
 * - Sans echeance fournie : echeance = date de reference + RG-8 jours.
 * - Echeance au-dela du delai : refusee si la regle est bloquante, acceptee
 *   (et signalee a l'affichage) si elle est en avertissement.
 * Sans effet pour une gravite non haute, ou si RG-8 est inactive.
 * @param {{ severity: string, dueDate: string|Date|null, from: string|Date, rule: object|undefined }} opts
 * @returns {{ dueDate: string|null, verdict: object|null }} echeance a enregistrer
 * @throws {AppError} 400 si RG-8 est bloquante et l'echeance la depasse
 */
export function applyCorrectionDelay({ severity, dueDate, from, rule }) {
  const given = dueDate ? new Date(dueDate) : null;
  if (given && Number.isNaN(given.getTime())) throw new AppError('Échéance de correction invalide', 400);
  if (!HIGH_SEVERITIES.includes(severity)) return { dueDate: given ? given.toISOString() : null, verdict: null };
  const start = new Date(from);
  const probe = evaluateRule(rule, 0);
  if (!probe) return { dueDate: given ? given.toISOString() : null, verdict: null };
  if (!given) {
    const limit = new Date(start.getTime() + Number(rule.value) * DAY_MS);
    return { dueDate: limit.toISOString(), verdict: evaluateRule(rule, Number(rule.value)) };
  }
  const days = Math.ceil((given.getTime() - start.getTime()) / DAY_MS);
  const verdict = evaluateRule(rule, Math.max(days, 0));
  if (!verdict.ok && verdict.mode === 'blocking') {
    throw new AppError(`Échéance refusée : ${verdict.message}.`, 400);
  }
  return { dueDate: given.toISOString(), verdict };
}

