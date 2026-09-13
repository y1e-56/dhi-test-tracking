import { Router } from 'express';
import { z } from 'zod';
import * as requirementsService from '../services/requirementsService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireRequirementManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'product_owner');

const createSchema = z.object({
  feature_id: z.number().int().positive(),
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  category: z.enum(['fonctionnelle','securite','performance','disponibilite','ergonomie','accessibilite','maintenabilite','compatibilite','resilience','observabilite','documentation','testabilite','custom']).optional(),
  status: z.enum(['proposed','validated','approved','rejected']).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['fonctionnelle','securite','performance','disponibilite','ergonomie','accessibilite','maintenabilite','compatibilite','resilience','observabilite','documentation','testabilite','custom']).optional(),
  status: z.enum(['proposed','validated','approved','rejected']).optional(),
});

/**
 * @swagger
 * /requirements:
 *   get:
 *     tags: [Requirements]
 *     summary: Lister les exigences (paginé)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: featureId
 *         in: query
 *         schema: { type: integer }
 *       - name: categorie
 *         in: query
 *         schema: { type: string }
 *       - name: statut
 *         in: query
 *         schema: { type: string }
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste paginée des exigences }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await requirementsService.listRequirementsPaginated({
      featureId: req.query.featureId ? parseInt(req.query.featureId) : undefined,
      categorie: req.query.categorie,
      statut: req.query.statut,
      recherche: req.query.recherche,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /requirements/by-feature/{featureId}:
 *   get:
 *     tags: [Requirements]
 *     summary: Exigences d'une fonctionnalité
 *     parameters:
 *       - name: featureId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des exigences }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-feature/:featureId', authenticate, async (req, res, next) => {
  try {
    const requirements = await requirementsService.listByFeature(parseInt(req.params.featureId));
    res.json(requirements);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /requirements/{id}:
 *   get:
 *     tags: [Requirements]
 *     summary: Détail d'une exigence
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Exigence }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const requirement = await requirementsService.getRequirement(parseInt(req.params.id));
    res.json(requirement);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /requirements:
 *   post:
 *     tags: [Requirements]
 *     summary: Créer une exigence
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feature_id, title]
 *             properties:
 *               feature_id: { type: integer }
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               status: { type: string }
 *     responses:
 *       201: { description: Exigence créée }
 *       400: { description: Données invalides }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireRequirementManager, async (req, res, next) => {
  try {
    const parsed = createSchema.parse({ ...req.body, created_by: req.user.id });
    const requirement = await requirementsService.createRequirement(parsed);
    res.status(201).json(requirement);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /requirements/{id}:
 *   put:
 *     tags: [Requirements]
 *     summary: Modifier une exigence
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               status: { type: string }
 *     responses:
 *       200: { description: Exigence mise à jour }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/:id', authenticate, requireRequirementManager, async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const requirement = await requirementsService.updateRequirement(parseInt(req.params.id), parsed);
    res.json(requirement);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /requirements/{id}:
 *   delete:
 *     tags: [Requirements]
 *     summary: Supprimer une exigence
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
router.delete('/:id', authenticate, requireRequirementManager, async (req, res, next) => {
  try {
    await requirementsService.deleteRequirement(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
