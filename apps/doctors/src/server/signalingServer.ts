// Servidor de señalización WebSocket para WebRTC
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

import { logger } from '@altamedica/shared';
interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'user-joined' | 'user-left';
  from: string;
  to?: string;
  data: any;
  roomId: string;
}

interface ConnectedUser {
  id: string;
  ws: WebSocket;
  roomId: string;
  userType: 'doctor' | 'patient';
}

class SignalingServer {
  private wss: WebSocketServer;
  private rooms: Map<string, ConnectedUser[]> = new Map();
  private users: Map<string, ConnectedUser> = new Map();

  constructor(port: number = 3001) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });

    this.setupWebSocketHandlers();
    server.listen(port, () => {
      logger.info(`Servidor de señalización ejecutándose en puerto ${port}`);
    });
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('Nueva conexión WebSocket');

      ws.on('message', (data: Buffer) => {
        try {
          const message: SignalingMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Error procesando mensaje:', String(error));
          ws.send(JSON.stringify({
            type: 'error',
            data: 'Mensaje inválido'
          }));
        }
      });

      ws.on('close', () => {
        this.handleUserDisconnect(ws);
      });

      ws.on('error', (error) => {
        logger.error('Error en WebSocket:', String(error));
        this.handleUserDisconnect(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: SignalingMessage): void {
    switch (message.type) {
      case 'join':
        this.handleJoin(ws, message);
        break;
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.handlePeerMessage(message);
        break;
      case 'leave':
        this.handleLeave(ws, message);
        break;
      default:
        logger.warn('Tipo de mensaje desconocido:', message.type);
    }
  }

  private handleJoin(ws: WebSocket, message: SignalingMessage): void {
    const userId = message.from;
    const roomId = message.roomId;
    const userType = message.data.userType;

    // Crear usuario conectado
    const user: ConnectedUser = {
      id: userId,
      ws,
      roomId,
      userType
    };

    // Agregar a la sala
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, []);
    }
    this.rooms.get(roomId)!.push(user);

    // Agregar al mapa de usuarios
    this.users.set(userId, user);

    // Notificar a otros usuarios en la sala
    this.broadcastToRoom(roomId, {
      type: 'user-joined',
      from: userId,
      data: { userType, userId },
      roomId
    }, userId);

    logger.info(`Usuario ${userId} (${userType}) se unió a la sala ${roomId}`);
    logger.info(`Usuarios en sala ${roomId}:`, JSON.stringify(this.rooms.get(roomId)!.map(u => `${u.id} (${u.userType})`), null, 2));
  }

  private handlePeerMessage(message: SignalingMessage): void {
    const { roomId, to, from } = message;

    if (to) {
      // Mensaje dirigido a un usuario específico
      const targetUser = this.users.get(to);
      if (targetUser && targetUser.roomId === roomId) {
        targetUser.ws.send(JSON.stringify(message));
      }
    } else {
      // Broadcast a toda la sala
      this.broadcastToRoom(roomId, message, from);
    }
  }

  private handleLeave(ws: WebSocket, message: SignalingMessage): void {
    this.handleUserDisconnect(ws);
  }

  private handleUserDisconnect(ws: WebSocket): void {
    // Encontrar usuario por WebSocket
    let disconnectedUser: ConnectedUser | null = null;
    for (const [userId, user] of this.users.entries()) {
      if (user.ws === ws) {
        disconnectedUser = user;
        break;
      }
    }

    if (disconnectedUser) {
      const { id: userId, roomId } = disconnectedUser;

      // Remover de la sala
      const room = this.rooms.get(roomId);
      if (room) {
        const userIndex = room.findIndex(u => u.id === userId);
        if (userIndex > -1) {
          room.splice(userIndex, 1);
          
          // Si la sala está vacía, eliminarla
          if (room.length === 0) {
            this.rooms.delete(roomId);
          }
        }
      }

      // Remover del mapa de usuarios
      this.users.delete(userId);

      // Notificar a otros usuarios
      this.broadcastToRoom(roomId, {
        type: 'user-left',
        from: userId,
        data: { userId },
        roomId
      });

      logger.info(`Usuario ${userId} se desconectó de la sala ${roomId}`);
    }
  }

  private broadcastToRoom(roomId: string, message: SignalingMessage, excludeUserId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    room.forEach(user => {
      if (user.id !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(messageStr);
      }
    });
  }

  // Métodos de utilidad
  getRoomUsers(roomId: string): ConnectedUser[] {
    return this.rooms.get(roomId) || [];
  }

  getUser(userId: string): ConnectedUser | undefined {
    return this.users.get(userId);
  }

  getStats(): { rooms: number; users: number; roomDetails: Record<string, number> } {
    const roomDetails: Record<string, number> = {};
    for (const [roomId, users] of this.rooms.entries()) {
      roomDetails[roomId] = users.length;
    }

    return {
      rooms: this.rooms.size,
      users: this.users.size,
      roomDetails
    };
  }
}

// Exportar para uso en desarrollo
if (require.main === module) {
  const port = parseInt(process.env.SIGNALING_PORT || '3001');
  new SignalingServer(port);
}

export { SignalingServer }; 