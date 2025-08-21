import * as mediasoup from 'mediasoup';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

import { logger } from '@altamedica/shared/services/logger.service';
interface MediaSoupConfig {
  worker: {
    rtcMinPort: number;
    rtcMaxPort: number;
    logLevel: 'warn' | 'debug' | 'error' | 'info';
    logTags: string[];
  };
  router: {
    mediaCodecs: mediasoup.types.RtpCodecCapability[];
  };
  webRtcTransport: {
    listenIps: mediasoup.types.TransportListenIp[];
    initialAvailableOutgoingBitrate: number;
    minimumAvailableOutgoingBitrate: number;
    maxSctpMessageSize: number;
    maxIncomingBitrate: number;
  };
}

interface Room {
  id: string;
  router: mediasoup.types.Router;
  peers: Map<string, Peer>;
  producerTransports: Map<string, mediasoup.types.WebRtcTransport>;
  consumerTransports: Map<string, mediasoup.types.WebRtcTransport>;
  producers: Map<string, mediasoup.types.Producer>;
  consumers: Map<string, mediasoup.types.Consumer>;
  dataProducers: Map<string, mediasoup.types.DataProducer>;
  dataConsumers: Map<string, mediasoup.types.DataConsumer>;
}

interface Peer {
  id: string;
  socketId: string;
  rtpCapabilities?: mediasoup.types.RtpCapabilities;
  sctpCapabilities?: mediasoup.types.SctpCapabilities;
  transports: Map<string, mediasoup.types.WebRtcTransport>;
  producers: Map<string, mediasoup.types.Producer>;
  consumers: Map<string, mediasoup.types.Consumer>;
  dataProducers: Map<string, mediasoup.types.DataProducer>;
  dataConsumers: Map<string, mediasoup.types.DataConsumer>;
  device?: mediasoup.types.Device;
}

export class MediaSoupServer {
  private workers: mediasoup.types.Worker[] = [];
  private rooms: Map<string, Room> = new Map();
  private nextWorkerIndex = 0;
  private io: SocketIOServer;

