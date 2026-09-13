import { Router } from 'express';
import { z } from 'zod';
import * as testScenariosService from '../services/testScenariosService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireScenarioManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'product_owner');
const requireScenarioEditor = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'product_owner', 'tester');

const createSchema = z.object({
  campaign_id: z.number().int().positive(),
  feature_id: z.number().int().positive().optional(),
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  category: z.enum(['fonctionnel','integration','end_to_end','regression','unitaire','api','interface','securite','performance','charge','stress','endurance','resilience','compatibilite','accessibilite','ergonomie','disponibilite','recuperation','installation','migration','documentation','testabilite']).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['fonctionnel','integration','end_to_end','regression','unitaire','api','interface','securite','performance','charge','stress','endurance','resilience','compatibilite','accessibilite','ergonomie','disponibilite','recuperation','installation','migration','documentation','testabilite']).optional(),
});

/**
 * @swagger
 * /test-scenarios:
 *   get:
 *     tags: [Test Scenarios]
 *     summary: Lister les scénarios (paginé)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: campaignId
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *       - name: categorie
 *         in: query
 *         schema: { type: string }
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Liste paginée des scénarios }
 *       400: { description: campaignId requis }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await testScenariosService.listScenariosPaginated({
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId) : undefined,
      featureId: req.query.featureId ? parseInt(req.query.featureId) : undefined,
      categorie: req.query.categorie,
      recherche: req.query.recherche,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-scenarios/by-feature/{featureId}:
 *   get:
 *     tags: [Test Scenarios]
 *     summary: Scénarios d'une fonctionnalité
 *     parameters:
 *       - name: featureId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des scénarios }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-feature/:featureId', authenticate, async (req, res, next) => {
  try {
    const scenarios = await testScenariosService.listByFeature(parseInt(req.params.featureId));
    res.json(scenarios);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-scenarios/{id}:
 *   get:
 *     tags: [Test Scenarios]
 *     summary: Détail d'un scénario (avec test_cases liés)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Scénario }
 *       404: { description: Non trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const scenario = await testScenariosService.getScenario(parseInt(req.params.id));
    res.json(scenario);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-scenarios:
 *   post:
 *     tags: [Test Scenarios]
 *     summary: Créer un scénario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaign_id, title]
 *             properties:
 *               campaign_id: { type: integer }
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *     responses:
 *       201: { description: Scénario créé }
 *       400: { description: Données invalides }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireScenarioEditor, async (req, res, next) => {
  try {
    const parsed = createSchema.parse({ ...req.body, created_by: req.user.id });
    const scenario = await testScenariosService.createScenario(parsed);
    res.status(201).json(scenario);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-scenarios/{id}:
 *   put:
 *     tags: [Test Scenarios]
 *     summary: Modifier un scénario
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
 *     responses:
 *       200: { description: Scénario mis à jour }
 *       404: { description: Non trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/:id', authenticate, requireScenarioEditor, async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const scenario = await testScenariosService.updateScenario(parseInt(req.params.id), parsed);
    res.json(scenario);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-scenarios/{id}:
 *   delete:
 *     tags: [Test Scenarios]
 *     summary: Supprimer un scénario
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
router.delete('/:id', authenticate, requireScenarioManager, async (req, res, next) => {
  try {
    await testScenariosService.deleteScenario(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
