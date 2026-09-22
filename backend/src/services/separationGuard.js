import { AppError } from '../middleware/errorHandler.js';

/**
 * Séparation des responsabilités (tâche « garde sobre » du candidat).
 *
 * Règle fondamentale du CDC (§5) : un même membre ne peut pas être à la fois
 * celui qui produit un résultat et celui qui le consigne comme conforme.
 * - Anomalies : une résolution ne peut être validée/rejetée que par un autre
 *   testeur que celui qui l'a signalée (resolved_by ≠ userId).
 * - Verdicts de test : une exécution déjà renseignée (résultat ≠ not_run) ne
 *   peut pas être modifiée/confirmée par celui qui l'a exécutée (executed_by).
 *
 * Référentiel pur et testable : n'accède jamais à la base.
 */

export const SEPARATION_MESSAGES = {
  validateOwnResolution:
    "Vous ne pouvez pas valider votre propre résolution : un autre testeur doit la confirmer.",
  rejectOwnResolution:
    "Vous ne pouvez pas rejeter votre propre résolution : un autre testeur doit se prononcer.",
  updateOwnVerdict:
    "Vous ne pouvez pas saisir ou confirmer le verdict d'une exécution que vous avez vous-même exécutée : un autre membre de la campagne doit le faire.",
};

/**
 * Vérifie qu'un utilisateur ne valide/rejette pas sa propre résolution.
 * @param {object} opts
 * @param {number|null} opts.resolvedBy  - id de l'auteur de la résolution (0 si inexistant)
 * @param {number|null} opts.actorId     - id de l'utilisateur qui se prononce
 * @param {'validated'|'rejected'} opts.status - statut cible
 * @throws {AppError} 403 si l'auteur se prononce sur sa propre résolution
 */
export function assertCanJudgeAnomaly({ resolvedBy, actorId, status }) {
  if (resolvedBy != null && resolvedBy === actorId) {
    const message =
      status === 'validated'
        ? SEPARATION_MESSAGES.validateOwnResolution
        : SEPARATION_MESSAGES.rejectOwnResolution;
    throw new AppError(message, 403);
  }
}

/**
 * Vérifie qu'un testeur ne modifie pas le verdict d'une exécution qu'il a
 * lui-même exécutée et déjà renseignée.
 * @param {object} opts
 * @param {number|null} opts.executedBy   - id de l'exécuteur (0 si inexistant)
 * @param {number|null} opts.actorId      - id de l'utilisateur qui tente la modification
 * @param {string|null} opts.currentResult- résultat actuel ('not_run' = jamais saisi)
 * @throws {AppError} 403 si l'exécuteur modifie son propre verdict déjà saisi
 */
export function assertCanRecordVerdict({ executedBy, actorId, currentResult }) {
  if (
    executedBy != null &&
    executedBy === actorId &&
    currentResult != null &&
    currentResult !== 'not_run'
  ) {
    throw new AppError(SEPARATION_MESSAGES.updateOwnVerdict, 403);
  }
}
