// Mock temporal para MediaSoup Server - permite ejecutar sin dependencia de mediasoup
import { logger } from '@altamedica/shared/services/logger.service';

export class MediaSoupServer {
  private rooms: Map<string, any> = new Map();

  constructor(server: any) {
    logger.info('⚠️  Usando MediaSoup Server MOCK - WebRTC no funcionará completamente');
    logger.info('📝 Para funcionalidad completa, instala mediasoup: npm install mediasoup');
  }

  public getRoomStats(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: roomId,
      peers: room.peers || 0,
      producers: room.producers || 0,
      consumers: room.consumers || 0,
      transports: room.transports || 0
    };
  }

  public getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      peers: room.peers || 0,
      producers: room.producers || 0,
      consumers: room.consumers || 0
    }));
  }

  public closeRoom(roomId: string) {
    this.rooms.delete(roomId);
    logger.info(`🏠 Sala MOCK cerrada: ${roomId}`);
  }

  // Método para simular creación de sala
  public createMockRoom(roomId: string) {
    this.rooms.set(roomId, {
      id: roomId,
      peers: 0,
      producers: 0,
      consumers: 0,
      transports: 0
    });
    logger.info(`🏠 Sala MOCK creada: ${roomId}`);
  }
}