"use client";

import { Button, Card, Input } from '@altamedica/ui';
import { 
  Activity, 
  Bell, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  FileText,
  Heart, 
  Home,
  MessageCircle,
  Phone, 
  Pill,
  Stethoscope,
  User, 
  Video,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type PatientMedicalLayoutProps = {
  children?: ReactNode;
  currentSection?: 'dashboard' | 'consultation' | 'appointments' | 'records' | 'medications';
  patientName?: string;
  doctorName?: string;
  appointmentStatus?: 'scheduled' | 'active' | 'completed' | 'pending';
  showConsultationPanels?: boolean;
  medicalHistoryPanel?: ReactNode;
  medicationsPanel?: ReactNode;
  notesPanel?: ReactNode;
  vitalsPanel?: ReactNode;
  emergencyMode?: boolean;
  showNotifications?: boolean;
  unreadMessages?: number;
};

export default function PatientMedicalLayout({ 
  children, 
  currentSection = 'dashboard',
  patientName = "Juan Pérez",
  doctorName,
  appointmentStatus,
  showConsultationPanels = true,
  medicalHistoryPanel,
  medicationsPanel,
  notesPanel,
  vitalsPanel,
  emergencyMode = false,
  showNotifications = true,
  unreadMessages = 0
}: PatientMedicalLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [isInConsultation, setIsInConsultation] = useState(false);
  const [openHistoryPanel, setOpenHistoryPanel] = useState(false);
  const [openMedicationsPanel, setOpenMedicationsPanel] = useState(false);
  const [openNotesPanel, setOpenNotesPanel] = useState(false);
  const [openVitalsPanel, setOpenVitalsPanel] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        setIsInConsultation(
          window.location.pathname.includes('consultation') || 
          window.location.pathname.includes('telemedicine') ||
          appointmentStatus === 'active'
        );
      } catch {
        // window.location.pathname can throw errors in some environments
      }
    }
  }, [appointmentStatus]);

  const navigationItems = [
    { 
      id: 'dashboard', 
      icon: Home, 
      label: 'Mi Portal', 
      href: '/dashboard',
      description: 'Resumen general de su salud'
    },
    { 
      id: 'appointments', 
      icon: Calendar, 
      label: 'Mis Citas', 
      href: '/appointments',
      description: 'Próximas citas médicas',
      badge: appointmentStatus === 'scheduled' ? '1' : undefined
    },
    { 
      id: 'consultation', 
      icon: Video, 
      label: 'Consulta', 
      href: '/consultation',
      description: 'Videollamada con su doctor',
      active: isInConsultation,
      status: appointmentStatus
    },
    { 
      id: 'records', 
      icon: FileText, 
      label: 'Mi Historial', 
      href: '/records',
      description: 'Historial médico completo'
    },
    { 
      id: 'medications', 
      icon: Pill, 
      label: 'Medicamentos', 
      href: '/medications',
      description: 'Recetas y recordatorios'
    },
    { 
      id: 'messages', 
      icon: MessageCircle, 
      label: 'Mensajes', 
      href: '/messages',
      description: 'Chat con su equipo médico',
      badge: unreadMessages > 0 ? unreadMessages.toString() : undefined
    },
    { 
      id: 'profile', 
      icon: User, 
      label: 'Mi Perfil', 
      href: '/profile',
      description: 'Información personal'
    }
  ];

  const getAppointmentStatusInfo = () => {
    switch (appointmentStatus) {
      case 'active':
        return {
          color: 'text-green-600 bg-green-50',
          icon: Video,
          text: 'En Consulta Activa',
          pulse: true
        };
      case 'scheduled':
        return {
          color: 'text-blue-600 bg-blue-50',
          icon: Clock,
          text: 'Cita Programada',
          pulse: false
        };
      case 'completed':
        return {
          color: 'text-gray-600 bg-gray-50',
          icon: CheckCircle,
          text: 'Consulta Finalizada',
          pulse: false
        };
      default:
        return {
          color: 'text-gray-500 bg-gray-50',
          icon: Calendar,
          text: 'Sin citas activas',
          pulse: false
        };
    }
  };

  const statusInfo = getAppointmentStatusInfo();

  return (
    <div className={`min-h-screen ${emergencyMode ? 'bg-red-50' : 'bg-gradient-to-br from-blue-50 via-white to-green-50'}`}>
      {/* Header Principal - Contexto Médico */}
      <header className="bg-white shadow-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Info del Paciente y Contexto */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    Portal Médico - {patientName}
                  </h1>
                  {doctorName && (
                    <p className="text-sm text-blue-600">
                      Atendido por Dr. {doctorName}
                    </p>
                  )}
                </div>
              </div>

              {/* Estado de la consulta */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${statusInfo.color}`}>
                <statusInfo.icon className={`w-4 h-4 ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium">{statusInfo.text}</span>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex items-center space-x-3">
              {emergencyMode && (
                <button className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">Emergencia 112</span>
                </button>
              )}
              
              {showNotifications && (
                <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              )}

              <Link 
                href="/support" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">Soporte</span>
              </Link>
            </div>
          </div>

          {/* Navegación de Secciones */}
          <nav className="mt-4 flex space-x-1 overflow-x-auto">
            {navigationItems.map((item) => {
              const isActive = currentSection === item.id || item.active;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex flex-1">
        {/* Área de Contenido Central */}
        <main className="flex-1 p-4">
          <div className={`grid gap-6 ${
            isInConsultation && showConsultationPanels 
              ? 'grid-cols-1 xl:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {/* Contenido Principal */}
            <section className={`${
              isInConsultation && showConsultationPanels 
                ? 'xl:col-span-2' 
                : 'col-span-1'
            }`}>
              {children || (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center min-h-[400px] flex items-center justify-center">
                  <div>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Bienvenido a su Portal Médico
                    </h3>
                    <p className="text-gray-600">
                      Aquí puede gestionar sus citas, ver su historial y comunicarse con su equipo médico.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Paneles Laterales en Consulta */}
            {isInConsultation && showConsultationPanels && (
              <aside className="space-y-4">
                {/* Panel de Notas Médicas */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <button
                    onClick={() => setOpenNotesPanel(!openNotesPanel)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-800">Notas de la Consulta</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${openNotesPanel ? '' : '-rotate-90'}`} />
                  </button>
                  {openNotesPanel && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      {notesPanel || (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Su doctor puede tomar notas durante la consulta que aparecerán aquí.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Panel de Signos Vitales */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <button
                    onClick={() => setOpenVitalsPanel(!openVitalsPanel)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-800">Signos Vitales</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${openVitalsPanel ? '' : '-rotate-90'}`} />
                  </button>
                  {openVitalsPanel && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      {vitalsPanel || (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-sm text-green-800">Frecuencia Cardíaca</span>
                            <span className="font-medium text-green-800">72 bpm</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="text-sm text-blue-800">Presión Arterial</span>
                            <span className="font-medium text-blue-800">120/80 mmHg</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>

          {/* Paneles Inferiores para Referencias Rápidas */}
          {showConsultationPanels && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Panel de Historial Médico */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <button
                  onClick={() => setOpenHistoryPanel(!openHistoryPanel)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-800">Mi Historial Médico</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${openHistoryPanel ? '' : '-rotate-90'}`} />
                </button>
                {openHistoryPanel && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {medicalHistoryPanel || (
                      <div className="mt-4 space-y-2">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm font-medium text-purple-800">Última visita</p>
                          <p className="text-xs text-purple-600">15 de Diciembre, 2024 - Chequeo general</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-800">Alergias conocidas</p>
                          <p className="text-xs text-gray-600">Penicilina, Polen</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Panel de Medicamentos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <button
                  onClick={() => setOpenMedicationsPanel(!openMedicationsPanel)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Pill className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-gray-800">Mis Medicamentos</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${openMedicationsPanel ? '' : '-rotate-90'}`} />
                </button>
                {openMedicationsPanel && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {medicationsPanel || (
                      <div className="mt-4 space-y-2">
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm font-medium text-orange-800">Losartán 50mg</p>
                          <p className="text-xs text-orange-600">1 vez al día - Próxima dosis: 8:00 AM</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800">Vitamina D</p>
                          <p className="text-xs text-green-600">Semanal - Próxima dosis: Domingo</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Barra de Estado / Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Portal Médico AltaMedica</span>
            <span>•</span>
            <span>Paciente: {patientName}</span>
            {doctorName && (
              <>
                <span>•</span>
                <span>Dr. {doctorName}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                appointmentStatus === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-gray-600">
                {appointmentStatus === 'active' ? 'En línea' : 'Fuera de línea'}
              </span>
            </div>
            
            {emergencyMode && (
              <button className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors">
                <AlertCircle className="w-3 h-3" />
                <span>Modo Emergencia</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}