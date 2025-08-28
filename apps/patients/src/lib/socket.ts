import { io, Socket } from 'socket.io-client';

import { logger } from '@altamedica/shared';
// Configuración del cliente Socket.IO
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Tipos para los eventos de Socket.IO
export interface SocketEvents {
  'join-room': (data: { roomId: string; userId: string; userType: string }) => void;
  'user-joined': (data: { userId: string; userType: string; timestamp: string }) => void;
  'offer': (data: { offer: RTCSessionDescriptionInit; from: string; timestamp: string }) => void;
  'answer': (data: { answer: RTCSessionDescriptionInit; from: string; timestamp: string }) => void;
  'ice-candidate': (data: { candidate: RTCIceCandidateInit; from: string; timestamp: string }) => void;
  'chat-message': (data: { message: string; from: string; userType: string; timestamp: string }) => void;
  'user-disconnected': (data: { userId: string; userType: string; timestamp: string }) => void;
}

// Clase para manejar la conexión Socket.IO
class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Conectar al servidor Socket.IO
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        resolve(this.socket);
        return;
      }

      logger.info('🔌 Conectando a Socket.IO:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      this.socket.on('connect', () => {
        logger.info('✅ Socket.IO conectado:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        logger.error('❌ Error de conexión Socket.IO:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        logger.info('🔌 Socket.IO desconectado:', reason);
        this.isConnected = false;
      });

      this.socket.on('reconnect', (attemptNumber) => {
        logger.info('🔄 Socket.IO reconectado en intento:', attemptNumber);
        this.isConnected = true;
      });

      this.socket.on('reconnect_error', (error) => {
        logger.error('❌ Error de reconexión Socket.IO:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('❌ Máximo de intentos de reconexión alcanzado');
        }
      });

      this.socket.on('reconnect_failed', () => {
        logger.error('❌ Falló la reconexión Socket.IO');
        this.isConnected = false;
      });
    });
  }

  // Desconectar del servidor
  disconnect(): void {
    if (this.socket) {
      logger.info('🔌 Desconectando Socket.IO');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Obtener la instancia del socket
  getSocket(): Socket | null {
    return this.socket;
  }

  // Verificar si está conectado
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Unirse a una sala
  joinRoom(roomId: string, userId: string, userType: string): void {
    if (!this.socket || !this.isConnected) {
      logger.error('❌ Socket no conectado para unirse a sala');
      return;
    }

    logger.info(`🚪 Uniéndose a sala: ${roomId} como ${userType} (${userId})`);
    
    this.socket.emit('join-room', {
      roomId,
      userId,
      userType
    });
  }

  // Enviar oferta WebRTC
  sendOffer(roomId: string, offer: RTCSessionDescriptionInit, targetUserId: string): void {
    if (!this.socket || !this.isConnected) {
      logger.error('❌ Socket no conectado para enviar oferta');
      return;
    }

    logger.info(`📤 Enviando oferta WebRTC a ${targetUserId}`);
    
    this.socket.emit('offer', {
      roomId,
      offer,
      targetUserId
    });
  }

  // Enviar respuesta WebRTC
  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, targetUserId: string): void {
    if (!this.socket || !this.isConnected) {
      logger.error('❌ Socket no conectado para enviar respuesta');
      return;
    }

    logger.info(`📤 Enviando respuesta WebRTC a ${targetUserId}`);
    
    this.socket.emit('answer', {
      roomId,
      answer,
      targetUserId
    });
  }

  // Enviar candidato ICE
  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit, targetUserId: string): void {
    if (!this.socket || !this.isConnected) {
      logger.error('❌ Socket no conectado para enviar candidato ICE');
      return;
    }

    logger.info(`📤 Enviando candidato ICE a ${targetUserId}`);
    
    this.socket.emit('ice-candidate', {
      roomId,
      candidate,
      targetUserId
    });
  }

  // Enviar mensaje de chat
  sendChatMessage(roomId: string, message: string, userId: string, userType: string): void {
    if (!this.socket || !this.isConnected) {
      logger.error('❌ Socket no conectado para enviar mensaje');
      return;
    }

    logger.info(`💬 Enviando mensaje de chat: ${message}`);
    
    this.socket.emit('chat-message', {
      roomId,
      message,
      userId,
      userType
    });
  }

  // Escuchar eventos
  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (!this.socket) {
      logger.error('❌ Socket no inicializado para escuchar eventos');
      return;
    }

    this.socket.on(event, callback as any);
  }

  // Dejar de escuchar eventos
  off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]): void {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback as any);
    } else {
      this.socket.off(event);
    }
  }
}

// Instancia global del SocketManager
export const socketManager = new SocketManager();

// Hook personalizado para usar Socket.IO en componentes React
export const useSocket = () => {
  return {
    connect: socketManager.connect.bind(socketManager),
    disconnect: socketManager.disconnect.bind(socketManager),
    getSocket: socketManager.getSocket.bind(socketManager),
    isConnected: socketManager.isSocketConnected.bind(socketManager),
    joinRoom: socketManager.joinRoom.bind(socketManager),
    sendOffer: socketManager.sendOffer.bind(socketManager),
    sendAnswer: socketManager.sendAnswer.bind(socketManager),
    sendIceCandidate: socketManager.sendIceCandidate.bind(socketManager),
    sendChatMessage: socketManager.sendChatMessage.bind(socketManager),
    on: socketManager.on.bind(socketManager),
    off: socketManager.off.bind(socketManager)
  };
};

export default socketManager; 