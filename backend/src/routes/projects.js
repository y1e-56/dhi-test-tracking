import { Router } from 'express';
import { z } from 'zod';
import * as projectService from '../services/projectService.js';
import { authenticate } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  test_lead_ids: z.array(z.number()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  test_lead_ids: z.array(z.number()).optional(),
});

router.get('/', authenticate, async (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const projects = await projectService.listProjects(includeArchived);
  res.json(projects);
});

router.get('/:id', authenticate, async (req, res) => {
  const project = await projectService.getProject(Number(req.params.id));
  res.json(project);
});

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Réservé aux administrateurs' });
  }
  next();
};

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const data = createSchema.parse(req.body);
  const project = await projectService.createProject({ ...data, created_by: req.user.id });
  bus.emit('data:changed', { entity: 'projects' });
  res.status(201).json({ project });
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const data = updateSchema.parse(req.body);
  const project = await projectService.updateProject(Number(req.params.id), data);
  bus.emit('data:changed', { entity: 'projects' });
  res.json({ project });
});

router.patch('/:id/archive', authenticate, requireAdmin, async (req, res) => {
  const project = await projectService.archiveProject(Number(req.params.id));
  bus.emit('data:changed', { entity: 'projects' });
  res.json({ project });
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  await projectService.deleteProject(Number(req.params.id));
  bus.emit('data:changed', { entity: 'projects' });
  res.status(204).send();
});

router.get('/:id/campaigns', authenticate, async (req, res) => {
  const campaigns = await projectService.getProjectCampaigns(Number(req.params.id));
  res.json(campaigns);
});

export default router;
