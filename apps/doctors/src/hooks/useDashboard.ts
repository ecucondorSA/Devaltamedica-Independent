/**
 * Hook personalizado para Dashboard Médico
 * Gestión de estado, datos en tiempo real y notificaciones críticas
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseService } from '@altamedica/database';
import { doctorService, DoctorStats, DoctorAppointment, DoctorPatient, DoctorAlert, DoctorActivity } from '../services/doctor-service';

import { logger } from '@altamedica/shared/services/logger.service';
// Usar tipos del servicio de doctores
export type DashboardStats = DoctorStats;
export type TodayAppointment = DoctorAppointment;
export type CriticalAlert = DoctorAlert;
export type PatientSummary = DoctorPatient;
export type RecentActivity = DoctorActivity;

export interface UseDashboardReturn {
  // Estados de datos
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Datos del dashboard
  stats: DashboardStats;
  todayAppointments: TodayAppointment[];
  recentPatients: PatientSummary[];
  criticalAlerts: CriticalAlert[];
  recentActivity: RecentActivity[];
  
  // Estados de UI
  selectedView: 'overview' | 'appointments' | 'patients' | 'alerts';
  showNotifications: boolean;
  compactMode: boolean;
  
  // Telemedicina
  activeTelemedicineSession: { sessionId: string; doctorId: string; patientId: string } | null;
  startTelemedicineSession: (appointmentId: string, patientId: string) => Promise<void>;
  
  // Acciones
  refreshDashboard: () => Promise<void>;
  setSelectedView: (view: 'overview' | 'appointments' | 'patients' | 'alerts') => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  toggleNotifications: () => void;
  toggleCompactMode: () => void;
  markAppointmentComplete: (appointmentId: string) => Promise<void>;
  
  // Suscripciones en tiempo real
  subscribeToAlerts: () => () => void;
}

export const useDashboard = (): UseDashboardReturn => {
  // Estados principales
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de datos
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    criticalAlerts: 0,
    monthlyConsultations: 0,
    patientSatisfactionRate: 0,
    averageWaitTime: 0,
    revenueThisMonth: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    telemedicineSessions: 0
  });
  
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientSummary[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  
  // Estados de UI
  const [selectedView, setSelectedView] = useState<'overview' | 'appointments' | 'patients' | 'alerts'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  
  // Estados de telemedicina
  const [activeTelemedicineSession, setActiveTelemedicineSession] = useState<{ sessionId: string; doctorId: string; patientId: string } | null>(null);

  /**
   * Inicializar autenticación y cargar datos
   */
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        
        // Verificar si Firebase está inicializado
        if (!firebaseService.isReady) {
          logger.warn('Firebase no inicializado. Configure las credenciales.');
        }
        
        // Configurar listener de autenticación
        const unsubscribe = onAuthStateChanged(
          firebaseService.authentication,
          async (firebaseUser) => {
            setUser(firebaseUser);
            
            if (firebaseUser) {
              await loadDashboardData(firebaseUser.uid);
            } else {
              resetDashboardData();
            }
            
            setIsLoading(false);
          }
        );
        
        return () => unsubscribe();
        
      } catch (err) {
        logger.error('Error inicializando dashboard:', err);
        setError('Error al inicializar el dashboard');
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  /**
   * Cargar todos los datos del dashboard
   */
  const loadDashboardData = async (userId: string) => {
    try {
      setError(null);
      
      // Cargar datos en paralelo usando el servicio real
      const [
        statsData,
        appointmentsData,
        patientsData,
        alertsData,
        activityData
      ] = await Promise.allSettled([
        doctorService.getStats(userId),
        doctorService.getTodayAppointments(userId),
        doctorService.getPatients(userId, { isActive: true }),
        doctorService.getCriticalAlerts(userId),
        doctorService.getRecentActivity(userId, 20)
      ]);

      // Procesar resultados
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (appointmentsData.status === 'fulfilled') setTodayAppointments(appointmentsData.value);
      if (patientsData.status === 'fulfilled') setRecentPatients(patientsData.value);
      if (alertsData.status === 'fulfilled') setCriticalAlerts(alertsData.value);
      if (activityData.status === 'fulfilled') setRecentActivity(activityData.value);
      
    } catch (err) {
      logger.error('Error cargando datos del dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    }
  };

  /**
   * Refrescar dashboard
   */
  const refreshDashboard = useCallback(async () => {
    if (user) {
      await loadDashboardData(user.uid);
    }
  }, [user]);

  /**
   * Reconocer alerta
   */
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await doctorService.acknowledgeAlert(alertId);
      
      // Actualizar estado local
      setCriticalAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true }
            : alert
        )
      );
      
      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        criticalAlerts: Math.max(0, prev.criticalAlerts - 1)
      }));
      
    } catch (err) {
      logger.error('Error reconociendo alerta:', err);
      throw new Error('No se pudo reconocer la alerta');
    }
  }, []);

  /**
   * Marcar cita como completada
   */
  const markAppointmentComplete = useCallback(async (appointmentId: string) => {
    try {
      await doctorService.updateAppointmentStatus(appointmentId, 'COMPLETED');
      
      // Actualizar estado local
      setTodayAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: 'COMPLETED' }
            : appointment
        )
      );
      
      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        todayAppointments: Math.max(0, prev.todayAppointments - 1),
        completedAppointments: prev.completedAppointments + 1
      }));
      
    } catch (err) {
      logger.error('Error completando cita:', err);
      throw new Error('No se pudo completar la cita');
    }
  }, []);

  /**
   * Iniciar sesión de telemedicina
   */
  const startTelemedicineSession = useCallback(async (appointmentId: string, patientId: string) => {
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Generar ID de sesión única
      const sessionId = `session_${Date.now()}_${appointmentId}`;
      
      // Crear sesión de telemedicina
      const telemedicineSession = {
        sessionId,
        doctorId: user.uid,
        patientId,
        appointmentId,
        startTime: new Date().toISOString(),
        status: 'active' as const
      };

      // Guardar en Firebase (opcional)
      try {
        await doctorService.createTelemedicineSession(telemedicineSession);
      } catch (err) {
        logger.warn('No se pudo guardar la sesión en Firebase:', err);
      }

      // Actualizar estado local
      setActiveTelemedicineSession({
        sessionId,
        doctorId: user.uid,
        patientId
      });

      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        telemedicineSessions: prev.telemedicineSessions + 1
      }));

    } catch (err) {
      logger.error('Error iniciando sesión de telemedicina:', err);
      throw new Error('No se pudo iniciar la sesión de telemedicina');
    }
  }, [user]);

  /**
   * Suscribirse a alertas en tiempo real
   */
  const subscribeToAlerts = useCallback(() => {
    // Aquí se implementaría la suscripción WebSocket real
    // Por ahora retornamos una función vacía
    return () => {
      // Cleanup de suscripción
    };
  }, []);

  /**
   * Resetear datos del dashboard
   */
  const resetDashboardData = () => {
    setStats({
      totalPatients: 0,
      todayAppointments: 0,
      pendingAppointments: 0,
      criticalAlerts: 0,
      monthlyConsultations: 0,
      patientSatisfactionRate: 0,
      averageWaitTime: 0,
      revenueThisMonth: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      telemedicineSessions: 0
    });
    setTodayAppointments([]);
    setRecentPatients([]);
    setCriticalAlerts([]);
    setRecentActivity([]);
  };

  // Acciones de UI
  const toggleNotifications = () => setShowNotifications(prev => !prev);
  const toggleCompactMode = () => setCompactMode(prev => !prev);

  return {
    // Estados de datos
    user,
    isLoading,
    error,
    stats,
    todayAppointments,
    recentPatients,
    criticalAlerts,
    recentActivity,
    
    // Estados de UI
    selectedView,
    showNotifications,
    compactMode,
    
    // Telemedicina
    activeTelemedicineSession,
    startTelemedicineSession,
    
    // Acciones
    refreshDashboard,
    setSelectedView,
    acknowledgeAlert,
    toggleNotifications,
    toggleCompactMode,
    markAppointmentComplete,
    subscribeToAlerts
  };
};

export default useDashboard;
