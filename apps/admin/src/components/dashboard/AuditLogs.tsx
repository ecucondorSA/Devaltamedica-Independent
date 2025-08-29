/**
 * @fileoverview AuditLogs - Logs de auditoría con arquitectura 3 capas
 * @description Componente para visualizar logs de auditoría usando tipos simples + adaptadores
 */

'use client';

import React, { useEffect, useState } from 'react';
import { logger } from '@altamedica/shared';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Shield,
  User,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';

// Importar tipos simples (Capa de App)
import { AdapterUtils } from '../../adapters/admin-adapters';
// Importar adaptadores (Capa de Adaptador)
import { AuditLogEntry, LoadingState } from '../../types';

// ==================== INTERFACES ====================

interface AuditLogsProps {
  className?: string;
}

// ==================== MOCK DATA ====================

const createMockAuditLogs = (): AuditLogEntry[] => {
  const actions = [
    'USER_LOGIN',
    'USER_LOGOUT',
    'USER_ROLE_UPDATE',
    'DATA_ACCESS',
    'SYSTEM_CHANGE',
    'USER_SUSPENDED',
    'USER_ACTIVATED',
  ];
  const severities: ('info' | 'warning' | 'error')[] = ['info', 'warning', 'error'];
  const users = [
    { name: 'Dr. María González', email: 'maria.gonzalez@example.com' },
    { name: 'Admin Carlos López', email: 'carlos.lopez@admin.com' },
    { name: 'Ana Martínez', email: 'ana.martinez@example.com' },
    { name: 'System Admin', email: 'system@altamedica.com' },
  ];

  return Array.from({ length: 50 }, (_, i) => {
    const user = users[i % users.length];
    const action = actions[i % actions.length];
    const severity = severities[i % severities.length];

    return {
      id: `audit-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      userId: `user-${i + 1000}`,
      userName: user.name,
      userEmail: user.email,
      action,
      resource: action.includes('USER') ? 'user_management' : 'system',
      details: `${action.replace(/_/g, ' ').toLowerCase()} - ${user.name}`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: ['Chrome', 'Firefox', 'Safari', 'Edge'][i % 4],
      severity,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// ==================== COMPONENTE PRINCIPAL ====================

const AuditLogs: React.FC<AuditLogsProps> = ({ className = '' }) => {
  // ==================== ESTADO ====================
  const [loading, setLoading] = useState<LoadingState>({ loading: true });
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);

  // ==================== EFECTOS ====================
  useEffect(() => {
    const loadAuditLogs = async () => {
      setLoading({ loading: true });
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockLogs = createMockAuditLogs();
        setLogs(mockLogs);
        setLoading({ loading: false });
      } catch (error) {
        logger.error('Error loading audit logs', error);
        setLoading({ loading: false, error: 'Error loading logs' });
      }
    };

    void loadAuditLogs();
  }, []);

  // ==================== FUNCIONES AUXILIARES ====================

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return <User className="w-4 h-4 text-green-600" />;
      case 'USER_LOGOUT':
        return <User className="w-4 h-4 text-gray-600" />;
      case 'USER_ROLE_UPDATE':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'USER_SUSPENDED':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'USER_ACTIVATED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'DATA_ACCESS':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'SYSTEM_CHANGE':
        return <Activity className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesSeverity && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  const handleViewLog = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const handleExport = (format: 'csv' | 'json') => {
    try {
      const dataToExport = filteredLogs.map((log) => ({
        timestamp: AdapterUtils.formatDate(log.timestamp),
        user: log.userName,
        action: log.action.replace(/_/g, ' '),
        resource: log.resource,
        severity: log.severity,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      }));

      if (format === 'csv') {
        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
          headers.join(','),
          ...dataToExport.map((row) =>
            headers.map((h) => `"${row[h as keyof typeof row]}"` ).join(',')
          ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const jsonContent = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error('Error exportando logs', error);
    }
  };

  const handleRefresh = () => {
    setLoading({ loading: true });
    setTimeout(() => {
      const refreshedLogs = createMockAuditLogs();
      setLogs(refreshedLogs);
      setLoading({ loading: false });
    }, 1000);
  };

  // ==================== RENDERIZADO CONDICIONAL ====================

  if (loading.loading) {
    return (
      <Card className={`${className}`}> 
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Logs de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando logs de auditoría...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading.error) {
    return (
      <Card className={`${className}`}> 
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Error al Cargar Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No se pudieron cargar los logs de auditoría</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ==================== RENDERIZADO PRINCIPAL ====================

  return (
    <Card className={`${className}`}> 
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Logs de Auditoría
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredLogs.length} registros)
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Actualizar logs"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              JSON
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros y búsqueda */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por usuario, acción o detalles..."
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              >
                <option value="all">Todas las severidades</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
              >
                <option value="all">Todas las acciones</option>
                <option value="USER_LOGIN">Login Usuario</option>
                <option value="USER_LOGOUT">Logout Usuario</option>
                <option value="USER_ROLE_UPDATE">Actualización Rol</option>
                <option value="USER_SUSPENDED">Usuario Suspendido</option>
                <option value="USER_ACTIVATED">Usuario Activado</option>
                <option value="DATA_ACCESS">Acceso Datos</option>
                <option value="SYSTEM_CHANGE">Cambio Sistema</option>
              </select>
            </div>
          </div>
        </div>

        {/*Tabla de logs */}
        <div className="border rounded-lg overflow-hidden">
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
                    IP / Navegador
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
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Database className="w-12 h-12 mb-2 text-gray-300" />
                        <p className="text-sm">
                          No se encontraron logs que coincidan con los filtros
                        </p>
                        {(searchTerm || filterSeverity !== 'all' || filterAction !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setFilterSeverity('all');
                              setFilterAction('all');
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1.5 bg-gray-100 rounded-md mr-3">
                            {getActionIcon(log.action)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.action.replace(/_/g, ' ')}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {log.details}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                        
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                            log.severity,
                          )}`}
                        >
                          {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">{log.ipAddress}</div>
                        <div className="text-sm text-gray-500">{log.userAgent}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {AdapterUtils.formatDate(log.timestamp)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(log.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewLog(log)}
                          className="inline-flex items-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          title="Ver detalles completos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <span>
              Mostrando {startIndex + 1}-
              {Math.min(startIndex + logsPerPage, filteredLogs.length)} de {filteredLogs.length}{' '}
              registros
            </span>
            {filteredLogs.length !== logs.length && (
              <span className="text-gray-500">(filtrados de {logs.length} total)</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${ 
                      currentPage === pageNumber
                        ? 'text-blue-600 bg-blue-50 border border-blue-200'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-2 text-gray-500">...</span>}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </CardContent>

      {/* Modal de detalles del log */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getActionIcon(selectedLog.action)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Detalles del Log de Auditoría
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedLog.action.replace(/_/g, ' ')} -{' '}
                      {AdapterUtils.formatDate(selectedLog.timestamp)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                  title="Cerrar modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Información principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="logId">
                    ID del Log
                  </label>
                  <p
                    className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border"
                    id="logId"
                  >
                    {selectedLog.id}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="logAction">
                    Acción
                  </label>
                  <div className="flex items-center gap-2">
                    {getActionIcon(selectedLog.action)}
                    <p className="text-sm text-gray-900 font-medium" id="logAction">
                      {selectedLog.action.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="logResource">
                    Recurso
                  </label>
                  <p
                    className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border"
                    id="logResource"
                  >
                    {selectedLog.resource}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="logUser">
                    Usuario
                  </label>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900" id="logUser">
                      {selectedLog.userName}
                    </p>
                    
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="logUserId">
                    ID de Usuario
                  </label>
                  <p
                    className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border"
                    id="logUserId"
                  >
                    {selectedLog.userId}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="logSeverity">
                    Severidad
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getSeverityColor(
                      selectedLog.severity,
                    )}`}
                    id="logSeverity"
                  >
                    {selectedLog.severity.charAt(0).toUpperCase() + selectedLog.severity.slice(1)}
                  </span>
                </div>
              </div>

              {/* Información técnica */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Información Técnica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="logIp">
                      Dirección IP
                    </label>
                    <p
                      className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border"
                      id="logIp"
                    >
                      {selectedLog.ipAddress}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label
                      className="block text-sm font-medium text-gray-700"
                      htmlFor="logUserAgent"
                    >
                      Navegador
                    </label>
                    <p
                      className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border"
                      id="logUserAgent"
                    >
                      {selectedLog.userAgent}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label
                      className="block text-sm font-medium text-gray-700"
                      htmlFor="logTimestamp"
                    >
                      Fecha y Hora
                    </label>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-900" id="logTimestamp">
                        {AdapterUtils.formatDate(selectedLog.timestamp)}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        UTC: {new Date(selectedLog.timestamp).toISOString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      className="block text-sm font-medium text-gray-700"
                      htmlFor="logRelativeTime"
                    >
                      Tiempo Relativo
                    </label>
                    <p className="text-sm text-gray-900" id="logRelativeTime">
                      {(() => {
                        const diff = Date.now() - new Date(selectedLog.timestamp).getTime();
                        const minutes = Math.floor(diff / (1000 * 60));
                        const hours = Math.floor(minutes / 60);
                        const days = Math.floor(hours / 24);

                        if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
                        if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
                        if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
                        return 'Hace unos momentos';
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalles completos */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Detalles de la Acción</h4>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {selectedLog.details}
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Log ID: {selectedLog.id}</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLogModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      const logData = {
                        ...selectedLog,
                        timestamp: AdapterUtils.formatDate(selectedLog.timestamp),
                      };
                      const jsonContent = JSON.stringify(logData, null, 2);
                      const blob = new Blob([jsonContent], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `audit-log-${selectedLog.id}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AuditLogs;
