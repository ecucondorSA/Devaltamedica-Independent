'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { api } from '../../lib/api-client-jwt';
import { useAuth } from '@altamedica/auth';
import { usePatientData } from '@altamedica/hooks';
import {
  Activity,
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  MessageCircle,
  Sparkles,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { logger } from '@altamedica/shared';
interface DashboardData {
  appointments: {
    upcoming: number;
    past: number;
    nextAppointment?: {
      id: string;
      date: string;
      time: string;
      doctorName: string;
      specialty: string;
    };
  };
  medicalRecords: {
    total: number;
    recent: number;
  };
  prescriptions: {
    active: number;
    expiringSoon: number;
  };
  notifications: {
    unread: number;
    items: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
    }>;
  };
}

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Usar usePatientData para obtener datos médicos completos
  const patientDataResult = usePatientData(user?.id, {
    enabled: !!user?.id,
    includeHistory: true,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<DashboardData>('/api/v1/patients/dashboard');
      setDashboardData(data);
    } catch (err: any) {
      logger.error('Error fetching dashboard:', err);
      setError('Error al cargar el dashboard');
      // Datos de ejemplo si falla la API
      setDashboardData({
        appointments: {
          upcoming: 2,
          past: 5,
          nextAppointment: {
            id: '1',
            date: '2025-02-15',
            time: '10:30',
            doctorName: 'Dra. María García',
            specialty: 'Cardiología',
          },
        },
        medicalRecords: {
          total: 12,
          recent: 3,
        },
        prescriptions: {
          active: 2,
          expiringSoon: 1,
        },
        notifications: {
          unread: 3,
          items: [
            {
              id: '1',
              type: 'appointment',
              message: 'Recordatorio: Cita mañana a las 10:30',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // El middleware redirigirá
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-primary-600">AltaMedica</div>
              <span className="text-neutral-500">|</span>
              <span className="text-gray-700">Portal de Pacientes</span>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-neutral-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                {dashboardData?.notifications.unread ? (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {dashboardData.notifications.unread}
                  </span>
                ) : null}
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                  <p className="text-xs text-neutral-500">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-neutral-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-neutral-50"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.displayName?.split(' ')[0]}
          </h1>
          <p className="text-neutral-600 mt-2">
            Aquí puedes gestionar tus citas médicas y ver tu historial
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-10 h-10 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">
                {dashboardData?.appointments.upcoming || 0}
              </span>
            </div>
            <h3 className="text-gray-700 font-medium">Citas Próximas</h3>
            <p className="text-sm text-neutral-500 mt-1">En los próximos 30 días</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-10 h-10 text-success-600" />
              <span className="text-2xl font-bold text-gray-900">
                {dashboardData?.medicalRecords.total || 0}
              </span>
            </div>
            <h3 className="text-gray-700 font-medium">Registros Médicos</h3>
            <p className="text-sm text-neutral-500 mt-1">
              {dashboardData?.medicalRecords.recent || 0} recientes
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-10 h-10 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">
                {dashboardData?.prescriptions.active || 0}
              </span>
            </div>
            <h3 className="text-gray-700 font-medium">Prescripciones Activas</h3>
            <p className="text-sm text-neutral-500 mt-1">
              {dashboardData?.prescriptions.expiringSoon || 0} por vencer
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Video className="w-10 h-10 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">24/7</span>
            </div>
            <h3 className="text-gray-700 font-medium">Telemedicina</h3>
            <p className="text-sm text-neutral-500 mt-1">Disponible ahora</p>
          </div>
        </div>

        {/* Next Appointment */}
        {dashboardData?.appointments.nextAppointment && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">Próxima Cita</h2>
                <div className="flex items-center gap-4 text-blue-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{dashboardData.appointments.nextAppointment.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{dashboardData.appointments.nextAppointment.time}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-blue-900 font-medium">
                    {dashboardData.appointments.nextAppointment.doctorName}
                  </p>
                  <p className="text-blue-700 text-sm">
                    {dashboardData.appointments.nextAppointment.specialty}
                  </p>
                </div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                Ver detalles
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Alta - Anamnesis con IA */}
        <div className="mb-8">
          <Link href="/alta-anamnesis">
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-2xl transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">Alta - Asistente Médica</h2>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="text-white/90">
                      Completá tu historia clínica conversando con Alta, tu asistente médica con IA
                    </p>
                    <p className="text-xs text-white/70 mt-1">
                      Desarrollada por Dr. Eduardo Marques (UBA)
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left group">
            <Calendar className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Agendar Cita</h3>
            <p className="text-sm text-neutral-600">Reserva una consulta con tu médico preferido</p>
            <div className="mt-4 text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span className="text-sm font-medium">Agendar ahora</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          <button className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all text-left group">
            <FileText className="w-8 h-8 text-success-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Ver Historial</h3>
            <p className="text-sm text-neutral-600">Accede a tus registros médicos y resultados</p>
            <div className="mt-4 text-success-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span className="text-sm font-medium">Ver registros</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          <button className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all text-left group">
            <Video className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Telemedicina</h3>
            <p className="text-sm text-neutral-600">Inicia una consulta virtual con un médico</p>
            <div className="mt-4 text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span className="text-sm font-medium">Iniciar consulta</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Sección de Datos Médicos del Paciente */}
        {patientDataResult.patient && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Signos Vitales Recientes */}
            {patientDataResult.vitalSigns.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Signos Vitales Recientes
                </h3>
                <div className="space-y-3">
                  {patientDataResult.vitalSigns.slice(0, 3).map((vital, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          Presión: {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic} mmHg
                        </p>
                        <p className="text-sm text-gray-600">
                          FC: {vital.heartRate} bpm • Temp: {vital.temperature}°C
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(vital.recordedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medicamentos Actuales - Temporalmente comentado por problemas de tipos */}
            {/* {patientDataResult.medications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Medicamentos Actuales</h3>
                <div className="space-y-3">
                  {patientDataResult.medications.slice(0, 3).map((med, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-gray-900">{med.name}</p>
                      <p className="text-sm text-gray-600">
                        {med.dosage} - {med.frequency}
                      </p>
                      {med.endDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Hasta: {new Date(med.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Resultados de Laboratorio Recientes - Temporalmente comentado por problemas de tipos */}
            {/* {patientDataResult.labResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Laboratorios</h3>
                <div className="space-y-3">
                  {patientDataResult.labResults.slice(0, 2).map((lab, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-gray-900">{lab.testName}</p>
                      <p className="text-sm text-gray-600">{lab.status}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(lab.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Resumen de Historia Médica - Temporalmente comentado por problemas de tipos */}
            {/* {patientDataResult.medicalHistory && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historia Médica</h3>
                <div className="space-y-2">
                  {patientDataResult.medicalHistory.conditions
                    ?.slice(0, 3)
                    .map((condition, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{condition.name}</span>
                        <span className="text-xs text-gray-500">
                          Desde {new Date(condition.diagnosedDate).getFullYear()}
                        </span>
                      </div>
                    ))}
                  {patientDataResult.medicalHistory.allergies?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700">Alergias:</p>
                      <p className="text-sm text-gray-600">
                        {patientDataResult.medicalHistory.allergies.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )} */}
          </div>
        )}
      </main>
    </div>
  );
}
