'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  Wrench, 
  Database, 
  Trash2, 
  Download,
  Upload,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  HardDrive,
  Shield,
  Zap
} from 'lucide-react';

interface MaintenanceTask {
  id: string;
  name: string;
  type: 'backup' | 'cleanup' | 'optimization' | 'update' | 'security';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  description: string;
  estimatedTime: string;
  lastRun?: string;
  nextRun?: string;
  size?: string;
  result?: string;
}

interface SystemInfo {
  diskUsage: number;
  memoryUsage: number;
  databaseSize: string;
  logFilesSize: string;
  tempFilesSize: string;
  lastBackup: string;
  lastCleanup: string;
  lastOptimization: string;
}

export default function MaintenanceTools() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simular datos de mantenimiento
        const mockTasks: MaintenanceTask[] = [
          {
            id: 'backup-001',
            name: 'Backup Completo de Base de Datos',
            type: 'backup',
            status: 'completed',
            progress: 100,
            description: 'Backup automático de toda la base de datos médica',
            estimatedTime: '15 minutos',
            lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            nextRun: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
            size: '2.5 GB',
            result: 'Backup completado exitosamente'
          },
          {
            id: 'cleanup-001',
            name: 'Limpieza de Logs Antiguos',
            type: 'cleanup',
            status: 'running',
            progress: 65,
            description: 'Eliminación de logs con más de 30 días',
            estimatedTime: '5 minutos',
            lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            result: 'Procesando archivos...'
          },
          {
            id: 'optimization-001',
            name: 'Optimización de Base de Datos',
            type: 'optimization',
            status: 'pending',
            progress: 0,
            description: 'Defragmentación y optimización de índices',
            estimatedTime: '20 minutos',
            nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'security-001',
            name: 'Actualización de Certificados SSL',
            type: 'security',
            status: 'completed',
            progress: 100,
            description: 'Renovación automática de certificados SSL',
            estimatedTime: '2 minutos',
            lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            nextRun: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
            result: 'Certificados actualizados correctamente'
          },
          {
            id: 'update-001',
            name: 'Actualización de Dependencias',
            type: 'update',
            status: 'failed',
            progress: 0,
            description: 'Actualización de paquetes npm y dependencias',
            estimatedTime: '10 minutos',
            lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            result: 'Error: Conflicto de versiones detectado'
          }
        ];

        const mockSystemInfo: SystemInfo = {
          diskUsage: 78,
          memoryUsage: 65,
          databaseSize: '15.2 GB',
          logFilesSize: '2.1 GB',
          tempFilesSize: '500 MB',
          lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          lastOptimization: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        setTasks(mockTasks);
        setSystemInfo(mockSystemInfo);
      } catch (err) {
        logger.error('Error fetching maintenance data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaintenanceData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchMaintenanceData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'backup': return <Database className="w-4 h-4" />;
      case 'cleanup': return <Trash2 className="w-4 h-4" />;
      case 'optimization': return <Zap className="w-4 h-4" />;
      case 'update': return <Upload className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const runTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'running', progress: 0 }
        : task
    ));
    
    // Simular progreso
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.id === taskId && task.status === 'running') {
          const newProgress = Math.min(task.progress + 10, 100);
          return {
            ...task,
            progress: newProgress,
            status: newProgress === 100 ? 'completed' : 'running'
          };
        }
        return task;
      }));
    }, 1000);

    setTimeout(() => clearInterval(interval), 10000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar herramientas de mantenimiento</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Información del Sistema */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Herramientas de Mantenimiento</h2>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </button>
          </div>
        </div>

        {systemInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Uso de Disco</p>
                  <p className="text-2xl font-bold">{systemInfo.diskUsage}%</p>
                </div>
                <HardDrive className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Tamaño DB</p>
                  <p className="text-2xl font-bold text-green-700">{systemInfo.databaseSize}</p>
                </div>
                <Database className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Logs</p>
                  <p className="text-2xl font-bold text-yellow-700">{systemInfo.logFilesSize}</p>
                </div>
                <Trash2 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Archivos Temp</p>
                  <p className="text-2xl font-bold text-purple-700">{systemInfo.tempFilesSize}</p>
                </div>
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Información de Últimas Ejecuciones */}
        {systemInfo && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Último Backup:</p>
              <p className="font-medium text-gray-900">
                {new Date(systemInfo.lastBackup).toLocaleString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Última Limpieza:</p>
              <p className="font-medium text-gray-900">
                {new Date(systemInfo.lastCleanup).toLocaleString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Última Optimización:</p>
              <p className="font-medium text-gray-900">
                {new Date(systemInfo.lastOptimization).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tareas de Mantenimiento */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tareas de Mantenimiento</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <div key={task.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(task.type)}
                    <h4 className="text-lg font-medium text-gray-900">{task.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                      <span className="ml-1">
                        {task.status === 'completed' ? 'Completado' :
                         task.status === 'running' ? 'Ejecutando' :
                         task.status === 'pending' ? 'Pendiente' : 'Fallido'}
                      </span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  {/* Barra de Progreso */}
                  {task.status === 'running' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Tiempo Estimado:</p>
                      <p className="text-gray-600">{task.estimatedTime}</p>
                    </div>
                    {task.size && (
                      <div>
                        <p className="font-medium text-gray-900">Tamaño:</p>
                        <p className="text-gray-600">{task.size}</p>
                      </div>
                    )}
                    {task.lastRun && (
                      <div>
                        <p className="font-medium text-gray-900">Última Ejecución:</p>
                        <p className="text-gray-600">
                          {new Date(task.lastRun).toLocaleString('es-ES')}
                        </p>
                      </div>
                    )}
                    {task.nextRun && (
                      <div>
                        <p className="font-medium text-gray-900">Próxima Ejecución:</p>
                        <p className="text-gray-600">
                          {new Date(task.nextRun).toLocaleString('es-ES')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {task.result && (
                    <div className="mt-3">
                      <p className="font-medium text-gray-900">Resultado:</p>
                      <p className={`text-sm ${
                        task.status === 'completed' ? 'text-green-600' :
                        task.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {task.result}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="ml-6">
                  {task.status === 'pending' && (
                    <button 
                      onClick={() => runTask(task.id)}
                      className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                      Ejecutar
                    </button>
                  )}
                  {task.status === 'running' && (
                    <div className="text-sm text-blue-600">Ejecutando...</div>
                  )}
                  {task.status === 'completed' && (
                    <div className="text-sm text-green-600">✓ Completado</div>
                  )}
                  {task.status === 'failed' && (
                    <button className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                      Reintentar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Database className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Backup Manual</span>
            <span className="text-xs text-gray-500">Crear backup ahora</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Trash2 className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Limpieza</span>
            <span className="text-xs text-gray-500">Limpiar archivos temp</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Zap className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Optimizar</span>
            <span className="text-xs text-gray-500">Optimizar sistema</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Shield className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Seguridad</span>
            <span className="text-xs text-gray-500">Verificar seguridad</span>
          </button>
        </div>
      </div>
    </div>
  );
} 