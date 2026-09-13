import { Router } from 'express';
import { z } from 'zod';
import * as dependenciesService from '../services/dependenciesService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireDependencyManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet');

const createSchema = z.object({
  feature_id: z.number().int().positive(),
  depends_on_feature_id: z.number().int().positive(),
  dependency_type: z.enum(['blocks','helps','relates_to']).optional(),
  description: z.string().optional(),
});

/**
 * @swagger
 * /dependencies:
 *   get:
 *     tags: [Dependencies]
 *     summary: Lister les dépendances (paginé)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: campaignId
 *         in: query
 *         schema: { type: integer }
 *       - name: featureId
 *         in: query
 *         schema: { type: integer }
 *       - name: dependencyType
 *         in: query
 *         schema: { type: string, enum: [blocks, helps, relates_to] }
 *     responses:
 *       200: { description: Liste paginée des dépendances }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await dependenciesService.listDependenciesPaginated({
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId) : undefined,
      featureId: req.query.featureId ? parseInt(req.query.featureId) : undefined,
      dependencyType: req.query.dependencyType,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /dependencies/by-feature/{featureId}:
 *   get:
 *     tags: [Dependencies]
 *     summary: Dépendances sortantes d'une fonctionnalité
 *     parameters:
 *       - name: featureId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des dépendances }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-feature/:featureId', authenticate, async (req, res, next) => {
  try {
    const deps = await dependenciesService.listByFeature(parseInt(req.params.featureId));
    res.json(deps);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /dependencies/dependents/{featureId}:
 *   get:
 *     tags: [Dependencies]
 *     summary: Fonctionnalités qui dépendent de cette feature
 *     parameters:
 *       - name: featureId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des dépendants }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/dependents/:featureId', authenticate, async (req, res, next) => {
  try {
    const deps = await dependenciesService.listDependents(parseInt(req.params.featureId));
    res.json(deps);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /dependencies/{id}:
 *   get:
 *     tags: [Dependencies]
 *     summary: Détail d'une dépendance
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Dépendance }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const dep = await dependenciesService.getDependency(parseInt(req.params.id));
    res.json(dep);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /dependencies:
 *   post:
 *     tags: [Dependencies]
 *     summary: Créer une dépendance entre fonctionnalités
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feature_id, depends_on_feature_id]
 *             properties:
 *               feature_id: { type: integer }
 *               depends_on_feature_id: { type: integer }
 *               dependency_type: { type: string, enum: [blocks, helps, relates_to] }
 *               description: { type: string }
 *     responses:
 *       201: { description: Dépendance créée }
 *       400: { description: Données invalides }
 *       409: { description: Dépendance déjà existante }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireDependencyManager, async (req, res, next) => {
  try {
    const parsed = createSchema.parse(req.body);
    const dep = await dependenciesService.createDependency({
      ...parsed,
      created_by: req.user.id,
    });
    res.status(201).json(dep);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /dependencies/{id}:
 *   delete:
 *     tags: [Dependencies]
 *     summary: Supprimer une dépendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Supprimée }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete('/:id', authenticate, requireDependencyManager, async (req, res, next) => {
  try {
    await dependenciesService.deleteDependency(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
