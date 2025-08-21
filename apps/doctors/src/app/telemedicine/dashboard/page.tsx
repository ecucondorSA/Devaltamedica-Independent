"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@altamedica/hooks';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Calendar,
  Clock,
  User,
  Video,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  FileText,
  Activity,
  Search,
  Filter,
  Bell
} from 'lucide-react';

// Mock data para sesiones de telemedicina del doctor
// En producción, esto vendría de la API usando useTelemedicineUnified
const mockTelemedicineSessions = [
  {
    id: 'session-001',
    patientName: 'María González',
    patientEmail: 'maria.gonzalez@email.com',
    appointmentType: 'Consulta de Seguimiento - Cardiología',
    scheduledTime: '2025-02-05 10:30',
    duration: 30,
    status: 'scheduled' as const,
    priority: 'normal' as const,
    medicalHistory: ['Hipertensión arterial', 'Alergia a penicilina'],
    lastVisit: '2024-12-15',
    notes: 'Control de presión arterial y ajuste de medicación'
  },
  {
    id: 'session-002',
    patientName: 'Carlos Rodríguez',
    patientEmail: 'carlos.rodriguez@email.com',
    appointmentType: 'Consulta de Emergencia - Neurología',
    scheduledTime: '2025-02-05 14:00',
    duration: 45,
    status: 'active' as const,
    priority: 'urgent' as const,
    medicalHistory: ['Migrañas recurrentes'],
    lastVisit: '2024-11-20',
    notes: 'Evaluación de nuevos síntomas neurológicos'
  },
  {
    id: 'session-003',
    patientName: 'Ana Martínez',
    patientEmail: 'ana.martinez@email.com',
    appointmentType: 'Primera Consulta - Medicina General',
    scheduledTime: '2025-02-05 16:30',
    duration: 60,
    status: 'completed' as const,
    priority: 'normal' as const,
    medicalHistory: ['Sin antecedentes relevantes'],
    lastVisit: null,
    notes: 'Paciente nueva - evaluación general'
  },
  {
    id: 'session-004',
    patientName: 'Luis Pérez',
    patientEmail: 'luis.perez@email.com',
    appointmentType: 'Consulta de Emergencia - Cardiología',
    scheduledTime: '2025-02-05 09:00',
    duration: 30,
    status: 'cancelled' as const,
    priority: 'critical' as const,
    medicalHistory: ['Infarto previo', 'Diabetes tipo 2'],
    lastVisit: '2024-12-01',
    notes: 'Paciente canceló por emergencia hospitalaria'
  }
];

const statusConfig = {
  scheduled: { label: 'Programada', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', icon: Clock },
  active: { label: 'En Curso', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', icon: Video },
  completed: { label: 'Completada', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700', icon: XCircle }
};

const priorityConfig = {
  normal: { label: 'Normal', color: 'gray', badgeColor: 'bg-gray-100 text-gray-800' },
  urgent: { label: 'Urgente', color: 'yellow', badgeColor: 'bg-yellow-100 text-yellow-800' },
  critical: { label: 'Crítico', color: 'red', badgeColor: 'bg-red-100 text-red-800' }
};

export default function TelemedicineDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState(mockTelemedicineSessions);
  const [filteredSessions, setFilteredSessions] = useState(mockTelemedicineSessions);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const loadSessions = async () => {
      try {
        // En producción: await TelemedicineService.getSessionsByDoctor(user?.uid)
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (error) {
        logger.error('Error loading sessions:', error);
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    // Filtrar sesiones basado en estado y búsqueda
    let filtered = sessions;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(session => session.status === selectedStatus);
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(session => 
        session.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.appointmentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.patientEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredSessions(filtered);
  }, [sessions, selectedStatus, searchQuery]);

  const handleJoinSession = (sessionId: string) => {
    router.push(`/telemedicine/session/${sessionId}`);
  };

  const handleStartNewSession = () => {
    // En producción, esto abriría un modal para crear nueva sesión
    router.push('/telemedicine/session/new');
  };

  const getTodaySessions = () => {
    const today = new Date().toDateString();
    return sessions.filter(session => 
      new Date(session.scheduledTime).toDateString() === today
    );
  };

  const getActiveSessionsCount = () => {
    return sessions.filter(session => session.status === 'active').length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="dashboard-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando Dashboard...</h2>
          <p className="text-gray-600">Obteniendo sesiones de telemedicina</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="telemedicine-dashboard">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8" data-testid="dashboard-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Telemedicina</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus consultas médicas virtuales
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleStartNewSession}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                data-testid="new-session-button"
              >
                <Video className="w-5 h-5" />
                <span>Nueva Consulta</span>
              </button>
              <button className="bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-testid="stats-cards">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoy</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="today-sessions-count">
                  {getTodaySessions().length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="active-sessions-count">
                  {getActiveSessionsCount()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="pending-sessions-count">
                  {sessions.filter(s => s.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="completed-sessions-count">
                  {sessions.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6" data-testid="filters-section">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por paciente, tipo de consulta..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-input"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                data-testid="status-filter"
              >
                <option value="all">Todos los estados</option>
                <option value="scheduled">Programadas</option>
                <option value="active">En curso</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow" data-testid="sessions-list">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Sesiones de Telemedicina ({filteredSessions.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center" data-testid="empty-state">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay sesiones
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedStatus !== 'all' 
                    ? 'No se encontraron sesiones con los filtros aplicados.'
                    : 'Aún no tienes sesiones de telemedicina programadas.'
                  }
                </p>
                {(!searchQuery && selectedStatus === 'all') && (
                  <button
                    onClick={handleStartNewSession}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Programar Primera Consulta
                  </button>
                )}
              </div>
            ) : (
              filteredSessions.map((session) => {
                const StatusIcon = statusConfig[session.status].icon;
                return (
                  <div 
                    key={session.id} 
                    className="p-6 hover:bg-gray-50 transition-colors"
                    data-testid={`session-${session.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900" data-testid="patient-name">
                              {session.patientName}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[session.priority].badgeColor}`}>
                            {priorityConfig[session.priority].label}
                          </span>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[session.status].bgColor} ${statusConfig[session.status].textColor}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[session.status].label}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            <span data-testid="appointment-type">{session.appointmentType}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span data-testid="scheduled-time">
                              {new Date(session.scheduledTime).toLocaleString('es-ES', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            <span>{session.duration} minutos</span>
                          </div>
                        </div>
                        
                        {session.notes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {session.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        {session.status === 'scheduled' && (
                          <button
                            onClick={() => handleJoinSession(session.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            data-testid="start-session-button"
                          >
                            <Video className="w-4 h-4" />
                            <span>Iniciar</span>
                          </button>
                        )}
                        
                        {session.status === 'active' && (
                          <button
                            onClick={() => handleJoinSession(session.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 animate-pulse"
                            data-testid="join-session-button"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Unirse</span>
                          </button>
                        )}
                        
                        <button 
                          className="text-gray-400 hover:text-gray-600 p-2"
                          onClick={() => router.push(`/patients/${session.patientEmail}`)}
                          data-testid="view-patient-button"
                        >
                          <User className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}