/**
 * 🏥 UNIFIED TELEMEDICINE SERVICE
 * Sistema centralizado de telemedicina para toda la plataforma AltaMedica
 *
 * Este servicio unifica y reemplaza:
 * - apps/doctors/src/services/telemedicine-service.ts
 * - apps/patients/src/services/telemedicine-service.ts
 * - apps/api-server/src/services/telemedicine.service.ts
 *
 * @package @altamedica/telemedicine-core
 * @since 2025-08-16
 */

import { z } from 'zod';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

export const TelemedicineSessionSchema = z.object({
  id: z.string(),
  appointmentId: z.string().optional(),
  patientId: z.string(),
  doctorId: z.string(),
  roomId: z.string(),
  sessionType: z.enum(['video', 'audio', 'chat']),
  provider: z.enum(['webrtc', 'mediasoup', 'agora', 'zoom', 'google_meet']),
  status: z.enum(['scheduled', 'waiting', 'active', 'completed', 'cancelled']),

  // Timing
  scheduledAt: z.date().optional(),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  duration: z.number().optional(), // minutes

  // Participants
  doctor: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      avatar: z.string().optional(),
      specialty: z.string().optional(),
    })
    .optional(),

  patient: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      avatar: z.string().optional(),
      medicalRecordNumber: z.string().optional(),
    })
    .optional(),

  // Quality metrics
  quality: z
    .object({
      video: z.number().min(0).max(100),
      audio: z.number().min(0).max(100),
      connection: z.number().min(0).max(100),
      latency: z.number().optional(),
      packetLoss: z.number().optional(),
    })
    .optional(),

  // Session data
  notes: z.string().optional(),
  recordings: z.array(z.string()).optional(),
  prescriptions: z.array(z.string()).optional(),

  // WebRTC configuration
  webrtcConfig: z
    .object({
      iceServers: z.array(
        z.object({
          urls: z.union([z.string(), z.array(z.string())]),
          username: z.string().optional(),
          credential: z.string().optional(),
        }),
      ),
      constraints: z.any().optional(),
      signalingUrl: z.string().optional(),
    })
    .optional(),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type TelemedicineSession = z.infer<typeof TelemedicineSessionSchema>;

export const CreateSessionRequestSchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string(),
  doctorId: z.string(),
  sessionType: z.enum(['video', 'audio', 'chat']),
  provider: z.enum(['webrtc', 'mediasoup', 'agora', 'zoom', 'google_meet']).default('webrtc'),
  scheduledAt: z.date().optional(),
  duration: z.number().min(5).max(180).default(30), // minutes
  notes: z.string().optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

export const JoinSessionRequestSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  userType: z.enum(['patient', 'doctor', 'observer']),
  deviceInfo: z
    .object({
      browser: z.string(),
      os: z.string(),
      device: z.string(),
    })
    .optional(),
});

export type JoinSessionRequest = z.infer<typeof JoinSessionRequestSchema>;

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface ITelemedicineService {
  // Session management
  createSession(data: CreateSessionRequest): Promise<TelemedicineSession>;
  getSession(sessionId: string): Promise<TelemedicineSession | null>;
  updateSession(
    sessionId: string,
    data: Partial<TelemedicineSession>,
  ): Promise<TelemedicineSession>;
  deleteSession(sessionId: string): Promise<void>;

  // Session operations
  joinSession(request: JoinSessionRequest): Promise<{
    session: TelemedicineSession;
    token: string;
    webrtcConfig: any;
  }>;
  leaveSession(sessionId: string, userId: string): Promise<void>;
  endSession(sessionId: string): Promise<void>;

  // Queries
  getActiveSessions(): Promise<TelemedicineSession[]>;
  getSessionsByDoctor(doctorId: string): Promise<TelemedicineSession[]>;
  getSessionsByPatient(patientId: string): Promise<TelemedicineSession[]>;
  getUpcomingSessions(
    userId: string,
    userType: 'patient' | 'doctor',
  ): Promise<TelemedicineSession[]>;

  // Quality and metrics
  updateQualityMetrics(sessionId: string, metrics: TelemedicineSession['quality']): Promise<void>;
  getSessionMetrics(sessionId: string): Promise<any>;

  // Emergency
  createEmergencySession(patientId: string): Promise<TelemedicineSession>;
  escalateToEmergency(sessionId: string): Promise<void>;
}

// ============================================================================
// UNIFIED SERVICE IMPLEMENTATION
// ============================================================================

export class UnifiedTelemedicineService implements ITelemedicineService {
  private apiUrl: string;
  private wsUrl: string;
  private signalingUrl: string;

