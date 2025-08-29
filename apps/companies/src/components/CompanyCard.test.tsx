/**
 * 🧪 ALTAMEDICA COMPANIES - COMPONENT TESTS
 * Tests de integración para componentes de empresas
 */
import { Button, Card, Input } from '@altamedica/ui';
import { Company } from '@altamedica/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CompanyCard from './CompanyCard'

// Mock del hook de navegación
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Datos de prueba
const mockCompany: Company = {
  id: '1',
  name: 'Hospital Universitario',
  type: 'hospital',
  address: {
    street: 'Av. Principal 123',
    city: 'Barcelona',
    state: 'Cataluña',
    zipCode: '08001',
    country: 'España'
  },
  contactInfo: {
    phone: '+34912345678',
    email: 'info@hospital.com',
    website: 'https://hospital.com'
  },
  businessHours: {
    monday: { open: '08:00', close: '20:00', closed: false },
    tuesday: { open: '08:00', close: '20:00', closed: false },
    wednesday: { open: '08:00', close: '20:00', closed: false },
    thursday: { open: '08:00', close: '20:00', closed: false },
    friday: { open: '08:00', close: '20:00', closed: false },
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
  description: 'Hospital universitario con excelente atención médica',
  isVerified: true,
  isActive: true,
  rating: 4.5,
  reviewCount: 150,
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
    languages: ['es', 'en', 'ca']
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-01-01')
}

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  TestWrapper.displayName = 'TestWrapper'
  
  return TestWrapper
}

