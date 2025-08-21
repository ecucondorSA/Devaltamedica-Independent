/**
 * 🧪 ALTAMEDICA COMPANIES - TESTS DE HOOKS
 * Tests unitarios para hooks de gestión de empresas
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import {
    useCompanies,
    useCompany,
    useCompanyAnalytics,
    useCompanyDashboard,
    useCompanyDoctors,
    useCompanySearch,
    useCreateCompany,
    useDeleteCompany,
    useJobOffers,
    usePaginatedCompanies,
    useUpdateCompany
} from '@altamedica/hooks'
import { companyService } from '../services/companyService'

// Mock del servicio
vi.mock('../services/companyService', () => ({
  companyService: {
    getCompanies: vi.fn(),
    getCompany: vi.fn(),
    createCompany: vi.fn(),
    updateCompany: vi.fn(),
    deleteCompany: vi.fn(),
    getCompanyDoctors: vi.fn(),
    getJobOffers: vi.fn(),
    getCompanyAnalytics: vi.fn(),
    getNearbyCompanies: vi.fn(),
    getCompanyStats: vi.fn(),
    getFavoriteCompanies: vi.fn(),
    toggleFavoriteCompany: vi.fn(),
  }
}))

// Datos de prueba
const mockCompany = {
  id: '1',
  name: 'Hospital Test',
  type: 'hospital' as const,
  address: {
    street: 'Test Street 123',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Test Country'
  },
  contactInfo: {
    phone: '+1234567890',
    email: 'test@hospital.com',
    website: 'https://test-hospital.com'
  },
  businessHours: {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true }
  },
  specialties: ['cardiology', 'neurology'],
  services: ['emergency', 'surgery'],
  accreditations: ['joint_commission'],
  certifications: ['iso_9001'],
  staffCount: 150,
  bedsCount: 50,
  foundedYear: 1995,
  description: 'Test hospital description',
  isVerified: true,
  isActive: true,
  rating: 4.5,
  reviewCount: 100,
  logoUrl: 'https://test.com/logo.png',
  images: ['https://test.com/image1.png'],
  tags: ['quality', 'emergency'],
  metadata: {},
  configuration: {
    allowOnlineBooking: true,
    allowTelehealth: true,
    acceptsInsurance: true,
    emergencyServices: true,
    requiresAppointment: false,
    languages: ['en', 'es']
  },
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockCompanies = [mockCompany]

const mockDoctors = [
  {
    id: '1',
    doctorId: 'doc1',
    companyId: '1',
    role: 'cardiologist',
    isActive: true,
    joinedAt: new Date(),
    salary: 150000,
    workSchedule: ['monday', 'tuesday', 'wednesday'],
    permissions: ['read', 'write']
  }
]

const mockJobOffers = [
  {
    id: '1',
    companyId: '1',
    title: 'Cardiologist Position',
    description: 'Looking for experienced cardiologist',
    requirements: ['MD degree', '5+ years experience'],
    responsibilities: ['Patient care', 'Surgery'],
    department: 'Cardiology',
    employmentType: 'full_time' as const,
    experienceLevel: 'senior' as const,
    location: 'Test City',
    isRemote: false,
    salary: {
      min: 150000,
      max: 200000,
      currency: 'USD',
      period: 'annual' as const
    },
    benefits: ['health_insurance', 'dental'],
    skills: ['cardiology', 'surgery'],
    postedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    applicationsCount: 10,
    status: 'open' as const
  }
]

const mockAnalytics = {
  period: 'monthly',
  totalPatients: 1000,
  totalRevenue: 500000,
  averageRating: 4.5,
  totalReviews: 100,
  doctorCount: 20,
  patientGrowth: 5.2,
  revenueGrowth: 8.1,
  satisfactionScore: 4.3,
  departmentPerformance: {},
  monthlyStats: [],
  topServices: []
}

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  TestWrapper.displayName = 'TestWrapper'
  
  return TestWrapper
}

describe('Company Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCompanies', () => {
    it('should fetch companies successfully', async () => {
      const mockService = companyService.getCompanies as Mock
      mockService.mockResolvedValue({ data: mockCompanies, pagination: { page: 1, limit: 20, total: 1 } })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanies(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.data).toEqual(mockCompanies)
      expect(mockService).toHaveBeenCalledWith(undefined)
    })

    it('should fetch companies with filters', async () => {
      const filters = { type: 'hospital' as const, city: 'Test City' }
      const mockService = companyService.getCompanies as Mock
      mockService.mockResolvedValue({ data: mockCompanies, pagination: { page: 1, limit: 20, total: 1 } })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanies(filters), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockService).toHaveBeenCalledWith(filters)
    })

    it('should handle error when fetching companies', async () => {
      const mockService = companyService.getCompanies as Mock
      mockService.mockRejectedValue(new Error('Network error'))

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanies(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('useCompany', () => {
    it('should fetch single company successfully', async () => {
      const mockService = companyService.getCompany as Mock
      mockService.mockResolvedValue({ data: mockCompany })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompany('1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.data).toEqual(mockCompany)
      expect(mockService).toHaveBeenCalledWith('1')
    })

    it('should not fetch when id is empty', () => {
      const mockService = companyService.getCompany as Mock

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompany(''), { wrapper })

      expect(result.current.isPending).toBe(true)
      expect(mockService).not.toHaveBeenCalled()
    })
  })

  describe('useCreateCompany', () => {
    it('should create company successfully', async () => {
      const newCompanyData = {
        name: 'New Hospital',
        type: 'hospital' as const,
        address: mockCompany.address,
        contactInfo: mockCompany.contactInfo,
        businessHours: mockCompany.businessHours
      }

      const mockService = companyService.createCompany as Mock
      mockService.mockResolvedValue({ data: { ...mockCompany, ...newCompanyData } })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateCompany(), { wrapper })

      result.current.mutate(newCompanyData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockService).toHaveBeenCalledWith(newCompanyData)
    })

    it('should handle error when creating company', async () => {
      const newCompanyData = {
        name: 'New Hospital',
        type: 'hospital' as const,
        address: mockCompany.address,
        contactInfo: mockCompany.contactInfo,
        businessHours: mockCompany.businessHours
      }

      const mockService = companyService.createCompany as Mock
      mockService.mockRejectedValue(new Error('Validation error'))

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateCompany(), { wrapper })

      result.current.mutate(newCompanyData)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('useUpdateCompany', () => {
    it('should update company successfully', async () => {
      const updateData = { name: 'Updated Hospital' }
      const mockService = companyService.updateCompany as Mock
      mockService.mockResolvedValue({ data: { ...mockCompany, ...updateData } })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUpdateCompany(), { wrapper })

      result.current.mutate({ id: '1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockService).toHaveBeenCalledWith('1', updateData)
    })
  })

  describe('useDeleteCompany', () => {
    it('should delete company successfully', async () => {
      const mockService = companyService.deleteCompany as Mock
      mockService.mockResolvedValue({ success: true })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteCompany(), { wrapper })

      result.current.mutate('1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockService).toHaveBeenCalledWith('1')
    })
  })

  describe('useCompanyDoctors', () => {
    it('should fetch company doctors successfully', async () => {
      const mockService = companyService.getCompanyDoctors as Mock
      mockService.mockResolvedValue({ data: mockDoctors })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanyDoctors('1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.data).toEqual(mockDoctors)
      expect(mockService).toHaveBeenCalledWith('1')
    })
  })

  describe('useJobOffers', () => {
    it('should fetch job offers successfully', async () => {
      const mockService = companyService.getJobOffers as Mock
      mockService.mockResolvedValue({ data: mockJobOffers })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useJobOffers('1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.data).toEqual(mockJobOffers)
      expect(mockService).toHaveBeenCalledWith('1')
    })
  })

  describe('useCompanyAnalytics', () => {
    it('should fetch company analytics successfully', async () => {
      const mockService = companyService.getCompanyAnalytics as Mock
      mockService.mockResolvedValue({ data: mockAnalytics })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanyAnalytics('1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.data).toEqual(mockAnalytics)
      expect(mockService).toHaveBeenCalledWith('1', 'monthly')
    })

    it('should fetch analytics with custom period', async () => {
      const mockService = companyService.getCompanyAnalytics as Mock
      mockService.mockResolvedValue({ data: { ...mockAnalytics, period: 'weekly' } })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanyAnalytics('1', 'weekly'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockService).toHaveBeenCalledWith('1', 'weekly')
    })
  })

  describe('useCompanySearch', () => {
    it('should initialize with empty filters', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanySearch(), { wrapper })

      expect(result.current.filters).toEqual({})
    })

    it('should update filters', async () => {
      const mockService = companyService.getCompanies as Mock
      mockService.mockResolvedValue({ data: mockCompanies })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanySearch(), { wrapper })

      const newFilters = { type: 'hospital' as const }
      result.current.updateFilters(newFilters)

      expect(result.current.filters).toEqual(newFilters)
    })

    it('should clear filters', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanySearch(), { wrapper })

      result.current.updateFilters({ type: 'hospital' as const })
      result.current.clearFilters()

      expect(result.current.filters).toEqual({})
    })
  })

  describe('usePaginatedCompanies', () => {
    it('should handle pagination', async () => {
      const mockService = companyService.getCompanies as Mock
      mockService.mockResolvedValue({
        data: mockCompanies,
        pagination: { page: 1, limit: 20, total: 50, hasNext: true, hasPrev: false }
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => usePaginatedCompanies(20), { wrapper })

      await waitFor(() => {
        expect(result.current.companies).toEqual(mockCompanies)
      })

      expect(result.current.page).toBe(1)
      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.hasPrevPage).toBe(false)

      // Test next page
      result.current.nextPage()
      expect(result.current.page).toBe(2)

      // Test prev page
      result.current.prevPage()
      expect(result.current.page).toBe(1)
    })
  })

  describe('useCompanyDashboard', () => {
    it('should aggregate dashboard data', async () => {
      const mockCompanyService = companyService.getCompany as Mock
      const mockDoctorsService = companyService.getCompanyDoctors as Mock
      const mockJobOffersService = companyService.getJobOffers as Mock
      const mockAnalyticsService = companyService.getCompanyAnalytics as Mock

      mockCompanyService.mockResolvedValue({ data: mockCompany })
      mockDoctorsService.mockResolvedValue({ data: mockDoctors })
      mockJobOffersService.mockResolvedValue({ data: mockJobOffers })
      mockAnalyticsService.mockResolvedValue({ data: mockAnalytics })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanyDashboard('1'), { wrapper })

      await waitFor(() => {
        expect(result.current.company?.data).toEqual(mockCompany)
        expect(result.current.doctors?.data).toEqual(mockDoctors)
        expect(result.current.jobOffers?.data).toEqual(mockJobOffers)
        expect(result.current.analytics?.data).toEqual(mockAnalytics)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle loading state', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCompanyDashboard('1'), { wrapper })

      expect(result.current.isLoading).toBe(true)
    })
  })
})
