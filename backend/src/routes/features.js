import { Router } from 'express';
import { z } from 'zod';
import * as featureService from '../services/featureService.js';
import { authenticate } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

const createSchema = z.object({
  campaign_id: z.number(),
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

router.get('/', authenticate, async (req, res) => {
  const campaignId = req.query.campaignId ? Number(req.query.campaignId) : undefined;
  const features = await featureService.listFeatures(campaignId);
  res.json(features);
});

router.get('/:id', authenticate, async (req, res) => {
  const feature = await featureService.getFeature(Number(req.params.id));
  res.json(feature);
});

router.post('/', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);
  const feature = await featureService.createFeature(data);
  bus.emit('data:changed', { entity: 'features' });
  res.status(201).json({ feature });
});

router.put('/:id', authenticate, async (req, res) => {
  const feature = await featureService.updateFeature(Number(req.params.id), req.body);
  bus.emit('data:changed', { entity: 'features' });
  res.json({ feature });
});

router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const feature = await featureService.updateFeatureStatus(Number(req.params.id), status);
  bus.emit('data:changed', { entity: 'features' });
  res.json({ feature });
});

router.delete('/:id', authenticate, async (req, res) => {
  await featureService.deleteFeature(Number(req.params.id));
  bus.emit('data:changed', { entity: 'features' });
  res.status(204).send();
});

router.get('/:id/anomalies', authenticate, async (req, res) => {
  const anomalies = await featureService.getFeatureAnomalies(Number(req.params.id));
  res.json(anomalies);
});

export default router;
