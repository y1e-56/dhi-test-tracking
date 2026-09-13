import jwt from 'jsonwebtoken';
import * as db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès non autorisé pour votre rôle' });
    }
    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireChefTesteur = requireRole('admin', 'chef_testeur');
export const requireQualityAdmin = requireRole('quality_manager', 'qa_lead');
export const requireTester = requireRole('admin', 'chef_testeur', 'tester');
export const requireDeveloper = requireRole('admin', 'developer');
export const requireManagerOrAbove = requireRole('admin', 'chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet');

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token manquant' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findById(decoded.userId);
    if (!user || user.date_suppression) {
      res.status(401).json({ message: 'Utilisateur non trouvé' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}
