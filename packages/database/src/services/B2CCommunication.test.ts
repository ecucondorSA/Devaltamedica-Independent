/**
 * 🧪 B2C COMMUNICATION SERVICE TESTS
 * Tests unitarios para los servicios de comunicación B2C
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  jobApplicationsService,
  messagingService,
  interviewsService,
  notificationsService,
  communicationEventsService
} from './B2CCommunicationService'
import { JobApplication, Interview, B2CNotification } from '@altamedica/types'

// Mock de Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() })
  },
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn()
  }))
}))

vi.mock('@altamedica/firebase', () => ({
  app: {}
}))

// Datos de prueba
const mockJobApplication: Partial<JobApplication> = {
  jobOfferId: 'job-123',
  doctorId: 'doctor-456',
  companyId: 'company-789',
  doctorProfile: {
    fullName: 'Dr. Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+57 300 123 4567',
    specialties: ['cardiology'],
    experience: 8,
    certifications: ['Board Certified Cardiologist']
  },
  coverLetter: 'Estoy muy interesado en esta posición...',
  expectedSalary: {
    amount: 15000000,
    currency: 'COP',
    period: 'monthly'
  },
  availability: {
    startDate: new Date(),
    schedule: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isFullTime: true
  }
}

const mockInterview: Partial<Interview> = {
  applicationId: 'app-123',
  jobOfferId: 'job-123',
  doctorId: 'doctor-456',
  companyId: 'company-789',
  type: 'video',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  duration: 60,
  interviewers: [
    {
      id: 'interviewer-1',
      name: 'Ana García',
      role: 'HR Manager',
      email: 'ana.garcia@company.com'
    }
  ]
}

const mockNotification: Partial<B2CNotification> = {
  recipientId: 'company-789',
  recipientType: 'company',
  type: 'job_application',
  title: 'Nueva aplicación recibida',
  message: 'Dr. Juan Pérez aplicó para la posición de cardiólogo',
  priority: 'medium',
  category: 'hiring'
}

describe('B2C Communication Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Job Applications Service', () => {
    it('should submit a job application successfully', async () => {
      // Mock addDoc para que devuelva un ID
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-application-123' })
      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        addDoc: mockAddDoc
      }))

      const result = await jobApplicationsService.submitApplication(mockJobApplication)
      expect(result).toBe('new-application-123')
    })

    it('should get company applications', async () => {
      const mockApplications = [
        { id: 'app-1', ...mockJobApplication },
        { id: 'app-2', ...mockJobApplication, doctorId: 'doctor-different' }
      ]

      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: mockApplications.map(app => ({
          id: app.id,
          data: () => app
        }))
      })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        getDocs: mockGetDocs
      }))

      const result = await jobApplicationsService.getCompanyApplications('company-789')
      expect(result).toHaveLength(2)
      expect(result[0].companyId).toBe('company-789')
    })

    it('should update application status', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => mockJobApplication
      })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        updateDoc: mockUpdateDoc,
        getDoc: mockGetDoc
      }))

      await expect(
        jobApplicationsService.updateApplicationStatus(
          'app-123',
          'accepted',
          'company-789',
          'Excelente perfil profesional'
        )
      ).resolves.not.toThrow()
    })
  })

  describe('Messaging Service', () => {
    it('should send a message successfully', async () => {
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockJobApplication, messages: [] })
      })
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        getDoc: mockGetDoc,
        updateDoc: mockUpdateDoc
      }))

      await expect(
        messagingService.sendMessage(
          'app-123',
          'company-789',
          'company',
          'Gracias por aplicar. Estamos revisando tu perfil.',
          'text'
        )
      ).resolves.not.toThrow()
    })

    it('should mark message as read', async () => {
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockJobApplication,
          messages: [
            {
              id: 'msg-123',
              content: 'Test message',
              senderId: 'doctor-456',
              senderType: 'doctor',
              sentAt: new Date()
            }
          ]
        })
      })
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        getDoc: mockGetDoc,
        updateDoc: mockUpdateDoc
      }))

      await expect(
        messagingService.markMessageAsRead('app-123', 'msg-123')
      ).resolves.not.toThrow()
    })
  })

  describe('Interviews Service', () => {
    it('should schedule an interview successfully', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'interview-123' })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        addDoc: mockAddDoc
      }))

      const result = await interviewsService.scheduleInterview(mockInterview)
      expect(result).toBe('interview-123')
    })

    it('should get company interviews', async () => {
      const mockInterviews = [
        { id: 'interview-1', ...mockInterview },
        { id: 'interview-2', ...mockInterview, doctorId: 'doctor-different' }
      ]

      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: mockInterviews.map(interview => ({
          id: interview.id,
          data: () => interview
        }))
      })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        getDocs: mockGetDocs
      }))

      const result = await interviewsService.getCompanyInterviews('company-789')
      expect(result).toHaveLength(2)
    })

    it('should get doctor interviews', async () => {
      const mockInterviews = [
        { id: 'interview-1', ...mockInterview },
        { id: 'interview-2', ...mockInterview, companyId: 'company-different' }
      ]

      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: mockInterviews.map(interview => ({
          id: interview.id,
          data: () => interview
        }))
      })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        getDocs: mockGetDocs
      }))

      const result = await interviewsService.getDoctorInterviews('doctor-456')
      expect(result).toHaveLength(2)
    })
  })

  describe('Notifications Service', () => {
    it('should create a notification', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'notification-123' })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        addDoc: mockAddDoc
      }))

      const result = await notificationsService.createNotification(mockNotification)
      expect(result).toBe('notification-123')
    })

    it('should get user notifications', async () => {
      const mockNotifications = [
        { id: 'notif-1', ...mockNotification },
        { id: 'notif-2', ...mockNotification, type: 'message' as const }
      ]

      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: mockNotifications.map(notif => ({
          id: notif.id,
          data: () => notif
        }))
      })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        getDocs: mockGetDocs
      }))

      const result = await notificationsService.getUserNotifications(
        'company-789',
        'company'
      )
      expect(result).toHaveLength(2)
    })

    it('should mark notification as read', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        updateDoc: mockUpdateDoc
      }))

      await expect(
        notificationsService.markAsRead('notification-123')
      ).resolves.not.toThrow()
    })
  })

  describe('Communication Events Service', () => {
    it('should log communication event', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'event-123' })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        addDoc: mockAddDoc
      }))

      await expect(
        communicationEventsService.logEvent({
          type: 'application_submitted',
          triggeredBy: 'doctor-456',
          triggeredFor: 'company-789',
          entityId: 'app-123',
          entityType: 'application',
          source: 'doctors_app'
        })
      ).resolves.not.toThrow()
    })

    it('should not throw if logging fails', async () => {
      const mockAddDoc = vi.fn().mockRejectedValue(new Error('Network error'))

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        addDoc: mockAddDoc
      }))

      // El servicio debe capturar el error y no hacer throw
      await expect(
        communicationEventsService.logEvent({
          type: 'message_sent',
          triggeredBy: 'company-789',
          triggeredFor: 'doctor-456',
          entityId: 'app-123',
          entityType: 'message',
          source: 'companies_app'
        })
      ).resolves.not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle Firestore connection errors', async () => {
      const mockGetDocs = vi.fn().mockRejectedValue(new Error('Firestore unavailable'))

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        getDocs: mockGetDocs
      }))

      await expect(
        jobApplicationsService.getCompanyApplications('company-789')
      ).rejects.toThrow('Firestore unavailable')
    })

    it('should handle invalid application data', async () => {
      const mockAddDoc = vi.fn().mockRejectedValue(new Error('Invalid data'))

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        addDoc: mockAddDoc
      }))

      await expect(
        jobApplicationsService.submitApplication({})
      ).rejects.toThrow('Invalid data')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete application flow', async () => {
      // 1. Submit application
      const mockAddDocApplication = vi.fn().mockResolvedValue({ id: 'app-123' })
      
      // 2. Create notification  
      const mockAddDocNotification = vi.fn().mockResolvedValue({ id: 'notif-123' })
      
      // 3. Log event
      const mockAddDocEvent = vi.fn().mockResolvedValue({ id: 'event-123' })

      const mockAddDoc = vi.fn()
        .mockResolvedValueOnce({ id: 'app-123' })      // Application
        .mockResolvedValueOnce({ id: 'notif-123' })    // Notification
        .mockResolvedValueOnce({ id: 'event-123' })    // Event

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        addDoc: mockAddDoc
      }))

      const applicationId = await jobApplicationsService.submitApplication(mockJobApplication)
      expect(applicationId).toBe('app-123')
      expect(mockAddDoc).toHaveBeenCalledTimes(3) // Application + Notification + Event
    })

    it('should handle interview scheduling with status update', async () => {
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockJobApplication, messages: [] })
      })
      
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'interview-123' })

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        getDoc: mockGetDoc,
        updateDoc: mockUpdateDoc,
        addDoc: mockAddDoc
      }))

      const interviewId = await interviewsService.scheduleInterview({
        ...mockInterview,
        applicationId: 'app-123'
      })

      expect(interviewId).toBe('interview-123')
      expect(mockAddDoc).toHaveBeenCalled() // Interview creation
    })
  })
})