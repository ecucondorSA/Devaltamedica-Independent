import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import DoctorDashboard from '../DoctorDashboard';

// Mock de useAuth
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'Dr. María',
      lastName: 'García',
      email: 'maria.garcia@altamedica.com',
      role: 'doctor',
      specialty: 'Cardiología',
      license: 'MED123456',
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

describe('DoctorDashboard Component', () => {
  const mockAppointments = [
    {
      id: '1',
      patientName: 'Juan Pérez',
      patientId: 'P001',
      date: '2024-01-15',
      time: '10:00',
      status: 'confirmed',
      type: 'in-person',
      symptoms: 'Dolor en el pecho',
      priority: 'high',
    },
    {
      id: '2',
      patientName: 'Ana López',
      patientId: 'P002',
      date: '2024-01-15',
      time: '11:00',
      status: 'pending',
      type: 'telemedicine',
      symptoms: 'Control rutinario',
      priority: 'normal',
    },
  ];

  const mockPatients = [
    {
      id: 'P001',
      firstName: 'Juan',
      lastName: 'Pérez',
      age: 45,
      gender: 'male',
      lastVisit: '2024-01-01',
      nextAppointment: '2024-01-15',
    },
    {
      id: 'P002',
      firstName: 'Ana',
      lastName: 'López',
      age: 32,
      gender: 'female',
      lastVisit: '2023-12-15',
      nextAppointment: '2024-01-15',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de fetch para appointments
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: mockAppointments }),
    });

    // Mock de fetch para patients
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ patients: mockPatients }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render dashboard with doctor information', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Bienvenido, Dr. María García')).toBeInTheDocument();
        expect(screen.getByText('Panel de Doctor')).toBeInTheDocument();
        expect(screen.getByText('Cardiología')).toBeInTheDocument();
      });
    });

    it('should render navigation menu', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Citas')).toBeInTheDocument();
        expect(screen.getByText('Pacientes')).toBeInTheDocument();
        expect(screen.getByText('Telemedicina')).toBeInTheDocument();
        expect(screen.getByText('Historial')).toBeInTheDocument();
        expect(screen.getByText('Perfil')).toBeInTheDocument();
      });
    });

    it('should render appointments section', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Citas de Hoy')).toBeInTheDocument();
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('Ana López')).toBeInTheDocument();
      });
    });

    it('should render patients section', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Pacientes Activos')).toBeInTheDocument();
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('45 años')).toBeInTheDocument();
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

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const appointmentsLink = screen.getByText('Citas');
        fireEvent.click(appointmentsLink);
        expect(mockPush).toHaveBeenCalledWith('/appointments');
      });
    });

    it('should navigate to patients page when clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const patientsLink = screen.getByText('Pacientes');
        fireEvent.click(patientsLink);
        expect(mockPush).toHaveBeenCalledWith('/patients');
      });
    });

    it('should navigate to telemedicine page when clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const telemedicineLink = screen.getByText('Telemedicina');
        fireEvent.click(telemedicineLink);
        expect(mockPush).toHaveBeenCalledWith('/telemedicine');
      });
    });
  });

  describe('Appointment Management', () => {
    it('should show appointment details when clicked', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const appointmentCard = screen.getByText('Juan Pérez');
        fireEvent.click(appointmentCard);
        
        expect(screen.getByText('Detalles de la Cita')).toBeInTheDocument();
        expect(screen.getByText('Dolor en el pecho')).toBeInTheDocument();
        expect(screen.getByText('Alta Prioridad')).toBeInTheDocument();
      });
    });

    it('should start appointment when start button is clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const startButton = screen.getByText('Iniciar Cita');
        fireEvent.click(startButton);
        
        expect(mockPush).toHaveBeenCalledWith('/appointments/1/start');
      });
    });

    it('should reschedule appointment when reschedule button is clicked', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const rescheduleButton = screen.getByText('Reprogramar');
        fireEvent.click(rescheduleButton);
        
        expect(screen.getByText('Reprogramar Cita')).toBeInTheDocument();
      });
    });

    it('should cancel appointment when cancel button is clicked', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<DoctorDashboard />);
      
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
  });

  describe('Patient Management', () => {
    it('should show patient details when clicked', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const patientCard = screen.getByText('Juan Pérez');
        fireEvent.click(patientCard);
        
        expect(screen.getByText('Historial del Paciente')).toBeInTheDocument();
        expect(screen.getByText('45 años')).toBeInTheDocument();
        expect(screen.getByText('Masculino')).toBeInTheDocument();
      });
    });

    it('should navigate to patient medical record when view record button is clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const viewRecordButton = screen.getByText('Ver Historial');
        fireEvent.click(viewRecordButton);
        
        expect(mockPush).toHaveBeenCalledWith('/patients/P001/medical-record');
      });
    });

    it('should schedule new appointment when schedule button is clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const scheduleButton = screen.getByText('Agendar Cita');
        fireEvent.click(scheduleButton);
        
        expect(mockPush).toHaveBeenCalledWith('/appointments/new?patientId=P001');
      });
    });
  });

  describe('Priority Management', () => {
    it('should show high priority appointments first', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const appointmentCards = screen.getAllByTestId('appointment-card');
        const firstAppointment = appointmentCards[0];
        
        expect(firstAppointment).toHaveTextContent('Juan Pérez');
        expect(firstAppointment).toHaveTextContent('Alta Prioridad');
      });
    });

    it('should filter appointments by priority', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const highPriorityFilter = screen.getByText('Alta Prioridad');
        fireEvent.click(highPriorityFilter);
        
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.queryByText('Ana López')).not.toBeInTheDocument();
      });
    });
  });

  describe('Telemedicine Integration', () => {
    it('should start telemedicine session when telemedicine button is clicked', async () => {
      const mockPush = jest.fn();
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const telemedicineButton = screen.getByText('Iniciar Sesión');
        fireEvent.click(telemedicineButton);
        
        expect(mockPush).toHaveBeenCalledWith('/telemedicine/session/2');
      });
    });

    it('should show telemedicine status for telemedicine appointments', async () => {
      render(<DoctorDashboard />);
      
      await waitFor(() => {
        const telemedicineAppointment = screen.getByText('Ana López').closest('[data-testid="appointment-card"]');
        expect(telemedicineAppointment).toHaveTextContent('Telemedicina');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when appointments fetch fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error al cargar las citas')).toBeInTheDocument();
      });
    });

    it('should show error message when patients fetch fails', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ appointments: mockAppointments }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<DoctorDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error al cargar los pacientes')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching data', () => {
      (fetch as any).mockImplementation(() => new Promise(() => {}));

      render(<DoctorDashboard />);
      
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

      render(<DoctorDashboard />);
      
      expect(screen.getByLabelText('Abrir menú')).toBeInTheDocument();
    });

    it('should toggle mobile menu when hamburger button is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<DoctorDashboard />);
      
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Cerrar menú')).toBeInTheDocument();
    });
  });
}); 