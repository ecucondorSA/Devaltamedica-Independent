import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for managing audit logs
 * Provides data fetching, filtering, and export functionality
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

export interface AuditFilters {
  actorId?: string;
  resource?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditPagination {
  cursor?: string;
  limit?: number;
}

export interface UseAuditLogsOptions {
  apiEndpoint?: string;
  initialFilters?: AuditFilters;
  pageSize?: number;
  enabled?: boolean;
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
    limit: number;
  };
}

export interface AuditStats {
  totalEvents: number;
  uniqueActors: number;
  topActions: Array<{ action: string; count: number }>;
  recentActivity: Array<{ hour: string; count: number }>;
}

/**
 * Fetch audit logs from API
 */
const fetchAuditLogs = async (
  endpoint: string,
  filters: AuditFilters,
  pagination: AuditPagination
): Promise<AuditLogsResponse> => {
  const params = new URLSearchParams();
  
  // Add filters
  if (filters.actorId) params.append('actorId', filters.actorId);
  if (filters.resource) params.append('resource', filters.resource);
  if (filters.action) params.append('action', filters.action);
  if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
  
  // Add pagination
  if (pagination.cursor) params.append('cursor', pagination.cursor);
  if (pagination.limit) params.append('limit', pagination.limit.toString());

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch audit statistics
 */
const fetchAuditStats = async (
  endpoint: string,
  filters: AuditFilters
): Promise<AuditStats> => {
  const params = new URLSearchParams();
  
  if (filters.actorId) params.append('actorId', filters.actorId);
  if (filters.resource) params.append('resource', filters.resource);
  if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

  const response = await fetch(`${endpoint}/stats?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};

/**
 * Export audit logs as CSV
 */
const exportAuditLogs = async (
  endpoint: string,
  filters: AuditFilters
): Promise<Blob> => {
  const params = new URLSearchParams();
  
  if (filters.actorId) params.append('actorId', filters.actorId);
  if (filters.resource) params.append('resource', filters.resource);
  if (filters.action) params.append('action', filters.action);
  if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

  const response = await fetch(`${endpoint}/export?${params.toString()}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
};

/**
 * Main hook for audit logs management
 */
export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const {
    apiEndpoint = '/api/v1/audit-logs',
    initialFilters = {},
    pageSize = 20,
    enabled = true
  } = options;

  const queryClient = useQueryClient();
  
  // State
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [pagination, setPagination] = useState<AuditPagination>({
    limit: pageSize
  });
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);

  // Query for fetching logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['auditLogs', filters, pagination],
    queryFn: () => fetchAuditLogs(apiEndpoint, filters, pagination),
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000 // 5 minutes
  });

  // Query for fetching stats
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['auditStats', filters],
    queryFn: () => fetchAuditStats(apiEndpoint, filters),
    enabled: enabled && !!logsData,
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Mutation for exporting
  const exportMutation = useMutation({
    mutationFn: () => exportAuditLogs(apiEndpoint, filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  });

  // Update all logs when data changes
  useEffect(() => {
    if (logsData?.data) {
      if (pagination.cursor) {
        // Append to existing logs
        setAllLogs(prev => [...prev, ...logsData.data]);
      } else {
        // Replace logs (new filter or initial load)
        setAllLogs(logsData.data);
      }
    }
  }, [logsData, pagination.cursor]);

  // Load more function
  const loadMore = useCallback(() => {
    if (logsData?.pagination.nextCursor) {
      setPagination(prev => ({
        ...prev,
        cursor: logsData.pagination.nextCursor
      }));
    }
  }, [logsData]);

  // Apply filters function
  const applyFilters = useCallback((newFilters: AuditFilters) => {
    setFilters(newFilters);
    setPagination({ limit: pageSize }); // Reset pagination
    setAllLogs([]); // Clear logs
  }, [pageSize]);

  // Clear filters function
  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination({ limit: pageSize });
    setAllLogs([]);
  }, [pageSize]);

  // Export function
  const exportLogs = useCallback(() => {
    exportMutation.mutate();
  }, [exportMutation]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    queryClient.invalidateQueries({ queryKey: ['auditStats'] });
  }, [queryClient]);

  return {
    // Data
    logs: allLogs,
    stats: statsData,
    pagination: logsData?.pagination,
    
    // Loading states
    isLoading,
    statsLoading,
    exportLoading: exportMutation.isPending,
    
    // Error states
    error: error as Error | null,
    exportError: exportMutation.error as Error | null,
    
    // Actions
    loadMore,
    applyFilters,
    clearFilters,
    exportLogs,
    refetch,
    refetchStats,
    invalidate,
    
    // Current state
    filters,
    hasMore: logsData?.pagination.hasMore || false,
    total: logsData?.pagination.total || 0
  };
}

/**
 * Hook for real-time audit log monitoring
 */
export function useAuditLogStream(options: {
  onNewLog?: (log: AuditLog) => void;
  enabled?: boolean;
} = {}) {
  const { onNewLog, enabled = true } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // In a real implementation, this would connect to a WebSocket
    // For now, we'll poll every 10 seconds
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }, 10000);

    return () => clearInterval(interval);
  }, [enabled, queryClient]);

  return {
    // Placeholder for WebSocket connection state
    connected: enabled,
    reconnect: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  };
}