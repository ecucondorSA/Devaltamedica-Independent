// Importar servicios Firebase desde el paquete centralizado
import { getFirebaseFirestore } from '@altamedica/firebase';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from '../lib/firestore-mock';

// Obtener instancia única de Firestore
const db = getFirebaseFirestore();

export interface MedicalNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  senderName?: string;
  type:
    | 'message'
    | 'appointment'
    | 'prescription'
    | 'lab_result'
    | 'reminder'
    | 'emergency'
    | 'system';
  title: string;
  body: string;
  data?: {
    conversationId?: string;
    appointmentId?: string;
    prescriptionId?: string;
    labResultId?: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    medicalData?: any;
  };
  read: boolean;
  createdAt: any;
  readAt?: Timestamp;
  // Campos médicos específicos
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'clinical' | 'administrative' | 'emergency' | 'reminder' | 'social';
  expiresAt?: Timestamp;
  actions?: Array<{
    label: string;
    action: string;
    style: 'primary' | 'secondary' | 'danger';
  }>;
}

export interface NotificationService {
  // Enviar notificaciones
  sendNotification: (
    recipientId: string,
    notification: Omit<MedicalNotification, 'id' | 'recipientId' | 'createdAt' | 'read'>,
  ) => Promise<void>;
  sendBulkNotifications: (
    recipientIds: string[],
    notification: Omit<MedicalNotification, 'id' | 'recipientId' | 'createdAt' | 'read'>,
  ) => Promise<void>;

  // Obtener notificaciones
  getNotifications: (userId: string, limit?: number) => Promise<MedicalNotification[]>;
  getUnreadNotifications: (userId: string) => Promise<MedicalNotification[]>;
  subscribeToNotifications: (
    userId: string,
    callback: (notifications: MedicalNotification[]) => void,
  ) => () => void;

  // Gestionar estado
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  // Notificaciones médicas específicas
  sendAppointmentReminder: (patientId: string, appointmentData: any) => Promise<void>;
  sendPrescriptionReady: (patientId: string, prescriptionData: any) => Promise<void>;
  sendLabResultsReady: (patientId: string, labData: any) => Promise<void>;
  sendEmergencyAlert: (recipientIds: string[], emergencyData: any) => Promise<void>;

  // Configuración
  updateNotificationPreferences: (
    userId: string,
    preferences: NotificationPreferences,
  ) => Promise<void>;
  getNotificationPreferences: (userId: string) => Promise<NotificationPreferences | null>;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  // Tipos específicos
  appointments: boolean;
  prescriptions: boolean;
  labResults: boolean;
  messages: boolean;
  reminders: boolean;
  emergencies: boolean;
  // Horarios
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
  weekendNotifications: boolean;
}

class FirebaseNotificationService implements NotificationService {
  private notificationsCollection = 'medical_notifications';
  private userPreferencesCollection = 'notification_preferences';

