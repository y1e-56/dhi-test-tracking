import { Router } from 'express';
import { z } from 'zod';
import * as chatService from '../services/chatService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1, 'Message requis'),
  campaignId: z.number().int().positive().optional(),
});

router.post('/', authenticate, async (req, res) => {
  const { message, campaignId } = chatSchema.parse(req.body);
  const reply = await chatService.processMessage({
    message,
    userId: req.user.id,
    campaignId,
  });
  res.json(reply);
});

export default router;
