'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ArrowLeft,
  Monitor,
  Database,
  Video,
  Shield,
  Globe,
  Server,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  description: string
  icon: React.ElementType
  lastUpdated: string
  uptime: string
  responseTime: string
}

interface HistoricalIncident {
  id: string
  title: string
  description: string
  status: 'resolved' | 'investigating' | 'monitoring'
  severity: 'low' | 'medium' | 'high'
  startTime: string
  endTime?: string
  affectedServices: string[]
}

const services: ServiceStatus[] = [
  {
    name: 'Portal Web',
    status: 'operational',
    description: 'Aplicación web principal funcionando correctamente',
    icon: Globe,
    lastUpdated: '2 min ago',
    uptime: '99.98%',
    responseTime: '145ms'
  },
  {
    name: 'Portal Médico',
    status: 'operational',
    description: 'Interfaz para profesionales médicos',
    icon: Monitor,
    lastUpdated: '1 min ago',
    uptime: '99.95%',
    responseTime: '167ms'
  },
  {
    name: 'Portal Pacientes',
    status: 'operational',
    description: 'Aplicación para pacientes',
    icon: Activity,
    lastUpdated: '3 min ago',
    uptime: '99.97%',
    responseTime: '132ms'
  },
  {
    name: 'Videoconsultas',
    status: 'operational',
    description: 'Sistema de videollamadas médicas',
    icon: Video,
    lastUpdated: '1 min ago',
    uptime: '99.92%',
    responseTime: '89ms'
  },
  {
    name: 'Base de Datos',
    status: 'operational',
    description: 'Sistemas de almacenamiento de datos médicos',
    icon: Database,
    lastUpdated: '2 min ago',
    uptime: '99.99%',
    responseTime: '23ms'
  },
  {
    name: 'Autenticación',
    status: 'operational',
    description: 'Sistema de login y seguridad',
    icon: Shield,
    lastUpdated: '1 min ago',
    uptime: '99.96%',
    responseTime: '78ms'
  },
  {
    name: 'API Server',
    status: 'operational',
    description: 'Servicios backend y APIs',
    icon: Server,
    lastUpdated: '2 min ago',
    uptime: '99.94%',
    responseTime: '156ms'
  }
]

const historicalIncidents: HistoricalIncident[] = [
  {
    id: '1',
    title: 'Mantenimiento programado de base de datos',
    description: 'Actualización de seguridad y optimización de rendimiento completada exitosamente.',
    status: 'resolved',
    severity: 'low',
    startTime: '2025-07-28 02:00 UTC',
    endTime: '2025-07-28 04:30 UTC',
    affectedServices: ['Base de Datos', 'API Server']
  },
  {
    id: '2',
    title: 'Latencia elevada en videoconsultas',
    description: 'Se detectó latencia aumentada en conexiones de video. Problema resuelto mediante optimización de servidores.',
    status: 'resolved',
    severity: 'medium',
    startTime: '2025-07-25 14:20 UTC',
    endTime: '2025-07-25 15:45 UTC',
    affectedServices: ['Videoconsultas']
  },
  {
    id: '3',
    title: 'Actualización de certificados SSL',
    description: 'Renovación automática de certificados de seguridad completada sin interrupciones.',
    status: 'resolved',
    severity: 'low',
    startTime: '2025-07-20 01:00 UTC',
    endTime: '2025-07-20 01:15 UTC',
    affectedServices: ['Portal Web', 'Autenticación']
  }
]

