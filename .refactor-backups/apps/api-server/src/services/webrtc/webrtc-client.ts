import { Device } from 'mediasoup-client';
import { io, Socket } from 'socket.io-client';

import { logger } from '@altamedica/shared/services/logger.service';
export interface WebRTCConfig {
  serverUrl: string;
  roomId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onProducerCreated?: (producer: any) => void;
  onConsumerCreated?: (consumer: any) => void;
  onError?: (error: string) => void;
}

export interface StreamConfig {
  video: {
    width: { ideal: number };
    height: { ideal: number };
    frameRate: { ideal: number };
    facingMode: 'user' | 'environment';
  };
  audio: {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    sampleRate: number;
  };
}

export class WebRTCClient {
  private socket: Socket;
  private device: Device | null = null;
  private roomId: string;
  private producerTransport: any = null;
  private consumerTransport: any = null;
  private producers: Map<string, any> = new Map();
  private consumers: Map<string, any> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();

  // Configuración optimizada para telemedicina
  private streamConfig: StreamConfig = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    }
  };

  // Callbacks
  private onConnected?: () => void;
  private onDisconnected?: () => void;
  private onProducerCreated?: (producer: any) => void;
  private onConsumerCreated?: (consumer: any) => void;
  private onError?: (error: string) => void;

  constructor(config: WebRTCConfig) {
    this.roomId = config.roomId;
    this.onConnected = config.onConnected;
    this.onDisconnected = config.onDisconnected;
    this.onProducerCreated = config.onProducerCreated;
    this.onConsumerCreated = config.onConsumerCreated;
    this.onError = config.onError;

    // Conectar al servidor
    this.socket = io(config.serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.socket.on('connect', () => {
      logger.info('🔌 Conectado al servidor WebRTC');
      this.joinRoom();
    });

    this.socket.on('disconnect', () => {
      logger.info('🔌 Desconectado del servidor WebRTC');
      this.onDisconnected?.();
    });

    this.socket.on('router-rtp-capabilities', async (data: { rtpCapabilities: any }) => {
      try {
        this.device = new Device();
        await this.device.load({ routerRtpCapabilities: data.rtpCapabilities });
        logger.info('✅ Dispositivo MediaSoup cargado');
      } catch (error) {
        logger.error('❌ Error al cargar dispositivo:', undefined, error);
        this.onError?.('Error al cargar dispositivo MediaSoup');
      }
    });

    this.socket.on('producer-transport-created', async (data: any) => {
      try {
        await this.handleProducerTransportCreated(data);
      } catch (error) {
        logger.error('❌ Error en producer transport:', undefined, error);
        this.onError?.('Error al crear transporte de producción');
      }
    });

    this.socket.on('producer-transport-connected', () => {
      logger.info('✅ Transporte de producción conectado');
    });

    this.socket.on('produced', (data: { id: string }) => {
      logger.info('✅ Productor creado:', data.id);
      this.onProducerCreated?.(data);
    });

    this.socket.on('consumer-transport-created', async (data: any) => {
      try {
        await this.handleConsumerTransportCreated(data);
      } catch (error) {
        logger.error('❌ Error en consumer transport:', undefined, error);
        this.onError?.('Error al crear transporte de consumo');
      }
    });

    this.socket.on('consumer-transport-connected', () => {
      logger.info('✅ Transporte de consumo conectado');
    });

    this.socket.on('consumed', (data: any) => {
      logger.info('✅ Consumidor creado:', data.id);
      this.consumers.set(data.id, data);
      this.onConsumerCreated?.(data);
    });

    this.socket.on('new-producer', async (data: { producerId: string; kind: string }) => {
      try {
        await this.consumeProducer(data.producerId, data.kind);
      } catch (error) {
        logger.error('❌ Error al consumir nuevo productor:', undefined, error);
      }
    });

    this.socket.on('producer-paused', () => {
      logger.info('⏸️ Productor pausado');
    });

    this.socket.on('producer-resumed', () => {
      logger.info('▶️ Productor reanudado');
    });

    this.socket.on('error', (data: { message: string }) => {
      logger.error('❌ Error del servidor:', data.message);
      this.onError?.(data.message);
    });
  }

  private async joinRoom() {
    try {
      // Obtener capacidades del dispositivo
      const rtpCapabilities = this.device?.rtpCapabilities;
      
      this.socket.emit('join-room', {
        roomId: this.roomId,
        rtpCapabilities
      });
    } catch (error) {
      logger.error('❌ Error al unirse a la sala:', undefined, error);
      this.onError?.('Error al unirse a la sala');
    }
  }

  private async handleProducerTransportCreated(data: any) {
    try {
      this.producerTransport = this.device!.createSendTransport(data);

      this.producerTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
        try {
          this.socket.emit('connect-producer-transport', {
            transportId: this.producerTransport.id,
            dtlsParameters
          });
          callback();
        } catch (error) {
          errback(error);
        }
      });

      this.producerTransport.on('produce', async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
        try {
          this.socket.emit('produce', {
            transportId: this.producerTransport.id,
            kind,
            rtpParameters
          });
          callback();
        } catch (error) {
          errback(error);
        }
      });

      this.producerTransport.on('disconnect', () => {
        logger.info('🚪 Transporte de producción desconectado');
      });

      this.producerTransport.on('close', () => {
        logger.info('🚪 Transporte de producción cerrado');
      });

    } catch (error) {
      logger.error('❌ Error al crear transporte de producción:', undefined, error);
      throw error;
    }
  }

  private async handleConsumerTransportCreated(data: any) {
    try {
      this.consumerTransport = this.device!.createRecvTransport(data);

      this.consumerTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
        try {
          this.socket.emit('connect-consumer-transport', {
            transportId: this.consumerTransport.id,
            dtlsParameters
          });
          callback();
        } catch (error) {
          errback(error);
        }
      });

      this.consumerTransport.on('disconnect', () => {
        logger.info('🚪 Transporte de consumo desconectado');
      });

      this.consumerTransport.on('close', () => {
        logger.info('🚪 Transporte de consumo cerrado');
      });

    } catch (error) {
      logger.error('❌ Error al crear transporte de consumo:', undefined, error);
      throw error;
    }
  }

  public async startLocalStream(config?: Partial<StreamConfig>) {
    try {
      const finalConfig = { ...this.streamConfig, ...config };
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: finalConfig.video,
        audio: finalConfig.audio
      });

      logger.info('✅ Stream local iniciado');
      return this.localStream;
    } catch (error) {
      logger.error('❌ Error al obtener stream local:', undefined, error);
      this.onError?.('Error al acceder a la cámara/micrófono');
      throw error;
    }
  }

  public async publishStream(stream: MediaStream, kind: 'video' | 'audio') {
    try {
      if (!this.producerTransport) {
        throw new Error('Transporte de producción no disponible');
      }

      const track = kind === 'video' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      
      if (!track) {
        throw new Error(`No se encontró track de ${kind}`);
      }

      const producer = await this.producerTransport.produce({ track });
      
      this.producers.set(producer.id, producer);
      
      producer.on('transportclose', () => {
        logger.info(`🚪 Productor ${kind} transport cerrado`);
      });

      producer.on('close', () => {
        logger.info(`🚪 Productor ${kind} cerrado`);
        this.producers.delete(producer.id);
      });

      logger.info(`✅ Stream ${kind} publicado:`, producer.id);
      return producer;
    } catch (error) {
      logger.error(`❌ Error al publicar stream ${kind}:`, undefined, error);
      this.onError?.(`Error al publicar ${kind}`);
      throw error;
    }
  }

  public async consumeProducer(producerId: string, kind: string) {
    try {
      if (!this.consumerTransport) {
        // Crear transporte de consumo si no existe
        this.socket.emit('create-consumer-transport', { roomId: this.roomId });
        return;
      }

      const { rtpCapabilities } = this.device!;
      
      this.socket.emit('consume', {
        transportId: this.consumerTransport.id,
        producerId,
        rtpCapabilities
      });
    } catch (error) {
      logger.error('❌ Error al consumir productor:', undefined, error);
      this.onError?.('Error al consumir stream remoto');
    }
  }

  public async pauseProducer(producerId: string) {
    try {
      this.socket.emit('pause-producer', { producerId });
    } catch (error) {
      logger.error('❌ Error al pausar productor:', undefined, error);
    }
  }

  public async resumeProducer(producerId: string) {
    try {
      this.socket.emit('resume-producer', { producerId });
    } catch (error) {
      logger.error('❌ Error al reanudar productor:', undefined, error);
    }
  }

  public async closeProducer(producerId: string) {
    try {
      const producer = this.producers.get(producerId);
      if (producer) {
        producer.close();
        this.producers.delete(producerId);
      }
    } catch (error) {
      logger.error('❌ Error al cerrar productor:', undefined, error);
    }
  }

  public async closeConsumer(consumerId: string) {
    try {
      const consumer = this.consumers.get(consumerId);
      if (consumer) {
        consumer.close();
        this.consumers.delete(consumerId);
      }
    } catch (error) {
      logger.error('❌ Error al cerrar consumidor:', undefined, error);
    }
  }

  public async closeTransport(transportId: string) {
    try {
      this.socket.emit('close-transport', { transportId });
    } catch (error) {
      logger.error('❌ Error al cerrar transporte:', undefined, error);
    }
  }

  public async setVideoQuality(quality: 'low' | 'medium' | 'high') {
    try {
      const qualityConfig = {
        low: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
        medium: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        high: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }
      };

      this.streamConfig.video = { ...this.streamConfig.video, ...qualityConfig[quality] };
      
      // Si hay un stream activo, reiniciarlo con nueva calidad
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        await this.startLocalStream();
      }
    } catch (error) {
      logger.error('❌ Error al cambiar calidad de video:', undefined, error);
    }
  }

  public async enableNoiseReduction(enabled: boolean) {
    try {
      this.streamConfig.audio.noiseSuppression = enabled;
      
      if (this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
          const constraints = audioTrack.getConstraints();
          constraints.noiseSuppression = enabled;
          await audioTrack.applyConstraints(constraints);
        }
      }
    } catch (error) {
      logger.error('❌ Error al configurar supresión de ruido:', undefined, error);
    }
  }

  public async enableEchoCancellation(enabled: boolean) {
    try {
      this.streamConfig.audio.echoCancellation = enabled;
      
      if (this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
          const constraints = audioTrack.getConstraints();
          constraints.echoCancellation = enabled;
          await audioTrack.applyConstraints(constraints);
        }
      }
    } catch (error) {
      logger.error('❌ Error al configurar cancelación de eco:', undefined, error);
    }
  }

  public getStats() {
    return {
      producers: this.producers.size,
      consumers: this.consumers.size,
      localStream: !!this.localStream,
      remoteStreams: this.remoteStreams.size,
      connected: this.socket.connected
    };
  }

  public disconnect() {
    try {
      // Cerrar todos los productores
      this.producers.forEach(producer => producer.close());
      this.producers.clear();

      // Cerrar todos los consumidores
      this.consumers.forEach(consumer => consumer.close());
      this.consumers.clear();

      // Detener stream local
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Cerrar transports
      if (this.producerTransport) {
        this.producerTransport.close();
        this.producerTransport = null;
      }

      if (this.consumerTransport) {
        this.consumerTransport.close();
        this.consumerTransport = null;
      }

      // Desconectar socket
      this.socket.disconnect();

      logger.info('🔌 Cliente WebRTC desconectado');
    } catch (error) {
      logger.error('❌ Error al desconectar:', undefined, error);
    }
  }
} 