  // Configuración optimizada para telemedicina
  private config: MediaSoupConfig = {
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'warn',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
    },
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
          parameters: {
            minptime: 10,
            useinbandfec: 1
          }
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
            'x-google-min-bitrate': 500,
            'x-google-max-bitrate': 3000
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
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000,
          parameters: {
            'profile-id': 0
          }
        }
      ]
    },
    webRtcTransport: {
      listenIps: [
        {
          ip: process.env.MEDIASOUP_LISTEN_IP || '127.0.0.1',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1'
        }
      ],
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      maxIncomingBitrate: 1500000
    }
  };

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.initialize();
  }

  private async initialize() {
    try {
      // Crear workers de MediaSoup
      await this.createWorkers();
      
      // Configurar eventos de Socket.IO
      this.setupSocketHandlers();
      
      logger.info('✅ MediaSoup Server inicializado correctamente');
    } catch (error) {
      logger.error('❌ Error al inicializar MediaSoup Server:', undefined, error);
    }
  }

  private async createWorkers() {
    const numWorkers = parseInt(process.env.MEDIASOUP_NUM_WORKERS || '4');
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: this.config.worker.logLevel,
        logTags: this.config.worker.logTags,
        rtcMinPort: this.config.worker.rtcMinPort,
        rtcMaxPort: this.config.worker.rtcMaxPort
      });

      worker.on('died', () => {
        logger.error('MediaSoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
      logger.info(`✅ Worker ${i + 1} creado (PID: ${worker.pid})`);
    }
  }

  private getWorker(): mediasoup.types.Worker {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`🔌 Cliente conectado: ${socket.id}`);

      // Crear o unirse a una sala
      socket.on('join-room', async (data: { roomId: string; rtpCapabilities?: mediasoup.types.RtpCapabilities }) => {
        try {
          await this.handleJoinRoom(socket, data);
        } catch (error) {
          logger.error('Error en join-room:', undefined, error);
          socket.emit('error', { message: 'Error al unirse a la sala' });
        }
      });

      // Crear transporte de producción
      socket.on('create-producer-transport', async (data: { roomId: string }) => {
        try {
          await this.handleCreateProducerTransport(socket, data);
        } catch (error) {
          logger.error('Error en create-producer-transport:', undefined, error);
          socket.emit('error', { message: 'Error al crear transporte de producción' });
        }
      });

      // Conectar transporte de producción
      socket.on('connect-producer-transport', async (data: { transportId: string; dtlsParameters: mediasoup.types.DtlsParameters }) => {
        try {
          await this.handleConnectProducerTransport(socket, data);
        } catch (error) {
          logger.error('Error en connect-producer-transport:', undefined, error);
          socket.emit('error', { message: 'Error al conectar transporte de producción' });
        }
      });

      // Producir
      socket.on('produce', async (data: { transportId: string; kind: mediasoup.types.MediaKind; rtpParameters: mediasoup.types.RtpParameters; appData?: any }) => {
        try {
          await this.handleProduce(socket, data);
        } catch (error) {
          logger.error('Error en produce:', undefined, error);
          socket.emit('error', { message: 'Error al producir stream' });
        }
      });

      // Crear transporte de consumo
      socket.on('create-consumer-transport', async (data: { roomId: string }) => {
        try {
          await this.handleCreateConsumerTransport(socket, data);
        } catch (error) {
          logger.error('Error en create-consumer-transport:', undefined, error);
          socket.emit('error', { message: 'Error al crear transporte de consumo' });
        }
      });

      // Conectar transporte de consumo
      socket.on('connect-consumer-transport', async (data: { transportId: string; dtlsParameters: mediasoup.types.DtlsParameters }) => {
        try {
          await this.handleConnectConsumerTransport(socket, data);
        } catch (error) {
          logger.error('Error en connect-consumer-transport:', undefined, error);
          socket.emit('error', { message: 'Error al conectar transporte de consumo' });
        }
      });

      // Consumir
      socket.on('consume', async (data: { transportId: string; producerId: string; rtpCapabilities: mediasoup.types.RtpCapabilities }) => {
        try {
          await this.handleConsume(socket, data);
        } catch (error) {
          logger.error('Error en consume:', undefined, error);
          socket.emit('error', { message: 'Error al consumir stream' });
        }
      });

      // Pausar/Reanudar productor
      socket.on('pause-producer', async (data: { producerId: string }) => {
        try {
          await this.handlePauseProducer(socket, data);
        } catch (error) {
          logger.error('Error en pause-producer:', undefined, error);
        }
      });

      socket.on('resume-producer', async (data: { producerId: string }) => {
        try {
          await this.handleResumeProducer(socket, data);
        } catch (error) {
          logger.error('Error en resume-producer:', undefined, error);
        }
      });

      // Cerrar transporte
      socket.on('close-transport', async (data: { transportId: string }) => {
        try {
          await this.handleCloseTransport(socket, data);
        } catch (error) {
          logger.error('Error en close-transport:', undefined, error);
        }
      });

      // Desconexión
      socket.on('disconnect', () => {
        logger.info(`🔌 Cliente desconectado: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinRoom(socket: any, data: { roomId: string; rtpCapabilities?: mediasoup.types.RtpCapabilities }) {
    const { roomId, rtpCapabilities } = data;
    
    let room = this.rooms.get(roomId);
    
    if (!room) {
      // Crear nueva sala
      const worker = this.getWorker();
      const router = await worker.createRouter({ mediaCodecs: this.config.router.mediaCodecs });
      
      room = {
        id: roomId,
        router,
        peers: new Map(),
        producerTransports: new Map(),
        consumerTransports: new Map(),
        producers: new Map(),
        consumers: new Map(),
        dataProducers: new Map(),
        dataConsumers: new Map()
      };
      
      this.rooms.set(roomId, room);
      logger.info(`🏠 Sala creada: ${roomId}`);
    }

    // Crear peer
    const peer: Peer = {
      id: socket.id,
      socketId: socket.id,
      rtpCapabilities,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
      dataProducers: new Map(),
      dataConsumers: new Map()
    };

    room.peers.set(socket.id, peer);
    socket.join(roomId);

    // Enviar capacidades del router
    socket.emit('router-rtp-capabilities', {
      rtpCapabilities: room.router.rtpCapabilities
    });

    logger.info(`👤 Peer ${socket.id} se unió a la sala ${roomId}`);
  }

  private async handleCreateProducerTransport(socket: any, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    const transport = await room.router.createWebRtcTransport(this.config.webRtcTransport);
    
    room.producerTransports.set(transport.id, transport);
    
    const peer = room.peers.get(socket.id);
    if (peer) {
      peer.transports.set(transport.id, transport);
    }

    transport.on('dtlsstatechange', (dtlsState) => {
      logger.info(`🔐 Transport DTLS state: ${dtlsState}`);
    });

    transport.on('close', () => {
      logger.info(`🚪 Transport cerrado: ${transport.id}`);
    });

    socket.emit('producer-transport-created', {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters
    });
  }

  private async handleConnectProducerTransport(socket: any, data: { transportId: string; dtlsParameters: mediasoup.types.DtlsParameters }) {
    const { transportId, dtlsParameters } = data;
    
    // Encontrar el transporte en cualquier sala
    let transport: mediasoup.types.WebRtcTransport | undefined;
    for (const room of this.rooms.values()) {
      transport = room.producerTransports.get(transportId);
      if (transport) break;
    }

    if (!transport) {
      throw new Error('Transport no encontrado');
    }

    await transport.connect({ dtlsParameters });
    socket.emit('producer-transport-connected');
  }

  private async handleProduce(socket: any, data: { transportId: string; kind: mediasoup.types.MediaKind; rtpParameters: mediasoup.types.RtpParameters; appData?: any }) {
    const { transportId, kind, rtpParameters, appData } = data;
    
    // Encontrar el transporte
    let transport: mediasoup.types.WebRtcTransport | undefined;
    let room: Room | undefined;
    
    for (const r of this.rooms.values()) {
      transport = r.producerTransports.get(transportId);
      if (transport) {
        room = r;
        break;
      }
    }

    if (!transport || !room) {
      throw new Error('Transport no encontrado');
    }

    const producer = await transport.produce({ kind, rtpParameters, appData });
    
    room.producers.set(producer.id, producer);
    
    const peer = room.peers.get(socket.id);
    if (peer) {
      peer.producers.set(producer.id, producer);
    }

    producer.on('transportclose', () => {
      logger.info(`🚪 Producer transport cerrado: ${producer.id}`);
    });

    producer.on('close', () => {
      logger.info(`🚪 Producer cerrado: ${producer.id}`);
      room!.producers.delete(producer.id);
    });

    // Notificar a otros peers sobre el nuevo productor
    socket.to(room.id).emit('new-producer', {
      producerId: producer.id,
      kind: producer.kind
    });

    socket.emit('produced', { id: producer.id });
  }

  private async handleCreateConsumerTransport(socket: any, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    const transport = await room.router.createWebRtcTransport(this.config.webRtcTransport);
    
    room.consumerTransports.set(transport.id, transport);
    
    const peer = room.peers.get(socket.id);
    if (peer) {
      peer.transports.set(transport.id, transport);
    }

    transport.on('dtlsstatechange', (dtlsState) => {
      logger.info(`🔐 Consumer transport DTLS state: ${dtlsState}`);
    });

    transport.on('close', () => {
      logger.info(`🚪 Consumer transport cerrado: ${transport.id}`);
    });

    socket.emit('consumer-transport-created', {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters
    });
  }

  private async handleConnectConsumerTransport(socket: any, data: { transportId: string; dtlsParameters: mediasoup.types.DtlsParameters }) {
    const { transportId, dtlsParameters } = data;
    
    let transport: mediasoup.types.WebRtcTransport | undefined;
    for (const room of this.rooms.values()) {
      transport = room.consumerTransports.get(transportId);
      if (transport) break;
    }

    if (!transport) {
      throw new Error('Transport no encontrado');
    }

    await transport.connect({ dtlsParameters });
    socket.emit('consumer-transport-connected');
  }

  private async handleConsume(socket: any, data: { transportId: string; producerId: string; rtpCapabilities: mediasoup.types.RtpCapabilities }) {
    const { transportId, producerId, rtpCapabilities } = data;
    
    let transport: mediasoup.types.WebRtcTransport | undefined;
    let room: Room | undefined;
    
    for (const r of this.rooms.values()) {
      transport = r.consumerTransports.get(transportId);
      if (transport) {
        room = r;
        break;
      }
    }

    if (!transport || !room) {
      throw new Error('Transport no encontrado');
    }

    const producer = room.producers.get(producerId);
    if (!producer) {
      throw new Error('Productor no encontrado');
    }

    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('No se puede consumir este productor');
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false
    });

    room.consumers.set(consumer.id, consumer);
    
    const peer = room.peers.get(socket.id);
    if (peer) {
      peer.consumers.set(consumer.id, consumer);
    }

    consumer.on('transportclose', () => {
      logger.info(`🚪 Consumer transport cerrado: ${consumer.id}`);
    });

    consumer.on('close', () => {
      logger.info(`🚪 Consumer cerrado: ${consumer.id}`);
      room!.consumers.delete(consumer.id);
    });

    socket.emit('consumed', {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused
    });
  }

  private async handlePauseProducer(socket: any, data: { producerId: string }) {
    const { producerId } = data;
    
    let producer: mediasoup.types.Producer | undefined;
    for (const room of this.rooms.values()) {
      producer = room.producers.get(producerId);
      if (producer) break;
    }

    if (producer) {
      await producer.pause();
      socket.emit('producer-paused');
    }
  }

  private async handleResumeProducer(socket: any, data: { producerId: string }) {
    const { producerId } = data;
    
    let producer: mediasoup.types.Producer | undefined;
    for (const room of this.rooms.values()) {
      producer = room.producers.get(producerId);
      if (producer) break;
    }

    if (producer) {
      await producer.resume();
      socket.emit('producer-resumed');
    }
  }

  private async handleCloseTransport(socket: any, data: { transportId: string }) {
    const { transportId } = data;
    
    for (const room of this.rooms.values()) {
      const transport = room.producerTransports.get(transportId) || room.consumerTransports.get(transportId);
      if (transport) {
        transport.close();
        room.producerTransports.delete(transportId);
        room.consumerTransports.delete(transportId);
        break;
      }
    }
  }

  private handleDisconnect(socket: any) {
    // Limpiar recursos del peer desconectado
    for (const room of this.rooms.values()) {
      const peer = room.peers.get(socket.id);
      if (peer) {
        // Cerrar todos los transports del peer
        peer.transports.forEach(transport => {
          transport.close();
        });
        
        // Cerrar todos los productores del peer
        peer.producers.forEach(producer => {
          producer.close();
        });
        
        // Cerrar todos los consumidores del peer
        peer.consumers.forEach(consumer => {
          consumer.close();
        });
        
        room.peers.delete(socket.id);
        
        // Si la sala está vacía, cerrarla
        if (room.peers.size === 0) {
          room.router.close();
          this.rooms.delete(room.id);
          logger.info(`🏠 Sala cerrada: ${room.id}`);
        }
        
        break;
      }
    }
  }

  // Métodos públicos para gestión de salas
  public getRoomStats(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      peers: room.peers.size,
      producers: room.producers.size,
      consumers: room.consumers.size,
      transports: room.producerTransports.size + room.consumerTransports.size
    };
  }

  public getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      peers: room.peers.size,
      producers: room.producers.size,
      consumers: room.consumers.size
    }));
  }

  public closeRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.router.close();
      this.rooms.delete(roomId);
      logger.info(`🏠 Sala cerrada manualmente: ${roomId}`);
    }
  }
} 