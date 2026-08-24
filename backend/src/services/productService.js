import { AppError } from '../middleware/errorHandler.js';
import { withTransaction } from '../config/database.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listProducts(includeArchived = false) {
  return db.products.list(includeArchived);
}

export async function listProductsPaginated(filters = {}) {
  return db.products.listPaginated({
    recherche: filters.recherche,
    statut: filters.statut,
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy,
  });
}

export async function getProduct(id) {
  const product = await db.products.findByIdWithCounts(id);
  if (!product) throw new AppError('Produit non trouvé', 404);
  return product;
}

export async function createProduct(data) {
  try {
    const existing = await db.products.findByName(data.name);
    if (existing) throw new AppError('Un produit avec ce nom existe déjà', 409);

    const product = await db.products.create(data);
    bus.emit('product:created', { product, user_id: data.created_by || null });
    return product;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function updateProduct(id, data) {
  try {
    if (data.name !== undefined) {
      const existing = await db.products.findByName(data.name, id);
      if (existing) throw new AppError('Un produit avec ce nom existe déjà', 409);
    }
    const product = await db.products.update(id, data);
    if (!product) throw new AppError('Produit non trouvé', 404);
    bus.emit('product:updated', { product, product_id: id, user_id: null });
    return product;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function archiveProduct(id) {
  const product = await db.products.update(id, { is_archived: true });
  if (!product) throw new AppError('Produit non trouvé', 404);
  bus.emit('product:archived', { product, product_id: id, user_id: null });
  return product;
}

export async function unarchiveProduct(id) {
  const product = await db.products.update(id, { is_archived: false });
  if (!product) throw new AppError('Produit non trouvé', 404);
  bus.emit('product:unarchived', { product, product_id: id, user_id: null });
  return product;
}

export async function deleteProduct(id) {
  return withTransaction(async (client) => {
    const projectsCount = await db.products.countProjects(id, client);
    if (projectsCount > 0) {
      throw new AppError(
        `Impossible de supprimer ce produit : ${projectsCount} projet(s) y sont encore rattaché(s). Détachez-les d'abord.`,
        409
      );
    }
    const result = await db.products.remove(id, client);
    if (!result) throw new AppError('Produit non trouvé', 404);
    bus.emit('product:deleted', { product_id: id, user_id: null });
  });
}

export async function getProductProjects(productId) {
  await getProduct(productId);
  return db.products.getProjects(productId);
}
