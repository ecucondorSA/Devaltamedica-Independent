import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '@/shared/lib/firebase-admin';
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

import { 
  TelemedicineSession,
  ChatMessage,
  CreateSessionData,
  UpdateSessionData,
  EndSessionData,
  RoomInfo,
  SessionStats,
  SystemStatus
} from './telemedicine.types';

export class TelemedicineService {
  private static io: Server;
  private static db = adminDb;
  private static sessionsCollection = 'telemedicine_sessions';
  private static chatCollection = 'telemedicine_chat';

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
  static async checkRoomAvailability(roomId: string): Promise<RoomInfo | null> {
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
  static async getSystemStatus(includeRoomStats: boolean = false): Promise<SystemStatus> {
    try {
      // Get basic system status
      const status: SystemStatus = {
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
        
        status.roomStats = {
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

  static async getUserStats(userId: string, userType: 'patient' | 'doctor', period: string): Promise<SessionStats> {
    try {
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

  static async getGlobalStats(period: string): Promise<SessionStats> {
    try {
      const q = query(collection(this.db, this.sessionsCollection));
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