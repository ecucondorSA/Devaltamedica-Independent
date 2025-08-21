/**
 * 🧪 B2C COMMUNICATION HOOKS TESTS
 * Tests unitarios para los hooks de comunicación B2C
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useCompanyToDoctorCommunication,
  useDoctorToCompanyCommunication,
  useJobApplication,
  useUnreadNotificationsCount
} from './useB2CCommunication'
import {
  jobApplicationsService,
  messagingService,
  interviewsService,
  notificationsService,
  realtimeService
} from '@altamedica/database'
import { JobApplication } from '@altamedica/types'

// Mock de los servicios
vi.mock('@altamedica/database', () => ({
  jobApplicationsService: {
    getCompanyApplications: vi.fn(),
    getDoctorApplications: vi.fn(),
    submitApplication: vi.fn(),
    updateApplicationStatus: vi.fn(),
    getApplication: vi.fn()
  },
  messagingService: {
    sendMessage: vi.fn(),
    markMessageAsRead: vi.fn()
  },
  interviewsService: {
    getCompanyInterviews: vi.fn(),
    getDoctorInterviews: vi.fn(),
    scheduleInterview: vi.fn()
  },
  notificationsService: {
    getUserNotifications: vi.fn(),
    markAsRead: vi.fn()
  },
  realtimeService: {
    subscribeToApplicationUpdates: vi.fn(),
    subscribeToNotifications: vi.fn()
  }
}))

// Datos de prueba
const mockApplication: JobApplication = {
  id: 'app-123',
  jobOfferId: 'job-456',
  doctorId: 'doctor-789',
  companyId: 'company-101',
  doctorProfile: {
    fullName: 'Dr. María González',
    email: 'maria.gonzalez@email.com',
    phone: '+57 301 234 5678',
    specialties: ['neurology'],
    experience: 10,
    certifications: ['Board Certified Neurologist']
  },
  status: 'pending',
  appliedAt: new Date('2024-01-15'),
  messages: [],
  source: 'marketplace',
  priority: 'medium',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  coverLetter: 'Tengo gran interés en esta posición...',
  expectedSalary: {
    amount: 18000000,
    currency: 'COP',
    period: 'monthly'
  },
  availability: {
    startDate: new Date('2024-02-01'),
    schedule: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isFullTime: true
  }
}

const mockInterview = {
  id: 'interview-123',
  applicationId: 'app-123',
  jobOfferId: 'job-456',
  doctorId: 'doctor-789',
  companyId: 'company-101',
  type: 'video' as const,
  scheduledAt: new Date('2024-01-20T10:00:00'),
  duration: 60,
  status: 'scheduled' as const,
  interviewers: [
    {
      id: 'interviewer-1',
      name: 'Carlos Ruiz',
      role: 'Medical Director',
      email: 'carlos.ruiz@company.com'
    }
  ],
  timeZone: 'America/Bogota',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  proposedTimes: [],
  remindersSent: []
}

const mockNotification = {
  id: 'notif-123',
  recipientId: 'company-101',
  recipientType: 'company' as const,
  type: 'job_application' as const,
  title: 'Nueva aplicación',
  message: 'Dr. María González aplicó para neurólogo',
  isRead: false,
  priority: 'medium' as const,
  category: 'hiring' as const,
  relatedId: 'app-123',
  relatedType: 'application' as const,
  createdAt: new Date('2024-01-15')
}

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  TestWrapper.displayName = 'TestWrapper'
  
  return TestWrapper
}

describe('B2C Communication Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCompanyToDoctorCommunication', () => {
    it('should fetch company applications successfully', async () => {
      const mockApplications = [mockApplication]
      const mockInterviews = [mockInterview]
      const mockNotifications = [mockNotification]

      vi.mocked(jobApplicationsService.getCompanyApplications).mockResolvedValue(mockApplications)
      vi.mocked(interviewsService.getCompanyInterviews).mockResolvedValue(mockInterviews)
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue(mockNotifications)

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useCompanyToDoctorCommunication('company-101'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.applications).toEqual(mockApplications)
        expect(result.current.interviews).toEqual(mockInterviews)
        expect(result.current.notifications).toEqual(mockNotifications)
      })

      expect(jobApplicationsService.getCompanyApplications).toHaveBeenCalledWith('company-101')
      expect(interviewsService.getCompanyInterviews).toHaveBeenCalledWith('company-101')
      expect(notificationsService.getUserNotifications).toHaveBeenCalledWith('company-101', 'company')
    })

    it('should update application status successfully', async () => {
      vi.mocked(jobApplicationsService.getCompanyApplications).mockResolvedValue([])
      vi.mocked(interviewsService.getCompanyInterviews).mockResolvedValue([])
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue([])
      vi.mocked(jobApplicationsService.updateApplicationStatus).mockResolvedValue()

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useCompanyToDoctorCommunication('company-101'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.updateApplicationStatus('app-123', 'accepted', 'Excelente perfil')

      await waitFor(() => {
        expect(jobApplicationsService.updateApplicationStatus).toHaveBeenCalledWith(
          'app-123',
          'accepted',
          'company-101',
          'Excelente perfil'
        )
      })
    })

    it('should schedule interview successfully', async () => {
      vi.mocked(jobApplicationsService.getCompanyApplications).mockResolvedValue([])
      vi.mocked(interviewsService.getCompanyInterviews).mockResolvedValue([])
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue([])
      vi.mocked(interviewsService.scheduleInterview).mockResolvedValue('interview-new')

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useCompanyToDoctorCommunication('company-101'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const interviewData = {
        applicationId: 'app-123',
        doctorId: 'doctor-789',
        type: 'video' as const,
        scheduledAt: new Date(),
        duration: 60
      }

      result.current.scheduleInterview(interviewData)

      await waitFor(() => {
        expect(interviewsService.scheduleInterview).toHaveBeenCalledWith({
          ...interviewData,
          companyId: 'company-101'
        })
      })
    })

    it('should send message successfully', async () => {
      vi.mocked(jobApplicationsService.getCompanyApplications).mockResolvedValue([])
      vi.mocked(interviewsService.getCompanyInterviews).mockResolvedValue([])
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue([])
      vi.mocked(messagingService.sendMessage).mockResolvedValue()

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useCompanyToDoctorCommunication('company-101'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.sendMessage('app-123', 'Gracias por aplicar', 'text')

      await waitFor(() => {
        expect(messagingService.sendMessage).toHaveBeenCalledWith(
          'app-123',
          'company-101',
          'company',
          'Gracias por aplicar',
          'text'
        )
      })
    })

    it('should handle real-time subscriptions', async () => {
      const mockUnsubscribe = vi.fn()
      
      vi.mocked(jobApplicationsService.getCompanyApplications).mockResolvedValue([])
      vi.mocked(interviewsService.getCompanyInterviews).mockResolvedValue([])
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue([])
      vi.mocked(realtimeService.subscribeToApplicationUpdates).mockReturnValue(mockUnsubscribe)
      vi.mocked(realtimeService.subscribeToNotifications).mockReturnValue(mockUnsubscribe)

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useCompanyToDoctorCommunication('company-101'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const mockCallback = vi.fn()
      const unsubscribe = result.current.subscribeToUpdates(mockCallback)

      expect(realtimeService.subscribeToApplicationUpdates).toHaveBeenCalledWith(
        'company-101',
        'company',
        expect.any(Function)
      )
      expect(realtimeService.subscribeToNotifications).toHaveBeenCalledWith(
        'company-101',
        'company',
        expect.any(Function)
      )

      // Cleanup
      unsubscribe()
      expect(mockUnsubscribe).toHaveBeenCalledTimes(2)
    })
  })

  describe('useDoctorToCompanyCommunication', () => {
    it('should fetch doctor applications successfully', async () => {
      const mockApplications = [mockApplication]
      const mockInterviews = [mockInterview]
      const mockNotifications = [mockNotification]

      vi.mocked(jobApplicationsService.getDoctorApplications).mockResolvedValue(mockApplications)
      vi.mocked(interviewsService.getDoctorInterviews).mockResolvedValue(mockInterviews)
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue(mockNotifications)

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useDoctorToCompanyCommunication('doctor-789'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.applications).toEqual(mockApplications)
        expect(result.current.interviews).toEqual(mockInterviews)
        expect(result.current.notifications).toEqual(mockNotifications)
      })

      expect(jobApplicationsService.getDoctorApplications).toHaveBeenCalledWith('doctor-789')
      expect(interviewsService.getDoctorInterviews).toHaveBeenCalledWith('doctor-789')
      expect(notificationsService.getUserNotifications).toHaveBeenCalledWith('doctor-789', 'doctor')
    })

    it('should submit application successfully', async () => {
      vi.mocked(jobApplicationsService.getDoctorApplications).mockResolvedValue([])
      vi.mocked(interviewsService.getDoctorInterviews).mockResolvedValue([])
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue([])
      vi.mocked(jobApplicationsService.submitApplication).mockResolvedValue('app-new')

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useDoctorToCompanyCommunication('doctor-789'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const applicationData = {
        jobOfferId: 'job-456',
        companyId: 'company-101',
        coverLetter: 'Me interesa mucho esta posición...'
      }

      result.current.submitApplication(applicationData)

      await waitFor(() => {
        expect(jobApplicationsService.submitApplication).toHaveBeenCalledWith({
          ...applicationData,
          doctorId: 'doctor-789'
        })
      })
    })
  })

  describe('useJobApplication', () => {
    it('should fetch single application successfully', async () => {
      vi.mocked(jobApplicationsService.getApplication).mockResolvedValue(mockApplication)

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useJobApplication('app-123'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockApplication)
        expect(result.current.isSuccess).toBe(true)
      })

      expect(jobApplicationsService.getApplication).toHaveBeenCalledWith('app-123')
    })

    it('should not fetch when applicationId is empty', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useJobApplication(''),
        { wrapper }
      )

      expect(result.current.fetchStatus).toBe('idle')
      expect(jobApplicationsService.getApplication).not.toHaveBeenCalled()
    })
  })

  describe('useUnreadNotificationsCount', () => {
    it('should count unread notifications correctly', async () => {
      const unreadNotifications = [
        { ...mockNotification, id: 'notif-1', isRead: false },
        { ...mockNotification, id: 'notif-2', isRead: false },
        { ...mockNotification, id: 'notif-3', isRead: false }
      ]

      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue(unreadNotifications)

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useUnreadNotificationsCount('company-101', 'company'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current).toBe(3)
      })

      expect(notificationsService.getUserNotifications).toHaveBeenCalledWith(
        'company-101',
        'company',
        true // unreadOnly = true
      )
    })

    it('should return 0 when no unread notifications', async () => {
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue([])

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useUnreadNotificationsCount('doctor-789', 'doctor'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current).toBe(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Service unavailable')
      
      vi.mocked(jobApplicationsService.getCompanyApplications).mockRejectedValue(error)
      vi.mocked(interviewsService.getCompanyInterviews).mockResolvedValue([])
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue([])

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useCompanyToDoctorCommunication('company-101'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(error)
      })
    })

    it('should handle mutation errors', async () => {
      vi.mocked(jobApplicationsService.getCompanyApplications).mockResolvedValue([])
      vi.mocked(interviewsService.getCompanyInterviews).mockResolvedValue([])
      vi.mocked(notificationsService.getUserNotifications).mockResolvedValue([])
      
      const error = new Error('Update failed')
      vi.mocked(jobApplicationsService.updateApplicationStatus).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useCompanyToDoctorCommunication('company-101'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.updateApplicationStatus('app-123', 'accepted')

      await waitFor(() => {
        expect(result.current.error).toEqual(error)
      })
    })
  })
})