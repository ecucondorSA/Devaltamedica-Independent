import { NextRequest, NextResponse } from 'next/server';
import { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { MediaServer } from 'mediasoup';
import { Worker, Router, Transport, Producer, Consumer } from 'mediasoup/node/lib/types';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Firebase imports
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
import { getFirestoreInstance } from '../lib/firebase-admin';

// Prisma imports
import prisma from '../lib/prisma';
import { TelemedicineStatus, SenderType } from '@prisma/client';

// Crypto service for PHI encryption
import { cryptoService } from '@altamedica/core/services/crypto';

import { logger } from '@altamedica/shared/services/logger.service';
// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface Room {
  id: string;
  router: Router;
  peers: Map<string, Peer>;
  createdAt: Date;
}

interface Peer {
  id: string;
  socket: any;
  transports: Map<string, Transport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  rtpCapabilities?: any;
}

interface TelemedicineSession {
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
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  message: string;
  timestamp: Date;
}

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    patientId?: string;
    doctorId?: string;
    status: string;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createSessionSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  roomId: z.string().optional()
});

const updateSessionSchema = z.object({
  status: z.nativeEnum(TelemedicineStatus).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  recordingUrl: z.string().url().optional()
});

const chatMessageSchema = z.object({
  senderId: z.string().min(1),
  senderType: z.nativeEnum(SenderType),
  message: z.string().min(1).max(1000)
});

