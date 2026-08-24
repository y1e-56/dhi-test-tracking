import { Router } from 'express';
import { z } from 'zod';
import * as productService from '../services/productService.js';
import * as releaseService from '../services/releaseService.js';
import * as environmentService from '../services/environmentService.js';
import { authenticate, requireQualityAdmin } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

const productCreateSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  owner_id: z.number().int().nullable().optional(),
  quality_manager_id: z.number().int().nullable().optional(),
});

const productUpdateSchema = productCreateSchema.partial();

const releaseCreateSchema = z.object({
  version: z.string().min(1, 'Version requise').max(50),
  description: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'released', 'cancelled']).optional(),
  planned_date: z.string().date().nullable().optional(),
  released_at: z.string().datetime({ offset: true }).nullable().optional(),
});

const releaseUpdateSchema = releaseCreateSchema.partial();

const environmentCreateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  type: z.enum(['development', 'integration', 'staging', 'production']).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

const environmentUpdateSchema = environmentCreateSchema.partial();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Lister les produits (avec filtres et pagination optionnels)
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer }
 *       - name: limit
 *         in: query
 *         schema: { type: integer }
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *       - name: statut
 *         in: query
 *         schema: { type: string, enum: [actif, archive] }
 *       - name: includeArchived
 *         in: query
 *         schema: { type: boolean }
 *         description: Inclure les produits archivés (uniquement pour la liste non paginée)
 *     responses:
 *       200:
 *         description: Liste des produits (paginée si filtres fournis, sinon tableau complet)
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res) => {
  const { page, limit, ...filters } = req.query;
  if (page || limit || filters.recherche || filters.statut) {
    const result = await productService.listProductsPaginated({
      page: page ? Math.max(1, parseInt(page)) : 1,
      limit: limit ? Math.max(1, Math.min(200, parseInt(limit))) : 20,
      recherche: filters.recherche || undefined,
      statut: filters.statut || undefined,
    });
    res.json(result);
  } else {
    const includeArchived = filters.includeArchived === 'true';
    const products = await productService.listProducts(includeArchived);
    res.json(products);
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Récupérer un produit (avec compteurs projets/releases/environnements)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Produit trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', authenticate, async (req, res) => {
  const product = await productService.getProduct(Number(req.params.id));
  res.json(product);
});

/**
 * @swagger
 * /products/{id}/projects:
 *   get:
 *     tags: [Products]
 *     summary: Lister les projets rattachés à un produit
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des projets du produit }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/projects', authenticate, async (req, res) => {
  const projects = await productService.getProductProjects(Number(req.params.id));
  res.json(projects);
});

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Créer un produit (admin ou quality manager)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               owner_id: { type: integer, nullable: true }
 *               quality_manager_id: { type: integer, nullable: true }
 *     responses:
 *       201: { description: Produit créé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: Un produit avec ce nom existe déjà }
 */
router.post('/', authenticate, requireQualityAdmin, async (req, res) => {
  const data = productCreateSchema.parse(req.body);
  const product = await productService.createProduct({ ...data, created_by: req.user.id });
  bus.emit('data:changed', { entity: 'products' });
  res.status(201).json({ product });
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Mettre à jour un produit (admin ou quality manager)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Produit mis à jour }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Un produit avec ce nom existe déjà }
 */
router.put('/:id', authenticate, requireQualityAdmin, async (req, res) => {
  const data = productUpdateSchema.parse(req.body);
  const product = await productService.updateProduct(Number(req.params.id), data);
  bus.emit('data:changed', { entity: 'products' });
  res.json({ product });
});

/**
 * @swagger
 * /products/{id}/archive:
 *   patch:
 *     tags: [Products]
 *     summary: Archiver un produit (admin ou quality manager)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Produit archivé }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/archive', authenticate, requireQualityAdmin, async (req, res) => {
  const product = await productService.archiveProduct(Number(req.params.id));
  bus.emit('data:changed', { entity: 'products' });
  res.json({ product });
});

/**
 * @swagger
 * /products/{id}/unarchive:
 *   patch:
 *     tags: [Products]
 *     summary: Restaurer un produit archivé (admin ou quality manager)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Produit restauré }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/unarchive', authenticate, requireQualityAdmin, async (req, res) => {
  const product = await productService.unarchiveProduct(Number(req.params.id));
  bus.emit('data:changed', { entity: 'products' });
  res.json({ product });
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Supprimer un produit (admin ou quality manager). Refusé si des projets y sont rattachés.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Produit supprimé }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Des projets sont encore rattachés au produit }
 */
