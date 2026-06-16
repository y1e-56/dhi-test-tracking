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

router.get('/', authenticate, async (req, res) => {
  const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
  const members = await teamService.getTeamMembers(projectId);
  res.json(members);
});

router.get('/stats/:projectId', authenticate, async (req, res) => {
  const stats = await teamService.getProjectTeamStats(Number(req.params.projectId));
  res.json(stats);
});

router.post('/members', authenticate, async (req, res) => {
  const data = addMemberSchema.parse(req.body);
  await campaignMemberService.addMember(data.campaign_id, data.user_id, data.team_type);
  res.status(201).json({ message: 'Membre ajouté' });
});

router.delete('/members/:campaignId/:userId', authenticate, async (req, res) => {
  await campaignMemberService.removeMember(Number(req.params.campaignId), Number(req.params.userId));
  res.json({ message: 'Membre retiré' });
});

router.get('/campaigns/:campaignId/members', authenticate, async (req, res) => {
  const result = await campaignMemberService.getCampaignMembersWithDetails(Number(req.params.campaignId));
  res.json(result);
});

router.get('/users/:userId/campaigns', authenticate, async (req, res) => {
  const campaigns = await campaignService.listCampaigns();
  const memberships = await campaignMemberService.getUserCampaigns(Number(req.params.userId));
  const userCampaigns = campaigns.filter(c => memberships.some(m => m.campaign_id === c.id));
  res.json(userCampaigns);
});

export default router;