const statsFilterSchema = z.object({
  userId: z.string().optional(),
  userType: z.enum(['patient', 'doctor']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const logError = (message: string, error: any) => {
  const sanitizedMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error(`${message}: ${sanitizedMessage}`);
};

const decryptSessionData = (sessionData: any) => {
  if (!sessionData) return null;
  const decrypted = { ...sessionData };
  if (decrypted.patientId) decrypted.patientId = cryptoService.decrypt(decrypted.patientId);
  if (decrypted.doctorId) decrypted.doctorId = cryptoService.decrypt(decrypted.doctorId);
  if (decrypted.notes) decrypted.notes = cryptoService.decrypt(decrypted.notes);
  if (decrypted.recordingUrl) decrypted.recordingUrl = cryptoService.decrypt(decrypted.recordingUrl);
  
  // Convert Timestamps to Dates
  if (decrypted.scheduledAt?.toDate) decrypted.scheduledAt = decrypted.scheduledAt.toDate();
  if (decrypted.startedAt?.toDate) decrypted.startedAt = decrypted.startedAt.toDate();
  if (decrypted.endedAt?.toDate) decrypted.endedAt = decrypted.endedAt.toDate();
  return decrypted;
};

// ============================================================================
// WEBRTC SERVER CLASS
// ============================================================================

export class WebRTCServer {
  private app: any;
  private server: any;
  private io: SocketIOServer;
  private mediaServer: MediaServer;
  private workers: Worker[] = [];
  public rooms: Map<string, Room> = new Map();
  private nextWorkerIndex = 0;

  constructor() {
    this.setupMediaServer();
  }

  private async setupMediaServer() {
    try {
      this.mediaServer = new MediaServer({
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
      });

      const numWorkers = Math.max(1, require('os').cpus().length);
      
      for (let i = 0; i < numWorkers; i++) {
        const worker = await this.mediaServer.createWorker({
          logLevel: 'warn',
          logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
          rtcMinPort: 10000,
          rtcMaxPort: 10100
        });

        worker.on('died', () => {
          logger.error('MediaSoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
          setTimeout(() => process.exit(1), 2000);
        });

        this.workers.push(worker);
        logger.info(`MediaSoup worker created [pid:${worker.pid}]`);
      }

      logger.info(`WebRTC server initialized with ${this.workers.length} workers`);
    } catch (error) {
      logger.error('Failed to initialize MediaServer:', undefined, error);
      throw error;
    }
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  public async createRoom(roomId: string): Promise<Room> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const worker = this.getNextWorker();
    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1
          }
        }
      ]
    });

    const room: Room = {
      id: roomId,
      router,
      peers: new Map(),
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);
    logger.info(`Room created: ${roomId}`);
    return room;
  }

  public closeRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.peers.forEach(peer => {
        peer.socket?.disconnect();
      });
      room.router.close();
      this.rooms.delete(roomId);
      logger.info(`Room closed: ${roomId}`);
    }
  }

  public setupSocketIO(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join-room', async (data: { roomId: string; rtpCapabilities?: any }) => {
        try {
          let room = this.rooms.get(data.roomId);
          
          if (!room) {
            room = await this.createRoom(data.roomId);
          }

          const peer: Peer = {
            id: socket.id,
            socket,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map(),
            rtpCapabilities: data.rtpCapabilities
          };

          room.peers.set(socket.id, peer);
          socket.to(data.roomId).emit('peer-joined', { peerId: socket.id });
          socket.emit('room-joined', {
            roomId: data.roomId,
            peers: Array.from(room.peers.keys()).filter(id => id !== socket.id)
          });

          logger.info(`Peer ${socket.id} joined room ${data.roomId}`);
        } catch (error) {
          logger.error('Error joining room:', undefined, error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        this.rooms.forEach((room, roomId) => {
          const peer = room.peers.get(socket.id);
          if (peer) {
            peer.transports.forEach(transport => transport.close());
            room.peers.delete(socket.id);
            socket.to(roomId).emit('peer-left', { peerId: socket.id });
            
            if (room.peers.size === 0) {
              this.closeRoom(roomId);
            }
          }
        });
      });
    });

    // Simple signaling namespace for compatibility
    const simpleNs = this.io.of('/simple');
    simpleNs.on('connection', (socket) => {
      logger.info(`[simple] client connected: ${socket.id}`);

      socket.on('join-room', (data: { roomId: string; userId?: string; userType?: string }) => {
        try {
          const { roomId, userId, userType } = data;
          socket.join(roomId);
          socket.to(roomId).emit('user-joined', {
            userId: userId || socket.id,
            userType: userType || 'unknown'
          });
          socket.emit('room-joined', { roomId });
          logger.info(`[simple] ${socket.id} joined room ${roomId} (${userType || 'unknown'})`);
        } catch (err) {
          logger.error('[simple] join-room error:', err);
          socket.emit('error', { message: 'Failed to join simple room' });
        }
      });

      socket.on('offer', (data: { roomId: string; offer: any }) => {
        const { roomId, offer } = data;
        socket.to(roomId).emit('offer', { offer });
      });

      socket.on('answer', (data: { roomId: string; answer: any }) => {
        const { roomId, answer } = data;
        socket.to(roomId).emit('answer', { answer });
      });

      socket.on('ice-candidate', (data: { roomId: string; candidate: any }) => {
        const { roomId, candidate } = data;
        socket.to(roomId).emit('ice-candidate', { candidate });
      });

      socket.on('disconnect', () => {
        logger.info(`[simple] client disconnected: ${socket.id}`);
      });
    });
  }
}

// ============================================================================
// TELEMEDICINE SERVICE CLASS (HYBRID FIREBASE/PRISMA)
// ============================================================================

export class TelemedicineService {
  private useFirebase: boolean = true;
  private db: any;
  private sessionsCollection = 'telemedicine_sessions';

  constructor() {
    this.db = getFirestoreInstance();
    this.useFirebase = !!this.db;
    
    if (!this.useFirebase) {
      logger.warn('Firebase not available. Using Prisma database.');
    }
  }

