import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

const ENVIRONMENT_TYPES = ['development', 'integration', 'staging', 'production'];

async function assertProductExists(productId) {
  const product = await db.products.findById(productId);
  if (!product) throw new AppError('Produit non trouvé', 404);
  return product;
}

export async function listEnvironments(productId, includeInactive = false) {
  await assertProductExists(productId);
  return db.environments.listByProduct(productId, includeInactive);
}

export async function getEnvironment(productId, environmentId) {
  const environment = await db.environments.findById(environmentId);
  if (!environment || environment.product_id !== Number(productId)) {
    throw new AppError('Environnement non trouvé pour ce produit', 404);
  }
  return environment;
}

export async function createEnvironment(productId, data) {
  try {
    await assertProductExists(productId);

    if (data.type && !ENVIRONMENT_TYPES.includes(data.type)) {
      throw new AppError('Type d\'environnement invalide', 400);
    }
    const existing = await db.environments.findByName(productId, data.name);
    if (existing) throw new AppError('Un environnement avec ce nom existe déjà pour ce produit', 409);

    const environment = await db.environments.create({ ...data, product_id: Number(productId) });
    bus.emit('environment:created', { environment, user_id: data.created_by || null });
    return environment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function updateEnvironment(productId, environmentId, data) {
  try {
    const environment = await getEnvironment(productId, environmentId);

    if (data.type !== undefined && !ENVIRONMENT_TYPES.includes(data.type)) {
      throw new AppError('Type d\'environnement invalide', 400);
    }
    if (data.name !== undefined) {
      const existing = await db.environments.findByName(productId, data.name, Number(environmentId));
      if (existing) throw new AppError('Un environnement avec ce nom existe déjà pour ce produit', 409);
    }

    const updated = await db.environments.update(Number(environmentId), data);
    bus.emit('environment:updated', { environment: updated, previous: environment, user_id: null });
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function deleteEnvironment(productId, environmentId) {
  const environment = await getEnvironment(productId, environmentId);
  await db.environments.remove(environment.id);
  bus.emit('environment:deleted', { environment_id: environment.id, user_id: null });
}
