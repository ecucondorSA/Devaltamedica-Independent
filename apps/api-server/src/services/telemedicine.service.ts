import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase-admin/firestore';

// Interfaces
export interface TelemedicineSession {
  id: string;
  roomId: string;
  patientId: string;
  doctorId: string;
  status: 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled';
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  notes?: string;
  recordingUrl?: string;
  chatHistory: ChatMessage[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  message: string;
  timestamp: Date;
}

export interface EmergencySession extends CreateSessionData {
  emergencyType: 'critical' | 'urgent' | 'moderate';
  symptoms: string;
  vitalSigns?: {
    heartRate?: number;
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    temperature?: number;
    oxygenSaturation?: number;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  priority: number;
  status: 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled';
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  sessionId?: string;
  consentType: 'telemedicine' | 'recording' | 'data_sharing' | 'emergency_contact';
  consentText: string;
  agreed: boolean;
  signatureData?: {
    signature?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
  };
  witnessInfo?: {
    witnessName?: string;
    witnessRole?: string;
    witnessId?: string;
  };
  createdBy?: string;
  createdAt: Date;
}

export interface CreateEmergencySessionData {
  patientId: string;
  emergencyType: 'critical' | 'urgent' | 'moderate';
  symptoms: string;
  vitalSigns?: EmergencySession['vitalSigns'];
  location?: EmergencySession['location'];
  priority: number;
  scheduledAt: Date;
  status: 'waiting';
  createdBy?: string;
}

export interface CreateConsentData {
  patientId: string;
  sessionId?: string;
  consentType: 'telemedicine' | 'recording' | 'data_sharing' | 'emergency_contact';
  consentText: string;
  agreed: boolean;
  signatureData?: ConsentRecord['signatureData'];
  witnessInfo?: ConsentRecord['witnessInfo'];
  createdBy?: string;
  createdAt: Date;
}

export interface CreateSessionData {
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  createdBy?: string;
}

export interface UpdateSessionData {
  notes?: string;
  recordingUrl?: string;
  updatedBy?: string;
}

export interface EndSessionData {
  notes?: string;
  recordingUrl?: string;
  endedBy?: string;
}

class TelemedicineService {
  private static io: Server;
  private static db = adminDb;
  private static sessionsCollection = 'telemedicine_sessions';
  private static chatCollection = 'telemedicine_chat';
  private static emergencySessionsCollection = 'emergency_telemedicine_sessions';
  private static consentsCollection = 'telemedicine_consents';

  public static initialize(io: Server) {
    this.io = io;
    this.io.on('connection', this.handleConnection);
  }

