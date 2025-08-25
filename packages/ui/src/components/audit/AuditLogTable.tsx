'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../Button';
import { Calendar } from '../calendar';
import { Input } from '../Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table/Table';
// Popover no existe en esta lib; omitir si no está en uso
// import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, ChevronDown, ChevronUp, Download, Filter, Loader2 } from 'lucide-react';
import { Badge } from '../Badge';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  },
};
/**
 * Audit Log Table Component
 * Compliant with Argentina Ley 26.529 - Article 15
 * Provides sortable, filterable, and exportable audit trail
 */

export interface AuditLog {
  id: string;
  actorId: string;
  actorType: string;
  resource: string;
  action: string;
  timestamp: string | Date;
  metadata?: Record<string, any>;
}

export interface AuditLogTableProps {
  apiEndpoint?: string;
  initialPageSize?: number;
  showExport?: boolean;
  showFilters?: boolean;
  onRowClick?: (log: AuditLog) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  apiEndpoint = '/api/v1/audit-logs',
  initialPageSize = 20,
  showExport = true,
  showFilters = true,
  onRowClick,
}) => {
  // State management
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'timestamp' | 'action' | 'resource'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    actorId: '',
    resource: '',
    action: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  // Temporary filter state (before applying)
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  /**
   * Fetch audit logs from API
   */
  const fetchLogs = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        // Add filters
        if (filters.actorId) params.append('actorId', filters.actorId);
        if (filters.resource) params.append('resource', filters.resource);
        if (filters.action) params.append('action', filters.action);
        if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

        // Add pagination
        if (!reset && cursor) params.append('cursor', cursor);
        params.append('limit', initialPageSize.toString());

        const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          if (reset) {
            setLogs(data.data);
          } else {
            setLogs((prev) => [...prev, ...data.data]);
          }

          setCursor(data.pagination?.nextCursor || null);
          setHasMore(data.pagination?.hasMore || false);
          setTotal(data.pagination?.total || data.data.length);
        } else {
          throw new Error(data.error || 'Failed to fetch audit logs');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        logger.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint, filters, cursor, initialPageSize],
  );

  /**
   * Handle CSV export
   */
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();

      // Add current filters
      if (filters.actorId) params.append('actorId', filters.actorId);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`${apiEndpoint}/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export audit logs');
      logger.error('Export error:', err);
    }
  };

  /**
   * Handle sort change
   */
  const handleSort = (field: 'timestamp' | 'action' | 'resource') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }

    // Client-side sorting for current page
    const sorted = [...logs].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setLogs(sorted);
  };

  /**
   * Apply filters
   */
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setCursor(null);
    setShowFilterPanel(false);
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    const clearedFilters = {
      actorId: '',
      resource: '',
      action: '',
      startDate: null,
      endDate: null,
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    setCursor(null);
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es });
  };

  /**
   * Get action badge color
   */
  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-500';
    if (action.includes('update')) return 'bg-blue-500';
    if (action.includes('delete')) return 'bg-red-500';
    if (action.includes('view') || action.includes('list')) return 'bg-gray-500';
    return 'bg-purple-500';
  };

  // Initial load
  useEffect(() => {
    fetchLogs(true);
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Header with filters and export */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Registro de Auditoría</h2>

        <div className="flex gap-2">
          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          )}

          {showExport && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={logs.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Actor ID</label>
              <Input
                value={tempFilters.actorId}
                onChange={(e) => setTempFilters({ ...tempFilters, actorId: e.target.value })}
                placeholder="UUID del actor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Recurso</label>
              <Input
                value={tempFilters.resource}
                onChange={(e) => setTempFilters({ ...tempFilters, resource: e.target.value })}
                placeholder="Ej: prescription/123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Acción</label>
              <Select
                value={tempFilters.action}
                onValueChange={(value) => setTempFilters({ ...tempFilters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="view">Ver</SelectItem>
                  <SelectItem value="create">Crear</SelectItem>
                  <SelectItem value="update">Actualizar</SelectItem>
                  <SelectItem value="delete">Eliminar</SelectItem>
                  <SelectItem value="prescription_create">Crear Prescripción</SelectItem>
                  <SelectItem value="prescription_list">Listar Prescripciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempFilters.startDate
                      ? format(tempFilters.startDate, 'dd/MM/yyyy')
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tempFilters.startDate || undefined}
                    onSelect={(date) => setTempFilters({ ...tempFilters, startDate: date || null })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fecha Fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempFilters.endDate
                      ? format(tempFilters.endDate, 'dd/MM/yyyy')
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tempFilters.endDate || undefined}
                    onSelect={(date) => setTempFilters({ ...tempFilters, endDate: date || null })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar
            </Button>
            <Button onClick={applyFilters}>Aplicar Filtros</Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  Fecha/Hora
                  {sortField === 'timestamp' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Actor</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('action')}
              >
                <div className="flex items-center gap-1">
                  Acción
                  {sortField === 'action' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('resource')}
              >
                <div className="flex items-center gap-1">
                  Recurso
                  {sortField === 'resource' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-gray-500">Cargando registros...</p>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <p>No se encontraron registros de auditoría</p>
                  {(filters.actorId ||
                    filters.resource ||
                    filters.action ||
                    filters.startDate ||
                    filters.endDate) && <p className="mt-2 text-sm">Intenta ajustar los filtros</p>}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onClick={() => onRowClick?.(log)}
                >
                  <TableCell className="font-mono text-sm">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.actorId.slice(0, 8)}...</div>
                      <div className="text-sm text-gray-500">{log.actorType}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getActionColor(log.action)} text-white`}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.resource}</TableCell>
                  <TableCell>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          logger.info('Metadata:', log.metadata);
                        }}
                      >
                        Ver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Mostrando {logs.length} de {total} registros
        </div>

        {hasMore && (
          <Button variant="outline" onClick={() => fetchLogs(false)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              'Cargar más'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
