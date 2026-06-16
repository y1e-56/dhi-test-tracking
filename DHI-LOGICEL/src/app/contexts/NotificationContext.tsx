import { createContext, useContext, useState, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { Notification } from '../types';
import { anomalyService } from '../services/anomalyService';
import { getErrorMessage } from '../services/api';

interface NotificationContextType {
  notifications: Notification[];
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  refreshNotifications: () => Promise<void>;
  ajouterNotification: (notification: Notification) => void;
  marquerNotificationLue: (id: string) => Promise<void>;
  getNotificationsNonLues: (userId: string) => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await anomalyService.getNotifications();
      setNotifications(data);
    } catch (e) {
      toast.error('Erreur refreshNotifications : ' + getErrorMessage(e as any));
    }
  }, []);

  const ajouterNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const marquerNotificationLue = async (id: string) => {
    const numericId = Number(id);
    const isNumeric = Number.isInteger(numericId);
    try {
      if (isNumeric) {
        await anomalyService.markNotificationRead(id);
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const getNotificationsNonLues = (userId: string): number => {
    return notifications.filter(n => n.userId === userId && !n.lue).length;
  };

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, refreshNotifications, ajouterNotification, marquerNotificationLue, getNotificationsNonLues }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