export default function StatusPage() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLastRefresh(new Date())
    setIsRefreshing(false)
  }

  useEffect(() => {
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      setLastRefresh(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-700 bg-green-100 border-green-200'
      case 'degraded':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'outage':
        return 'text-red-700 bg-red-100 border-red-200'
    }
  }

  const getStatusText = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'Operacional'
      case 'degraded':
        return 'Degradado'
      case 'outage':
        return 'Fuera de Servicio'
    }
  }

  const getSeverityColor = (severity: HistoricalIncident['severity']) => {
    switch (severity) {
      case 'low':
        return 'text-blue-700 bg-blue-100'
      case 'medium':
        return 'text-yellow-700 bg-yellow-100'
      case 'high':
        return 'text-red-700 bg-red-100'
    }
  }

  const overallStatus = services.every(s => s.status === 'operational') 
    ? 'operational' 
    : services.some(s => s.status === 'outage')
    ? 'outage'
    : 'degraded'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver al inicio</span>
            </Link>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              {getStatusIcon(overallStatus)}
              <h1 className="text-3xl font-bold text-gray-900">Estado del Sistema</h1>
            </div>
            <p className="text-gray-600 mb-4">
              {overallStatus === 'operational' && 'Todos los sistemas funcionando correctamente'}
              {overallStatus === 'degraded' && 'Algunos servicios experimentan problemas menores'}
              {overallStatus === 'outage' && 'Experimentamos interrupciones en algunos servicios'}
            </p>
            <p className="text-sm text-gray-500">
              Última actualización: {lastRefresh.toLocaleString('es-ES')}
            </p>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div className={`mb-8 p-6 rounded-2xl border-2 ${getStatusColor(overallStatus)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(overallStatus)}
              <div>
                <h2 className="text-xl font-semibold">
                  {overallStatus === 'operational' && '✅ Todos los sistemas operacionales'}
                  {overallStatus === 'degraded' && '⚠️ Rendimiento degradado'}
                  {overallStatus === 'outage' && '❌ Servicios interrumpidos'}
                </h2>
                <p className="text-sm opacity-90">
                  {overallStatus === 'operational' && 'AltaMedica está funcionando sin problemas'}
                  {overallStatus === 'degraded' && 'Algunos servicios pueden verse afectados'}
                  {overallStatus === 'outage' && 'Trabajamos para restablecer el servicio'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">99.96%</div>
              <div className="text-sm opacity-90">Uptime total</div>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Estado de Servicios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.name} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>
                    {getStatusIcon(service.status)}
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(service.status)} mb-4`}>
                    {getStatusText(service.status)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Uptime</div>
                      <div className="font-medium text-green-600">{service.uptime}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Respuesta</div>
                      <div className="font-medium">{service.responseTime}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Actualizado</div>
                      <div className="font-medium">{service.lastUpdated}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Uptime Promedio</h3>
                <p className="text-3xl font-bold text-green-600">99.96%</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Últimos 30 días</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tiempo de Respuesta</h3>
                <p className="text-3xl font-bold text-blue-600">127ms</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Promedio global</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Incidentes</h3>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Activos ahora</p>
          </div>
        </div>

        {/* Historical Incidents */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Historial de Incidentes</h2>
          
          {historicalIncidents.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay incidentes recientes</h3>
              <p className="text-gray-600">Todos los sistemas han estado funcionando sin problemas</p>
            </div>
          ) : (
            <div className="space-y-6">
              {historicalIncidents.map((incident) => (
                <div key={incident.id} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity === 'low' && 'Baja'}
                          {incident.severity === 'medium' && 'Media'}
                          {incident.severity === 'high' && 'Alta'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{incident.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {incident.affectedServices.map((service) => (
                          <span key={service} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                            {service}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Inicio: {new Date(incident.startTime).toLocaleString('es-ES')}</span>
                        {incident.endTime && (
                          <span>Fin: {new Date(incident.endTime).toLocaleString('es-ES')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {incident.status === 'resolved' && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Resuelto</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Information */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">¿Experimentas problemas?</h3>
            <p className="text-blue-800 mb-4">
              Si encuentras algún problema que no aparece aquí, por favor contáctanos.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/help"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Centro de Ayuda
              </Link>
              <a
                href="mailto:soporte@altamedica.com"
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Contactar Soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}