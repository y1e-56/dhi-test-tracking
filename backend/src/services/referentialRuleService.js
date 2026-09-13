import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

const RULE_KEYS = ['domain', 'label', 'threshold', 'active'];

export async function listRules() {
  return db.referentialRules.listRules();
}

export async function updateRule(id, patch) {
  if (!id) throw new AppError('Identifiant de règle requis', 400);
  if (!patch || typeof patch !== 'object') throw new AppError('Données invalides', 400);
  const data = {};
  for (const key of RULE_KEYS) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  if (data.active !== undefined) data.active = !!data.active;
  if (Object.keys(data).length === 0) throw new AppError('Aucun champ à mettre à jour', 400);
  const rule = await db.referentialRules.updateRule(id, data);
  if (!rule) throw new AppError('Règle non trouvée', 404);
  bus.emit('referential:rule_updated', { rule, user_id: null });
  return rule;
}

export async function createRule(data) {
  if (!data || !data.id || !String(data.domain).trim() || !String(data.label).trim()) {
    throw new AppError('id, domain et label sont requis', 400);
  }
  const rule = await db.referentialRules.createRule({
    id: String(data.id).trim(),
    domain: String(data.domain).trim(),
    label: String(data.label).trim(),
    threshold: data.threshold != null ? String(data.threshold) : '',
    active: data.active !== undefined ? !!data.active : true,
  });
  bus.emit('referential:rule_created', { rule, user_id: null });
  return rule;
}

export async function deleteRule(id) {
  if (!id) throw new AppError('Identifiant de règle requis', 400);
  const removed = await db.referentialRules.deleteRule(id);
  if (!removed) throw new AppError('Règle non trouvée', 404);
  bus.emit('referential:rule_deleted', { id, user_id: null });
  return removed;
}