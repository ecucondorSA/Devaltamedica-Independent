import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  type:
    | "appointment"
    | "prescription"
    | "lab_result"
    | "reminder"
    | "alert"
    | "info";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  actionUrl?: string;
  metadata?: any;
}

export function useNotifications(patientId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError(null);

      // Mock data - en producción sería una llamada API real
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "appointment",
          title: "Recordatorio de Cita",
          message:
            "Tienes una cita programada mañana a las 10:00 AM con Dr. García",
          timestamp: "2025-01-27T10:00:00Z",
          isRead: false,
          priority: "high",
          actionUrl: "/appointments",
        },
        {
          id: "2",
          type: "prescription",
          title: "Prescripción por Vencer",
          message:
            "Tu prescripción de Losartán vence en 3 días. Contacta a tu médico.",
          timestamp: "2025-01-26T15:30:00Z",
          isRead: false,
          priority: "urgent",
          actionUrl: "/prescriptions",
        },
        {
          id: "3",
          type: "lab_result",
          title: "Nuevos Resultados Disponibles",
          message:
            "Los resultados de tu análisis de sangre están listos para revisar.",
          timestamp: "2025-01-25T09:15:00Z",
          isRead: true,
          priority: "medium",
          actionUrl: "/lab-results",
        },
      ];

      await new Promise((resolve) => setTimeout(resolve, 500));
      setNotifications(mockNotifications);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar notificaciones"
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const urgentCount = notifications.filter(
    (n) => n.priority === "urgent"
  ).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    urgentCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
