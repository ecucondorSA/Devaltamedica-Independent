/**
 * 🏢 JOB APPLICATIONS MANAGER - COMPANIES B2C
 * Componente para gestionar aplicaciones de doctores
 */

'use client'

import { Button, Card, Input } from '@altamedica/ui';
import { useState, useEffect } from 'react'
// TODO: Implementar estos hooks en @altamedica/hooks
// import { useCompanyToDoctorCommunication, useUnreadNotificationsCount } from '@altamedica/hooks'

// Hooks temporales mientras se implementan en el paquete
const useCompanyToDoctorCommunication = (companyId: string) => ({
  applications: [],
  interviews: [],
  notifications: [],
  updateApplicationStatus: async () => {},
  scheduleInterview: async () => {},
  sendMessage: async () => {},
  markNotificationAsRead: async () => {},
  subscribeToUpdates: () => {},
  loading: false,
  error: null
})

const useUnreadNotificationsCount = () => 0
import { JobApplication } from '@altamedica/types'

import { logger } from '@altamedica/shared/services/logger.service';
interface JobApplicationsManagerProps {
  companyId: string
}

export default function JobApplicationsManager({ companyId }: JobApplicationsManagerProps) {
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showMessaging, setShowMessaging] = useState(false)
  const [messageText, setMessageText] = useState('')

  // Hook principal B2C
  const {
    applications,
    interviews,
    notifications,
    updateApplicationStatus,
    scheduleInterview,
    sendMessage,
    markNotificationAsRead,
    subscribeToUpdates,
    isLoading,
    isError,
    error
  } = useCompanyToDoctorCommunication(companyId)

  // Contador de notificaciones no leídas
  const unreadCount = useUnreadNotificationsCount(companyId, 'company')

  // Suscripción a updates en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToUpdates((event) => {
      logger.info('B2C Update received:', event)
      
      // Mostrar notificación toast o similar
      if (event.type === 'applications_updated') {
        // Mostrar notificación de nueva aplicación
      }
      
      if (event.type === 'notifications_updated') {
        // Mostrar badges de notificaciones
      }
    })

    return unsubscribe
  }, [subscribeToUpdates])

  // Manejar actualización de estado de aplicación
  const handleStatusUpdate = async (applicationId: string, newStatus: JobApplication['status']) => {
    try {
      await updateApplicationStatus(applicationId, newStatus)
      
      // Cerrar modal o hacer alguna UI feedback
      setSelectedApplication(null)
    } catch (error) {
      logger.error('Error updating application status:', error)
    }
  }

  // Manejar programación de entrevista
  const handleScheduleInterview = async (application: JobApplication) => {
    try {
      const interviewData = {
        applicationId: application.id,
        jobOfferId: application.jobOfferId,
        doctorId: application.doctorId,
        companyId: application.companyId,
        type: 'video' as const,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
        duration: 60,
        interviewers: [
          {
            id: companyId,
            name: 'HR Manager',
            role: 'Gerente de RRHH',
            email: 'hr@company.com'
          }
        ],
        timeZone: 'America/Bogota'
      }

      await scheduleInterview(interviewData)
      
      // UI feedback
      alert('Entrevista programada exitosamente')
    } catch (error) {
      logger.error('Error scheduling interview:', error)
    }
  }

  // Manejar envío de mensaje
  const handleSendMessage = async () => {
    if (!selectedApplication || !messageText.trim()) return

    try {
      await sendMessage(selectedApplication.id, messageText, 'text')
      setMessageText('')
      setShowMessaging(false)
    } catch (error) {
      logger.error('Error sending message:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando aplicaciones...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error al cargar aplicaciones</h3>
        <p className="text-red-600 text-sm mt-1">
          {error?.message || 'Ha ocurrido un error inesperado'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con notificaciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Aplicaciones de Doctores
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona las aplicaciones y comunícate con candidatos
          </p>
        </div>
        
        {/* Badge de notificaciones */}
        {unreadCount > 0 && (
          <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-2">
            <span className="text-red-800 font-medium">
              🔔 {unreadCount} notificacion{unreadCount !== 1 ? 'es' : ''} nueva{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium">Total Aplicaciones</h3>
          <p className="text-2xl font-bold text-blue-900">{applications.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">Pendientes</h3>
          <p className="text-2xl font-bold text-yellow-900">
            {applications.filter(app => app.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-medium">Entrevistas</h3>
          <p className="text-2xl font-bold text-green-900">{interviews.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-purple-800 font-medium">Aceptadas</h3>
          <p className="text-2xl font-bold text-purple-900">
            {applications.filter(app => app.status === 'accepted').length}
          </p>
        </div>
      </div>

      {/* Lista de aplicaciones */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Aplicaciones Recientes</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {applications.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No hay aplicaciones disponibles</p>
            </div>
          ) : (
            applications.map((application) => (
              <div key={application.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {application.doctorProfile.fullName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {application.doctorProfile.specialties.join(', ')} • 
                          {application.doctorProfile.experience} años exp.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>📧 {application.doctorProfile.email}</span>
                      <span>📞 {application.doctorProfile.phone}</span>
                      <span>⏰ {new Date(application.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Badge de estado */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                      application.status === 'interview_scheduled' ? 'bg-purple-100 text-purple-800' :
                      application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {application.status === 'pending' ? '⏳ Pendiente' :
                       application.status === 'reviewing' ? '👀 Revisando' :
                       application.status === 'interview_scheduled' ? '📅 Entrevista' :
                       application.status === 'accepted' ? '✅ Aceptada' :
                       application.status === 'rejected' ? '❌ Rechazada' :
                       application.status}
                    </span>

                    {/* Botones de acción */}
                    <div className="flex space-x-1">
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'reviewing')}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Revisar
                          </button>
                          <button
                            onClick={() => handleScheduleInterview(application)}
                            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Entrevista
                          </button>
                        </>
                      )}
                      
                      {application.status === 'reviewing' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'accepted')}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Rechazar
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setSelectedApplication(application)
                          setShowMessaging(true)
                        }}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        💬 Mensaje
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cover letter preview */}
                {application.coverLetter && (
                  <div className="mt-3 bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {application.coverLetter}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de mensajería */}
      {showMessaging && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Mensaje para {selectedApplication.doctorProfile.fullName}
              </h3>
              <button
                onClick={() => setShowMessaging(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full h-24 border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Mensaje
              </button>
              <button
                onClick={() => setShowMessaging(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}