import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';

export async function listRequirementsPaginated(filters = {}) {
  return db.requirements.findByFeaturePaginated(filters);
}

export async function listByFeature(featureId) {
  return db.requirements.findByFeature(featureId);
}

export async function getRequirement(id) {
  const req = await db.requirements.findById(id);
  if (!req) throw new AppError('Exigence non trouvée', 404);
  return req;
}

export async function createRequirement(data) {
  // La fonctionnalité est facultative : une exigence peut exister avant son découpage.
  if (data.feature_id != null) {
    const feature = await db.features.findById(data.feature_id);
    if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  }
  if (data.product_id != null) {
    const product = await db.products.findById(data.product_id);
    if (!product) throw new AppError('Produit non trouvé', 404);
  }
  // Chaque fonctionnalité liée doit exister
  for (const fid of data.feature_ids ?? []) {
    if (fid === data.feature_id) continue;
    const feature = await db.features.findById(fid);
    if (!feature) throw new AppError(`Fonctionnalité ${fid} non trouvée`, 404);
  }
  return db.requirements.create(data);
}

export async function updateRequirement(id, data) {
  if (data.feature_id != null) {
    const feature = await db.features.findById(data.feature_id);
    if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  }
  if (data.product_id != null) {
    const product = await db.products.findById(data.product_id);
    if (!product) throw new AppError('Produit non trouvé', 404);
  }
  for (const fid of data.feature_ids ?? []) {
    if (fid === data.feature_id) continue;
    const feature = await db.features.findById(fid);
    if (!feature) throw new AppError(`Fonctionnalité ${fid} non trouvée`, 404);
  }
  const updated = await db.requirements.update(id, data);
  if (!updated) throw new AppError('Exigence non trouvée', 404);
  return updated;
}

/**
 * Import groupé : valide une seule fois les fonctionnalités et le produit référencés,
 * puis insère toutes les lignes dans une transaction (tout ou rien).
 */
export async function bulkCreateRequirements(items, userId) {
  const productIds = [...new Set(items.map((i) => i.product_id).filter((id) => id != null))];
  for (const pid of productIds) {
    const product = await db.products.findById(pid);
    if (!product) throw new AppError(`Produit ${pid} introuvable`, 400);
  }

  const featureIds = [...new Set(items.flatMap((i) => i.feature_ids ?? []))];
  const knownFeatures = new Set();
  for (const fid of featureIds) {
    const feature = await db.features.findById(fid);
    if (!feature) throw new AppError(`Fonctionnalité ${fid} introuvable`, 400);
    knownFeatures.add(fid);
  }

  return db.requirements.createMany(
    items.map((i) => ({ ...i, feature_ids: (i.feature_ids ?? []).filter((f) => knownFeatures.has(f)), created_by: userId })),
  );
}

export async function deleteRequirement(id) {
  const deleted = await db.requirements.remove(id);
  if (!deleted) throw new AppError('Exigence non trouvée', 404);
  return deleted;
}
