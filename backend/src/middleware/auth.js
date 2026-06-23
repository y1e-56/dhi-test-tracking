import jwt from 'jsonwebtoken';
import * as db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

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
