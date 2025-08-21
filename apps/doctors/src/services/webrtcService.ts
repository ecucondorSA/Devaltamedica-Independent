// Servicio de WebRTC real para telemedicina
import { logger } from '@altamedica/shared/services/logger.service';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  signalingUrl: string;
  roomId: string;
  userId: string;
  userType: 'doctor' | 'patient';
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'user-joined' | 'user-left';
  from: string;
  to?: string;
  data: any;
  roomId: string;
}

export interface WebRTCEvent {
  type: 'connection-state-change' | 'ice-connection-state-change' | 'stream-added' | 'stream-removed' | 'error';
  data: any;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private signalingSocket: WebSocket | null = null;
  private config: WebRTCConfig | null = null;
  private eventListeners: Map<string, ((event: WebRTCEvent) => void)[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Configurar listeners para cambios de estado
    if (this.peerConnection) {
      this.peerConnection.onconnectionstatechange = () => {
        this.emit('connection-state-change', {
          state: this.peerConnection?.connectionState
        });
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        this.emit('ice-connection-state-change', {
          state: this.peerConnection?.iceConnectionState
        });
      };

      this.peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          this.remoteStreams.set(event.track.id, stream);
          this.emit('stream-added', { stream, track: event.track });
        }
      };
    }
  }

  async initialize(config: WebRTCConfig): Promise<void> {
    this.config = config;
    
    // Configurar RTCPeerConnection
    this.peerConnection = new RTCPeerConnection({
      iceServers: config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.setupEventListeners();

    // Configurar manejo de ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          from: config.userId,
          data: event.candidate,
          roomId: config.roomId
        });
      }
    };

    // Conectar al servidor de señalización
    await this.connectSignaling();
  }

  private async connectSignaling(): Promise<void> {
    if (!this.config) throw new Error('Configuración no inicializada');

    return new Promise((resolve, reject) => {
      this.signalingSocket = new WebSocket(this.config!.signalingUrl);

      this.signalingSocket.onopen = () => {
        logger.info('Conectado al servidor de señalización');
        
        // Unirse a la sala
        this.sendSignalingMessage({
          type: 'join',
          from: this.config!.userId,
          data: { userType: this.config!.userType },
          roomId: this.config!.roomId
        });

        resolve();
      };

      this.signalingSocket.onmessage = (event) => {
        try {
          const message: SignalingMessage = JSON.parse(event.data);
          this.handleSignalingMessage(message);
        } catch (error) {
          logger.error('Error procesando mensaje de señalización:', error);
        }
      };

      this.signalingSocket.onerror = (error) => {
        logger.error('Error en conexión de señalización:', error);
        reject(error);
      };

      this.signalingSocket.onclose = () => {
        logger.info('Conexión de señalización cerrada');
        this.emit('connection-state-change', { state: 'disconnected' });
      };
    });
  }

  private handleSignalingMessage(message: SignalingMessage): void {
    if (!this.peerConnection) return;

    switch (message.type) {
      case 'offer':
        this.handleOffer(message);
        break;
      case 'answer':
        this.handleAnswer(message);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(message);
        break;
      case 'user-joined':
        this.handleUserJoined(message);
        break;
      case 'user-left':
        this.handleUserLeft(message);
        break;
    }
  }

  private async handleOffer(message: SignalingMessage): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data));
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: 'answer',
        from: this.config!.userId,
        to: message.from,
        data: answer,
        roomId: this.config!.roomId
      });
    } catch (error) {
      logger.error('Error manejando oferta:', error);
      this.emit('error', { error: 'Error manejando oferta', details: error });
    }
  }

  private async handleAnswer(message: SignalingMessage): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data));
    } catch (error) {
      logger.error('Error manejando respuesta:', error);
      this.emit('error', { error: 'Error manejando respuesta', details: error });
    }
  }

  private async handleIceCandidate(message: SignalingMessage): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.data));
    } catch (error) {
      logger.error('Error agregando ICE candidate:', error);
    }
  }

  private handleUserJoined(message: SignalingMessage): void {
    logger.info(`Usuario ${message.from} se unió a la sala`);
    this.emit('connection-state-change', { 
      state: 'user-joined', 
      userId: message.from 
    });
  }

  private handleUserLeft(message: SignalingMessage): void {
    logger.info(`Usuario ${message.from} dejó la sala`);
    this.emit('connection-state-change', { 
      state: 'user-left', 
      userId: message.from 
    });
  }

  private sendSignalingMessage(message: SignalingMessage): void {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify(message));
    } else {
      logger.warn('Socket de señalización no está conectado');
    }
  }

  async startLocalStream(constraints: MediaStreamConstraints = {
    video: true,
    audio: true
  }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Agregar tracks al peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      return this.localStream;
    } catch (error) {
      logger.error('Error obteniendo stream local:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection no inicializada');
    }

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Enviar oferta a través de señalización
      this.sendSignalingMessage({
        type: 'offer',
        from: this.config!.userId,
        data: offer,
        roomId: this.config!.roomId
      });

      return offer;
    } catch (error) {
      logger.error('Error creando oferta:', error);
      throw error;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStreams(): MediaStream[] {
    return Array.from(this.remoteStreams.values());
  }

  getConnectionState(): RTCConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  getIceConnectionState(): RTCIceConnectionState | null {
    return this.peerConnection?.iceConnectionState || null;
  }

  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null;
    return await this.peerConnection.getStats();
  }

  // Event listeners
  on(event: string, callback: (event: WebRTCEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (event: WebRTCEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type: event, data });
        } catch (error) {
          logger.error('Error en event listener:', error);
        }
      });
    }
  }

  // Limpieza
  async disconnect(): Promise<void> {
    // Detener streams locales
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Cerrar peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Cerrar socket de señalización
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    // Limpiar streams remotos
    this.remoteStreams.clear();

    // Limpiar event listeners
    this.eventListeners.clear();

    logger.info('WebRTC desconectado');
  }
}

// Instancia singleton del servicio
export const webrtcService = new WebRTCService(); 