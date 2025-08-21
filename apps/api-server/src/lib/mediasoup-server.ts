import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import mediasoup from 'mediasoup';
import { 
  Worker, 
  Router, 
  WebRtcTransport, 
  Producer, 
  Consumer,
  Transport,
  ProducerOptions,
  ConsumerOptions
} from 'mediasoup/node/lib/types';
import { dbConnection } from '@altamedica/database';
import { logPHIAccess, logMedicalAction } from '@/lib/logger';
import { medicalAuditor } from '@/lib/mock-medical';

import { logger } from '@altamedica/shared/services/logger.service';
// Funciones locales para simular consultas de base de datos
async function query(sql: string, params: any[] = []): Promise<any> {
  try {
    const db = await dbConnection.getFirestore();
    // Simular respuesta de base de datos
    return {
      rows: [
        {
          id: Math.floor(Math.random() * 1000) + 1,
          name: 'Usuario Simulado',
          email: 'usuario@altamedica.com',
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ]
    };
  } catch (error) {
    logger.error('Error en consulta simulada:', undefined, error);
    return { rows: [] };
  }
}

async function transaction(callback: (client: any) => Promise<any>): Promise<any> {
  try {
    const db = await dbConnection.getFirestore();
    // Simular transacción
    return await callback(db);
  } catch (error) {
    logger.error('Error en transacción simulada:', undefined, error);
    throw error;
  }
}

interface TeleMedicineSession {
  id: string;
  roomId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  status: 'waiting' | 'connected' | 'recording' | 'ended';
  startTime: Date;
  endTime?: Date;
  recordingPath?: string;
  participants: Map<string, Participant>;
  router: Router;
  worker: Worker;
}

interface Participant {
  id: string;
  socketId: string;
  role: 'doctor' | 'patient' | 'observer';
  name: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  deviceInfo?: any;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'vitals' | 'prescription';
}

interface VitalSigns {
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  temperature: number;
  oxygenSaturation: number;
  timestamp: Date;
}

export class MediasoupTelemedicineServer {
  private io: SocketIOServer;
  private sessions: Map<string, TeleMedicineSession> = new Map();
  private workers: Worker[] = [];
  private currentWorkerIndex = 0;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.initializeWorkers();
    this.setupSocketHandlers();
  }

  private async initializeWorkers() {
    const numWorkers = parseInt(process.env.MEDIASOUP_WORKERS || '2');
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: 10000 + (i * 100),
        rtcMaxPort: 10100 + (i * 100),
      });

      worker.on('died', () => {
        logger.error(`MediaSoup worker ${i} died, exiting...`);
        process.exit(1);
      });

      this.workers.push(worker);
      logger.info(`MediaSoup worker ${i} created`);
    }
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Join Session
      socket.on('join-session', async (data) => {
        try {
          const { sessionId, participantId, role, name, deviceInfo } = data;
          
          // Verificar permisos en la base de datos
          const sessionResult = await query(
            `SELECT ts.*, a.patient_id, a.doctor_id 
             FROM telemedicine_sessions ts
             JOIN appointments a ON ts.appointment_id = a.id
             WHERE ts.room_id = $1`,
            [sessionId]
          );

          if (sessionResult.rows.length === 0) {
            socket.emit('error', { message: 'Sesión no encontrada' });
            return;
          }

          const sessionData = sessionResult.rows[0];
          
          // Verificar que el usuario tiene acceso a esta sesión
          if (role === 'patient' && sessionData.patient_id !== participantId) {
            socket.emit('error', { message: 'Acceso no autorizado' });
            return;
          }
          
          if (role === 'doctor' && sessionData.doctor_id !== participantId) {
            socket.emit('error', { message: 'Acceso no autorizado' });
            return;
          }

          // Obtener o crear sesión
          let session = this.sessions.get(sessionId);
          if (!session) {
            const worker = this.getNextWorker();
            const router = await worker.createRouter({
              mediaCodecs: [
                {
                  kind: 'audio',
                  mimeType: 'audio/opus',
                  clockRate: 48000,
                  channels: 2,
                },
                {
                  kind: 'video',
                  mimeType: 'video/VP8',
                  clockRate: 90000,
                  parameters: {
                    'x-google-start-bitrate': 1000,
                  },
                },
                {
                  kind: 'video',
                  mimeType: 'video/h264',
                  clockRate: 90000,
                  parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '4d0032',
                    'level-asymmetry-allowed': 1,
                  },
                },
              ],
            });

            session = {
              id: sessionId,
              roomId: sessionId,
              appointmentId: sessionData.appointment_id,
              patientId: sessionData.patient_id,
              doctorId: sessionData.doctor_id,
              status: 'waiting',
              startTime: new Date(),
              participants: new Map(),
              router,
              worker
            };

            this.sessions.set(sessionId, session);
          }

          // Crear participante
          const participant: Participant = {
            id: participantId,
            socketId: socket.id,
            role,
            name,
            isVideoEnabled: true,
            isAudioEnabled: true,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map(),
            deviceInfo
          };

          session.participants.set(socket.id, participant);
          socket.join(sessionId);

          // Actualizar estado de la sesión
          if (session.participants.size >= 2) {
            session.status = 'connected';
            
            // Actualizar en base de datos
            await query(
              'UPDATE telemedicine_sessions SET status = $1, actual_start = $2 WHERE room_id = $3',
              ['active', new Date(), sessionId]
            );
          }

          // Enviar capacidades del router
          socket.emit('router-capabilities', session.router.rtpCapabilities);

          // Notificar a otros participantes
          socket.to(sessionId).emit('participant-joined', {
            participantId,
            role,
            name,
            deviceInfo
          });

          // Log de auditoría HIPAA
          await this.logSessionEvent('JOIN_SESSION', participantId, session.patientId, {
            sessionId,
            role,
            deviceInfo
          });

          logger.info(`${role} ${name} joined session ${sessionId}`);
        } catch (error) {
          logger.error('Error joining session:', undefined, error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Create WebRTC Transport
      socket.on('create-transport', async (data) => {
        try {
          const { direction, sessionId } = data;
          const session = this.sessions.get(sessionId);
          const participant = session?.participants.get(socket.id);
          
          if (!session || !participant) {
            socket.emit('error', { message: 'Session or participant not found' });
            return;
          }

          const transport = await session.router.createWebRtcTransport({
            listenIps: [
              {
                ip: process.env.MEDIASOUP_LISTEN_IP || '127.0.0.1',
                announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || null
              }
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate: 1000000,
            minimumAvailableOutgoingBitrate: 600000,
            maxSctpMessageSize: 262144,
            maxIncomingBitrate: 1500000
          });

          participant.transports.set(transport.id, transport);

          transport.on('dtlsstatechange', (dtlsState) => {
            if (dtlsState === 'closed') {
              transport.close();
            }
          });

          transport.on('close', () => {
            participant.transports.delete(transport.id);
          });

          socket.emit('transport-created', {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            sctpParameters: transport.sctpParameters
          });

        } catch (error) {
          logger.error('Error creating transport:', undefined, error);
          socket.emit('error', { message: 'Failed to create transport' });
        }
      });

      // Connect Transport
      socket.on('connect-transport', async (data) => {
        try {
          const { dtlsParameters, sessionId } = data;
          const session = this.sessions.get(sessionId);
          const participant = session?.participants.get(socket.id);
          const transport = participant?.transports.get(data.transportId);
          
          if (!transport) {
            socket.emit('error', { message: 'Transport not found' });
            return;
          }

          await transport.connect({ dtlsParameters });
          socket.emit('transport-connected', { transportId: transport.id });

        } catch (error) {
          logger.error('Error connecting transport:', undefined, error);
          socket.emit('error', { message: 'Failed to connect transport' });
        }
      });

      // Produce Media
      socket.on('produce', async (data) => {
        try {
          const { kind, rtpParameters, sessionId } = data;
          const session = this.sessions.get(sessionId);
          const participant = session?.participants.get(socket.id);
          const transport = participant?.transports.get(data.transportId);
          
          if (!transport) {
            socket.emit('error', { message: 'Transport not found' });
            return;
          }

          const producer = await transport.produce({
            kind,
            rtpParameters,
            appData: { participantId: participant?.id }
          });

          participant?.producers.set(producer.id, producer);

          // Notificar a otros participantes
          socket.to(sessionId).emit('new-producer', {
            producerId: producer.id,
            participantId: participant?.id,
            participantName: participant?.name,
            kind
          });

          socket.emit('produced', { producerId: producer.id });

        } catch (error) {
          logger.error('Error producing media:', undefined, error);
          socket.emit('error', { message: 'Failed to produce media' });
        }
      });

      // Consume Media
      socket.on('consume', async (data) => {
        try {
          const { producerId, rtpCapabilities, sessionId } = data;
          const session = this.sessions.get(sessionId);
          const participant = session?.participants.get(socket.id);
          const transport = participant?.transports.get(data.transportId);
          
          if (!transport) {
            socket.emit('error', { message: 'Transport not found' });
            return;
          }

          const producer = session.router.getProducerById(producerId);
          if (!producer) {
            socket.emit('error', { message: 'Producer not found' });
            return;
          }

          if (!session.router.canConsume({ producerId, rtpCapabilities })) {
            socket.emit('error', { message: 'Cannot consume' });
            return;
          }

          const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
            paused: true,
            appData: { participantId: participant?.id }
          });

          participant?.consumers.set(consumer.id, consumer);

          socket.emit('consumed', {
            consumerId: consumer.id,
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused
          });

        } catch (error) {
          logger.error('Error consuming media:', undefined, error);
          socket.emit('error', { message: 'Failed to consume media' });
        }
      });

      // Resume Consumer
      socket.on('resume-consumer', async (data) => {
        try {
          const { consumerId, sessionId } = data;
          const session = this.sessions.get(sessionId);
          const participant = session?.participants.get(socket.id);
          const consumer = participant?.consumers.get(consumerId);

          if (consumer) {
            await consumer.resume();
            socket.emit('consumer-resumed', { consumerId });
          }

        } catch (error) {
          logger.error('Error resuming consumer:', undefined, error);
        }
      });

      // Chat Messages
      socket.on('chat-message', async (data) => {
        try {
          const { sessionId, message, type = 'text' } = data;
          const session = this.sessions.get(sessionId);
          const participant = session?.participants.get(socket.id);

          if (!participant) return;

          const chatMessage: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            sessionId,
            senderId: participant.id,
            senderName: participant.name,
            message,
            timestamp: new Date(),
            type
          };

          // Guardar en base de datos
          await query(
            `INSERT INTO telemedicine_chat_messages (
              session_id, sender_id, sender_name, message, message_type, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              sessionId,
              participant.id,
              participant.name,
              message,
              type,
              chatMessage.timestamp
            ]
          );

          // Enviar a todos los participantes
          this.io.to(sessionId).emit('chat-message', chatMessage);

          // Log de auditoría HIPAA
          await this.logSessionEvent('CHAT_MESSAGE', participant.id, session?.patientId || '', {
            sessionId,
            messageType: type,
            messageLength: message.length
          });

        } catch (error) {
          logger.error('Error sending chat message:', undefined, error);
        }
      });

      // Share Vitals
      socket.on('share-vitals', async (data) => {
        try {
          const { sessionId, vitals } = data;
          const session = this.sessions.get(sessionId);
          const participant = session?.participants.get(socket.id);

          if (!participant || participant.role !== 'patient') return;

          // Guardar en base de datos
          await query(
            `INSERT INTO patient_vitals (
              patient_id, session_id, heart_rate, blood_pressure_systolic,
              blood_pressure_diastolic, temperature, oxygen_saturation, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              participant.id,
              sessionId,
              vitals.heartRate,
              vitals.bloodPressure.systolic,
              vitals.bloodPressure.diastolic,
              vitals.temperature,
              vitals.oxygenSaturation,
              vitals.timestamp
            ]
          );

          // Enviar a todos los participantes
          this.io.to(sessionId).emit('vitals-shared', {
            patientId: participant.id,
            patientName: participant.name,
            vitals,
            timestamp: new Date()
          });

          // Log de auditoría HIPAA
          await this.logSessionEvent('SHARE_VITALS', participant.id, session?.patientId || '', {
            sessionId,
            vitalsData: vitals
          });

        } catch (error) {
          logger.error('Error sharing vitals:', undefined, error);
        }
      });

      // Toggle Media
      socket.on('toggle-media', async (data) => {
        try {
          const { type, enabled, sessionId } = data;
          const session = this.sessions.get(sessionId);
          const participant = session?.participants.get(socket.id);

          if (participant) {
            if (type === 'video') {
              participant.isVideoEnabled = enabled;
            } else if (type === 'audio') {
              participant.isAudioEnabled = enabled;
            }

            socket.to(sessionId).emit('participant-media-changed', {
              participantId: participant.id,
              type,
              enabled
            });
          }

        } catch (error) {
          logger.error('Error toggling media:', undefined, error);
        }
      });

      // End Session
      socket.on('end-session', async (data) => {
        try {
          const { sessionId } = data;
          const session = this.sessions.get(sessionId);

          if (session) {
            session.status = 'ended';
            session.endTime = new Date();

            // Limpiar recursos
            for (const participant of session.participants.values()) {
              participant.producers.forEach(producer => producer.close());
              participant.consumers.forEach(consumer => consumer.close());
              participant.transports.forEach(transport => transport.close());
            }

            // Cerrar router y worker
            session.router.close();
            session.worker.close();

            // Actualizar en base de datos
            await query(
              'UPDATE telemedicine_sessions SET status = $1, actual_end = $2 WHERE room_id = $3',
              ['ended', session.endTime, sessionId]
            );

            // Notificar a todos los participantes
            this.io.to(sessionId).emit('session-ended', {
              sessionId,
              endTime: session.endTime,
              duration: session.endTime.getTime() - session.startTime.getTime()
            });

            // Log de auditoría HIPAA
            await this.logSessionEvent('END_SESSION', 'system', session.patientId, {
              sessionId,
              duration: session.endTime.getTime() - session.startTime.getTime()
            });

            // Limpiar sesión
            this.sessions.delete(sessionId);
          }

        } catch (error) {
          logger.error('Error ending session:', undefined, error);
        }
      });

      // Disconnect
      socket.on('disconnect', async () => {
        logger.info(`User disconnected: ${socket.id}`);
        
        // Encontrar y limpiar participante
        for (const [sessionId, session] of this.sessions) {
          const participant = session.participants.get(socket.id);
          if (participant) {
            // Limpiar recursos del participante
            participant.producers.forEach(producer => producer.close());
            participant.consumers.forEach(consumer => consumer.close());
            participant.transports.forEach(transport => transport.close());

            // Notificar a otros participantes
            socket.to(sessionId).emit('participant-disconnected', {
              participantId: participant.id,
              participantName: participant.name
            });

            session.participants.delete(socket.id);

            // Si no quedan participantes, cerrar sesión
            if (session.participants.size === 0) {
              session.status = 'ended';
              session.endTime = new Date();
              
              await query(
                'UPDATE telemedicine_sessions SET status = $1, actual_end = $2 WHERE room_id = $3',
                ['ended', session.endTime, sessionId]
              );

              session.router.close();
              session.worker.close();
              this.sessions.delete(sessionId);
            }

            break;
          }
        }
      });
    });
  }

  private async logSessionEvent(action: string, userId: string, patientId: string, details: any) {
    try {
      // Log de acceso a PHI
      logPHIAccess({
        userId,
        patientId,
        action,
        resource: 'telemedicine_session',
        ipAddress: 'websocket',
        userAgent: 'mediasoup-server',
        reason: 'telemedicine_session_activity'
      });

      // Log médico general
      logMedicalAction({
        timestamp: new Date().toISOString(),
        userId,
        action,
        resource: `/telemedicine/session/${details.sessionId}`,
        ipAddress: 'websocket',
        userAgent: 'mediasoup-server',
        success: true,
        metadata: details
      });

      // Auditoría médica
      medicalAuditor.recordAuditEvent({
        userId,
        action,
        resourceType: 'telemedicine_session',
        resourceId: patientId,
        details,
        ipAddress: 'websocket',
        userAgent: 'mediasoup-server',
        success: true
      });
    } catch (error) {
      logger.error('Error en logging de sesión:', undefined, error);
    }
  }

  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  public getSessionInfo(sessionId: string): TeleMedicineSession | undefined {
    return this.sessions.get(sessionId);
  }
} 