  private static handleConnection = (socket: Socket) => {
    logger.info(`Usuario conectado con socket id: ${socket.id}`);

    socket.on('join-room', (roomId: string, userId: string) => {
      socket.join(roomId);
      logger.info(`Usuario ${userId} se unió a la sala ${roomId}`);
      socket.to(roomId).emit('user-connected', userId);
    });

    socket.on('offer', (roomId: string, offer: any) => {
      socket.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (roomId: string, answer: any) => {
      socket.to(roomId).emit('answer', answer);
    });

    socket.on('ice-candidate', (roomId: string, candidate: any) => {
      socket.to(roomId).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
      logger.info(`Usuario desconectado: ${socket.id}`);
    });
  }

  // Session Management
  static async createSession(data: CreateSessionData): Promise<TelemedicineSession> {
    try {
      const sessionId = uuidv4();
      const roomId = uuidv4();

      const sessionData = {
        id: sessionId,
        roomId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        status: 'scheduled' as const,
        scheduledAt: Timestamp.fromDate(data.scheduledAt),
        chatHistory: [],
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, this.sessionsCollection), sessionData);
      
      // Create WebRTC room if io server is available
      if (this.io) {
        // Room creation logic can be added here
        logger.info(`Created WebRTC room: ${roomId}`);
      }

      // Return the created session with proper typing
      return {
        id: docRef.id,
        roomId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        status: 'scheduled',
        scheduledAt: data.scheduledAt,
        chatHistory: [],
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error creating telemedicine session:', undefined, error);
      throw new Error('Failed to create telemedicine session');
    }
  }

  static async getSession(sessionId: string): Promise<TelemedicineSession | null> {
    try {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return this.convertFirestoreToSession({ id: docSnap.id, ...data });
    } catch (error) {
      logger.error('Error getting session:', undefined, error);
      throw new Error('Failed to get session');
    }
  }

  static async getSessionsByUser(userId: string, userType: 'patient' | 'doctor'): Promise<TelemedicineSession[]> {
    try {
      const fieldToQuery = userType === 'patient' ? 'patientId' : 'doctorId';

      const q = query(
        collection(this.db, this.sessionsCollection),
        where(fieldToQuery, '==', userId),
        orderBy('scheduledAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => this.convertFirestoreToSession({ id: d.id, ...d.data() }));
    } catch (error) {
      logger.error('Error getting sessions by user:', undefined, error);
      throw new Error('Failed to get sessions');
    }
  }

  static async getSessionByRoomId(roomId: string): Promise<TelemedicineSession | null> {
    try {
      const q = query(
        collection(this.db, this.sessionsCollection),
        where('roomId', '==', roomId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.convertFirestoreToSession({ id: doc.id, ...doc.data() });
    } catch (error) {
      logger.error('Error getting session by room ID:', undefined, error);
      throw new Error('Failed to get session by room ID');
    }
  }

  static async startSession(sessionId: string, startedBy?: string): Promise<TelemedicineSession> {
    try {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = docSnap.data();
      if (sessionData.status !== 'scheduled' && sessionData.status !== 'waiting') {
        throw new Error('Session cannot be started - invalid state');
      }

      const updateData = {
        status: 'active',
        startedAt: serverTimestamp(),
        updatedBy: startedBy,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);
      return this.convertFirestoreToSession({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      logger.error('Error starting session:', undefined, error);
      throw error;
    }
  }

  static async endSession(sessionId: string, data: EndSessionData): Promise<TelemedicineSession> {
    try {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = docSnap.data();
      if (sessionData.status !== 'active') {
        throw new Error('Session cannot be ended - not active');
      }

      const endTime = new Date();
      let duration = 0;
      if (sessionData.startedAt) {
        duration = endTime.getTime() - sessionData.startedAt.toDate().getTime();
      }

      const updateData: any = {
        status: 'completed',
        endedAt: Timestamp.fromDate(endTime),
        duration,
        updatedBy: data.endedBy,
        updatedAt: serverTimestamp()
      };

      if (data.notes) updateData.notes = data.notes;
      if (data.recordingUrl) updateData.recordingUrl = data.recordingUrl;

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);
      return this.convertFirestoreToSession({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      logger.error('Error ending session:', undefined, error);
      throw error;
    }
  }

  static async cancelSession(sessionId: string, cancelledBy?: string): Promise<TelemedicineSession> {
    try {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Session not found');
      }

      const updateData = {
        status: 'cancelled',
        updatedBy: cancelledBy,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);
      return this.convertFirestoreToSession({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      logger.error('Error cancelling session:', undefined, error);
      throw error;
    }
  }

  static async updateSession(sessionId: string, data: UpdateSessionData): Promise<TelemedicineSession> {
    try {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Session not found');
      }

      const updateData: any = {
        updatedBy: data.updatedBy,
        updatedAt: serverTimestamp()
      };

      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.recordingUrl !== undefined) updateData.recordingUrl = data.recordingUrl;

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);
      return this.convertFirestoreToSession({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      logger.error('Error updating session:', undefined, error);
      throw error;
    }
  }

  // Chat Management
  static async addChatMessage(sessionId: string, messageData: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    try {
      const messageId = uuidv4();
      const message: ChatMessage = {
        id: messageId,
        ...messageData
      };

      const chatRef = collection(this.db, this.chatCollection);
      await addDoc(chatRef, {
        sessionId,
        ...message,
        timestamp: Timestamp.fromDate(message.timestamp)
      });

      // Also update the session's chat history
      const sessionRef = doc(this.db, this.sessionsCollection, sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        const updatedChatHistory = [...(sessionData.chatHistory || []), message];
        
        await updateDoc(sessionRef, {
          chatHistory: updatedChatHistory,
          updatedAt: serverTimestamp()
        });
      }

      return message;
    } catch (error) {
      logger.error('Error adding chat message:', undefined, error);
      throw new Error('Failed to add chat message');
    }
  }

  static async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(this.db, this.chatCollection),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          senderId: data.senderId,
          senderType: data.senderType,
          message: data.message,
          timestamp: data.timestamp.toDate()
        };
      });
    } catch (error) {
      logger.error('Error getting chat history:', undefined, error);
      throw new Error('Failed to get chat history');
    }
  }

  // Room Management
  static async checkRoomAvailability(roomId: string): Promise<any> {
    try {
      const session = await this.getSessionByRoomId(roomId);
      
      if (!session) {
        return null;
      }

      return {
        available: session.status === 'scheduled' || session.status === 'waiting',
        status: session.status,
        participants: {
          patientId: session.patientId,
          doctorId: session.doctorId
        },
        scheduledAt: session.scheduledAt,
        startedAt: session.startedAt
      };
    } catch (error) {
      logger.error('Error checking room availability:', undefined, error);
      throw new Error('Failed to check room availability');
    }
  }

  // Statistics
  static async getSystemStatus(includeRoomStats: boolean = false): Promise<any> {
    try {
      // Get basic system status
      const status = {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'connected',
          webrtc: this.io ? 'connected' : 'disconnected'
        }
      };

      if (includeRoomStats) {
        // Add room statistics if requested
        const activeSessionsQuery = query(
          collection(this.db, this.sessionsCollection),
          where('status', '==', 'active')
        );
        const activeSessions = await getDocs(activeSessionsQuery);
        
        (status as any).roomStats = {
          activeRooms: activeSessions.size,
          totalConnections: this.io?.engine?.clientsCount || 0
        };
      }

      return status;
    } catch (error) {
      logger.error('Error getting system status:', undefined, error);
      throw new Error('Failed to get system status');
    }
  }

  static async getUserStats(userId: string, userType: 'patient' | 'doctor', period: string): Promise<any> {
    try {
      // Implementation for user-specific statistics
      const fieldToQuery = userType === 'patient' ? 'patientId' : 'doctorId';
      
      const q = query(
        collection(this.db, this.sessionsCollection),
        where(fieldToQuery, '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => doc.data());

      return {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
        averageDuration: this.calculateAverageDuration(sessions),
        period
      };
    } catch (error) {
      logger.error('Error getting user stats:', undefined, error);
      throw new Error('Failed to get user statistics');
    }
  }

  static async getGlobalStats(period: string): Promise<any> {
    try {
      const q = query(collection(this.db, this.sessionsCollection));
      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => doc.data());

      return {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
        activeSessions: sessions.filter(s => s.status === 'active').length,
        averageDuration: this.calculateAverageDuration(sessions),
        period
      };
    } catch (error) {
      logger.error('Error getting global stats:', undefined, error);
      throw new Error('Failed to get global statistics');
    }
  }

  // Helper methods
  private static convertFirestoreToSession(data: any): TelemedicineSession {
    return {
      id: data.id,
      roomId: data.roomId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      status: data.status,
      scheduledAt: data.scheduledAt?.toDate() || new Date(),
      startedAt: data.startedAt?.toDate(),
      endedAt: data.endedAt?.toDate(),
      duration: data.duration,
      notes: data.notes,
      recordingUrl: data.recordingUrl,
      chatHistory: data.chatHistory || [],
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }

  private static calculateAverageDuration(sessions: any[]): number {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.duration);
    if (completedSessions.length === 0) return 0;
    
    const totalDuration = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    return totalDuration / completedSessions.length;
  }

  // Emergency Sessions
  static async createEmergencySession(data: CreateEmergencySessionData): Promise<TelemedicineSession> {
    try {
      const roomId = `emergency_${uuidv4()}`;
      const session = {
        roomId,
        patientId: data.patientId,
        doctorId: '', // Will be assigned when doctor accepts
        status: data.status,
        emergencyType: data.emergencyType,
        symptoms: data.symptoms,
        vitalSigns: data.vitalSigns,
        location: data.location,
        priority: data.priority,
        scheduledAt: Timestamp.fromDate(data.scheduledAt),
        chatHistory: [],
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, this.emergencySessionsCollection), session);
      const newSession = await getDoc(docRef);
      
      // Convert emergency session to regular session format
      const sessionData = { id: newSession.id, ...newSession.data() };
      return this.convertFirestoreToSession(sessionData);
    } catch (error) {
      logger.error('Error creating emergency session:', undefined, error);
      throw error;
    }
  }

  // Consent Management
  static async createConsent(data: CreateConsentData): Promise<ConsentRecord> {
    try {
      const consent = {
        patientId: data.patientId,
        sessionId: data.sessionId,
        consentType: data.consentType,
        consentText: data.consentText,
        agreed: data.agreed,
        signatureData: data.signatureData,
        witnessInfo: data.witnessInfo,
        createdBy: data.createdBy,
        createdAt: Timestamp.fromDate(data.createdAt)
      };

      const docRef = await addDoc(collection(this.db, this.consentsCollection), consent);
      const newConsent = await getDoc(docRef);
      
      return this.convertFirestoreToConsent({ id: newConsent.id, ...newConsent.data() });
    } catch (error) {
      logger.error('Error creating consent:', undefined, error);
      throw error;
    }
  }

  static async getConsents(filters: {
    patientId: string;
    sessionId?: string;
    consentType?: string;
  }): Promise<ConsentRecord[]> {
    try {
      let q = query(
        collection(this.db, this.consentsCollection),
        where('patientId', '==', filters.patientId),
        orderBy('createdAt', 'desc')
      );

      if (filters.sessionId) {
        q = query(q, where('sessionId', '==', filters.sessionId));
      }

      if (filters.consentType) {
        q = query(q, where('consentType', '==', filters.consentType));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertFirestoreToConsent({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      logger.error('Error getting consents:', undefined, error);
      throw error;
    }
  }

  private static convertFirestoreToConsent(data: any): ConsentRecord {
    return {
      id: data.id,
      patientId: data.patientId,
      sessionId: data.sessionId,
      consentType: data.consentType,
      consentText: data.consentText,
      agreed: data.agreed,
      signatureData: data.signatureData,
      witnessInfo: data.witnessInfo,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date()
    };
  }

  // Cleanup old sessions
  static async cleanupOldSessions(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const q = query(
        collection(this.db, this.sessionsCollection),
        where('status', 'in', ['completed', 'cancelled']),
        where('updatedAt', '<', Timestamp.fromDate(thirtyDaysAgo))
      );

      const querySnapshot = await getDocs(q);
      logger.info(`Cleaning up ${querySnapshot.size} old sessions`);

      // In a real implementation, you might want to archive rather than delete
      // for compliance reasons, especially in medical applications
    } catch (error) {
      logger.error('Error cleaning up old sessions:', undefined, error);
    }
  }
}

export default TelemedicineService;
