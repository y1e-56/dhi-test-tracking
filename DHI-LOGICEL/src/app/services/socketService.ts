import { io, Socket } from 'socket.io-client';

const hostname = window.location.hostname;
const SOCKET_URL = `http://${hostname}:5000`;

type EventHandler = (...args: any[]) => void;

let socket: Socket | null = null;

export const socketService = {
  connect(userId: string | number, token?: string, options?: { autoJoinUserRoom?: boolean }) {
    if (socket?.connected) {
      console.log('[socketService] Déjà connecté');
      return socket;
    }

    console.log('[socketService] Connexion au serveur Socket.IO...');
    const resolvedToken = token ?? localStorage.getItem('token') ?? undefined;

    socket = io(SOCKET_URL, {
      auth: resolvedToken ? { userId, token: resolvedToken } : { userId },
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('[socketService] Connecté au serveur Socket.IO');
      if (options?.autoJoinUserRoom !== false) {
        socket?.emit('join-user', userId);
      }
    });

    socket.on('disconnect', () => {
      console.log('[socketService] Déconnecté du serveur Socket.IO');
    });

    socket.on('connect_error', (error: any) => {
      console.error('[socketService] Erreur de connexion:', error);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      console.log('[socketService] Déconnexion du serveur Socket.IO');
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  joinCampaign(campaignId: string | number) {
    if (socket) {
      console.log('[socketService] Rejoindre campaign-' + campaignId);
      socket.emit('join-campaign', campaignId);
    }
  },

  leaveCampaign(campaignId: string | number) {
    if (socket) {
      console.log('[socketService] Quitter campaign-' + campaignId);
      socket.emit('leave-campaign', campaignId);
    }
  },

  onCampaignCreated(callback: (campaign: any) => void) {
    if (socket) {
      socket.on('campaign-created', callback);
    }
  },

  onCampaignUpdated(callback: (campaign: any) => void) {
    if (socket) {
      socket.on('campaign-updated', callback);
    }
  },

  onCampaignDeleted(callback: (data: { id: string }) => void) {
    if (socket) {
      socket.on('campaign-deleted', callback);
    }
  },

  offCampaignCreated(callback: (campaign: any) => void) {
    if (socket) {
      socket.off('campaign-created', callback);
    }
  },

  offCampaignUpdated(callback: (campaign: any) => void) {
    if (socket) {
      socket.off('campaign-updated', callback);
    }
  },

  offCampaignDeleted(callback: (data: { id: string }) => void) {
    if (socket) {
      socket.off('campaign-deleted', callback);
    }
  },

  onNotification(callback: (notification: any) => void) {
    if (socket) {
      socket.off('notification', callback); // éviter les doublons
      socket.on('notification', callback);
    }
  },

  offNotification(callback: (notification: any) => void) {
    if (socket) {
      socket.off('notification', callback);
    }
  },

  onDataChanged(callback: (data: { entity: string }) => void) {
    if (socket) {
      socket.on('data-changed', callback);
    }
  },

  offDataChanged(callback: (data: { entity: string }) => void) {
    if (socket) {
      socket.off('data-changed', callback);
    }
  },

  onCampaignUpdate(callback: (update: any) => void) {
    if (socket) {
      socket.on('campaign-update', callback);
    }
  },

  offCampaignUpdate(callback: (update: any) => void) {
    if (socket) {
      socket.off('campaign-update', callback);
    }
  },

  onAnomalyCreated(callback: (anomaly: any) => void) {
    if (socket) {
      socket.on('anomaly-created', callback);
    }
  },

  onAnomalyUpdated(callback: (anomaly: any) => void) {
    if (socket) {
      socket.on('anomaly-updated', callback);
    }
  },

  onFeatureStatusChanged(callback: (feature: any) => void) {
    if (socket) {
      socket.on('feature-status-changed', callback);
    }
  },

  onTaskAssigned(callback: (task: any) => void) {
    if (socket) {
      socket.on('task-assigned', callback);
    }
  },

  off(event: string, handler?: EventHandler) {
    if (socket) {
      socket.off(event, handler as any);
    }
  },

  on(event: string, handler: EventHandler) {
    if (socket) {
      socket.on(event, handler);
    }
  }
};
