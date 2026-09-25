import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import * as authService from '../services/authService.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

// Limite dÃ©sactivable en local/e2e via DISABLE_AUTH_RATE_LIMIT=1,
// et ajustable via AUTH_RATE_LIMIT_MAX (dÃ©faut : 20 req / 15 min).
const authRateLimiter = process.env.DISABLE_AUTH_RATE_LIMIT === '1'
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Trop de tentatives depuis cette adresse. RÃ©essayez plus tard.' },
    });

export const BACKEND_ROLES = ['admin', 'chef_testeur', 'tester', 'developer', 'quality_manager', 'qa_lead', 'product_owner', 'chef_projet', 'approver', 'lecteur'];

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractÃ¨res').optional(),
  first_name: z.string().min(1, 'PrÃ©nom requis').optional(),
  last_name: z.string().min(1, 'Nom requis').optional(),
  role: z.enum(BACKEND_ROLES).optional(),
  roles: z.array(z.enum(BACKEND_ROLES)).min(1, 'Au moins un rôle requis').optional(),
});

const updateRoleSchema = z
  .object({
    role: z.enum(BACKEND_ROLES).optional(),
    roles: z.array(z.enum(BACKEND_ROLES)).min(1, 'Au moins un rôle requis').optional(),
  })
  .refine((d) => d.role || d.roles, { message: 'role ou roles requis' });

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: CrÃ©er un nouvel utilisateur (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, first_name, last_name, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role: { type: string, enum: [admin, chef_testeur, tester, developer, quality_manager, qa_lead, product_owner, chef_projet, approver, lecteur] }
 *     responses:
 *       201:
 *         description: Utilisateur crÃ©Ã©
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       403:
 *         description: RÃ©servÃ© aux administrateurs
 *       429:
 *         description: Trop de tentatives
 */
router.post('/register', authenticate, requireAdmin, authRateLimiter, async (req, res) => {
  const data = registerSchema.parse(req.body);
  const { user, created } = await authService.register(data.email, data.password, data.first_name, data.last_name, data.role, data.roles);
  if (created) bus.emit('user:created', { user, password: data.password });
  bus.emit('data:changed', { entity: 'users' });
  res.status(created ? 201 : 200).json({ user, created });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authentifier un utilisateur
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion rÃ©ussie, retourne le token JWT et l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Identifiants invalides
 *       429:
 *         description: Trop de tentatives
 */
router.post('/login', authRateLimiter, async (req, res) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data.email, data.password);
  const ip = req.ip || req.headers['x-forwarded-for'] || '';
  bus.emit('user:logged_in', { user: result.user, ip });
  res.json(result);
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Demander une rÃ©initialisation de mot de passe (notifie l'administrateur)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Demande enregistrÃ©e (rÃ©ponse gÃ©nÃ©rique, ne confirme pas l'existence du compte)
 *       429:
 *         description: Trop de tentatives
 */
router.post('/forgot-password', authRateLimiter, async (req, res) => {
  const data = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(data.email);
  res.json({ message: 'Si ce compte existe, votre administrateur a Ã©tÃ© averti de votre demande.' });
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: RÃ©cupÃ©rer le profil de l'utilisateur connectÃ©
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/profile', authenticate, async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json(user);
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: RÃ©cupÃ©rer les informations de l'utilisateur connectÃ©
 *     responses:
 *       200:
 *         description: Utilisateur courant
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/me', authenticate, async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json(user);
});

/**
 * @swagger
 * /auth/me:
 *   put:
 *     tags: [Auth]
 *     summary: Mettre Ã  jour le profil de l'utilisateur connectÃ©
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Profil mis Ã  jour
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/me', authenticate, async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json(user);
});

/**
 * @swagger
 * /auth/me/password:
 *   put:
 *     tags: [Auth]
 *     summary: Changer le mot de passe de l'utilisateur connectÃ©
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Mot de passe mis Ã  jour
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/me/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json({ message: 'Mot de passe mis Ã  jour' });
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     tags: [Auth]
 *     summary: Lister les utilisateurs (admin uniquement, avec filtres et pagination optionnels)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *         description: Recherche par nom/email
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [admin, chef_testeur, tester, developer, quality_manager, qa_lead, product_owner, chef_projet, approver, lecteur] }
 *       - name: bloque
 *         in: query
 *         schema: { type: string }
 *       - name: includeSupprimes
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des utilisateurs (paginÃ©e si un filtre/page/limit est fourni, sinon tableau complet)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *                 - $ref: '#/components/schemas/PaginatedResult'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const { page, limit, ...filters } = req.query;
  if (page || limit || filters.recherche || filters.role || filters.bloque) {
    const result = await authService.listUsersPaginated({
      page: page ? Math.max(1, parseInt(page)) : 1,
      limit: limit ? Math.max(1, Math.min(200, parseInt(limit))) : 20,
      recherche: filters.recherche || undefined,
      role: filters.role || undefined,
      bloque: filters.bloque || undefined,
      includeSupprimes: filters.includeSupprimes || undefined,
    });
    res.json(result);
  } else {
    const users = await authService.listUsers();
    res.json(users);
  }
});

/**
 * @swagger
 * /auth/members:
 *   get:
 *     tags: [Auth]
 *     summary: Lister les membres actifs (tout utilisateur authentifiÃ©, pour l'affichage Ã©quipe/assignation)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs actifs
 *         content:
 *           application/json:
 *             type: array
 *             items: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/members', authenticate, async (req, res) => {
  const users = await authService.listUsers();
  res.json(users);
});

/**
 * @swagger
 * /auth/users/{id}/block:
 *   patch:
 *     tags: [Auth]
 *     summary: Bloquer un utilisateur (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Utilisateur bloquÃ©
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/block', authenticate, requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ message: 'Vous ne pouvez pas bloquer votre propre compte' });
  }
  await authService.blockUser(targetId);
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: 'Utilisateur bloquÃ©' });
});

/**
 * @swagger
 * /auth/users/{id}/unblock:
 *   patch:
 *     tags: [Auth]
 *     summary: DÃ©bloquer un utilisateur (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Utilisateur dÃ©bloquÃ©
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/unblock', authenticate, requireAdmin, async (req, res) => {
  await authService.unblockUser(Number(req.params.id));
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: 'Utilisateur dÃ©bloquÃ©' });
});

/**
 * @swagger
 * /auth/users/{id}/soft-delete:
 *   patch:
 *     tags: [Auth]
 *     summary: Supprimer (soft-delete) un utilisateur (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Utilisateur supprimÃ©
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/soft-delete', authenticate, requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
  }
  await authService.softDeleteUser(targetId);
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: 'Utilisateur supprimÃ©' });
});

/**
 * @swagger
 * /auth/users/{id}/restore:
 *   patch:
 *     tags: [Auth]
 *     summary: Restaurer un utilisateur supprimÃ© (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Utilisateur restaurÃ©
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/restore', authenticate, requireAdmin, async (req, res) => {
  await authService.restoreUser(Number(req.params.id));
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: 'Utilisateur restaurÃ©' });
});

/**
 * @swagger
 * /auth/users/{id}/reset-password:
 *   patch:
 *     tags: [Auth]
 *     summary: RÃ©initialiser le mot de passe d'un utilisateur (admin uniquement)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Mot de passe rÃ©initialisÃ© et envoyÃ© par email
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
  const result = await authService.resetPasswordByAdmin(Number(req.params.id));
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: `Mot de passe rÃ©initialisÃ© et envoyÃ© Ã  ${result.email}` });
});

/**
 * @swagger
 * /auth/users/{id}/role:
 *   patch:
 *     tags: [Auth]
 *     summary: Changer le rÃ´le d'un utilisateur (admin uniquement)
 *     security:
 *       - bearerAuth: []
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, chef_testeur, tester, developer, quality_manager, qa_lead, product_owner, chef_projet, approver, lecteur] }
 *     responses:
 *       200:
 *         description: RÃ´le mis Ã  jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: RÃ´le invalide
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rÃ´le' });
  }
  const { role, roles } = updateRoleSchema.parse(req.body);
  const user = roles ? await authService.updateUserRoles(targetId, roles) : await authService.updateUserRole(targetId, role);
  bus.emit('data:changed', { entity: 'users' });
  res.json({ user });
});

export default router;
