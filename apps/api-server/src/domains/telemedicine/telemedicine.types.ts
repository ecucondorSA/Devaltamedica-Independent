export interface TelemedicineSession {
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
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  message: string;
  timestamp: Date;
}

export interface CreateSessionData {
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  createdBy?: string;
}

export interface UpdateSessionData {
  notes?: string;
  recordingUrl?: string;
  updatedBy?: string;
}

export interface EndSessionData {
  notes?: string;
  recordingUrl?: string;
  endedBy?: string;
}

export interface RoomInfo {
  available: boolean;
  status: string;
  participants: {
    patientId: string;
    doctorId: string;
  };
  scheduledAt: Date;
  startedAt?: Date;
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageDuration: number;
  period: string;
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'offline';
  timestamp: Date;
  services: {
    database: 'connected' | 'disconnected';
    webrtc: 'connected' | 'disconnected';
  };
  roomStats?: {
    activeRooms: number;
    totalConnections: number;
  };
}