  constructor(config?: { apiUrl?: string; wsUrl?: string; signalingUrl?: string }) {
    this.apiUrl = config?.apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.wsUrl = config?.wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    this.signalingUrl =
      config?.signalingUrl || process.env.NEXT_PUBLIC_SIGNALING_URL || 'ws://localhost:8888';
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async createSession(data: CreateSessionRequest): Promise<TelemedicineSession> {
    const validated = CreateSessionRequestSchema.parse(data);

    const response = await fetch(`${this.apiUrl}/api/v1/telemedicine/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(validated),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const result = await response.json();
    return TelemedicineSessionSchema.parse(result);
  }

  async getSession(sessionId: string): Promise<TelemedicineSession | null> {
    const response = await fetch(`${this.apiUrl}/api/v1/telemedicine/sessions/${sessionId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    const result = await response.json();
    return TelemedicineSessionSchema.parse(result);
  }

  async updateSession(
    sessionId: string,
    data: Partial<TelemedicineSession>,
  ): Promise<TelemedicineSession> {
    const response = await fetch(`${this.apiUrl}/api/v1/telemedicine/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update session: ${response.statusText}`);
    }

    const result = await response.json();
    return TelemedicineSessionSchema.parse(result);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/v1/telemedicine/sessions/${sessionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  async joinSession(request: JoinSessionRequest): Promise<{
    session: TelemedicineSession;
    token: string;
    webrtcConfig: any;
  }> {
    const validated = JoinSessionRequestSchema.parse(request);

    const response = await fetch(
      `${this.apiUrl}/api/v1/telemedicine/sessions/${validated.sessionId}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: validated.userId,
          userType: validated.userType,
          deviceInfo: validated.deviceInfo,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to join session: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      session: TelemedicineSessionSchema.parse(result.session),
      token: result.token,
      webrtcConfig: result.webrtcConfig,
    };
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/v1/telemedicine/sessions/${sessionId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to leave session: ${response.statusText}`);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/v1/telemedicine/sessions/${sessionId}/end`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to end session: ${response.statusText}`);
    }
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  async getActiveSessions(): Promise<TelemedicineSession[]> {
    const response = await fetch(`${this.apiUrl}/api/v1/telemedicine/sessions?status=active`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get active sessions: ${response.statusText}`);
    }

    const result = await response.json();
    return z.array(TelemedicineSessionSchema).parse(result.sessions || result);
  }

  async getSessionsByDoctor(doctorId: string): Promise<TelemedicineSession[]> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/telemedicine/sessions?doctorId=${doctorId}`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get doctor sessions: ${response.statusText}`);
    }

    const result = await response.json();
    return z.array(TelemedicineSessionSchema).parse(result.sessions || result);
  }

  async getSessionsByPatient(patientId: string): Promise<TelemedicineSession[]> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/telemedicine/sessions?patientId=${patientId}`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get patient sessions: ${response.statusText}`);
    }

    const result = await response.json();
    return z.array(TelemedicineSessionSchema).parse(result.sessions || result);
  }

  async getUpcomingSessions(
    userId: string,
    userType: 'patient' | 'doctor',
  ): Promise<TelemedicineSession[]> {
    const queryParam = userType === 'doctor' ? 'doctorId' : 'patientId';
    const response = await fetch(
      `${this.apiUrl}/api/v1/telemedicine/sessions?${queryParam}=${userId}&status=scheduled&upcoming=true`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get upcoming sessions: ${response.statusText}`);
    }

    const result = await response.json();
    return z.array(TelemedicineSessionSchema).parse(result.sessions || result);
  }

  // ============================================================================
  // QUALITY AND METRICS
  // ============================================================================

  async updateQualityMetrics(
    sessionId: string,
    metrics: TelemedicineSession['quality'],
  ): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/telemedicine/sessions/${sessionId}/quality`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(metrics),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update quality metrics: ${response.statusText}`);
    }
  }

  async getSessionMetrics(sessionId: string): Promise<any> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/telemedicine/sessions/${sessionId}/metrics`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get session metrics: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // EMERGENCY
  // ============================================================================

  async createEmergencySession(patientId: string): Promise<TelemedicineSession> {
    const response = await fetch(`${this.apiUrl}/api/v1/telemedicine/emergency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ patientId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create emergency session: ${response.statusText}`);
    }

    const result = await response.json();
    return TelemedicineSessionSchema.parse(result);
  }

  async escalateToEmergency(sessionId: string): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/telemedicine/sessions/${sessionId}/escalate`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to escalate session: ${response.statusText}`);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: UnifiedTelemedicineService | null = null;

export function getTelemedicineService(config?: {
  apiUrl?: string;
  wsUrl?: string;
  signalingUrl?: string;
}): UnifiedTelemedicineService {
  if (!instance) {
    instance = new UnifiedTelemedicineService(config);
  }
  return instance;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default UnifiedTelemedicineService;
