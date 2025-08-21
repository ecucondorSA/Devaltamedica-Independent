import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmergencyPage from '../../app/emergency/page.tsx';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('EmergencyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset geolocation mock
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 41.3851,
          longitude: 2.1734,
        },
      });
    });
  });

  it('renders emergency page header', () => {
    render(<EmergencyPage />);
    
    expect(screen.getByText('Servicios de Emergencia')).toBeInTheDocument();
    expect(screen.getByText('Encuentra atención médica de urgencia cerca de ti')).toBeInTheDocument();
  });

  it('renders emergency warning', () => {
    render(<EmergencyPage />);
    
    expect(screen.getByText(/En caso de emergencia grave, llame al 112 inmediatamente/)).toBeInTheDocument();
  });

  it('renders emergency form', () => {
    render(<EmergencyPage />);
    
    expect(screen.getByText('Describe tu Emergencia')).toBeInTheDocument();
    expect(screen.getByTestId('emergency-type')).toBeInTheDocument();
    expect(screen.getByTestId('urgency-level')).toBeInTheDocument();
    expect(screen.getByTestId('find-emergency-care')).toBeInTheDocument();
  });

  it('shows emergency call button', () => {
    render(<EmergencyPage />);
    
    expect(screen.getByText('Emergencia Crítica')).toBeInTheDocument();
    expect(screen.getByText('Llamar 112')).toBeInTheDocument();
  });

  it('should have disabled search button initially', () => {
    render(<EmergencyPage />);
    
    const searchButton = screen.getByTestId('find-emergency-care');
    expect(searchButton).toBeDisabled();
  });

  it('enables search button when form is filled', async () => {
    const user = userEvent.setup();
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const searchButton = screen.getByTestId('find-emergency-care');
    
    await user.selectOptions(emergencyTypeSelect, 'cardiac');
    await user.selectOptions(urgencyLevelSelect, 'high');
    
    expect(searchButton).not.toBeDisabled();
  });

  it('shows loading state when searching', async () => {
    const user = userEvent.setup();
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const searchButton = screen.getByTestId('find-emergency-care');
    
    await user.selectOptions(emergencyTypeSelect, 'cardiac');
    await user.selectOptions(urgencyLevelSelect, 'high');
    await user.click(searchButton);
    
    expect(screen.getByText('Buscando...')).toBeInTheDocument();
  });

  it('displays emergency hospitals after search', async () => {
    const user = userEvent.setup();
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const searchButton = screen.getByTestId('find-emergency-care');
    
    await user.selectOptions(emergencyTypeSelect, 'cardiac');
    await user.selectOptions(urgencyLevelSelect, 'high');
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('Centros de Emergencia Cercanos (3)')).toBeInTheDocument();
    });
    
    // Check for hospital cards
    const hospitalElements = screen.getAllByTestId('emergency-hospital');
    expect(hospitalElements).toHaveLength(3);
    
    // Check for specific hospital
    expect(screen.getByText('Hospital Universitario')).toBeInTheDocument();
    expect(screen.getByText('Hospital del Mar')).toBeInTheDocument();
    expect(screen.getByText('Clínica Sant Joan')).toBeInTheDocument();
  });

  it('shows hospital details correctly', async () => {
    const user = userEvent.setup();
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const searchButton = screen.getByTestId('find-emergency-care');
    
    await user.selectOptions(emergencyTypeSelect, 'cardiac');
    await user.selectOptions(urgencyLevelSelect, 'high');
    await user.click(searchButton);
    
    await waitFor(() => {
      // Check wait times
      const waitTimes = screen.getAllByTestId('wait-time');
      expect(waitTimes[0]).toHaveTextContent('15 minutos');
      
      // Check available beds
      const availableBeds = screen.getAllByTestId('available-beds');
      expect(availableBeds[0]).toHaveTextContent('5 camas');
      
      // Check distances
      const distances = screen.getAllByTestId('distance');
      expect(distances[0]).toHaveTextContent('2.5 km');
    });
  });

  it('opens calling modal when call button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const searchButton = screen.getByTestId('find-emergency-care');
    
    await user.selectOptions(emergencyTypeSelect, 'cardiac');
    await user.selectOptions(urgencyLevelSelect, 'high');
    await user.click(searchButton);
    
    await waitFor(() => {
      const callButtons = screen.getAllByTestId('call-emergency');
      expect(callButtons[0]).toBeInTheDocument();
    });
    
    const callButtons = screen.getAllByTestId('call-emergency');
    await user.click(callButtons[0]);
    
    expect(screen.getByTestId('calling-modal')).toBeInTheDocument();
    expect(screen.getByText('Llamando a Hospital Universitario')).toBeInTheDocument();
    expect(screen.getByTestId('emergency-number')).toHaveTextContent('+34912345678');
  });

  it('closes calling modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const searchButton = screen.getByTestId('find-emergency-care');
    
    await user.selectOptions(emergencyTypeSelect, 'cardiac');
    await user.selectOptions(urgencyLevelSelect, 'high');
    await user.click(searchButton);
    
    await waitFor(() => {
      const callButtons = screen.getAllByTestId('call-emergency');
      expect(callButtons[0]).toBeInTheDocument();
    });
    
    const callButtons = screen.getAllByTestId('call-emergency');
    await user.click(callButtons[0]);
    
    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);
    
    expect(screen.queryByTestId('calling-modal')).not.toBeInTheDocument();
  });

  it('displays trauma center badges correctly', async () => {
    const user = userEvent.setup();
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const searchButton = screen.getByTestId('find-emergency-care');
    
    await user.selectOptions(emergencyTypeSelect, 'trauma');
    await user.selectOptions(urgencyLevelSelect, 'critical');
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('Centro de Trauma')).toBeInTheDocument();
    });
  });

  it('shows urgency level badge after search', async () => {
    const user = userEvent.setup();
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const searchButton = screen.getByTestId('find-emergency-care');
    
    await user.selectOptions(emergencyTypeSelect, 'cardiac');
    await user.selectOptions(urgencyLevelSelect, 'critical');
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Urgencia: Crítica - Inmediata/)).toBeInTheDocument();
    });
  });

  it('shows proper empty state message', () => {
    render(<EmergencyPage />);
    
    expect(screen.getByText('Encuentra Atención de Emergencia')).toBeInTheDocument();
    expect(screen.getByText('Completa el formulario para encontrar los centros médicos de emergencia más cercanos.')).toBeInTheDocument();
  });

  it('handles geolocation error gracefully', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({ code: 1, message: 'User denied geolocation' });
    });
    
    render(<EmergencyPage />);
    
    // Should still render the page without location
    expect(screen.getByText('Servicios de Emergencia')).toBeInTheDocument();
  });

  it('renders all emergency type options', () => {
    render(<EmergencyPage />);
    
    const emergencyTypeSelect = screen.getByTestId('emergency-type');
    const options = emergencyTypeSelect.querySelectorAll('option');
    
    expect(options).toHaveLength(7); // 6 types + default option
    expect(screen.getByText('Problemas Cardíacos')).toBeInTheDocument();
    expect(screen.getByText('Trauma/Accidente')).toBeInTheDocument();
    expect(screen.getByText('Dificultad Respiratoria')).toBeInTheDocument();
  });

  it('renders all urgency level options', () => {
    render(<EmergencyPage />);
    
    const urgencyLevelSelect = screen.getByTestId('urgency-level');
    const options = urgencyLevelSelect.querySelectorAll('option');
    
    expect(options).toHaveLength(5); // 4 levels + default option
    expect(screen.getByText('Baja - No urgente')).toBeInTheDocument();
    expect(screen.getByText('Media - Urgente')).toBeInTheDocument();
    expect(screen.getByText('Alta - Muy urgente')).toBeInTheDocument();
    expect(screen.getByText('Crítica - Inmediata')).toBeInTheDocument();
  });
});
