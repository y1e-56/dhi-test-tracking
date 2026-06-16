import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export function initializeSocket(httpServer) {
  const socketCorsOrigin = process.env.CORS_ORIGIN === 'dev' || process.env.CORS_ORIGIN === '*'
    ? true
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
        ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
      ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: socketCorsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = String(decoded.userId);
      next();
    } catch {
      next(new Error('Token invalide ou expiré'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Utilisateur connecté: ${socket.userId}`);

    // Rejoindre une room personnelle pour les notifications
    socket.join(`user-${socket.userId}`);
    console.log(`[Socket.IO] Utilisateur ${socket.userId} a rejoint user-${socket.userId}`);

    socket.on('join-campaign', (campaignId) => {
      socket.join(`campaign-${campaignId}`);
      console.log(`[Socket.IO] Utilisateur ${socket.userId} a rejoint campaign-${campaignId}`);
    });

    socket.on('leave-campaign', (campaignId) => {
      socket.leave(`campaign-${campaignId}`);
      console.log(`[Socket.IO] Utilisateur ${socket.userId} a quitté campaign-${campaignId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Utilisateur déconnecté: ${socket.userId}`);
    });
  });

  return io;
}

export function emitCampaignUpdate(io, campaignId, event, data) {
  console.log(`[Socket.IO] Émission ${event} pour campaign-${campaignId}:`, data);
  io.to(`campaign-${campaignId}`).emit(event, data);
}

export function emitCampaignCreated(io, campaign) {
  console.log(`[Socket.IO] Nouvelle campagne créée:`, campaign);
  io.emit('campaign-created', campaign);
}

export function emitCampaignDeleted(io, campaignId) {
  console.log(`[Socket.IO] Campagne supprimée:`, campaignId);
  io.emit('campaign-deleted', { id: campaignId });
}

export function emitCampaignUpdated(io, campaign) {
  console.log(`[Socket.IO] Campagne mise à jour:`, campaign);
  io.emit('campaign-updated', campaign);
}

export function emitNotification(io, userId, notification) {
  console.log(`[Socket.IO] Notification pour user-${userId}:`, notification);
  io.to(`user-${userId}`).emit('notification', notification);
}

export function emitDataChanged(io, entityType) {
  console.log(`[Socket.IO] Données modifiées: ${entityType}`);
  io.emit('data-changed', { entity: entityType });
}
