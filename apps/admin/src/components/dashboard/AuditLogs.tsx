'use client';

import { logger } from '@altamedica/shared/services/logger.service';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Search,
  Shield,
  User,
} from 'lucide-react';
import React, { useState } from 'react';

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AuditLogsProps {
  logs: AuditLog[];
  onViewLog: (logId: string) => void;
  onExport: (type: string) => Promise<void>;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ logs, onViewLog, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return <User className="w-4 h-4" />;
      case 'USER_LOGOUT':
        return <User className="w-4 h-4" />;
      case 'USER_ROLE_UPDATE':
        return <Shield className="w-4 h-4" />;
      case 'USER_SUSPENDED':
        return <AlertTriangle className="w-4 h-4" />;
      case 'USER_ACTIVATED':
        return <CheckCircle className="w-4 h-4" />;
      case 'DATA_ACCESS':
        return <FileText className="w-4 h-4" />;
      case 'SYSTEM_CHANGE':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesSeverity && matchesAction;
  });

  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setShowLogModal(true);
    onViewLog(log.id);
  };

  const handleExport = async (type: string) => {
    try {
      await onExport(type);
    } catch (error) {
      logger.error('Error exportando logs:', String(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Logs de Auditoría</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar JSON
            </button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las severidades</option>
              <option value="critical">Crítico</option>
              <option value="high">Alto</option>
              <option value="medium">Medio</option>
              <option value="low">Bajo</option>
            </select>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las acciones</option>
              <option value="USER_LOGIN">Login de Usuario</option>
              <option value="USER_LOGOUT">Logout de Usuario</option>
              <option value="USER_ROLE_UPDATE">Actualización de Rol</option>
              <option value="USER_SUSPENDED">Usuario Suspendido</option>
              <option value="USER_ACTIVATED">Usuario Activado</option>
              <option value="DATA_ACCESS">Acceso a Datos</option>
              <option value="SYSTEM_CHANGE">Cambio del Sistema</option>
            </select>
          </div>
        </div>

        {/* Tabla de logs */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-1 bg-gray-100 rounded mr-2">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.action.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{log.details}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.userEmail}</div>
                    <div className="text-sm text-gray-500">ID: {log.userId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewLog(log)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {filteredLogs.length} de {logs.length} logs
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Anterior
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalles del log */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalles del Log de Auditoría</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">ID del Log</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Acción</label>
                  <p className="text-sm text-gray-900">{selectedLog.action}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Usuario</label>
                  <p className="text-sm text-gray-900">{selectedLog.userEmail}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">ID de Usuario</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.userId}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Severidad</label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedLog.severity)}`}
                  >
                    {selectedLog.severity}
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Dirección IP</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Timestamp</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Detalles</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedLog.details}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Exportar Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
