import { Router } from 'express';
import * as notificationService from '../services/notificationService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /notifications/my:
 *   get:
 *     tags: [Notifications]
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
router.get('/my', authenticate, async (req, res) => {
  const notifications = await notificationService.getUserNotifications(req.user.id);
  res.json(notifications);
});

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Nombre de notifications non lues de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Compteur de notifications non lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/unread-count', authenticate, async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.json({ count });
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
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
router.patch('/:id/read', authenticate, async (req, res) => {
  await notificationService.markAsRead(Number(req.params.id), req.user.id);
  res.json({ message: 'Notification marquée comme lue' });
});

/**
 * @swagger
 * /notifications/mark-all-read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Marquer toutes les notifications comme lues
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch('/mark-all-read', authenticate, async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.json({ message: 'Toutes les notifications marquées comme lues' });
});

export default router;