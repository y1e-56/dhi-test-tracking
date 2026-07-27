import { Router } from 'express';
import { z } from 'zod';
import * as teamService from '../services/teamService.js';
import * as campaignMemberService from '../services/campaignMemberService.js';
import * as campaignService from '../services/campaignService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const addMemberSchema = z.object({
  campaign_id: z.number(),
  user_id: z.number(),
  team_type: z.enum(['tester', 'developer']),
});

/**
 * @swagger
 * /teams:
 *   get:
 *     tags: [Teams]
 *     summary: Lister les membres d'équipe (optionnellement filtrés par projet)
 *     parameters:
 *       - name: projectId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des membres
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res) => {
  const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
  const members = await teamService.getTeamMembers(projectId);
  res.json(members);
});

/**
 * @swagger
 * /teams/stats/{projectId}:
 *   get:
 *     tags: [Teams]
 *     summary: Statistiques d'équipe pour un projet
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Statistiques d'équipe
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/stats/:projectId', authenticate, async (req, res) => {
  const stats = await teamService.getProjectTeamStats(Number(req.params.projectId));
  res.json(stats);
});

/**
 * @swagger
 * /teams/members:
 *   post:
 *     tags: [Teams]
 *     summary: Ajouter un membre à une campagne
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaign_id, user_id, team_type]
 *             properties:
 *               campaign_id: { type: integer }
 *               user_id: { type: integer }
 *               team_type: { type: string, enum: [tester, developer] }
 *     responses:
 *       201:
 *         description: Membre ajouté
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/members', authenticate, async (req, res) => {
  const data = addMemberSchema.parse(req.body);
  await campaignMemberService.addMember(data.campaign_id, data.user_id, data.team_type);
  res.status(201).json({ message: 'Membre ajouté' });
});

/**
 * @swagger
 * /teams/members/{campaignId}/{userId}:
 *   delete:
 *     tags: [Teams]
 *     summary: Retirer un membre d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Membre retiré
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/members/:campaignId/:userId', authenticate, async (req, res) => {
  await campaignMemberService.removeMember(Number(req.params.campaignId), Number(req.params.userId));
  res.json({ message: 'Membre retiré' });
});

/**
 * @swagger
 * /teams/campaigns/{campaignId}/members:
 *   get:
 *     tags: [Teams]
 *     summary: Lister les membres d'une campagne avec détails
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des membres de la campagne
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/campaigns/:campaignId/members', authenticate, async (req, res) => {
  const result = await campaignMemberService.getCampaignMembersWithDetails(Number(req.params.campaignId));
  res.json(result);
});

/**
 * @swagger
 * /teams/users/{userId}/campaigns:
 *   get:
 *     tags: [Teams]
 *     summary: Lister les campagnes auxquelles un utilisateur participe
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des campagnes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Campaign' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/users/:userId/campaigns', authenticate, async (req, res) => {
  const campaigns = await campaignService.listCampaigns();
  const memberships = await campaignMemberService.getUserCampaigns(Number(req.params.userId));
  const userCampaigns = campaigns.filter(c => memberships.some(m => m.campaign_id === c.id));
  res.json(userCampaigns);
});

export default router;
