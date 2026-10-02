import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';
import bus from '../lib/eventBus.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const MAX_LOCK_DURATION_MINUTES = 24 * 60;

const ALLOWED_ROLES = ['admin', 'chef_testeur', 'tester', 'developer', 'quality_manager', 'qa_lead', 'product_owner', 'chef_projet', 'approver', 'lecteur'];
const ROLE_PRIVILEGE = Object.fromEntries(ALLOWED_ROLES.map((r, i) => [r, i]));

function collectRoles(user) {
  const list = Array.isArray(user?.roles) && user.roles.length ? user.roles : user?.role ? [user.role] : [];
  return [...new Set(list.filter((r) => ALLOWED_ROLES.includes(r)))];
}

// Le rôle principal est toujours le plus privilégié (index le plus faible).
function computePrimary(roles) {
  const list = roles.filter((r) => ALLOWED_ROLES.includes(r));
  if (list.length === 0) return 'lecteur';
  return list.reduce((best, r) => (ROLE_PRIVILEGE[r] < ROLE_PRIVILEGE[best] ? r : best));
}

function toPublic(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    roles: collectRoles(user),
    created_at: user.created_at,
  };
}

export async function register(email, password, firstName, lastName, role, roles = []) {
  const wantedRoles = [...new Set((roles && roles.length ? roles : [role]).filter((r) => ALLOWED_ROLES.includes(r)))];
  if (wantedRoles.length === 0) {
    throw new AppError('Rôle invalide. Rôles autorisés : ' + ALLOWED_ROLES.join(', '), 400);
  }

  const existing = await db.users.findByEmail(email);
  if (existing) {
    // Un même email = un même compte : l'appelant (admin) envoie TOUJOURS le set
    // complet des rôles voulus, donc on REMPLACE (pas d'union) pour ne pas laisser
    // de rôles "fantômes" hérités d'anciennes éditions.
    const merged = wantedRoles;
    const primary = computePrimary(merged);
    if (existing.date_suppression) await db.users.restore(existing.id);
    await db.users.resetFailedAttempts(existing.id);
    const user = await db.users.setRoles(existing.id, merged, primary);
    return { user: toPublic(user), created: false };
  }

  if (!password || password.length < 6) throw new AppError('Mot de passe requis (6 caractères minimum)', 400);
  if (!firstName?.trim() || !lastName?.trim()) throw new AppError('Prénom et nom requis', 400);

  const primary = computePrimary(wantedRoles);
  const password_hash = await bcrypt.hash(password, 10);
  const user = await db.users.create({ email, password_hash, firstName, lastName, role: primary, roles: wantedRoles });
  return { user: toPublic(user), created: true };
}

export async function login(email, password) {
  const user = await db.users.findByEmail(email);
  if (!user) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  if (user.date_suppression) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AppError('Compte temporairement verrouillé. Réessayez plus tard.', 423);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const attempts = user.failed_login_attempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const durationMinutes = Math.min(
        LOCK_DURATION_MINUTES * 2 ** (user.lock_count || 0),
        MAX_LOCK_DURATION_MINUTES
      );
      const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
      await db.users.lockUntil(user.id, lockedUntil, attempts);
      throw new AppError(`Trop de tentatives. Compte verrouillé pour ${durationMinutes} minutes.`, 423);
    }
    await db.users.incrementFailedAttempts(user.id, attempts);
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  await db.users.resetFailedAttempts(user.id);

  const payload = { userId: user.id, email: user.email, role: user.role, roles: collectRoles(user) };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  return { user: toPublic(user), token };
}

export async function getProfile(userId) {
  const user = await db.users.findById(userId);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
  return toPublic(user);
}

export async function updateProfile(userId, data) {
  const user = await db.users.update(userId, data);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
  return toPublic(user);
}

export async function updateUserRole(userId, role) {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new AppError('Rôle invalide. Rôles autorisés : ' + ALLOWED_ROLES.join(', '), 400);
  }
  const user = await db.users.updateRole(userId, role);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
  return { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, roles: user.roles };
}

export async function updateUserRoles(userId, roles) {
  if (!Array.isArray(roles) || roles.length === 0 || roles.some((r) => !ALLOWED_ROLES.includes(r))) {
    throw new AppError('Rôles invalides. Rôles autorisés : ' + ALLOWED_ROLES.join(', '), 400);
  }
  const merged = [...new Set(roles)];
  const primary = computePrimary(merged);
  const user = await db.users.setRoles(userId, merged, primary);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
  return { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, roles: user.roles };
}

export async function listUsers() {
  return db.users.list();
}

export async function listUsersPaginated(filters = {}) {
  return db.users.listPaginated({
    recherche: filters.recherche,
    role: filters.role,
    bloque: filters.bloque,
    includeSupprimes: filters.includeSupprimes,
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy,
  });
}

export async function blockUser(userId, durationMinutes = 60) {
  const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  const user = await db.users.block(userId, lockedUntil);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
}

export async function unblockUser(userId) {
  const user = await db.users.unblock(userId);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
}

export async function softDeleteUser(userId) {
  const user = await db.users.softDelete(userId);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
}

export async function restoreUser(userId) {
  const user = await db.users.restore(userId);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await db.users.findById(userId);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Mot de passe actuel incorrect', 401);

  const password_hash = await bcrypt.hash(newPassword, 10);
  await db.users.updatePassword(userId, password_hash);
}

export async function forgotPassword(email) {
  const user = await db.users.findByEmail(email);
  if (user && !user.date_suppression) {
    await db.users.markPasswordResetRequested(user.id);
    const admins = await db.users.listByRole('admin');
    bus.emit('user:password_forgot', { user: toPublic(user), admins });
  }
  // Réponse toujours générique : on ne révèle jamais si l'email existe en base.
}

export async function resetPasswordByAdmin(userId) {
  const user = await db.users.findById(userId);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);
  if (!user.password_reset_requested_at) {
    throw new AppError('Aucune demande de mot de passe oublié en attente pour cet utilisateur', 400);
  }

  const tempPassword = crypto.randomBytes(6).toString('base64url');
  const password_hash = await bcrypt.hash(tempPassword, 10);
  await db.users.updatePassword(userId, password_hash);
  await db.users.clearPasswordResetRequest(userId);

  bus.emit('user:password_reset_by_admin', { user: toPublic(user), tempPassword });
  return { email: user.email };
}
