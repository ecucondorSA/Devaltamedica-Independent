import { useState, useEffect } from 'react';

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  details: string;
  level: 'info' | 'warning' | 'critical';
  resource: string;
  actorId: string;
}

export interface AuditLogStats {
  totalLogs: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  lastUpdate: Date;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  totalEvents: number;
  uniqueActors: number;
  recentActivity: Array<{ hour: string; count: number }>;
}

export interface UseAuditLogsOptions {
  pageSize?: number;
  enabled?: boolean;
}

export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const { pageSize = 50, enabled = true } = options;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({});

  // Sync loading states
  const syncLoading = (value: boolean) => {
    setLoading(value);
    setIsLoading(value);
    setStatsLoading(value);
  };
  const [stats, setStats] = useState<AuditLogStats>({
    totalLogs: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    lastUpdate: new Date(),
    topActions: [],
    topUsers: [],
    totalEvents: 0,
    uniqueActors: 0,
    recentActivity: [],
  });

  const calculateStats = (logsData: AuditLog[]): AuditLogStats => {
    const critical = logsData.filter((log) => log.level === 'critical').length;
    const warning = logsData.filter((log) => log.level === 'warning').length;
    const info = logsData.filter((log) => log.level === 'info').length;

    // Calculate top actions
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    logsData.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({ userId, count }));

    // Generate mock recent activity (last 24 hours)
    const recentActivity = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString();
      const count = Math.floor(Math.random() * 50) + (i > 18 ? 10 : 0); // More activity in recent hours
      return { hour, count };
    });

    return {
      totalLogs: logsData.length,
      criticalCount: critical,
      warningCount: warning,
      infoCount: info,
      lastUpdate: new Date(),
      topActions,
      topUsers,
      totalEvents: logsData.length,
      uniqueActors: Object.keys(userCounts).length,
      recentActivity,
    };
  };

  const fetchLogs = async () => {
    if (!enabled) return;

    syncLoading(true);
    try {
      // Mock data for development - replace with real API call
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date(),
          action: 'user_login',
          userId: 'doctor_1',
          details: 'Doctor logged in successfully',
          level: 'info',
          resource: 'auth',
          actorId: 'doctor_1',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000),
          action: 'prescription_create',
          userId: 'doctor_1',
          details: 'Created prescription for patient',
          level: 'info',
          resource: 'prescription',
          actorId: 'doctor_1',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000),
          action: 'hipaa_violation_detected',
          userId: 'system',
          details: 'Unauthorized access attempt detected',
          level: 'critical',
          resource: 'security',
          actorId: 'system',
        },
      ];

      console.log('Fetching audit logs...');
      setLogs(mockLogs);
      setStats(calculateStats(mockLogs));
      setTotal(mockLogs.length + Math.floor(Math.random() * 1000)); // Mock total
      setHasMore(mockLogs.length >= pageSize);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
      setStats({
        totalLogs: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        lastUpdate: new Date(),
        topActions: [],
        topUsers: [],
        totalEvents: 0,
        uniqueActors: 0,
        recentActivity: [],
      });
    } finally {
      syncLoading(false);
    }
  };

  const applyFilters = (newFilters: any) => {
    setFilters(newFilters);
    fetchLogs(); // Re-fetch with new filters
  };

  const clearFilters = () => {
    setFilters({});
    fetchLogs();
  };

  const loadMore = async () => {
    if (!hasMore || isLoading) return;

    // Mock load more functionality
    setIsLoading(true);
    setTimeout(() => {
      setHasMore(false); // Mock: no more pages
      setIsLoading(false);
    }, 1000);
  };

  const exportLogs = async () => {
    setExportLoading(true);
    try {
      // Mock CSV export
      const csv = logs
        .map(
          (log) =>
            `${log.timestamp},${log.action},${log.userId},${log.resource},${log.level},${log.details}`,
        )
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [enabled]);

  return {
    logs,
    loading,
    isLoading,
    stats,
    statsLoading,
    filters,
    applyFilters,
    clearFilters,
    exportLogs,
    exportLoading,
    hasMore,
    loadMore,
    total,
    refetch: fetchLogs,
    calculateStats,
  };
};
