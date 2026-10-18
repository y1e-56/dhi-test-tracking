import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';
import { assertGoLiveDecision, checklistCompletion, goLiveVerdicts } from './goLiveGuard.js';
import { loadRules } from './rulesEngine.js';

const VERDICTS = ['GO', 'GO_CONDITIONNEL', 'NO_GO', 'AJOURNE'];

export const GO_LIVE_CHECKLIST_TEMPLATE = [
  { id: 'gl-1', label: "Taux d'exécution des campagnes ≥ 95 %", weight: 15 },
  { id: 'gl-2', label: 'Taux de succès global ≥ 90 %', weight: 15 },
  { id: 'gl-3', label: 'Aucun test critique en échec', weight: 20 },
  { id: 'gl-4', label: 'Aucune anomalie de gravité haute ouverte', weight: 15 },
  { id: 'gl-5', label: 'Couverture fonctionnelle ≥ 90 %', weight: 10 },
  { id: 'gl-6', label: 'Tests de sécurité exécutés et validés', weight: 10 },
  { id: 'gl-7', label: 'Tests de performance conformes aux seuils', weight: 5 },
  { id: 'gl-8', label: 'Plan de rollback documenté', weight: 5 },
  { id: 'gl-9', label: 'Points à surveiller critiques tous clos', weight: 5 },
];

function asApiItem(row) {
  return {
    id: row.template_key,
    label: row.label,
    weight: row.weight,
    checked: row.is_checked,
  };
}

/** Complétude pondérée de la checklist d'une release, sur le modèle complet. */
async function completionOf(releaseRef) {
  const rows = await db.goLive.listChecklistByRelease(releaseRef);
  return checklistCompletion(
    GO_LIVE_CHECKLIST_TEMPLATE,
    rows.filter((row) => row.is_checked).map((row) => row.template_key)
  );
}

/** Anomalies hautes ouvertes sur la release (référence numérique = id de version). */
async function openHighOf(releaseRef) {
  const releaseId = Number(releaseRef);
  return Number.isInteger(releaseId) && releaseId > 0
    ? db.anomalies.countOpenHighForRelease(releaseId)
    : 0;
}

export async function getChecklist(releaseRef) {
  if (!releaseRef) throw new AppError('release_ref requis', 400);
  const rows = await db.goLive.listChecklistByRelease(releaseRef);
  return rows.map(asApiItem);
}

export async function updateChecklistItem(releaseRef, itemId, isChecked) {
  if (!releaseRef || !itemId) throw new AppError('release_ref et item requis', 400);
  const template = GO_LIVE_CHECKLIST_TEMPLATE.find((item) => item.id === itemId);
  if (!template) throw new AppError('Item de checklist inconnu', 400);
  const existing = await db.goLive.findChecklistItem(releaseRef, itemId);
  const row = existing
    ? await db.goLive.updateChecklistChecked(existing.id, !!isChecked)
    : await db.goLive.upsertChecklistItem(releaseRef, itemId, template.label, template.weight, !!isChecked);
  if (!row) throw new AppError('Impossible de mettre à jour l\'item', 500);
  const completion = await completionOf(releaseRef);
  bus.emit('go-live:checklist_updated', { release_ref: releaseRef, item: row, completion, user_id: null });
  return asApiItem(row);
}

export async function listDecisions(releaseRef = null) {
  return db.goLive.listDecisions(releaseRef || null);
}

export async function createDecision(data) {
  if (!data.release_ref) throw new AppError('release_ref requis', 400);
  if (!VERDICTS.includes(data.verdict)) throw new AppError('Verdict Go Live invalide', 400);
  if (!data.decider || !String(data.decider).trim()) throw new AppError('Décideur requis', 400);
  // Complétude et anomalies relues en base : RG-9 / RG-10 ne dépendent pas
  // de ce que le navigateur affirme.
  const completion = await completionOf(data.release_ref);
  const openHigh = await openHighOf(data.release_ref);
  const rules = await loadRules();
  assertGoLiveDecision(
    { verdict: data.verdict, verdicts: goLiveVerdicts({ openHigh, completion, rules }) },
    data.confirmed === true
  );
  const decision = await db.goLive.createDecision({ ...data, checklist_completion: completion });
  bus.emit('go-live:decision_created', { decision, user_id: data.created_by || null });
  return decision;
}