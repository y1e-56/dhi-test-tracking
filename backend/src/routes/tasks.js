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

router.post('/features', authenticate, async (req, res) => {
  const data = createFeatureSchema.parse(req.body);
  const feature = await featureService.createFeature(data);
  bus.emit('data:changed', { entity: 'features' });
  res.status(201).json({ feature });
});

router.get('/campaigns/:campaignId/features', authenticate, async (req, res) => {
  const features = await featureService.listFeatures(Number(req.params.campaignId));
  res.json(features);
});

router.post('/assignments', authenticate, async (req, res) => {
  const data = createAssignmentSchema.parse(req.body);
  const assignment = await assignmentService.createAssignment(data.feature_id, data.assigned_to);
  bus.emit('data:changed', { entity: 'features' });
  res.status(201).json(assignment);
});

router.patch('/assignments/:id/reassign', authenticate, async (req, res) => {
  const { new_assigned_to } = req.body;
  const assignment = await assignmentService.updateAssignment(Number(req.params.id), { assigned_to: new_assigned_to });
  bus.emit('data:changed', { entity: 'features' });
  res.json(assignment);
});

router.patch('/assignments/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const assignment = await assignmentService.updateAssignment(Number(req.params.id), { status });
  bus.emit('data:changed', { entity: 'features' });
  res.json(assignment);
});

router.delete('/assignments/:id', authenticate, async (req, res) => {
  await assignmentService.deleteAssignment(Number(req.params.id));
  bus.emit('data:changed', { entity: 'features' });
  res.status(204).send();
});

router.get('/my-tasks', authenticate, async (req, res) => {
  const assignments = await assignmentService.getUserAssignments(req.user.id);
  const anomalies = await anomalyService.listAnomalies(undefined, undefined, req.user.id);
  res.json({ assignments, anomalies });
});

router.get('/campaigns/:campaignId/tasks', authenticate, async (req, res) => {
  const assignments = await assignmentService.getCampaignAssignments(Number(req.params.campaignId));
  res.json(assignments);
});

export default router;
