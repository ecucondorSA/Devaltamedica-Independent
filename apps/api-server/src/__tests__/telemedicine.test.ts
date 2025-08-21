import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { app } from '../app';
import { createTestDatabase, clearTestDatabase } from './test-utils';
import { createMocks } from 'node-mocks-http';
import { POST as createSession } from '../app/api/v1/telemedicine/session/route.ts';

// Mock de servicios externos
jest.mock('../services/telemedicineService', () => ({
  TelemedicineService: {
    getStats: jest.fn(),
    getActiveSessions: jest.fn(),
    getSessionDetails: jest.fn(),
    endSession: jest.fn(),
    getConnectionQuality: jest.fn(),
  },
}));

jest.mock('../services/notificationService', () => ({
  NotificationService: {
    sendNotification: jest.fn(),
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAsArchived: jest.fn(),
    deleteNotification: jest.fn(),
    updateSettings: jest.fn(),
    getSettings: jest.fn(),
  },
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = {
      id: '1',
      email: 'test@example.com',
      role: 'patient',
    };
    next();
  }),
}));

jest.mock('../middleware/hipaa', () => ({
  logHIPAAEvent: jest.fn((req, res, next) => next()),
}));

describe('Telemedicine API Endpoints', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await clearTestDatabase(testDb);
  });

  describe('GET /api/v1/telemedicine/stats', () => {
    it('should return telemedicine statistics', async () => {
      const mockStats = {
        activeSessions: 5,
        totalSessions: 25,
        averageDuration: 45,
        participantsOnline: 12,
        connectionQuality: {
          excellent: 75,
          good: 20,
          poor: 5,
        },
        sessionsByType: {
          consultation: 15,
          follow_up: 8,
          emergency: 2,
        },
        systemHealth: {
          status: 'healthy',
          cpu: 35,
          memory: 45,
          network: 15,
        },
      };

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getStats as any).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/telemedicine/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats,
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.getStats).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getStats as any).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/v1/telemedicine/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Error interno del servidor',
        timestamp: expect.any(String),
      });
    });

    it('should require authentication', async () => {
      const { authenticateToken } = await import('../middleware/auth');
      (authenticateToken as any).mockImplementation((req, res) => {
        res.status(401).json({ error: 'Token requerido' });
      });

      const response = await request(app)
        .get('/api/v1/telemedicine/stats')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Token requerido',
      });
    });
  });

  describe('GET /api/v1/telemedicine/sessions', () => {
    it('should return active sessions', async () => {
      const mockSessions = [
        {
          id: '1',
          roomId: 'room-1',
          patientName: 'John Doe',
          doctorName: 'Dr. Smith',
          startTime: '2024-01-15T10:00:00Z',
          duration: 30,
          status: 'active',
          participants: 2,
          connectionQuality: 'excellent',
        },
        {
          id: '2',
          roomId: 'room-2',
          patientName: 'Jane Smith',
          doctorName: 'Dr. Johnson',
          startTime: '2024-01-15T11:00:00Z',
          duration: 45,
          status: 'active',
          participants: 2,
          connectionQuality: 'good',
        },
      ];

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getActiveSessions as any).mockResolvedValue(mockSessions);

      const response = await request(app)
        .get('/api/v1/telemedicine/sessions')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { sessions: mockSessions },
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.getActiveSessions).toHaveBeenCalled();
    });

    it('should handle empty sessions list', async () => {
      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getActiveSessions as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/telemedicine/sessions')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { sessions: [] },
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /api/v1/telemedicine/sessions/:sessionId', () => {
    it('should return session details', async () => {
      const mockSession = {
        id: '1',
        roomId: 'room-1',
        patientName: 'John Doe',
        doctorName: 'Dr. Smith',
        startTime: '2024-01-15T10:00:00Z',
        duration: 30,
        status: 'active',
        participants: [
          {
            id: '1',
            name: 'John Doe',
            role: 'patient',
            joinedAt: '2024-01-15T10:00:00Z',
          },
          {
            id: '2',
            name: 'Dr. Smith',
            role: 'doctor',
            joinedAt: '2024-01-15T10:05:00Z',
          },
        ],
        connectionQuality: 'excellent',
        chatMessages: [],
        vitals: [],
      };

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getSessionDetails as any).mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/api/v1/telemedicine/sessions/1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockSession,
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.getSessionDetails).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent session', async () => {
      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getSessionDetails as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/telemedicine/sessions/999')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Sesión no encontrada',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/v1/telemedicine/sessions/:sessionId/end', () => {
    it('should end session successfully', async () => {
      const mockEndedSession = {
        id: '1',
        endTime: '2024-01-15T10:30:00Z',
        duration: 30,
        status: 'ended',
      };

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.endSession as any).mockResolvedValue(mockEndedSession);

      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/end')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockEndedSession,
        message: 'Sesión finalizada exitosamente',
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.endSession).toHaveBeenCalledWith('1');
    });

    it('should handle session end errors', async () => {
      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.endSession as any).mockRejectedValue(new Error('Session already ended'));

      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/end')
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Session already ended',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /api/v1/telemedicine/connection-quality', () => {
    it('should return connection quality metrics', async () => {
      const mockQuality = {
        latency: 100,
        bandwidth: 1000,
        packetLoss: 0.5,
        jitter: 10,
        quality: 'excellent',
        recommendations: [
          'La conexión es óptima para telemedicina',
          'Se recomienda mantener la configuración actual',
        ],
      };

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getConnectionQuality as any).mockResolvedValue(mockQuality);

      const response = await request(app)
        .get('/api/v1/telemedicine/connection-quality')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockQuality,
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.getConnectionQuality).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/telemedicine/sessions/:sessionId/chat', () => {
    it('should send chat message', async () => {
      const mockMessage = {
        id: '1',
        sessionId: '1',
        senderId: '1',
        senderName: 'John Doe',
        message: 'Hello doctor',
        timestamp: '2024-01-15T10:15:00Z',
        type: 'text',
      };

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.sendChatMessage as any).mockResolvedValue(mockMessage);

      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/chat')
        .set('Authorization', 'Bearer test-token')
        .send({
          message: 'Hello doctor',
          type: 'text',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockMessage,
        message: 'Mensaje enviado exitosamente',
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.sendChatMessage).toHaveBeenCalledWith('1', {
        message: 'Hello doctor',
        type: 'text',
        senderId: '1',
      });
    });

    it('should validate message content', async () => {
      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/chat')
        .set('Authorization', 'Bearer test-token')
        .send({
          message: '',
          type: 'text',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'El mensaje no puede estar vacío',
        timestamp: expect.any(String),
      });
    });

    it('should validate message type', async () => {
      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/chat')
        .set('Authorization', 'Bearer test-token')
        .send({
          message: 'Test message',
          type: 'invalid',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Tipo de mensaje no válido',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/v1/telemedicine/sessions/:sessionId/vitals', () => {
    it('should share vitals data', async () => {
      const mockVitals = {
        id: '1',
        sessionId: '1',
        heartRate: 75,
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
        },
        temperature: 36.5,
        oxygenSaturation: 98,
        timestamp: '2024-01-15T10:20:00Z',
      };

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.shareVitals as any).mockResolvedValue(mockVitals);

      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/vitals')
        .set('Authorization', 'Bearer test-token')
        .send({
          heartRate: 75,
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
          },
          temperature: 36.5,
          oxygenSaturation: 98,
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockVitals,
        message: 'Signos vitales compartidos exitosamente',
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.shareVitals).toHaveBeenCalledWith('1', {
        heartRate: 75,
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
        },
        temperature: 36.5,
        oxygenSaturation: 98,
      });
    });

    it('should validate vitals data', async () => {
      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/vitals')
        .set('Authorization', 'Bearer test-token')
        .send({
          heartRate: -10, // Invalid value
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
          },
          temperature: 36.5,
          oxygenSaturation: 98,
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Datos de signos vitales inválidos',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /api/v1/telemedicine/sessions/:sessionId/chat', () => {
    it('should return chat messages for session', async () => {
      const mockMessages = [
        {
          id: '1',
          sessionId: '1',
          senderId: '1',
          senderName: 'John Doe',
          message: 'Hello doctor',
          timestamp: '2024-01-15T10:15:00Z',
          type: 'text',
        },
        {
          id: '2',
          sessionId: '1',
          senderId: '2',
          senderName: 'Dr. Smith',
          message: 'Hello John, how are you feeling?',
          timestamp: '2024-01-15T10:16:00Z',
          type: 'text',
        },
      ];

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getChatMessages as any).mockResolvedValue(mockMessages);

      const response = await request(app)
        .get('/api/v1/telemedicine/sessions/1/chat')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { messages: mockMessages },
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.getChatMessages).toHaveBeenCalledWith('1');
    });
  });

  describe('GET /api/v1/telemedicine/sessions/:sessionId/vitals', () => {
    it('should return vitals history for session', async () => {
      const mockVitals = [
        {
          id: '1',
          sessionId: '1',
          heartRate: 75,
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
          },
          temperature: 36.5,
          oxygenSaturation: 98,
          timestamp: '2024-01-15T10:20:00Z',
        },
        {
          id: '2',
          sessionId: '1',
          heartRate: 78,
          bloodPressure: {
            systolic: 125,
            diastolic: 82,
          },
          temperature: 36.6,
          oxygenSaturation: 97,
          timestamp: '2024-01-15T10:25:00Z',
        },
      ];

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getVitalsHistory as any).mockResolvedValue(mockVitals);

      const response = await request(app)
        .get('/api/v1/telemedicine/sessions/1/vitals')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { vitals: mockVitals },
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.getVitalsHistory).toHaveBeenCalledWith('1');
    });
  });

  describe('POST /api/v1/telemedicine/sessions/:sessionId/record', () => {
    it('should start session recording', async () => {
      const mockRecording = {
        id: '1',
        sessionId: '1',
        status: 'recording',
        startTime: '2024-01-15T10:30:00Z',
        recordingUrl: null,
      };

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.startRecording as any).mockResolvedValue(mockRecording);

      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/record')
        .set('Authorization', 'Bearer test-token')
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockRecording,
        message: 'Grabación iniciada exitosamente',
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.startRecording).toHaveBeenCalledWith('1');
    });

    it('should stop session recording', async () => {
      const mockRecording = {
        id: '1',
        sessionId: '1',
        status: 'stopped',
        startTime: '2024-01-15T10:30:00Z',
        endTime: '2024-01-15T10:45:00Z',
        recordingUrl: 'https://example.com/recording.mp4',
      };

      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.stopRecording as any).mockResolvedValue(mockRecording);

      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/record/stop')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockRecording,
        message: 'Grabación detenida exitosamente',
        timestamp: expect.any(String),
      });

      expect(TelemedicineService.stopRecording).toHaveBeenCalledWith('1');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getStats as any).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/telemedicine/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Error interno del servidor',
        timestamp: expect.any(String),
      });
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/telemedicine/sessions/1/chat')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'El mensaje no puede estar vacío',
        timestamp: expect.any(String),
      });
    });

    it('should handle unauthorized access', async () => {
      const { authenticateToken } = await import('../middleware/auth');
      (authenticateToken as any).mockImplementation((req, res) => {
        res.status(403).json({ error: 'Acceso denegado' });
      });

      const response = await request(app)
        .get('/api/v1/telemedicine/stats')
        .expect(403);

      expect(response.body).toEqual({
        error: 'Acceso denegado',
      });
    });
  });

  describe('HIPAA Compliance', () => {
    it('should log HIPAA events for sensitive operations', async () => {
      const { logHIPAAEvent } = await import('../middleware/hipaa');
      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.getSessionDetails as any).mockResolvedValue({
        id: '1',
        patientName: 'John Doe',
      });

      await request(app)
        .get('/api/v1/telemedicine/sessions/1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(logHIPAAEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SESSION_ACCESS',
          userId: '1',
          sessionId: '1',
          details: expect.any(String),
        })
      );
    });

    it('should log HIPAA events for session end', async () => {
      const { logHIPAAEvent } = await import('../middleware/hipaa');
      const { TelemedicineService } = await import('../services/telemedicineService');
      (TelemedicineService.endSession as any).mockResolvedValue({
        id: '1',
        status: 'ended',
      });

      await request(app)
        .post('/api/v1/telemedicine/sessions/1/end')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(logHIPAAEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SESSION_END',
          userId: '1',
          sessionId: '1',
          details: expect.any(String),
        })
      );
    });
  });

  describe('POST /api/v1/telemedicine/session', () => {
    it('should create telemedicine session', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: {
          doctorId: 'doctor-123',
          patientId: 'patient-456',
          appointmentId: 'appointment-789',
          sessionType: 'video-consultation'
        }
      });

      await createSession(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.sessionId).toBeDefined();
      expect(data.data.roomUrl).toBeDefined();
      expect(data.data.encryptionKey).toBeDefined();
    });

    it('should validate session parameters', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { invalid: 'data' }
      });

      await createSession(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should enforce HIPAA compliance', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: {
          doctorId: 'doctor-123',
          patientId: 'patient-456',
          appointmentId: 'appointment-789',
          sessionType: 'video-consultation'
        }
      });

      await createSession(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.compliance).toBeDefined();
      expect(data.data.compliance.hipaa).toBe(true);
      expect(data.data.compliance.auditTrail).toBe(true);
    });
  });
}); 