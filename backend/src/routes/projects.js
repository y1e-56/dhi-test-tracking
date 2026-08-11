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

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: Lister les projets (avec filtres et pagination optionnels)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *       - name: statut
 *         in: query
 *         schema: { type: string }
 *       - name: chefTesteurId
 *         in: query
 *         schema: { type: integer }
 *       - name: includeArchived
 *         in: query
 *         schema: { type: boolean }
 *         description: Inclure les projets archivés (uniquement pour la liste non paginée)
 *     responses:
 *       200:
 *         description: Liste des projets (paginée si un filtre/page/limit est fourni, sinon tableau complet)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items: { $ref: '#/components/schemas/Project' }
 *                 - $ref: '#/components/schemas/PaginatedResult'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res) => {
  const { page, limit, ...filters } = req.query;
  if (page || limit || filters.recherche || filters.statut || filters.chefTesteurId) {
    const result = await projectService.listProjectsPaginated({
      page: page ? Math.max(1, parseInt(page)) : 1,
      limit: limit ? Math.max(1, Math.min(200, parseInt(limit))) : 20,
      recherche: filters.recherche || undefined,
      statut: filters.statut || undefined,
      chefTesteurId: filters.chefTesteurId ? Number(filters.chefTesteurId) : undefined,
    });
    res.json(result);
  } else {
    const includeArchived = filters.includeArchived === 'true';
    const projects = await projectService.listProjects(includeArchived);
    res.json(projects);
  }
});

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Récupérer un projet par son id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Projet trouvé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
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

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Créer un projet (admin uniquement)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               test_lead_ids: { type: array, items: { type: integer } }
 *     responses:
 *       201:
 *         description: Projet créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const data = createSchema.parse(req.body);
  const project = await projectService.createProject({ ...data, created_by: req.user.id });
  bus.emit('data:changed', { entity: 'projects' });
  res.status(201).json({ project });
});

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Mettre à jour un projet (admin uniquement)
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
 *               name: { type: string }
 *               description: { type: string }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               test_lead_ids: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Projet mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const data = updateSchema.parse(req.body);
  const project = await projectService.updateProject(Number(req.params.id), data);
  bus.emit('data:changed', { entity: 'projects' });
  res.json({ project });
});

/**
 * @swagger
 * /projects/{id}/archive:
 *   patch:
 *     tags: [Projects]
 *     summary: Archiver un projet (admin uniquement)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Projet archivé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/archive', authenticate, requireAdmin, async (req, res) => {
  const project = await projectService.archiveProject(Number(req.params.id));
  bus.emit('data:changed', { entity: 'projects' });
  res.json({ project });
});

/**
 * @swagger
 * /projects/{id}/unarchive:
 *   patch:
 *     tags: [Projects]
 *     summary: Restaurer un projet archivé (admin uniquement)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Projet restauré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/unarchive', authenticate, requireAdmin, async (req, res) => {
  const project = await projectService.unarchiveProject(Number(req.params.id));
  bus.emit('data:changed', { entity: 'projects' });
  res.json({ project });
});

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Supprimer un projet (admin uniquement)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Projet supprimé
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  await projectService.deleteProject(Number(req.params.id));
  bus.emit('data:changed', { entity: 'projects' });
  res.status(204).send();
});

/**
 * @swagger
 * /projects/{id}/campaigns:
 *   get:
 *     tags: [Projects]
 *     summary: Lister les campagnes d'un projet
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des campagnes du projet
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Campaign' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/campaigns', authenticate, async (req, res) => {
  const campaigns = await projectService.getProjectCampaigns(Number(req.params.id));
  res.json(campaigns);
});

export default router;
