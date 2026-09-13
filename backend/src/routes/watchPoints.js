import { Router } from 'express';
import { z } from 'zod';
import * as watchPointsService from '../services/watchPointsService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireWatchPointManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet');
const requireWatchPointEditor = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'tester');

const createSchema = z.object({
  project_id: z.number().int().positive(),
  campaign_id: z.number().int().positive().optional(),
  feature_id: z.number().int().positive().optional(),
  title: z.string().min(1, 'Titre requis'),
  description: z.string().min(1, 'Description requise'),
  context: z.string().optional(),
  criticality: z.enum(['low','medium','high','critical']).optional(),
  consequence: z.string().optional(),
  owner_id: z.number().int().positive().optional(),
  validation_criteria: z.string().optional(),
  recommendations: z.string().optional(),
  status: z.enum(['open','validated','passed','failed']).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  context: z.string().optional(),
  criticality: z.enum(['low','medium','high','critical']).optional(),
  consequence: z.string().optional(),
  owner_id: z.number().int().positive().nullable().optional(),
  validation_criteria: z.string().optional(),
  recommendations: z.string().optional(),
  status: z.enum(['open','validated','passed','failed']).optional(),
});

/**
 * @swagger
 * /watch-points:
 *   get:
 *     tags: [Watch Points]
 *     summary: Lister les points à surveiller (paginé)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: projetId
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *       - name: campaign_id
 *         in: query
 *         schema: { type: integer }
 *       - name: statut
 *         in: query
 *         schema: { type: string }
 *       - name: criticite
 *         in: query
 *         schema: { type: string }
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste paginée des points à surveiller }
 *       400: { description: projetId requis }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await watchPointsService.listWatchPointsPaginated({
      projetId: req.query.projetId ? parseInt(req.query.projetId) : undefined,
      campaign_id: req.query.campaign_id ? parseInt(req.query.campaign_id) : undefined,
      statut: req.query.statut,
      criticite: req.query.criticite,
      recherche: req.query.recherche,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /watch-points/by-campaign/{campaignId}:
 *   get:
 *     tags: [Watch Points]
 *     summary: Points à surveiller d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des points à surveiller }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-campaign/:campaignId', authenticate, async (req, res, next) => {
  try {
    const points = await watchPointsService.listByCampaign(parseInt(req.params.campaignId));
    res.json(points);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /watch-points/stats/{projectId}:
 *   get:
 *     tags: [Watch Points]
 *     summary: Statistiques des points à surveiller par projet
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Stats par statut et criticité }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/stats/:projectId', authenticate, async (req, res, next) => {
  try {
    const stats = await watchPointsService.getWatchPointStats(parseInt(req.params.projectId));
    res.json(stats);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /watch-points/{id}:
 *   get:
 *     tags: [Watch Points]
 *     summary: Détail d'un point à surveiller
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Point à surveiller }
 *       404: { description: Non trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const point = await watchPointsService.getWatchPoint(parseInt(req.params.id));
    res.json(point);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /watch-points:
 *   post:
 *     tags: [Watch Points]
 *     summary: Créer un point à surveiller
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project_id, title, description]
 *             properties:
 *               project_id: { type: integer }
 *               campaign_id: { type: integer }
 *               feature_id: { type: integer }
 *               title: { type: string }
 *               description: { type: string }
 *               context: { type: string }
 *               criticality: { type: string }
 *               consequence: { type: string }
 *               owner_id: { type: integer }
 *               validation_criteria: { type: string }
 *               recommendations: { type: string }
 *               status: { type: string }
 *     responses:
 *       201: { description: Point créé }
 *       400: { description: Données invalides }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireWatchPointEditor, async (req, res, next) => {
  try {
    const parsed = createSchema.parse({ ...req.body, created_by: req.user.id });
    const point = await watchPointsService.createWatchPoint(parsed);
    res.status(201).json(point);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /watch-points/{id}:
 *   put:
 *     tags: [Watch Points]
 *     summary: Modifier un point à surveiller
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
 *               context: { type: string }
 *               criticality: { type: string }
 *               consequence: { type: string }
 *               owner_id: { type: integer }
 *               validation_criteria: { type: string }
 *               recommendations: { type: string }
 *               status: { type: string }
 *     responses:
 *       200: { description: Point mis à jour }
 *       404: { description: Non trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/:id', authenticate, requireWatchPointManager, async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const point = await watchPointsService.updateWatchPoint(parseInt(req.params.id), parsed);
    res.json(point);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /watch-points/{id}:
 *   delete:
 *     tags: [Watch Points]
 *     summary: Supprimer un point à surveiller
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Supprimé }
 *       404: { description: Non trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete('/:id', authenticate, requireWatchPointManager, async (req, res, next) => {
  try {
    await watchPointsService.deleteWatchPoint(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
