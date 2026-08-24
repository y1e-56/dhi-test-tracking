import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

const RELEASE_STATUSES = ['planned', 'in_progress', 'released', 'cancelled'];

async function assertProductExists(productId) {
  const product = await db.products.findById(productId);
  if (!product) throw new AppError('Produit non trouvé', 404);
  return product;
}

export async function listReleases(productId) {
  await assertProductExists(productId);
  return db.releases.listByProduct(productId);
}

export async function getRelease(productId, releaseId) {
  const release = await db.releases.findById(releaseId);
  if (!release || release.product_id !== Number(productId)) {
    throw new AppError('Version non trouvée pour ce produit', 404);
  }
  return release;
}

export async function createRelease(productId, data) {
  try {
    await assertProductExists(productId);

    if (data.status && !RELEASE_STATUSES.includes(data.status)) {
      throw new AppError('Statut de version invalide', 400);
    }
    const existing = await db.releases.findByVersion(productId, data.version);
    if (existing) throw new AppError('Une version avec ce numéro existe déjà pour ce produit', 409);

    const release = await db.releases.create({ ...data, product_id: Number(productId) });
    bus.emit('release:created', { release, user_id: data.created_by || null });
    return release;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function updateRelease(productId, releaseId, data) {
  try {
    const release = await getRelease(productId, releaseId);

    if (data.status !== undefined && !RELEASE_STATUSES.includes(data.status)) {
      throw new AppError('Statut de version invalide', 400);
    }
    if (data.version !== undefined) {
      const existing = await db.releases.findByVersion(productId, data.version, Number(releaseId));
      if (existing) throw new AppError('Une version avec ce numéro existe déjà pour ce produit', 409);
    }

    const updated = await db.releases.update(Number(releaseId), data);
    bus.emit('release:updated', { release: updated, previous: release, user_id: null });
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function deleteRelease(productId, releaseId) {
  const release = await getRelease(productId, releaseId);
  const campaignsCount = await db.releases.countCampaigns(release.id);
  if (campaignsCount > 0) {
    throw new AppError(
      `Impossible de supprimer cette version : ${campaignsCount} campagne(s) y sont rattachée(s).`,
      409
    );
  }
  await db.releases.remove(release.id);
  bus.emit('release:deleted', { release_id: release.id, user_id: null });
}
