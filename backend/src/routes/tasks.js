import { Router } from 'express';
import { z } from 'zod';
import * as featureService from '../services/featureService.js';
import * as assignmentService from '../services/assignmentService.js';
import * as anomalyService from '../services/anomalyService.js';
import { authenticate } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

const createFeatureSchema = z.object({
  campaign_id: z.number(),
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const createAssignmentSchema = z.object({
  feature_id: z.number(),
  assigned_to: z.number(),
});

/**
 * @swagger
 * /tasks/features:
 *   post:
 *     tags: [Tasks]
 *     summary: Créer une fonctionnalité (alias)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaign_id, name]
 *             properties:
 *               campaign_id: { type: integer }
 *               name: { type: string }
 *               description: { type: string }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *     responses:
 *       201:
 *         description: Fonctionnalité créée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature: { $ref: '#/components/schemas/Feature' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/features', authenticate, async (req, res) => {
  const data = createFeatureSchema.parse(req.body);
  const feature = await featureService.createFeature(data);
  bus.emit('data:changed', { entity: 'features' });
  res.status(201).json({ feature });
});

/**
 * @swagger
 * /tasks/campaigns/{campaignId}/features:
 *   get:
 *     tags: [Tasks]
 *     summary: Lister les fonctionnalités d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des fonctionnalités
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Feature' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/campaigns/:campaignId/features', authenticate, async (req, res) => {
  const features = await featureService.listFeatures(Number(req.params.campaignId));
  res.json(features);
});

/**
 * @swagger
 * /tasks/assignments:
 *   post:
 *     tags: [Tasks]
 *     summary: Assigner une fonctionnalité à un utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feature_id, assigned_to]
 *             properties:
 *               feature_id: { type: integer }
 *               assigned_to: { type: integer }
 *     responses:
 *       201:
 *         description: Assignation créée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Assignment' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/assignments', authenticate, async (req, res) => {
  const data = createAssignmentSchema.parse(req.body);
  const assignment = await assignmentService.createAssignment(data.feature_id, data.assigned_to, req.user.id);
  bus.emit('data:changed', { entity: 'features' });
  res.status(201).json(assignment);
});

/**
 * @swagger
 * /tasks/assignments/{id}/reassign:
 *   patch:
 *     tags: [Tasks]
 *     summary: Réassigner une tâche à un autre utilisateur
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
 *             required: [new_assigned_to]
 *             properties:
 *               new_assigned_to: { type: integer }
 *     responses:
 *       200:
 *         description: Assignation mise à jour
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Assignment' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/assignments/:id/reassign', authenticate, async (req, res) => {
  const { new_assigned_to } = req.body;
  const assignment = await assignmentService.updateAssignment(Number(req.params.id), { assigned_to: new_assigned_to }, req.user.id);
  bus.emit('data:changed', { entity: 'features' });
  res.json(assignment);
});

/**
 * @swagger
 * /tasks/assignments/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Changer le statut d'une assignation
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, in_progress, completed] }
 *     responses:
 *       200:
 *         description: Assignation mise à jour
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Assignment' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/assignments/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const assignment = await assignmentService.updateAssignment(Number(req.params.id), { status }, req.user.id);
  bus.emit('data:changed', { entity: 'features' });
  res.json(assignment);
});

/**
 * @swagger
 * /tasks/assignments/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Supprimer une assignation
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Assignation supprimée
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/assignments/:id', authenticate, async (req, res) => {
  await assignmentService.deleteAssignment(Number(req.params.id), req.user.id);
  bus.emit('data:changed', { entity: 'features' });
  res.status(204).send();
});

/**
 * @swagger
 * /tasks/my-tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Lister les tâches (assignations + anomalies) de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Assignations et anomalies de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assignments:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Assignment' }
 *                 anomalies:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/my-tasks', authenticate, async (req, res) => {
  const assignments = await assignmentService.getUserAssignments(req.user.id);
  const anomalies = await anomalyService.listAnomalies(undefined, undefined, req.user.id);
  res.json({ assignments, anomalies });
});

/**
 * @swagger
 * /tasks/campaigns/{campaignId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Lister les assignations d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des assignations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Assignment' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/campaigns/:campaignId/tasks', authenticate, async (req, res) => {
  const assignments = await assignmentService.getCampaignAssignments(Number(req.params.campaignId));
  res.json(assignments);
});

export default router;
