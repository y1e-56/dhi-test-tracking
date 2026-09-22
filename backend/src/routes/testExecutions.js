import { Router } from 'express';
import { z } from 'zod';
import * as testExecutionsService from '../services/testExecutionsService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireExecutionManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet');
const requireExecutionEditor = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'tester');

const createSchema = z.object({
  test_case_id: z.number().int().positive(),
  campaign_id: z.number().int().positive(),
  result: z.enum(['passed','failed','blocked','not_run','skipped']).optional(),
  execution_date: z.string().optional(),
  duration_seconds: z.number().int().positive().optional(),
  environment: z.string().max(100).optional(),
  notes: z.string().optional(),
  screenshot_path: z.string().max(500).optional(),
  expected_behavior: z.string().optional(),
  actual_behavior: z.string().optional(),
  anomaly_id: z.number().int().positive().optional(),
});

const updateSchema = z.object({
  result: z.enum(['passed','failed','blocked','not_run','skipped']).optional(),
  duration_seconds: z.number().int().positive().nullable().optional(),
  environment: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  screenshot_path: z.string().max(500).nullable().optional(),
  expected_behavior: z.string().nullable().optional(),
  actual_behavior: z.string().nullable().optional(),
  anomaly_id: z.number().int().positive().nullable().optional(),
});

/**
 * @swagger
 * /test-executions:
 *   get:
 *     tags: [Test Executions]
 *     summary: Lister les exécutions (paginé)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: campaignId
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *       - name: result
 *         in: query
 *         schema: { type: string, enum: [passed, failed, blocked, not_run, skipped] }
 *       - name: executedBy
 *         in: query
 *         schema: { type: integer }
 *       - name: testCaseId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste paginée des exécutions }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await testExecutionsService.listExecutionsPaginated({
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId) : undefined,
      result: req.query.result,
      executedBy: req.query.executedBy ? parseInt(req.query.executedBy) : undefined,
      testCaseId: req.query.testCaseId ? parseInt(req.query.testCaseId) : undefined,
      recherche: req.query.recherche,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-executions/stats/{campaignId}:
 *   get:
 *     tags: [Test Executions]
 *     summary: Statistiques des exécutions d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Stats par résultat }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/stats/:campaignId', authenticate, async (req, res, next) => {
  try {
    const stats = await testExecutionsService.getExecutionStats(parseInt(req.params.campaignId));
    res.json(stats);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-executions/by-test-case/{testCaseId}:
 *   get:
 *     tags: [Test Executions]
 *     summary: Historique des exécutions d'un cas de test
 *     parameters:
 *       - name: testCaseId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des exécutions }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-test-case/:testCaseId', authenticate, async (req, res, next) => {
  try {
    const executions = await testExecutionsService.listByTestCase(parseInt(req.params.testCaseId));
    res.json(executions);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-executions/{id}:
 *   get:
 *     tags: [Test Executions]
 *     summary: Détail d'une exécution
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Exécution }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const exec = await testExecutionsService.getExecution(parseInt(req.params.id));
    res.json(exec);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-executions:
 *   post:
 *     tags: [Test Executions]
 *     summary: Créer une exécution
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [test_case_id, campaign_id]
 *             properties:
 *               test_case_id: { type: integer }
 *               campaign_id: { type: integer }
 *               result: { type: string, enum: [passed, failed, blocked, not_run, skipped] }
 *               duration_seconds: { type: integer }
 *               environment: { type: string }
 *               notes: { type: string }
 *               expected_behavior: { type: string }
 *               actual_behavior: { type: string }
 *               anomaly_id: { type: integer }
 *     responses:
 *       201: { description: Exécution créée }
 *       400: { description: Données invalides }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireExecutionEditor, async (req, res, next) => {
  try {
    const parsed = createSchema.parse(req.body);
    const exec = await testExecutionsService.createExecution({
      ...parsed,
      executed_by: req.user.id,
    });
    res.status(201).json(exec);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-executions/{id}:
 *   put:
 *     tags: [Test Executions]
 *     summary: Modifier une exécution
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
 *               result: { type: string }
 *               duration_seconds: { type: integer }
 *               environment: { type: string }
 *               notes: { type: string }
 *               expected_behavior: { type: string }
 *               actual_behavior: { type: string }
 *               anomaly_id: { type: integer }
 *     responses:
 *       200: { description: Exécution mise à jour }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/:id', authenticate, requireExecutionEditor, async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const exec = await testExecutionsService.updateExecution(parseInt(req.params.id), parsed, req.user.id);
    res.json(exec);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /test-executions/{id}:
 *   delete:
 *     tags: [Test Executions]
 *     summary: Supprimer une exécution
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
router.delete('/:id', authenticate, requireExecutionManager, async (req, res, next) => {
  try {
    await testExecutionsService.deleteExecution(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