  async createSession(data: {
    patientId: string;
    doctorId: string;
    scheduledAt: Date;
    roomId?: string;
  }) {
    const sessionId = uuidv4();
    const roomId = data.roomId || uuidv4();

    if (this.useFirebase) {
      // Firebase implementation with PHI encryption
      const encryptedPatientId = cryptoService.encrypt(data.patientId);
      const encryptedDoctorId = cryptoService.encrypt(data.doctorId);

      const sessionData = {
        id: sessionId,
        roomId,
        patientId: encryptedPatientId,
        doctorId: encryptedDoctorId,
        status: 'scheduled',
        scheduledAt: Timestamp.fromDate(data.scheduledAt),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, this.sessionsCollection), sessionData);
      return { id: docRef.id, roomId, ...data };
    } else {
      // Prisma implementation
      const session = await prisma.telemedicineSession.create({
        data: {
          id: sessionId,
          roomId,
          patientId: data.patientId,
          doctorId: data.doctorId,
          status: TelemedicineStatus.SCHEDULED,
          scheduledAt: data.scheduledAt
        }
      });
      return session;
    }
  }

  async getSessionById(sessionId: string) {
    if (this.useFirebase) {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...decryptSessionData(docSnap.data()) };
    } else {
      return await prisma.telemedicineSession.findUnique({
        where: { id: sessionId },
        include: {
          patient: true,
          doctor: true,
          chatMessages: true
        }
      });
    }
  }

  async getSessionsByUser(userId: string, userType: 'patient' | 'doctor', limitCount: number = 50, offset: number = 0) {
    if (this.useFirebase) {
      const encryptedUserId = cryptoService.encrypt(userId);
      const fieldToQuery = userType === 'patient' ? 'patientId' : 'doctorId';

      const q = query(
        collection(this.db, this.sessionsCollection),
        where(fieldToQuery, '==', encryptedUserId),
        orderBy('scheduledAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...decryptSessionData(d.data()) }));
    } else {
      const whereClause = userType === 'patient' 
        ? { patientId: userId }
        : { doctorId: userId };

      return await prisma.telemedicineSession.findMany({
        where: whereClause,
        orderBy: { scheduledAt: 'desc' },
        take: limitCount,
        skip: offset,
        include: {
          patient: true,
          doctor: true
        }
      });
    }
  }

  async startSession(sessionId: string) {
    const startTime = new Date();

    if (this.useFirebase) {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      await updateDoc(docRef, {
        status: 'active',
        startedAt: Timestamp.fromDate(startTime),
        updatedAt: serverTimestamp()
      });

      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...decryptSessionData(updatedDoc.data()) };
    } else {
      return await prisma.telemedicineSession.update({
        where: { id: sessionId },
        data: {
          status: TelemedicineStatus.ACTIVE,
          startedAt: startTime
        }
      });
    }
  }

  async endSession(sessionId: string, notes?: string, recordingUrl?: string) {
    const endTime = new Date();

    if (this.useFirebase) {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) throw new Error('Session not found');

      const sessionData = docSnap.data();
      let duration = 0;
      if (sessionData.startedAt) {
        duration = endTime.getTime() - sessionData.startedAt.toDate().getTime();
      }

      const updateData: any = {
        status: 'completed',
        endedAt: Timestamp.fromDate(endTime),
        duration,
        updatedAt: serverTimestamp()
      };
      
      if (notes) updateData.notes = cryptoService.encrypt(notes);
      if (recordingUrl) updateData.recordingUrl = cryptoService.encrypt(recordingUrl);

      await updateDoc(docRef, updateData);
      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...decryptSessionData(updatedDoc.data()) };
    } else {
      return await prisma.telemedicineSession.update({
        where: { id: sessionId },
        data: {
          status: TelemedicineStatus.COMPLETED,
          endedAt: endTime,
          notes,
          recordingUrl
        }
      });
    }
  }

  async cancelSession(sessionId: string, reason?: string) {
    if (this.useFirebase) {
      const docRef = doc(this.db, this.sessionsCollection, sessionId);
      await updateDoc(docRef, {
        status: 'cancelled',
        cancelReason: reason || '',
        updatedAt: serverTimestamp()
      });

      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...decryptSessionData(updatedDoc.data()) };
    } else {
      return await prisma.telemedicineSession.update({
        where: { id: sessionId },
        data: {
          status: TelemedicineStatus.CANCELLED,
          notes: reason
        }
      });
    }
  }

  async addChatMessage(data: {
    sessionId: string;
    senderId: string;
    senderType: SenderType;
    message: string;
  }) {
    if (this.useFirebase) {
      // For Firebase, we would store chat in a subcollection
      const chatRef = collection(this.db, `${this.sessionsCollection}/${data.sessionId}/chat`);
      const messageData = {
        senderId: cryptoService.encrypt(data.senderId),
        senderType: data.senderType,
        message: cryptoService.encrypt(data.message),
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(chatRef, messageData);
      return { id: docRef.id, ...data, timestamp: new Date() };
    } else {
      return await prisma.chatMessage.create({
        data: {
          sessionId: data.sessionId,
          senderId: data.senderId,
          senderType: data.senderType,
          message: data.message
        }
      });
    }
  }

  async getChatHistory(sessionId: string) {
    if (this.useFirebase) {
      const chatRef = collection(this.db, `${this.sessionsCollection}/${sessionId}/chat`);
      const q = query(chatRef, orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: cryptoService.decrypt(data.senderId),
          senderType: data.senderType,
          message: cryptoService.decrypt(data.message),
          timestamp: data.timestamp?.toDate() || new Date()
        };
      });
    } else {
      return await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' }
      });
    }
  }

  async getActiveSessions() {
    if (this.useFirebase) {
      const q = query(
        collection(this.db, this.sessionsCollection),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...decryptSessionData(d.data()) }));
    } else {
      return await prisma.telemedicineSession.findMany({
        where: { status: TelemedicineStatus.ACTIVE },
        include: {
          patient: true,
          doctor: true
        }
      });
    }
  }

  async checkRoomAvailability(roomId: string) {
    if (this.useFirebase) {
      const q = query(
        collection(this.db, this.sessionsCollection),
        where('roomId', '==', roomId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { exists: false };
      }

      const sessionDoc = querySnapshot.docs[0];
      const sessionData = decryptSessionData(sessionDoc.data());
      
      return {
        exists: true,
        session: { id: sessionDoc.id, ...sessionData },
        available: sessionData.status === 'scheduled' || sessionData.status === 'waiting'
      };
    } else {
      const session = await prisma.telemedicineSession.findFirst({
        where: { roomId },
        include: {
          patient: true,
          doctor: true
        }
      });

      if (!session) {
        return { exists: false };
      }

      return {
        exists: true,
        session,
        available: session.status === TelemedicineStatus.SCHEDULED || session.status === TelemedicineStatus.WAITING
      };
    }
  }

  async getTelemedicineStats(filter: {
    userId?: string;
    userType?: 'patient' | 'doctor';
    startDate?: Date;
    endDate?: Date;
  }) {
    // Implementation would vary between Firebase and Prisma
    // This is a simplified version
    if (this.useFirebase) {
      // Firebase aggregation would be more complex
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalDuration: 0,
        averageDuration: 0
      };
    } else {
      const whereClause: any = {};
      
      if (filter.userId && filter.userType) {
        if (filter.userType === 'patient') {
          whereClause.patientId = filter.userId;
        } else {
          whereClause.doctorId = filter.userId;
        }
      }

      if (filter.startDate) {
        whereClause.scheduledAt = { gte: filter.startDate };
      }
      
      if (filter.endDate) {
        if (whereClause.scheduledAt) {
          whereClause.scheduledAt.lte = filter.endDate;
        } else {
          whereClause.scheduledAt = { lte: filter.endDate };
        }
      }

      const sessions = await prisma.telemedicineSession.findMany({
        where: whereClause
      });

      const completedSessions = sessions.filter(s => s.status === TelemedicineStatus.COMPLETED);
      
      return {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        totalDuration: completedSessions.reduce((acc, s) => acc + (s.duration || 0), 0),
        averageDuration: completedSessions.length > 0 
          ? completedSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / completedSessions.length 
          : 0
      };
    }
  }

  async cleanupOldSessions(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    if (this.useFirebase) {
      // Firebase cleanup would require batch operations
      return 0;
    } else {
      const result = await prisma.telemedicineSession.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          status: {
            in: [TelemedicineStatus.COMPLETED, TelemedicineStatus.CANCELLED]
          }
        }
      });
      return result.count;
    }
  }
}