  // Enviar notificaciones
  async sendNotification(
    recipientId: string,
    notification: Omit<MedicalNotification, 'id' | 'recipientId' | 'createdAt' | 'read'>,
  ): Promise<void> {
    try {
      const notificationData: Omit<MedicalNotification, 'id'> = {
        recipientId,
        ...notification,
        read: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, this.notificationsCollection), notificationData);

      // Si es una notificación urgente, podríamos también enviar push notification
      if (notification.priority === 'urgent' || notification.category === 'emergency') {
        await this.sendPushNotification(recipientId, notification);
      }
    } catch (error) {
      throw new Error(`Error enviando notificación: ${error}`);
    }
  }

  async sendBulkNotifications(
    recipientIds: string[],
    notification: Omit<MedicalNotification, 'id' | 'recipientId' | 'createdAt' | 'read'>,
  ): Promise<void> {
    try {
      const promises = recipientIds.map((recipientId) =>
        this.sendNotification(recipientId, notification),
      );
      await Promise.all(promises);
    } catch (error) {
      throw new Error(`Error enviando notificaciones masivas: ${error}`);
    }
  }

  // Obtener notificaciones
  async getNotifications(userId: string, limitCount = 50): Promise<MedicalNotification[]> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as MedicalNotification,
      );
    } catch (error) {
      throw new Error(`Error obteniendo notificaciones: ${error}`);
    }
  }

  async getUnreadNotifications(userId: string): Promise<MedicalNotification[]> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('recipientId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as MedicalNotification,
      );
    } catch (error) {
      throw new Error(`Error obteniendo notificaciones no leídas: ${error}`);
    }
  }

  subscribeToNotifications(
    userId: string,
    callback: (notifications: MedicalNotification[]) => void,
  ): () => void {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50),
      );

      return onSnapshot(q, (querySnapshot) => {
        const notifications: MedicalNotification[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as MedicalNotification,
        );
        callback(notifications);
      });
    } catch (error) {
      logger.error('Error suscribiendo a notificaciones:', error);
      return () => {};
    }
  }

  // Gestionar estado
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.notificationsCollection, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(`Error marcando notificación como leída: ${error}`);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('recipientId', '==', userId),
        where('read', '==', false),
      );

      const querySnapshot = await getDocs(q);
      const promises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          read: true,
          readAt: serverTimestamp(),
        }),
      );

      await Promise.all(promises);
    } catch (error) {
      throw new Error(`Error marcando todas las notificaciones como leídas: ${error}`);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.notificationsCollection, notificationId);
      await updateDoc(notificationRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(`Error eliminando notificación: ${error}`);
    }
  }

  // Notificaciones médicas específicas
  async sendAppointmentReminder(patientId: string, appointmentData: any): Promise<void> {
    const notification = {
      senderId: 'system',
      senderName: 'Sistema AltaMedica',
      type: 'appointment' as const,
      title: '📅 Recordatorio de Cita',
      body: `Tienes una cita con ${appointmentData.doctorName} el ${appointmentData.date} a las ${appointmentData.time}`,
      data: {
        appointmentId: appointmentData.id,
        actionUrl: `/appointments/${appointmentData.id}`,
        priority: 'medium' as const,
        medicalData: appointmentData,
      },
      priority: 'medium' as const,
      category: 'reminder' as const,
      actions: [
        { label: 'Ver Cita', action: 'view', style: 'primary' as const },
        { label: 'Reagendar', action: 'reschedule', style: 'secondary' as const },
      ],
    };

    await this.sendNotification(patientId, notification);
  }

  async sendPrescriptionReady(patientId: string, prescriptionData: any): Promise<void> {
    const notification = {
      senderId: prescriptionData.doctorId,
      senderName: prescriptionData.doctorName,
      type: 'prescription' as const,
      title: '💊 Prescripción Lista',
      body: `Tu prescripción de ${prescriptionData.medicationName} está lista para recoger`,
      data: {
        prescriptionId: prescriptionData.id,
        actionUrl: `/prescriptions/${prescriptionData.id}`,
        priority: 'high' as const,
        medicalData: prescriptionData,
      },
      priority: 'high' as const,
      category: 'clinical' as const,
      actions: [
        { label: 'Ver Prescripción', action: 'view', style: 'primary' as const },
        { label: 'Ubicar Farmacia', action: 'locate', style: 'secondary' as const },
      ],
    };

    await this.sendNotification(patientId, notification);
  }

  async sendLabResultsReady(patientId: string, labData: any): Promise<void> {
    const notification = {
      senderId: labData.doctorId,
      senderName: labData.doctorName,
      type: 'lab_result' as const,
      title: '🔬 Resultados de Laboratorio',
      body: `Tus resultados de ${labData.testName} están disponibles`,
      data: {
        labResultId: labData.id,
        actionUrl: `/lab-results/${labData.id}`,
        priority: labData.urgent ? ('urgent' as const) : ('high' as const),
        medicalData: labData,
      },
      priority: labData.urgent ? ('urgent' as const) : ('high' as const),
      category: 'clinical' as const,
      actions: [
        { label: 'Ver Resultados', action: 'view', style: 'primary' as const },
        { label: 'Agendar Consulta', action: 'schedule', style: 'secondary' as const },
      ],
    };

    await this.sendNotification(patientId, notification);
  }

  async sendEmergencyAlert(recipientIds: string[], emergencyData: any): Promise<void> {
    const notification = {
      senderId: 'emergency_system',
      senderName: 'Sistema de Emergencias',
      type: 'emergency' as const,
      title: '🚨 Alerta de Emergencia',
      body: emergencyData.message || 'Se ha activado una alerta de emergencia médica',
      data: {
        actionUrl: `/emergency/${emergencyData.id}`,
        priority: 'urgent' as const,
        medicalData: emergencyData,
      },
      priority: 'urgent' as const,
      category: 'emergency' as const,
      actions: [
        { label: 'Ver Detalles', action: 'view', style: 'danger' as const },
        { label: 'Contactar Emergencias', action: 'call', style: 'danger' as const },
      ],
    };

    await this.sendBulkNotifications(recipientIds, notification);
  }

  // Configuración
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences,
  ): Promise<void> {
    try {
      const preferencesRef = doc(db, this.userPreferencesCollection, userId);
      await updateDoc(preferencesRef, {
        ...preferences,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(`Error actualizando preferencias: ${error}`);
    }
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const preferencesRef = doc(db, this.userPreferencesCollection, userId);
      const preferencesSnap = await getDocs(
        query(collection(db, this.userPreferencesCollection), where('__name__', '==', userId)),
      );

      if (preferencesSnap.empty) {
        // Crear preferencias por defecto
        const defaultPreferences: NotificationPreferences = {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          appointments: true,
          prescriptions: true,
          labResults: true,
          messages: true,
          reminders: true,
          emergencies: true,
          weekendNotifications: true,
        };
        await this.updateNotificationPreferences(userId, defaultPreferences);
        return defaultPreferences;
      }

      return preferencesSnap.docs[0].data() as NotificationPreferences;
    } catch (error) {
      throw new Error(`Error obteniendo preferencias: ${error}`);
    }
  }

  // Método privado para push notifications (requeriría implementación adicional)
  private async sendPushNotification(
    recipientId: string,
    notification: Omit<MedicalNotification, 'id' | 'recipientId' | 'createdAt' | 'read'>,
  ): Promise<void> {
    try {
      // Aquí se implementaría la lógica para enviar push notifications reales
      // usando Firebase Cloud Messaging (FCM) o un servicio similar
      logger.info('Enviando push notification urgente a:', recipientId, notification.title);

      // Ejemplo de implementación con FCM:
      /*
      const messaging = getMessaging()
      await messaging.send({
        token: userFCMToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {}
      })
      */
    } catch (error) {
      logger.error('Error enviando push notification:', error);
    }
  }
}

// Instancia singleton
export const firebaseNotifications = new FirebaseNotificationService();
export default firebaseNotifications;
