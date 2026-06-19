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
});

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

// Stats pour les KPIs des pages admin
router.get('/stats', authenticate, async (_req, res) => {
  const stats = await anomalyService.getAnomalyStats();
  res.json(stats);
});

router.get('/campaigns/:campaignId', authenticate, async (req, res) => {
  const anomalies = await anomalyService.listAnomalies(Number(req.params.campaignId));
  res.json(anomalies);
});

router.get('/test-cases/:testCaseId', authenticate, async (req, res) => {
  const anomalies = await anomalyService.listAnomalies(undefined, undefined, undefined, undefined, Number(req.params.testCaseId));
  res.json(anomalies);
});

router.get('/my-anomalies', authenticate, async (req, res) => {
  const anomalies = await anomalyService.listAnomalies(undefined, undefined, req.user.id);
  res.json(anomalies);
});

router.get('/reported', authenticate, async (req, res) => {
  const anomalies = await anomalyService.listAnomalies(undefined, undefined, undefined, req.user.id);
  res.json(anomalies);
});

router.get('/:id', authenticate, async (req, res) => {
  const anomaly = await anomalyService.getAnomaly(Number(req.params.id));
  res.json(anomaly);
});

router.post('/', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);
  const anomaly = await anomalyService.createAnomaly(data);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.status(201).json({ anomaly });
});

router.put('/:id', authenticate, async (req, res) => {
  const anomaly = await anomalyService.updateAnomaly(Number(req.params.id), req.body, req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.json({ anomaly });
});

router.patch('/:id/signal-resolution', authenticate, async (req, res) => {
  const { resolution_description } = req.body;
  const anomaly = await anomalyService.signalResolution(Number(req.params.id), resolution_description, req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.json({ anomaly });
});

router.patch('/:id/validate', authenticate, async (req, res) => {
  const anomaly = await anomalyService.validateAnomaly(Number(req.params.id), req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.json({ anomaly });
});

router.patch('/:id/reject', authenticate, async (req, res) => {
  const anomaly = await anomalyService.rejectAnomaly(Number(req.params.id), req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.json({ anomaly });
});

router.delete('/:id', authenticate, async (req, res) => {
  await anomalyService.deleteAnomaly(Number(req.params.id), req.user.id);
  bus.emit('data:changed', { entity: 'anomalies' });
  res.status(204).send();
});

router.get('/:id/history', authenticate, async (req, res) => {
  const history = await anomalyService.getAnomalyHistory(Number(req.params.id));
  res.json(history);
});

router.get('/notifications/my', authenticate, async (req, res) => {
  const notifications = await notificationService.getUserNotifications(req.user.id);
  res.json(notifications);
});

router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  await notificationService.markAsRead(Number(req.params.id), req.user.id);
  res.json({ message: 'Notification marquée comme lue' });
});

router.patch('/notifications/mark-all-read', authenticate, async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.json({ message: 'Toutes les notifications marquées comme lues' });
});

export default router;