router.delete('/:id', authenticate, requireQualityAdmin, async (req, res) => {
  await productService.deleteProduct(Number(req.params.id));
  bus.emit('data:changed', { entity: 'products' });
  res.status(204).send();
});

// ── Releases d'un produit ────────────────────────────────

/**
 * @swagger
 * /products/{id}/releases:
 *   get:
 *     tags: [Releases]
 *     summary: Lister les versions d'un produit
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des versions }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/releases', authenticate, async (req, res) => {
  const releases = await releaseService.listReleases(Number(req.params.id));
  res.json(releases);
});

/**
 * @swagger
 * /products/{id}/releases:
 *   post:
 *     tags: [Releases]
 *     summary: Créer une version pour un produit (admin ou quality manager)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [version]
 *             properties:
 *               version: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [planned, in_progress, released, cancelled] }
 *               planned_date: { type: string, format: date }
 *     responses:
 *       201: { description: Version créée }
 *       409: { description: Version dupliquée pour ce produit }
 */
router.post('/:id/releases', authenticate, requireQualityAdmin, async (req, res) => {
  const data = releaseCreateSchema.parse(req.body);
  const release = await releaseService.createRelease(Number(req.params.id), { ...data, created_by: req.user.id });
  bus.emit('data:changed', { entity: 'products' });
  res.status(201).json({ release });
});

/**
 * @swagger
 * /products/{id}/releases/{releaseId}:
 *   put:
 *     tags: [Releases]
 *     summary: Mettre à jour une version (admin ou quality manager)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: releaseId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Version mise à jour }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id/releases/:releaseId', authenticate, requireQualityAdmin, async (req, res) => {
  const data = releaseUpdateSchema.parse(req.body);
  const release = await releaseService.updateRelease(Number(req.params.id), Number(req.params.releaseId), data);
  bus.emit('data:changed', { entity: 'products' });
  res.json({ release });
});

/**
 * @swagger
 * /products/{id}/releases/{releaseId}:
 *   delete:
 *     tags: [Releases]
 *     summary: Supprimer une version (admin ou quality manager). Refusé si des campagnes y sont rattachées.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: releaseId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Version supprimée }
 *       409: { description: Des campagnes sont rattachées à cette version }
 */
router.delete('/:id/releases/:releaseId', authenticate, requireQualityAdmin, async (req, res) => {
  await releaseService.deleteRelease(Number(req.params.id), Number(req.params.releaseId));
  bus.emit('data:changed', { entity: 'products' });
  res.status(204).send();
});

// ── Environnements d'un produit ──────────────────────────

/**
 * @swagger
 * /products/{id}/environments:
 *   get:
 *     tags: [Environments]
 *     summary: Lister les environnements d'un produit
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: includeInactive
 *         in: query
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Liste des environnements }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/environments', authenticate, async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const environments = await environmentService.listEnvironments(Number(req.params.id), includeInactive);
  res.json(environments);
});

/**
 * @swagger
 * /products/{id}/environments:
 *   post:
 *     tags: [Environments]
 *     summary: Créer un environnement pour un produit (admin ou quality manager)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [development, integration, staging, production] }
 *               description: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       201: { description: Environnement créé }
 *       409: { description: Environnement dupliqué pour ce produit }
 */
router.post('/:id/environments', authenticate, requireQualityAdmin, async (req, res) => {
  const data = environmentCreateSchema.parse(req.body);
  const environment = await environmentService.createEnvironment(Number(req.params.id), {
    ...data,
    created_by: req.user.id,
  });
  bus.emit('data:changed', { entity: 'products' });
  res.status(201).json({ environment });
});

/**
 * @swagger
 * /products/{id}/environments/{environmentId}:
 *   put:
 *     tags: [Environments]
 *     summary: Mettre à jour un environnement (admin ou quality manager)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: environmentId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Environnement mis à jour }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id/environments/:environmentId', authenticate, requireQualityAdmin, async (req, res) => {
  const data = environmentUpdateSchema.parse(req.body);
  const environment = await environmentService.updateEnvironment(
    Number(req.params.id),
    Number(req.params.environmentId),
    data
  );
  bus.emit('data:changed', { entity: 'products' });
  res.json({ environment });
});

/**
 * @swagger
 * /products/{id}/environments/{environmentId}:
 *   delete:
 *     tags: [Environments]
 *     summary: Supprimer un environnement (admin ou quality manager)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: environmentId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Environnement supprimé }
 */
router.delete('/:id/environments/:environmentId', authenticate, requireQualityAdmin, async (req, res) => {
  await environmentService.deleteEnvironment(Number(req.params.id), Number(req.params.environmentId));
  bus.emit('data:changed', { entity: 'products' });
  res.status(204).send();
});

export default router;
