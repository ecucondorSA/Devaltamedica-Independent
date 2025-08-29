import useAuth from '@altamedica/auth';
import { useEffect, useState } from 'react';

import { logger } from '@altamedica/shared';
import { Patient } from '@altamedica/types';

// Removed local interface - using @altamedica/types
import { Appointment } from '@altamedica/types';

interface TelemedicineSession {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: 'waiting' | 'active' | 'ended' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  type: 'video' | 'audio' | 'chat';
  notes: string;
  symptoms: string[];
  diagnosis?: string;
  prescription?: string[];
  followUpDate?: string;
}

interface MarketplaceOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  specialty: string;
  type: 'job' | 'contract' | 'consultation' | 'partnership';
  salary: string;
  postedDate: string;
  applications: number;
  rating: number;
  urgent?: boolean;
  description: string;
  requirements: string[];
  benefits: string[];
  experience: string;
  schedule: string;
  remote?: boolean;
  companyLogo?: string;
  companySize: string;
  companyIndustry: string;
}

interface DashboardStats {
  totalPatients: number;
  activeAppointments: number;
  telemedicineSessions: number;
  marketplaceOffers: number;
  pendingAppointments: number;
  completedAppointments: number;
  patientSatisfaction: number;
  monthlyRevenue: number;
}

export function useDashboardData() {
  const { user, firebaseUser } = useAuth() as any;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [telemedicineSessions, setTelemedicineSessions] = useState<TelemedicineSession[]>([]);
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeAppointments: 0,
    telemedicineSessions: 0,
    marketplaceOffers: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    patientSatisfaction: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar pacientes
  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();

      if (data.success) {
        setPatients(data.data);
      } else {
        logger.error('Error loading patients:', data.error);
      }
    } catch (error) {
      logger.error('Error loading patients:', String(error));
    }
  };

  // Cargar citas
  const loadAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      const data = await response.json();

      if (data.success) {
        setAppointments(data.data);
      } else {
        logger.error('Error loading appointments:', data.error);
      }
    } catch (error) {
      logger.error('Error loading appointments:', String(error));
    }
  };

  // Cargar sesiones de telemedicina
  const loadTelemedicineSessions = async () => {
    try {
      const response = await fetch('/api/telemedicine');
      const data = await response.json();

      if (data.success) {
        setTelemedicineSessions(data.data);
      } else {
        logger.error('Error loading telemedicine sessions:', data.error);
      }
    } catch (error) {
      logger.error('Error loading telemedicine sessions:', String(error));
    }
  };

  // Cargar ofertas del marketplace
  const loadMarketplaceOffers = async () => {
    try {
      // Solo cargar si el usuario está autenticado
      if (!firebaseUser) {
        logger.info('User not authenticated, skipping marketplace offers load');
        return;
      }

      // Obtener el token de autenticación
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/marketplace', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMarketplaceOffers(data.data);
      } else {
        logger.error('Error loading marketplace offers:', data.error);
      }
    } catch (error) {
      logger.error('Error loading marketplace offers:', String(error));
    }
  };

  // Aplicar a una oferta del marketplace
  const applyToOffer = async (offerId: string, coverLetter?: string) => {
    try {
      // Verificar autenticación
      if (!firebaseUser || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el token de autenticación
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          offerId,
          doctorId: user.id, // Usar el ID del doctor actual
          coverLetter: coverLetter || 'Interesado en la posición',
          resume: 'CV del doctor',
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      logger.error('Error applying to offer:', String(error));
      return { success: false, error: 'Error al aplicar a la oferta' };
    }
  };

  // Crear nueva sesión de telemedicina
  const createTelemedicineSession = async (sessionData: {
    patientId: string;
    patientName: string;
    type: 'video' | 'audio' | 'chat';
    notes: string;
    symptoms: string[];
  }) => {
    try {
      const response = await fetch('/api/telemedicine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionData,
          doctorId: 'doc1',
          doctorName: 'Dr. Carlos López',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recargar sesiones
        await loadTelemedicineSessions();
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      logger.error('Error creating telemedicine session:', String(error));
      return { success: false, error: 'Error al crear la sesión' };
    }
  };

  // Actualizar sesión de telemedicina
  const updateTelemedicineSession = async (
    sessionId: string,
    updates: {
      status?: 'waiting' | 'active' | 'ended' | 'cancelled';
      endTime?: string;
      duration?: number;
      diagnosis?: string;
      prescription?: string[];
      followUpDate?: string;
    },
  ) => {
    try {
      const response = await fetch('/api/telemedicine', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          ...updates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recargar sesiones
        await loadTelemedicineSessions();
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      logger.error('Error updating telemedicine session:', String(error));
      return { success: false, error: 'Error al actualizar la sesión' };
    }
  };

  // Crear nueva cita
  const createAppointment = async (appointmentData: {
    patientName: string;
    patientId: string;
    date: string;
    time: string;
    type: 'in_person' | 'telemedicine_video' | 'telemedicine_audio' | 'follow_up' | 'emergency';
    specialty: string;
    reason: string;
    duration: number;
    insuranceCovered: boolean;
    copay: number;
    notes: string;
    symptoms: string[];
  }) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...appointmentData,
          doctorId: 'doc1',
          doctorName: 'Dr. Carlos López',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recargar citas
        await loadAppointments();
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      logger.error('Error creating appointment:', String(error));
      return { success: false, error: 'Error al crear la cita' };
    }
  };

  // Calcular estadísticas
  const calculateStats = () => {
    const totalPatients = patients.length;
    const activeAppointments = appointments.filter((a) => a.status === 'scheduled').length;
    const telemedicineSessionsCount = telemedicineSessions.filter(
      (s) => s.status === 'active',
    ).length;
    const marketplaceOffersCount = marketplaceOffers.length;
    const pendingAppointments = appointments.filter((a) => a.status === 'scheduled').length;
    const completedAppointments = appointments.filter((a) => a.status === 'completed').length;

    // Calcular ingresos mensuales (simulado)
    const monthlyRevenue = completedAppointments * 50; // €50 por cita completada

    // Calcular satisfacción del paciente (simulado)
    const patientSatisfaction = 4.8; // Basado en calificaciones

    setStats({
      totalPatients,
      activeAppointments,
      telemedicineSessions: telemedicineSessionsCount,
      marketplaceOffers: marketplaceOffersCount,
      pendingAppointments,
      completedAppointments,
      patientSatisfaction,
      monthlyRevenue,
    });
  };

  // Cargar todos los datos
  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadPatients(),
        loadAppointments(),
        loadTelemedicineSessions(),
        loadMarketplaceOffers(),
      ]);
    } catch (error) {
      setError('Error al cargar los datos del dashboard');
      logger.error('Error loading dashboard data:', String(error));
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales cuando el usuario está autenticado
  useEffect(() => {
    if (firebaseUser) {
      loadAllData();
    }
  }, [firebaseUser]);

  // Efecto para recalcular estadísticas cuando cambian los datos
  useEffect(() => {
    calculateStats();
  }, [patients, appointments, telemedicineSessions, marketplaceOffers]);

  return {
    // Datos
    patients,
    appointments,
    telemedicineSessions,
    marketplaceOffers,
    stats,

    // Estado
    loading,
    error,

    // Funciones
    loadPatients,
    loadAppointments,
    loadTelemedicineSessions,
    loadMarketplaceOffers,
    applyToOffer,
    createTelemedicineSession,
    updateTelemedicineSession,
    createAppointment,
    loadAllData,
  };
}
