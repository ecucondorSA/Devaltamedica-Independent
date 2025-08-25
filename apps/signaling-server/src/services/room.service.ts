import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { serverConfig } from '../config/server.config.js';

import { logger } from '@altamedica/shared';
// TODO: Definir estos tipos en @altamedica/types
interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  [key: string]: any;
}

interface Participant {
  id: string;
  userId: string;
  socketId: string;
  role: 'patient' | 'doctor';
  name: string;
  status: string;
  joinedAt: Date;
  leftAt?: Date;
  connectionInfo: any;
  [key: string]: any;
}

interface Room {
  id: string;
  name: string;
  sessionId: string;
  type: string;
  status: string;
  participants: Participant[];
  createdAt: Date;
  maxParticipants: number;
  isRecording: boolean;
  [key: string]: any;
}

export class RoomService {
  private rooms: Map<string, Room>;
  private redisClient: ReturnType<typeof createClient> | null = null;

  constructor() {
    this.rooms = new Map();
    // this.initRedis();
  }

  async createRoom(sessionId: string, appointmentId: string): Promise<Room> {
    const roomId = `room-${appointmentId}-${uuidv4()}`;
    const room: Room = {
      id: roomId,
      name: `Consultation ${appointmentId}`,
      sessionId,
      type: 'consultation',
      status: 'active',
      participants: [],
      createdAt: new Date(),
      maxParticipants: 10,
      isRecording: false,
    };
    this.rooms.set(roomId, room);

    if (this.redisClient) {
      const roomForRedis = { ...room, participants: [] };
      await this.redisClient.set(
        `${serverConfig.redis.keyPrefix}room:${roomId}`,
        JSON.stringify(roomForRedis),
        { EX: 3600 * 4 },
      );
    }
    logger.info(`🏥 Room created: ${roomId}`);
    return room;
  }

  async joinRoom(roomId: string, user: User, connectionInfo: any): Promise<Participant | null> {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.error(`Room not found: ${roomId}`);
      return null;
    }

    const existingParticipant = room.participants.find((p) => p.userId === user.id);
    if (existingParticipant) {
      existingParticipant.status = 'connected';
      existingParticipant.connectionInfo = connectionInfo;
      return existingParticipant;
    }

    const participant: Participant = {
      id: uuidv4(),
      userId: user.id,
      socketId: '', // Will be set by caller
      role: user.role as 'patient' | 'doctor',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown',
      status: 'connected',
      joinedAt: new Date(),
      connectionInfo,
    };
    room.participants.push(participant);

    if (this.redisClient) {
      await this.updateRoomInRedis(room);
    }
    logger.info(`👤 User ${user.id} joined room ${roomId}`);
    return participant;
  }

  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const participant = room.participants.find((p) => p.userId === userId);
    if (!participant) {
      return false;
    }

    participant.status = 'disconnected';
    participant.leftAt = new Date();

    const activeParticipants = room.participants.filter((p) => p.status === 'connected');
    if (activeParticipants.length === 0) {
      room.status = 'ended';
      if (this.redisClient) {
        setTimeout(async () => {
          await this.redisClient?.del(`${serverConfig.redis.keyPrefix}room:${roomId}`);
          this.rooms.delete(roomId);
        }, 60000);
      }
    }
    logger.info(`👤 User ${userId} left room ${roomId}`);
    return true;
  }

  async getRoom(roomId: string): Promise<Room | null> {
    let room = this.rooms.get(roomId);
    if (!room && this.redisClient) {
      const roomData = await this.redisClient.get(`${serverConfig.redis.keyPrefix}room:${roomId}`);
      if (roomData) {
        const parsedRoom = JSON.parse(roomData);
        room = {
          ...parsedRoom,
          participants: [],
          createdAt: new Date(parsedRoom.createdAt),
        };
        if (room) {
          this.rooms.set(roomId, room);
        }
      }
    }
    return room || null;
  }

  async getRoomParticipants(roomId: string): Promise<Participant[]> {
    const room = await this.getRoom(roomId);
    return room ? room.participants : [];
  }

  async updateParticipantStatus(
    roomId: string,
    userId: string,
    status: 'waiting' | 'connected' | 'disconnected',
  ): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const participant = room.participants.find((p) => p.userId === userId);
    if (!participant) {
      return false;
    }
    participant.status = status;

    // if (this.redisClient) {
    //   await this.updateRoomInRedis(room);
    // }
    return true;
  }

  async endRoom(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }
    room.status = 'ended';
    room.participants.forEach((p) => {
      p.status = 'disconnected';
      if (!p.leftAt) {
        p.leftAt = new Date();
      }
    });
    if (this.redisClient) {
      await this.updateRoomInRedis(room);
    }
    logger.info(`🏥 Room ended: ${roomId}`);
    return true;
  }

  async cleanupInactiveRooms(): Promise<void> {
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.status === 'ended' || room.createdAt < fourHoursAgo) {
        this.rooms.delete(roomId);
        if (this.redisClient) {
          await this.redisClient.del(`${serverConfig.redis.keyPrefix}room:${roomId}`);
        }
        logger.info(`🗑️ Cleaned up room: ${roomId}`);
      }
    }
  }

  private async updateRoomInRedis(room: Room): Promise<void> {
    if (!this.redisClient) return;
    const roomData = {
      ...room,
      participants: room.participants,
    };
    await this.redisClient.set(
      `${serverConfig.redis.keyPrefix}room:${room.id}`,
      JSON.stringify(roomData),
      { EX: 3600 * 4 },
    );
  }

  async getRoomStats(): Promise<{
    totalRooms: number;
    activeRooms: number;
    totalParticipants: number;
  }> {
    const activeRooms = Array.from(this.rooms.values()).filter((r) => r.status === 'active');
    const totalParticipants = activeRooms.reduce((sum, room) => sum + room.participants.length, 0);
    return {
      totalRooms: this.rooms.size,
      activeRooms: activeRooms.length,
      totalParticipants,
    };
  }
}
