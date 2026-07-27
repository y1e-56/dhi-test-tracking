import { Router } from 'express';
import { z } from 'zod';
import * as chatService from '../services/chatService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1, 'Message requis'),
  campaignId: z.number().int().positive().optional(),
});

/**
 * @swagger
 * /chat:
 *   post:
 *     tags: [Chat]
 *     summary: Envoyer un message à l'assistant conversationnel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string }
 *               campaignId: { type: integer }
 *     responses:
 *       200:
 *         description: Réponse de l'assistant
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
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
