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
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AuditLogStats>({
    totalLogs: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    lastUpdate: new Date(),
    topActions: [],
    topUsers: [],
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

    return {
      totalLogs: logsData.length,
      criticalCount: critical,
      warningCount: warning,
      infoCount: info,
      lastUpdate: new Date(),
      topActions,
      topUsers,
    };
  };

  const fetchLogs = async () => {
    setLoading(true);
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
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    stats,
    refetch: fetchLogs,
    calculateStats,
  };
};
