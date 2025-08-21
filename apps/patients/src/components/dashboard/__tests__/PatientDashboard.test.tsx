import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import PatientDashboard from '../PatientDashboard';

// Mock de useAuth
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'patient',
    },
    logout: jest.fn(),
  }),
}));

// Mock de useToast
jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock de useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock de fetch para API calls
global.fetch = jest.fn();

describe('PatientDashboard Component', () => {
  const mockAppointments = [
    {
      id: '1',
      doctorName: 'Dr. Smith',
      specialty: 'Cardiología',
      date: '2024-01-15',
      time: '10:00',
      status: 'confirmed',
      type: 'in-person',
    },
    {
      id: '2',
      doctorName: 'Dr. Johnson',
      specialty: 'Dermatología',
      date: '2024-01-20',
      time: '14:30',
      status: 'pending',
      type: 'telemedicine',
    },
  ];

  const mockMedicalRecords = [
    {
      id: '1',
      date: '2024-01-10',
      type: 'Consulta',
      doctor: 'Dr. Smith',
      diagnosis: 'Hipertensión controlada',
      prescription: 'Medicamento A',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de fetch para appointments
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: mockAppointments }),
    });

    // Mock de fetch para medical records
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: mockMedicalRecords }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render dashboard with patient information', async () => {
      render(<PatientDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Bienvenido, John Doe')).toBeInTheDocument();
        expect(screen.getByText('Panel de Paciente')).toBeInTheDocument();
      });
    });

    it('should render navigation menu', async () => {
      render(<PatientDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Citas')).toBeInTheDocument();
        expect(screen.getByText('Historial Médico')).toBeInTheDocument();
        expect(screen.getByText('Telemedicina')).toBeInTheDocument();
        expect(screen.getByText('Perfil')).toBeInTheDocument();
      });
    });

    it('should render appointments section', async () => {
      render(<PatientDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Próximas Citas')).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('Cardiología')).toBeInTheDocument();
      });
    });

    it('should render medical records section', async () => {
      render(<PatientDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Historial Médico')).toBeInTheDocument();
        expect(screen.getByText('Hipertensión controlada')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to appointments page when clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<PatientDashboard />);
      
      await waitFor(() => {
        const appointmentsLink = screen.getByText('Citas');
        fireEvent.click(appointmentsLink);
        expect(mockPush).toHaveBeenCalledWith('/appointments');
      });
    });

    it('should navigate to telemedicine page when clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<PatientDashboard />);
      
      await waitFor(() => {
        const telemedicineLink = screen.getByText('Telemedicina');
        fireEvent.click(telemedicineLink);
        expect(mockPush).toHaveBeenCalledWith('/telemedicine');
      });
    });

    it('should navigate to profile page when clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<PatientDashboard />);
      
      await waitFor(() => {
        const profileLink = screen.getByText('Perfil');
        fireEvent.click(profileLink);
        expect(mockPush).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('Appointment Actions', () => {
    it('should show appointment details when clicked', async () => {
      render(<PatientDashboard />);
      
      await waitFor(() => {
        const appointmentCard = screen.getByText('Dr. Smith');
        fireEvent.click(appointmentCard);
        
        expect(screen.getByText('Detalles de la Cita')).toBeInTheDocument();
        expect(screen.getByText('Fecha: 15/01/2024')).toBeInTheDocument();
        expect(screen.getByText('Hora: 10:00')).toBeInTheDocument();
      });
    });

    it('should cancel appointment when cancel button is clicked', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<PatientDashboard />);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);
        
        expect(fetch).toHaveBeenCalledWith('/api/appointments/1/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      });
    });

    it('should reschedule appointment when reschedule button is clicked', async () => {
      render(<PatientDashboard />);
      
      await waitFor(() => {
        const rescheduleButton = screen.getByText('Reprogramar');
        fireEvent.click(rescheduleButton);
        
        expect(screen.getByText('Reprogramar Cita')).toBeInTheDocument();
      });
    });
  });

  describe('Medical Records', () => {
    it('should show medical record details when clicked', async () => {
      render(<PatientDashboard />);
      
      await waitFor(() => {
        const recordCard = screen.getByText('Hipertensión controlada');
        fireEvent.click(recordCard);
        
        expect(screen.getByText('Detalles del Registro')).toBeInTheDocument();
        expect(screen.getByText('Medicamento A')).toBeInTheDocument();
      });
    });

    it('should download medical record when download button is clicked', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const mockCreateObjectURL = jest.fn(() => 'blob:test');
      URL.createObjectURL = mockCreateObjectURL;

      render(<PatientDashboard />);
      
      await waitFor(() => {
        const downloadButton = screen.getByText('Descargar');
        fireEvent.click(downloadButton);
        
        expect(fetch).toHaveBeenCalledWith('/api/medical-records/1/download');
        expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when appointments fetch fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<PatientDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error al cargar las citas')).toBeInTheDocument();
      });
    });

    it('should show error message when medical records fetch fails', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<PatientDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error al cargar el historial médico')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching data', () => {
      (fetch as any).mockImplementation(() => new Promise(() => {}));

      render(<PatientDashboard />);
      
      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile menu when screen is small', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<PatientDashboard />);
      
      expect(screen.getByLabelText('Abrir menú')).toBeInTheDocument();
    });

    it('should toggle mobile menu when hamburger button is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<PatientDashboard />);
      
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Cerrar menú')).toBeInTheDocument();
    });
  });
}); 