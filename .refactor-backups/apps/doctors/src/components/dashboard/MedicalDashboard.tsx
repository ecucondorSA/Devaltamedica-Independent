/**
 * Dashboard Médico Principal
 * Integración completa de todos los componentes con navegación y estado
 */

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useEffect } from 'react';
import useDashboard from '@/hooks/useDashboard';
import DashboardStats from './DashboardStats';
import TodayAppointments from './TodayAppointments';
import CriticalAlerts from './CriticalAlerts';
import { ProfessionalTelemedicineCall } from '../telemedicine/ProfessionalTelemedicineCall';

interface MedicalDashboardProps {
  initialView?: 'overview' | 'appointments' | 'patients' | 'alerts';
}

const MedicalDashboard: React.FC<MedicalDashboardProps> = ({ 
  initialView = 'overview' 
}) => {
  const {
    user,
    isLoading,
    error,
    stats,
    todayAppointments,
    recentPatients,
    criticalAlerts,
    recentActivity,
    selectedView,
    showNotifications,
    compactMode,
    refreshDashboard,
    setSelectedView,
    acknowledgeAlert,
    toggleNotifications,
    toggleCompactMode,
    markAppointmentComplete,
    subscribeToAlerts,
    startTelemedicineSession, // Nuevo estado para la sesión de telemedicina
    activeTelemedicineSession // ID de la sesión activa
  } = useDashboard();

  // Establecer vista inicial
  useEffect(() => {
    setSelectedView(initialView);
  }, [initialView, setSelectedView]);

  // Suscribirse a alertas en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToAlerts();
    return () => unsubscribe();
  }, [subscribeToAlerts]);

  // Navegación del dashboard
  const navigationItems = [
    {
      id: 'overview' as const,
      label: 'Resumen',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      badge: null
    },
    {
      id: 'appointments' as const,
      label: 'Citas',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: stats.todayAppointments > 0 ? stats.todayAppointments : null
    },
    {
      id: 'patients' as const,
      label: 'Pacientes',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: recentPatients.length > 0 ? recentPatients.length : null
    },
    {
      id: 'alerts' as const,
      label: 'Alertas',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      badge: criticalAlerts.filter(a => !a.acknowledged).length > 0 
        ? criticalAlerts.filter(a => !a.acknowledged).length 
        : null,
      urgent: criticalAlerts.some(a => a.priority === 'CRITICAL' && !a.acknowledged)
    }
  ];

  // Manejo de errores de autenticación
  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Acceso Requerido
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Necesitas iniciar sesión para acceder al dashboard médico.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Error del Sistema
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <button
              onClick={refreshDashboard}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Dashboard */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Título y navegación */}
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard Médico
                </h1>
                {user && (
                  <p className="text-sm text-gray-600">
                    Bienvenido, Dr. {user.displayName || user.email}
                  </p>
                )}
              </div>

              {/* Navegación horizontal */}
              <nav className="hidden md:flex space-x-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedView(item.id)}
                    className={`
                      relative flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${selectedView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                    {item.badge && (
                      <span className={`
                        ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${item.urgent 
                          ? 'bg-red-100 text-red-800 animate-pulse' 
                          : 'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Controles del header */}
            <div className="flex items-center space-x-4">
              {/* Botón de refrescar */}
              <button
                onClick={refreshDashboard}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                title="Refrescar datos"
              >
                <svg 
                  className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Modo compacto */}
              <button
                onClick={toggleCompactMode}
                className={`p-2 transition-colors ${
                  compactMode 
                    ? 'text-blue-600 hover:text-blue-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Modo compacto"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>

              {/* Notificaciones */}
              <button
                onClick={toggleNotifications}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Notificaciones"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9a6 6 0 10-12 0v3l-5 5h5m7 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {criticalAlerts.filter(a => !a.acknowledged).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación móvil */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex space-x-1 overflow-x-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedView(item.id)}
              className={`
                relative flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                ${selectedView === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className={`
                  ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium
                  ${item.urgent 
                    ? 'bg-red-100 text-red-800 animate-pulse' 
                    : 'bg-gray-100 text-gray-800'
                  }
                `}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VISTA DE TELEMEDICINA ACTIVA */}
        {activeTelemedicineSession ? (
          <ProfessionalTelemedicineCall 
            sessionId={activeTelemedicineSession.sessionId}
            doctorId={activeTelemedicineSession.doctorId}
            patientId={activeTelemedicineSession.patientId}
          />
        ) : (
          <>
            {/* Vista de Resumen */}
            {selectedView === 'overview' && (
              <div className="space-y-8">
                {/* ... (código de la vista de resumen) */}
              </div>
            )}

            {/* ... (otras vistas) ... */}
          </>
        )}
      </main>
    </div>
  );
};

export default MedicalDashboard;
