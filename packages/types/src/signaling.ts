/**
 * @fileoverview WebRTC Signaling Types
 * @module @altamedica/types/signaling
 * @description Types for WebRTC signaling server and real-time communication
 */

import { z } from 'zod';

// ==================== USER TYPES ====================
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['doctor', 'patient', 'admin', 'staff']),
  avatar: z.string().optional(),
  uid: z.string(), // Firebase UID
});

export type User = z.infer<typeof UserSchema>;

// ==================== ROOM TYPES ====================
export const ParticipantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  socketId: z.string(),
  role: z.enum(['doctor', 'patient']),
  name: z.string(),
  joinedAt: z.date(),
  leftAt: z.date().optional(),
  status: z.enum(['connected', 'disconnected', 'left', 'waiting']),
  connectionInfo: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    lastPing: z.date().optional(),
  }).optional(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  sessionId: z.string().optional(), // For backwards compatibility
  type: z.enum(['consultation', 'meeting', 'emergency']),
  status: z.enum(['active', 'ended', 'waiting']).default('waiting'),
  createdAt: z.date(),
  endedAt: z.date().optional(),
  participants: z.array(ParticipantSchema),
  maxParticipants: z.number().default(10),
  isRecording: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

export type Room = z.infer<typeof RoomSchema>;

// ==================== SIGNALING DATA TYPES ====================
export const JoinRoomDataSchema = z.object({
  roomId: z.string(),
  role: z.enum(['doctor', 'patient']),
  name: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type JoinRoomData = z.infer<typeof JoinRoomDataSchema>;

export const LeaveRoomDataSchema = z.object({
  roomId: z.string(),
  reason: z.string().optional(),
});

export type LeaveRoomData = z.infer<typeof LeaveRoomDataSchema>;

export const SignalingMessageSchema = z.object({
  type: z.enum(['offer', 'answer', 'ice-candidate', 'peer-connected', 'peer-disconnected']),
  roomId: z.string(),
  sessionId: z.string().optional(), // For backwards compatibility
  fromUserId: z.string(),
  toUserId: z.string().optional(), // Para mensajes peer-to-peer específicos
  to: z.string().optional(), // Alternative field name for toUserId
  data: z.any(), // RTCSessionDescription o RTCIceCandidate
  timestamp: z.date().default(() => new Date()),
});

export type SignalingMessage = z.infer<typeof SignalingMessageSchema>;

// ==================== CHAT TYPES ====================
export const ChatMessageDataSchema = z.object({
  roomId: z.string(),
  message: z.string(),
  type: z.enum(['text', 'system', 'notification']).default('text'),
  metadata: z.record(z.any()).optional(),
});

export type ChatMessageData = z.infer<typeof ChatMessageDataSchema>;

// ==================== MEDIA CONTROL TYPES ====================
export const ToggleMediaDataSchema = z.object({
  roomId: z.string(),
  mediaType: z.enum(['video', 'audio', 'screen']),
  enabled: z.boolean(),
});

export type ToggleMediaData = z.infer<typeof ToggleMediaDataSchema>;

// ==================== VITALS MONITORING TYPES ====================
export const VitalsUpdateDataSchema = z.object({
  roomId: z.string(),
  patientId: z.string(),
  vitals: z.object({
    heartRate: z.number().optional(),
    bloodPressure: z.object({
      systolic: z.number(),
      diastolic: z.number(),
    }).optional(),
    temperature: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    respiratoryRate: z.number().optional(),
  }),
  timestamp: z.date().default(() => new Date()),
  critical: z.boolean().default(false),
});

export type VitalsUpdateData = z.infer<typeof VitalsUpdateDataSchema>;

// ==================== CONNECTION QUALITY TYPES ====================
export const ConnectionQualitySchema = z.object({
  userId: z.string(),
  roomId: z.string(),
  quality: z.enum(['excellent', 'good', 'fair', 'poor']),
  stats: z.object({
    latency: z.number(), // milliseconds
    packetLoss: z.number(), // percentage
    jitter: z.number(), // milliseconds
    bandwidth: z.object({
      upload: z.number(), // kbps
      download: z.number(), // kbps
    }),
  }),
  timestamp: z.date().default(() => new Date()),
});

export type ConnectionQuality = z.infer<typeof ConnectionQualitySchema>;

// ==================== ROOM EVENTS ====================
export const RoomEventSchema = z.object({
  type: z.enum([
    'room-created',
    'room-ended',
    'participant-joined',
    'participant-left',
    'recording-started',
    'recording-stopped',
    'media-toggled',
    'emergency-declared',
  ]),
  roomId: z.string(),
  userId: z.string(),
  timestamp: z.date().default(() => new Date()),
  data: z.any().optional(),
});

export type RoomEvent = z.infer<typeof RoomEventSchema>;

// ==================== ERROR TYPES ====================
export const SignalingErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  roomId: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

export type SignalingError = z.infer<typeof SignalingErrorSchema>;