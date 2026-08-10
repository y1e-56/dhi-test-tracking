import { Router } from 'express';
import { z } from 'zod';
import * as anomalyService from '../services/anomalyService.js';
import * as notificationService from '../services/notificationService.js';
import { authenticate } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

const createSchema = z.object({
  feature_id: z.number(),
  campaign_id: z.number(),
  description: z.string().min(1, 'Description requise'),
  reported_by: z.number().optional(),
  assigned_to: z.number().optional(),
  test_case_id: z.number().optional(),
  correction_due_date: z.string().optional(),
});

/**
 * @swagger
 * /anomalies:
 *   get:
 *     tags: [Anomalies]
 *     summary: Lister les anomalies (paginée, avec filtres)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: campagneId
 *         in: query
 *         schema: { type: integer }
 *       - name: fonctionnaliteId
 *         in: query
 *         schema: { type: integer }
 *       - name: statut
 *         in: query
 *         schema: { type: string, enum: [new, in_progress, resolution_signaled, validated, rejected] }
 *       - name: projetId
 *         in: query
 *         schema: { type: integer }
 *       - name: testeurId
 *         in: query
 *         schema: { type: integer }
 *       - name: developpeurId
 *         in: query
 *         schema: { type: integer }
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *       - name: dateDebut
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: dateFin
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Liste paginée des anomalies
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResult' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Paginated + filtered list (nouveau)
router.get('/', authenticate, async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const result = await anomalyService.listAnomaliesPaginated({
    page: page ? Math.max(1, parseInt(page)) : 1,
    limit: limit ? Math.max(1, Math.min(200, parseInt(limit))) : 20,
    campagneId: filters.campagneId ? Number(filters.campagneId) : undefined,
    fonctionnaliteId: filters.fonctionnaliteId ? Number(filters.fonctionnaliteId) : undefined,
    statut: filters.statut || undefined,
    projetId: filters.projetId ? Number(filters.projetId) : undefined,
    testeurId: filters.testeurId ? Number(filters.testeurId) : undefined,
    developpeurId: filters.developpeurId ? Number(filters.developpeurId) : undefined,
    recherche: filters.recherche || undefined,
    dateDebut: filters.dateDebut || undefined,
    dateFin: filters.dateFin || undefined,
  });
  res.json(result);
});

/**
 * @swagger
 * /anomalies/stats:
 *   get:
 *     tags: [Anomalies]
 *     summary: Statistiques globales des anomalies (KPIs)
 *     responses:
 *       200:
 *         description: Statistiques des anomalies
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Stats pour les KPIs des pages admin
router.get('/stats', authenticate, async (req, res) => {
  const stats = await anomalyService.getAnomalyStats(req.query.projetId);
  res.json(stats);
});

/**
 * @swagger
 * /anomalies/campaigns/{campaignId}:
 *   get:
 *     tags: [Anomalies]
 *     summary: Lister les anomalies d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des anomalies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/campaigns/:campaignId', authenticate, async (req, res) => {
  const anomalies = await anomalyService.listAnomalies(Number(req.params.campaignId));
  res.json(anomalies);
});

/**
 * @swagger
 * /anomalies/test-cases/{testCaseId}:
 *   get:
 *     tags: [Anomalies]
 *     summary: Lister les anomalies liées à un cas de test
 *     parameters:
 *       - name: testCaseId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des anomalies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/test-cases/:testCaseId', authenticate, async (req, res) => {
  const anomalies = await anomalyService.listAnomalies(undefined, undefined, undefined, undefined, Number(req.params.testCaseId));
  res.json(anomalies);
});

/**
 * @swagger
 * /anomalies/my-anomalies:
 *   get:
 *     tags: [Anomalies]
 *     summary: Lister les anomalies assignées à l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Liste des anomalies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/my-anomalies', authenticate, async (req, res) => {
  const anomalies = await anomalyService.listAnomalies(undefined, undefined, req.user.id);
  res.json(anomalies);
});

/**
 * @swagger
 * /anomalies/reported:
 *   get:
 *     tags: [Anomalies]
 *     summary: Lister les anomalies signalées par l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Liste des anomalies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/reported', authenticate, async (req, res) => {
  const anomalies = await anomalyService.listAnomalies(undefined, undefined, undefined, req.user.id);
  res.json(anomalies);
});

/**
 * @swagger
 * /anomalies/{id}:
 *   get:
 *     tags: [Anomalies]
 *     summary: Récupérer une anomalie par son id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anomalie trouvée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', authenticate, async (req, res) => {
  const anomaly = await anomalyService.getAnomaly(Number(req.params.id));
  res.json(anomaly);
});

/**
 * @swagger
 * /anomalies:
 *   post:
 *     tags: [Anomalies]
 *     summary: Créer une anomalie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feature_id, campaign_id, description]
 *             properties:
 *               feature_id: { type: integer }
 *               campaign_id: { type: integer }
 *               description: { type: string }
 *               reported_by: { type: integer }
 *               assigned_to: { type: integer }
 *               test_case_id: { type: integer }
 *     responses:
 *       201:
 *         description: Anomalie créée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anomaly: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);
  const anomaly = await anomalyService.createAnomaly(data);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.status(201).json({ anomaly });
});

/**
 * @swagger
 * /anomalies/{id}:
 *   put:
 *     tags: [Anomalies]
 *     summary: Mettre à jour une anomalie
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
 *     responses:
 *       200:
 *         description: Anomalie mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anomaly: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authenticate, async (req, res) => {
  const anomaly = await anomalyService.updateAnomaly(Number(req.params.id), req.body, req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.json({ anomaly });
});

/**
 * @swagger
 * /anomalies/{id}/signal-resolution:
 *   patch:
 *     tags: [Anomalies]
 *     summary: Signaler la résolution d'une anomalie
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
 *             required: [resolution_description]
 *             properties:
 *               resolution_description: { type: string }
 *     responses:
 *       200:
 *         description: Résolution signalée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anomaly: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/signal-resolution', authenticate, async (req, res) => {
  const { resolution_description } = req.body;
  const anomaly = await anomalyService.signalResolution(Number(req.params.id), resolution_description, req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.json({ anomaly });
});

/**
 * @swagger
 * /anomalies/{id}/validate:
 *   patch:
 *     tags: [Anomalies]
 *     summary: Valider la résolution d'une anomalie
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anomalie validée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anomaly: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/validate', authenticate, async (req, res) => {
  const anomaly = await anomalyService.validateAnomaly(Number(req.params.id), req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.json({ anomaly });
});

/**
 * @swagger
 * /anomalies/{id}/reject:
 *   patch:
 *     tags: [Anomalies]
 *     summary: Rejeter (réouvrir) une anomalie
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anomalie rejetée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anomaly: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/reject', authenticate, async (req, res) => {
  const anomaly = await anomalyService.rejectAnomaly(Number(req.params.id), req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.json({ anomaly });
});

/**
 * @swagger
 * /anomalies/{id}:
 *   delete:
 *     tags: [Anomalies]
 *     summary: Supprimer une anomalie
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Anomalie supprimée
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, async (req, res) => {
  await anomalyService.deleteAnomaly(Number(req.params.id), req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.status(204).send();
});

/**
 * @swagger
 * /anomalies/{id}/history:
 *   get:
 *     tags: [Anomalies]
 *     summary: Historique des actions sur une anomalie
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Historique de l'anomalie
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/history', authenticate, async (req, res) => {
  const history = await anomalyService.getAnomalyHistory(Number(req.params.id));
  res.json(history);
});

/**
 * @swagger
 * /anomalies/notifications/my:
 *   get:
 *     tags: [Anomalies]
 *     summary: Lister les notifications de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Liste des notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Notification' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/notifications/my', authenticate, async (req, res) => {
  const notifications = await notificationService.getUserNotifications(req.user.id);
  res.json(notifications);
});

/**
 * @swagger
 * /anomalies/notifications/{id}/read:
 *   patch:
 *     tags: [Anomalies]
 *     summary: Marquer une notification comme lue
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  await notificationService.markAsRead(Number(req.params.id), req.user.id);
  res.json({ message: 'Notification marquée comme lue' });
});

/**
 * @swagger
 * /anomalies/notifications/mark-all-read:
 *   patch:
 *     tags: [Anomalies]
 *     summary: Marquer toutes les notifications comme lues
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch('/notifications/mark-all-read', authenticate, async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.json({ message: 'Toutes les notifications marquées comme lues' });
});

export default router;
