import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const s = socketService.connect(currentUser.id, token);
    setSocket(s || socketService.getSocket());

    const onConnect = () => {
      setIsConnected(true);
    };
    const onDisconnect = () => {
      setIsConnected(false);
    };

    const currentSocket = socketService.getSocket();
    if (currentSocket) {
      currentSocket.on('connect', onConnect);
      currentSocket.on('disconnect', onDisconnect);
      if (currentSocket.connected) setIsConnected(true);
    }

    return () => {
      if (currentSocket) {
        currentSocket.off('connect', onConnect);
        currentSocket.off('disconnect', onDisconnect);
      }
      socketService.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