describe('CompanyCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    const Wrapper = createWrapper()
    return render(
      <Wrapper>
        <CompanyCard company={mockCompany} {...props} />
      </Wrapper>
    )
  }

  it('should render company information correctly', () => {
    renderComponent()

    // Verificar información básica
    expect(screen.getByTestId('company-name')).toHaveTextContent('Hospital Universitario')
    expect(screen.getByTestId('company-type')).toHaveTextContent('Hospital')
    expect(screen.getByTestId('company-address')).toHaveTextContent('Barcelona, Cataluña')
    expect(screen.getByTestId('company-rating')).toHaveTextContent('4.5')
    expect(screen.getByTestId('company-reviews')).toHaveTextContent('150 reseñas')
  })

  it('should display company specialties', () => {
    renderComponent()

    expect(screen.getByTestId('company-specialties')).toBeInTheDocument()
    expect(screen.getByText('Cardiología')).toBeInTheDocument()
    expect(screen.getByText('Neurología')).toBeInTheDocument()
  })

  it('should show verification badge for verified companies', () => {
    renderComponent()

    expect(screen.getByTestId('verified-badge')).toBeInTheDocument()
    expect(screen.getByTestId('verified-badge')).toHaveTextContent('Verificado')
  })

  it('should not show verification badge for unverified companies', () => {
    const unverifiedCompany = { ...mockCompany, isVerified: false }
    renderComponent({ company: unverifiedCompany })

    expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument()
  })

  it('should display configuration badges', () => {
    renderComponent()

    expect(screen.getByTestId('online-booking-badge')).toBeInTheDocument()
    expect(screen.getByTestId('telehealth-badge')).toBeInTheDocument()
    expect(screen.getByTestId('insurance-badge')).toBeInTheDocument()
    expect(screen.getByTestId('emergency-badge')).toBeInTheDocument()
  })

  it('should handle click to view company details', () => {
    renderComponent()

    const viewDetailsButton = screen.getByTestId('view-company-details')
    fireEvent.click(viewDetailsButton)

    expect(mockPush).toHaveBeenCalledWith('/companies/1')
  })

  it('should handle book appointment action', () => {
    renderComponent()

    const bookButton = screen.getByTestId('book-appointment')
    fireEvent.click(bookButton)

    expect(mockPush).toHaveBeenCalledWith('/companies/1/booking')
  })

  it('should display company logo with fallback', () => {
    renderComponent()

    const logo = screen.getByTestId('company-logo')
    expect(logo).toHaveAttribute('src', 'https://test.com/logo.png')
    expect(logo).toHaveAttribute('alt', 'Logo de Hospital Universitario')
  })

  it('should handle logo error and show fallback', async () => {
    renderComponent()

    const logo = screen.getByTestId('company-logo')
    
    // Simular error de carga de imagen
    fireEvent.error(logo)

    await waitFor(() => {
      expect(screen.getByTestId('company-logo-fallback')).toBeInTheDocument()
    })
  })

  it('should show distance when provided', () => {
    renderComponent({ distance: 2.5 })

    expect(screen.getByTestId('company-distance')).toHaveTextContent('2.5 km')
  })

  it('should not show distance when not provided', () => {
    renderComponent()

    expect(screen.queryByTestId('company-distance')).not.toBeInTheDocument()
  })

  it('should be keyboard accessible', () => {
    renderComponent()

    const card = screen.getByTestId('company-card')
    const viewButton = screen.getByTestId('view-company-details')
    const bookButton = screen.getByTestId('book-appointment')

    // Verificar que los elementos pueden recibir focus
    expect(card).toHaveAttribute('tabIndex', '0')
    expect(viewButton).not.toHaveAttribute('disabled')
    expect(bookButton).not.toHaveAttribute('disabled')

    // Simular navegación con teclado
    card.focus()
    expect(document.activeElement).toBe(card)

    fireEvent.keyDown(card, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/companies/1')
  })

  it('should have proper aria labels for accessibility', () => {
    renderComponent()

    const card = screen.getByTestId('company-card')
    const rating = screen.getByTestId('company-rating')
    const bookButton = screen.getByTestId('book-appointment')

    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Hospital Universitario'))
    expect(rating).toHaveAttribute('aria-label', 'Calificación: 4.5 de 5 estrellas')
    expect(bookButton).toHaveAttribute('aria-label', 'Reservar cita en Hospital Universitario')
  })

  it('should handle favorite toggle action', async () => {
    const mockToggleFavorite = vi.fn().mockResolvedValue({ isFavorite: true })
    renderComponent({ onToggleFavorite: mockToggleFavorite })

    const favoriteButton = screen.getByTestId('toggle-favorite')
    fireEvent.click(favoriteButton)

    expect(mockToggleFavorite).toHaveBeenCalledWith('1')

    await waitFor(() => {
      expect(screen.getByTestId('favorite-icon-filled')).toBeInTheDocument()
    })
  })

  it('should show loading state while toggling favorite', async () => {
    const mockToggleFavorite = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    renderComponent({ onToggleFavorite: mockToggleFavorite })

    const favoriteButton = screen.getByTestId('toggle-favorite')
    fireEvent.click(favoriteButton)

    expect(screen.getByTestId('favorite-loading')).toBeInTheDocument()
  })

  it('should display business hours indicator', () => {
    renderComponent()

    // Mock current time to be during business hours
    const mockDate = new Date('2024-01-15T10:00:00') // Monday 10 AM
    vi.setSystemTime(mockDate)

    expect(screen.getByTestId('business-hours-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('open-status')).toHaveTextContent('Abierto')
  })

  it('should show closed status outside business hours', () => {
    // Mock current time to be Sunday
    const mockDate = new Date('2024-01-14T10:00:00') // Sunday 10 AM
    vi.setSystemTime(mockDate)

    renderComponent()

    expect(screen.getByTestId('business-hours-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('closed-status')).toHaveTextContent('Cerrado')
  })

  it('should handle responsive design', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    renderComponent()

    const card = screen.getByTestId('company-card')
    expect(card).toHaveClass('company-card', 'company-card--mobile')
  })

  it('should display emergency services badge when available', () => {
    renderComponent()

    expect(screen.getByTestId('emergency-badge')).toBeInTheDocument()
    expect(screen.getByTestId('emergency-badge')).toHaveTextContent('Emergencias')
  })

  it('should handle company card hover effects', () => {
    renderComponent()

    const card = screen.getByTestId('company-card')
    
    fireEvent.mouseEnter(card)
    expect(card).toHaveClass('company-card--hover')

    fireEvent.mouseLeave(card)
    expect(card).not.toHaveClass('company-card--hover')
  })

  it('should display all supported languages', () => {
    renderComponent()

    const languageList = screen.getByTestId('language-list')
    expect(languageList).toHaveTextContent('Español')
    expect(languageList).toHaveTextContent('Inglés')
    expect(languageList).toHaveTextContent('Catalán')
  })

  it('should show staff count when available', () => {
    renderComponent()

    expect(screen.getByTestId('staff-count')).toHaveTextContent('150 profesionales')
  })

  it('should show bed count for hospitals', () => {
    renderComponent()

    expect(screen.getByTestId('beds-count')).toHaveTextContent('50 camas')
  })

  it('should not show bed count for non-hospital types', () => {
    const clinicCompany = { ...mockCompany, type: 'clinic' as const, bedsCount: undefined }
    renderComponent({ company: clinicCompany })

    expect(screen.queryByTestId('beds-count')).not.toBeInTheDocument()
  })

  it('should handle error states gracefully', () => {
    const errorCompany = { ...mockCompany, name: undefined } as any
    
    expect(() => renderComponent({ company: errorCompany })).not.toThrow()
  })

  it('should match snapshot', () => {
    const { container } = renderComponent()
    expect(container.firstChild).toMatchSnapshot()
  })
})