// ============================================================================
// UNIFIED CONTROLLER CLASS
// ============================================================================

export class UnifiedTelemedicineController {
  private telemedicineService: TelemedicineService;
  private webrtcServer: WebRTCServer;

  constructor(webrtcServer?: WebRTCServer) {
    this.telemedicineService = new TelemedicineService();
    this.webrtcServer = webrtcServer || new WebRTCServer();
  }

  // Express-style handlers for backward compatibility
  async createSessionExpress(req: Request, res: Response) {
    try {
      const { patientId, doctorId, scheduledAt } = req.body;
      if (!patientId || !doctorId || !scheduledAt) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const roomId = uuidv4();
      const session = await this.telemedicineService.createSession({
        patientId,
        doctorId,
        scheduledAt: new Date(scheduledAt),
        roomId
      });

      // Create WebRTC room
      try {
        await this.webrtcServer.createRoom(roomId);
      } catch (webrtcError) {
        logger.error('Error creating WebRTC room:', webrtcError);
      }

      res.status(201).json({
        sessionId: session.id,
        roomId,
        message: 'Telemedicine session created successfully'
      });
    } catch (error) {
      logError('Error creating telemedicine session', error);
      res.status(500).json({ error: 'Failed to create telemedicine session' });
    }
  }

  async getSessionExpress(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await this.telemedicineService.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      logError('Error getting session', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  }

  // Next.js-style handlers
  async createSession(req: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const validation = createSessionSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Datos de entrada inválidos',
            details: validation.error.errors
          },
          { status: 400 }
        );
      }

      const { patientId, doctorId, scheduledAt, roomId } = validation.data;

      // Authorization check
      const user = req.user!;
      const canCreate = user.roles.includes('admin') ||
                       user.doctorId === doctorId ||
                       user.patientId === patientId;

      if (!canCreate) {
        return NextResponse.json(
          { error: 'No tienes permisos para crear esta sesión' },
          { status: 403 }
        );
      }

      const session = await this.telemedicineService.createSession({
        patientId,
        doctorId,
        scheduledAt: new Date(scheduledAt),
        roomId
      });

      // Create WebRTC room
      try {
        await this.webrtcServer.createRoom(session.roomId);
      } catch (webrtcError) {
        logger.error('Error creating WebRTC room:', webrtcError);
      }

      return NextResponse.json({
        sessionId: session.id,
        roomId: session.roomId,
        message: 'Sesión de telemedicina creada exitosamente',
        session
      }, { status: 201 });

    } catch (error) {
      logger.error('Error creating telemedicine session:', undefined, error);
      return NextResponse.json(
        { error: 'Error interno del servidor al crear la sesión' },
        { status: 500 }
      );
    }
  }

  async getSession(req: AuthenticatedRequest, sessionId: string): Promise<NextResponse> {
    try {
      const session = await this.telemedicineService.getSessionById(sessionId);

      if (!session) {
        return NextResponse.json(
          { error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      // Authorization check
      const user = req.user!;
      const hasAccess = user.roles.includes('admin') ||
                       user.patientId === session.patientId ||
                       user.doctorId === session.doctorId;

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver esta sesión' },
          { status: 403 }
        );
      }

      return NextResponse.json(session);

    } catch (error) {
      logger.error('Error getting session:', undefined, error);
      return NextResponse.json(
        { error: 'Error interno del servidor al obtener la sesión' },
        { status: 500 }
      );
    }
  }

  async startSession(req: AuthenticatedRequest, sessionId: string): Promise<NextResponse> {
    try {
      const session = await this.telemedicineService.getSessionById(sessionId);

      if (!session) {
        return NextResponse.json(
          { error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      // Verify session can be started
      if (session.status !== 'scheduled' && session.status !== 'waiting') {
        return NextResponse.json(
          { error: 'La sesión no puede iniciarse en su estado actual' },
          { status: 400 }
        );
      }

      // Authorization check
      const user = req.user!;
      const canStart = user.roles.includes('admin') ||
                      user.doctorId === session.doctorId;

      if (!canStart) {
        return NextResponse.json(
          { error: 'Solo el médico asignado puede iniciar la sesión' },
          { status: 403 }
        );
      }

      const updatedSession = await this.telemedicineService.startSession(sessionId);

      return NextResponse.json({
        message: 'Sesión iniciada exitosamente',
        session: updatedSession
      });

    } catch (error) {
      logger.error('Error starting session:', undefined, error);
      return NextResponse.json(
        { error: 'Error interno del servidor al iniciar la sesión' },
        { status: 500 }
      );
    }
  }

  async endSession(req: AuthenticatedRequest, sessionId: string): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { notes, recordingUrl } = body;

      const session = await this.telemedicineService.getSessionById(sessionId);

      if (!session) {
        return NextResponse.json(
          { error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      if (session.status !== 'active') {
        return NextResponse.json(
          { error: 'La sesión no está activa' },
          { status: 400 }
        );
      }

      // Authorization check
      const user = req.user!;
      const canEnd = user.roles.includes('admin') ||
                    user.doctorId === session.doctorId;

      if (!canEnd) {
        return NextResponse.json(
          { error: 'Solo el médico asignado puede finalizar la sesión' },
          { status: 403 }
        );
      }

      const updatedSession = await this.telemedicineService.endSession(
        sessionId,
        notes,
        recordingUrl
      );

      return NextResponse.json({
        message: 'Sesión finalizada exitosamente',
        session: updatedSession
      });

    } catch (error) {
      logger.error('Error ending session:', undefined, error);
      return NextResponse.json(
        { error: 'Error interno del servidor al finalizar la sesión' },
        { status: 500 }
      );
    }
  }

  // Additional methods for chat, stats, room availability, etc.
  async addChatMessage(req: AuthenticatedRequest, sessionId: string): Promise<NextResponse> {
    try {
      const body = await req.json();
      const validation = chatMessageSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Datos de mensaje inválidos',
            details: validation.error.errors
          },
          { status: 400 }
        );
      }

      const { senderId, senderType, message } = validation.data;

      const session = await this.telemedicineService.getSessionById(sessionId);

      if (!session) {
        return NextResponse.json(
          { error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      // Authorization check
      const user = req.user!;
      const isParticipant = user.patientId === session.patientId ||
                           user.doctorId === session.doctorId;

      if (!isParticipant && !user.roles.includes('admin')) {
        return NextResponse.json(
          { error: 'No tienes permisos para enviar mensajes en esta sesión' },
          { status: 403 }
        );
      }

      const chatMessage = await this.telemedicineService.addChatMessage({
        sessionId,
        senderId,
        senderType,
        message
      });

      return NextResponse.json({
        message: 'Mensaje enviado exitosamente',
        chatMessage
      }, { status: 201 });

    } catch (error) {
      logger.error('Error adding chat message:', undefined, error);
      return NextResponse.json(
        { error: 'Error interno del servidor al enviar el mensaje' },
        { status: 500 }
      );
    }
  }

  // Expose WebRTC server for external use
  getWebRTCServer() {
    return this.webrtcServer;
  }

  // Health check endpoint
  async healthCheck(): Promise<NextResponse> {
    return NextResponse.json({
      status: 'healthy',
      webrtcRooms: this.webrtcServer.rooms.size,
      timestamp: new Date().toISOString()
    });
  }
}

export default UnifiedTelemedicineController;