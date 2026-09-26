import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useStore } from "@/lib/dhi-store";
import { mapBackendNotificationToApp, type BackendNotification } from "@/lib/api";

const API_BASE_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:5000/api";
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export function useRealtimeNotifications() {
  const { currentUser, loadNotifications, pushBackendNotification } = useStore();

  const actionsRef = useRef({ loadNotifications, pushBackendNotification });
  actionsRef.current = { loadNotifications, pushBackendNotification };

  useEffect(() => {
    if (!currentUser) return;
    void actionsRef.current.loadNotifications();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socket.on("notification", (payload: BackendNotification) => {
      if (!payload || payload.notified_user_id == null) return;
      if (String(payload.notified_user_id) !== String(currentUser.id)) return;
      actionsRef.current.pushBackendNotification(
        mapBackendNotificationToApp(payload, String(currentUser.id)),
      );
    });

    socket.on("connect_error", (error) => {
      console.warn("[socket] Connexion impossible:", error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);
}