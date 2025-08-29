'use client';

import React, { useState } from 'react';
import { Activity, AlertCircle, Clock, FileText, Shield, TrendingUp, Users } from 'lucide-react';

import { useAuditLogs } from '@altamedica/hooks';
import { AuditLog } from '@altamedica/types';
import {
  AuditLogTable,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@altamedica/ui';

const API_ENDPOINT = '/api/v1/audit-logs';

/**
 * Admin Audit Dashboard Page
 * Complete E2E implementation for audit log viewing and analysis
 * Compliant with Argentina Ley 26.529
 */
export default function AuditDashboard() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Use the audit logs hook
  const {
    logs,
    stats,
    // isLoading,
    // statsLoading,
    // filters,
    // applyFilters,
    // clearFilters,
    exportLogs,
    exportLoading,
    // hasMore,
    // loadMore,
    total,
  } = useAuditLogs({
    pageSize: 50,
    enabled: true,
  });

  /**
   * Format number with locale
   */
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditoría del Sistema</h1>
          <p className="mt-2 text-gray-600">
            Registro completo de actividades - Ley 26.529 Art. 15
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-600">Sistema Protegido</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Eventos Totales</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(total)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Últimos 30 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.uniqueActors)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Usuarios únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Acción Principal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topActions[0]?.action || 'N/A'}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.topActions[0]?.count || 0} veces
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentActivity[stats.recentActivity.length - 1]?.count || 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Última hora</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">
            <FileText className="mr-2 h-4 w-4" />
            Registros
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="mr-2 h-4 w-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Shield className="mr-2 h-4 w-4" />
            Cumplimiento
          </TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Auditoría</CardTitle>
              <CardDescription>
                Todas las acciones realizadas en el sistema médico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogTable
                apiEndpoint={API_ENDPOINT}
                initialPageSize={50}
                showExport
                showFilters
                onRowClick={(log) => setSelectedLog(log as any)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Top Actions Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Más Frecuentes</CardTitle>
                <CardDescription>Top 10 acciones en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.topActions.map((action: { action: string; count: number }, index) => (
                    <div key={action.action} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{index + 1}
                        </span>
                        <Badge variant="outline">{action.action}</Badge>
                      </div>
                      <span className="text-sm font-medium">{formatNumber(action.count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad por Hora</CardTitle>
                <CardDescription>Últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.recentActivity.slice(-10).map((activity) => (
                    <div key={activity.hour} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.hour).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min(
                                100,
                                (activity.count /
                                  Math.max(...stats.recentActivity.map((a) => a.count))) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-medium">
                          {activity.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Críticas</CardTitle>
              <CardDescription>Acciones que requieren atención especial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs
                  .filter(
                    (log) =>
                      log.action.includes('delete') ||
                      log.action.includes('error') ||
                      log.action.includes('unauthorized'),
                  )
                  .slice(0, 5)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{log.action}</span>
                        <span className="text-xs text-muted-foreground">{log.resource}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Cumplimiento</CardTitle>
              <CardDescription>
                Verificación de requisitos legales y regulatorios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Compliance Checks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium">Ley 26.529 - Art. 15</span>
                    </div>
                    <Badge className="bg-green-500 text-white">Cumplido</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium">Registro de Modificaciones</span>
                    </div>
                    <Badge className="bg-green-500 text-white">Activo</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium">Identificación de Usuarios</span>
                    </div>
                    <Badge className="bg-green-500 text-white">Implementado</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium">Trazabilidad Completa</span>
                    </div>
                    <Badge className="bg-green-500 text-white">Operativo</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span className="font-medium">Integridad con Hash Chain</span>
                    </div>
                    <Badge className="bg-yellow-500 text-white">Pendiente (GAP-001-T5)</Badge>
                  </div>
                </div>

                {/* Compliance Summary */}
                <div className="mt-6 rounded border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">Sistema en Cumplimiento</h4>
                      <p className="mt-1 text-sm text-green-700">
                        El sistema cumple con los requisitos establecidos en la Ley 26.529 para el
                        registro de acceso y modificaciones en historias clínicas electrónicas. La
                        implementación de hash chain está planificada para la próxima fase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Exportación de Registros</CardTitle>
              <CardDescription>Generar reportes para auditorías externas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Exportar Registros Actuales</h4>
                    <p className="text-sm text-muted-foreground">
                      Descarga los registros filtrados en formato CSV
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportLogs}
                    disabled={exportLoading || logs.length === 0}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {exportLoading ? 'Exportando...' : 'Exportar CSV'}
                  </button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Total de registros disponibles: {formatNumber(total)}</p>
                  <p>Registros en vista actual: {formatNumber(logs.length)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>Detalles del Registro</CardTitle>
              <CardDescription>ID: {selectedLog.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Fecha/Hora</dt>
                  <dd>{selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString('es-AR') : ''}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Actor</dt>
                  <dd>
                    {selectedLog.actorId} ({selectedLog.actorType})
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Acción</dt>
                  <dd>
                    <Badge>{selectedLog.action}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Recurso</dt>
                  <dd className="font-mono text-sm">{selectedLog.resource}</dd>
                </div>
                {selectedLog.metadata && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Metadata</dt>
                    <dd>
                      <pre className="mt-1 overflow-auto rounded bg-gray-100 p-2 text-xs">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
