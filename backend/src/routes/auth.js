import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import * as authService from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives depuis cette adresse. Réessayez plus tard.' },
});

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  role: z.enum(['admin', 'test_lead', 'tester', 'developer']),
});

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
 *     summary: Créer un nouvel utilisateur
 *     security: []
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
 *               role: { type: string, enum: [admin, test_lead, tester, developer] }
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       429:
 *         description: Trop de tentatives
 */
router.post('/register', authRateLimiter, async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data.email, data.password, data.first_name, data.last_name, data.role);
  bus.emit('user:created', { user, password: data.password });
  res.status(201).json({ user });
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
 *         description: Connexion réussie, retourne le token JWT et l'utilisateur
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
 *     summary: Demander une réinitialisation de mot de passe (notifie l'administrateur)
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
 *         description: Demande enregistrée (réponse générique, ne confirme pas l'existence du compte)
 *       429:
 *         description: Trop de tentatives
 */
router.post('/forgot-password', authRateLimiter, async (req, res) => {
  const data = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(data.email);
  res.json({ message: 'Si ce compte existe, votre administrateur a été averti de votre demande.' });
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Récupérer le profil de l'utilisateur connecté
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
 *     summary: Récupérer les informations de l'utilisateur connecté
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
 *     summary: Mettre à jour le profil de l'utilisateur connecté
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
 *         description: Profil mis à jour
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
 *     summary: Changer le mot de passe de l'utilisateur connecté
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
 *         description: Mot de passe mis à jour
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/me/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json({ message: 'Mot de passe mis à jour' });
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     tags: [Auth]
 *     summary: Lister les utilisateurs (avec filtres et pagination optionnels)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *         description: Recherche par nom/email
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [admin, chef_testeur, tester, developer] }
 *       - name: bloque
 *         in: query
 *         schema: { type: string }
 *       - name: includeSupprimes
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des utilisateurs (paginée si un filtre/page/limit est fourni, sinon tableau complet)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *                 - $ref: '#/components/schemas/PaginatedResult'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/users', authenticate, async (req, res) => {
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
 * /auth/users/{id}/block:
 *   patch:
 *     tags: [Auth]
 *     summary: Bloquer un utilisateur
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Utilisateur bloqué
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/block', authenticate, async (req, res) => {
  await authService.blockUser(Number(req.params.id));
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: 'Utilisateur bloqué' });
});

/**
 * @swagger
 * /auth/users/{id}/unblock:
 *   patch:
 *     tags: [Auth]
 *     summary: Débloquer un utilisateur
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Utilisateur débloqué
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/unblock', authenticate, async (req, res) => {
  await authService.unblockUser(Number(req.params.id));
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: 'Utilisateur débloqué' });
});

/**
 * @swagger
 * /auth/users/{id}/soft-delete:
 *   patch:
 *     tags: [Auth]
 *     summary: Supprimer (soft-delete) un utilisateur
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/soft-delete', authenticate, async (req, res) => {
  await authService.softDeleteUser(Number(req.params.id));
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: 'Utilisateur supprimé' });
});

/**
 * @swagger
 * /auth/users/{id}/restore:
 *   patch:
 *     tags: [Auth]
 *     summary: Restaurer un utilisateur supprimé
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Utilisateur restauré
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/restore', authenticate, async (req, res) => {
  await authService.restoreUser(Number(req.params.id));
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: 'Utilisateur restauré' });
});

/**
 * @swagger
 * /auth/users/{id}/reset-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Réinitialiser le mot de passe d'un utilisateur (admin uniquement)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé et envoyé par email
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/reset-password', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Seul un administrateur peut réinitialiser un mot de passe' });
  }
  const result = await authService.resetPasswordByAdmin(Number(req.params.id));
  bus.emit('data:changed', { entity: 'users' });
  res.json({ message: `Mot de passe réinitialisé et envoyé à ${result.email}` });
});

export default router;
