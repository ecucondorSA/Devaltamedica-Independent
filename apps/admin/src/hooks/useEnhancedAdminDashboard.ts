/**
 * Enhanced Admin Dashboard Hook
 * Integra patterns del patient dashboard con funcionalidades admin
 * Incluye real-time updates, HIPAA compliance, y emergency alerts
 */

import { MetricCardProps } from '@altamedica/ui';

import { useState, useEffect, useCallback } from 'react';

import { useRealTimeUpdates, RealTimeUpdate } from './useRealTimeUpdates';

export interface AdminMetrics {
  totalUsers: number;
  activePatients: number;
  activeDoctors: number;
  activeCompanies: number;
  totalRevenue: number;
  emergencyConsultations: number;
  systemHealth: number;
  hipaaCompliance: number;
  avgResponseTime: number;
  criticalAlerts: number;
}

interface ComplianceStatus {
  hipaa: boolean;
  uptime: number;
  lastAudit: Date;
}

export interface AdminDashboardData {
  metrics: AdminMetrics;
  recentActivities: unknown[];
  systemStatus: 'healthy' | 'warning' | 'critical';
  emergencyAlerts: string[];
  complianceStatus: ComplianceStatus;
}

export const useEnhancedAdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  // Real-time updates siguiendo el pattern del patient dashboard
  const { isConnected, connectionQuality } = useRealTimeUpdates({
    onUpdate: (update: RealTimeUpdate) => {
      if (update.type === 'emergency_alert') {
        setEmergencyMode(true);
        // Trigger emergency protocols
      }
      // Update metrics in real-time
      setData((prevData) =>
        prevData
          ? {
              ...prevData,
              ...(update.data as Partial<AdminDashboardData>),
            }
          : null,
      );
    },
    endpoint: '/admin/realtime',
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch admin metrics
      const metricsResponse = await fetch('/api/v1/admin/metrics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch admin metrics');
      }

      const metrics = await metricsResponse.json() as { data: AdminMetrics };

      // Fetch system status
      const statusResponse = await fetch('/api/v1/admin/system-status');
      const systemStatus = await statusResponse.json() as { data: { status: 'healthy' | 'warning' | 'critical'; emergencyAlerts?: string[] } };

      // Fetch compliance status
      const complianceResponse = await fetch('/api/v1/admin/compliance-status');
      const complianceStatus = await complianceResponse.json() as { data: ComplianceStatus };

      const dashboardData: AdminDashboardData = {
        metrics: metrics.data,
        recentActivities: [], // TODO: Implement
        systemStatus: systemStatus.data.status,
        emergencyAlerts: systemStatus.data.emergencyAlerts || [],
        complianceStatus: complianceStatus.data,
      };

      setData(dashboardData);

      // Check for emergency conditions
      if (dashboardData.emergencyAlerts.length > 0 || dashboardData.metrics.criticalAlerts > 0) {
        setEmergencyMode(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convert metrics to MetricCard format
  const getMetricsForDisplay = useCallback((): MetricCardProps[] => {
    if (!data) return [];

    return [
      {
        title: 'Total Users',
        value: data.metrics.totalUsers.toLocaleString(),
        subtitle: 'Active platform users',
        trend: { value: 12, isPositive: true, direction: 'up', label: 'vs last month' },
        status: 'normal',
        medicalContext: {
          hipaaCompliant: true,
          lastUpdated: new Date(),
        },
      },
      {
        title: 'Active Patients',
        value: data.metrics.activePatients.toLocaleString(),
        subtitle: 'Currently enrolled',
        trend: { value: 8, isPositive: true, direction: 'up', label: 'vs last week' },
        status: 'success',
        realTimeUpdate: true,
        medicalContext: {
          hipaaCompliant: true,
          lastUpdated: new Date(),
        },
      },
      {
        title: 'Active Doctors',
        value: data.metrics.activeDoctors.toLocaleString(),
        subtitle: 'Online and available',
        status: 'normal',
        realTimeUpdate: true,
        medicalContext: {
          hipaaCompliant: true,
          lastUpdated: new Date(),
        },
      },
      {
        title: 'Revenue',
        value: `$${(data.metrics.totalRevenue / 1000).toFixed(1)}K`,
        subtitle: 'This month',
        trend: { value: 15, isPositive: true, direction: 'up', label: 'vs last month' },
        status: 'success',
        medicalContext: {
          hipaaCompliant: true,
          lastUpdated: new Date(),
        },
      },
      {
        title: 'Emergency Consultations',
        value: data.metrics.emergencyConsultations,
        subtitle: 'Active now',
        status: data.metrics.emergencyConsultations > 5 ? 'critical' : 'normal',
        realTimeUpdate: true,
        medicalContext: {
          isEmergency: data.metrics.emergencyConsultations > 5,
          hipaaCompliant: true,
          lastUpdated: new Date(),
        },
      },
      {
        title: 'System Health',
        value: `${data.metrics.systemHealth}%`,
        subtitle: 'Overall performance',
        status: data.metrics.systemHealth < 90 ? 'warning' : 'success',
        trend: {
          value: Math.abs(data.metrics.systemHealth - 95),
          isPositive: data.metrics.systemHealth >= 95,
          direction: data.metrics.systemHealth >= 95 ? 'up' : 'down',
        },
        medicalContext: {
          hipaaCompliant: true,
          lastUpdated: new Date(),
        },
      },
      {
        title: 'HIPAA Compliance',
        value: `${data.metrics.hipaaCompliance}%`,
        subtitle: 'Compliance score',
        status: data.metrics.hipaaCompliance < 95 ? 'critical' : 'success',
        medicalContext: {
          isEmergency: data.metrics.hipaaCompliance < 95,
          hipaaCompliant: data.metrics.hipaaCompliance >= 95,
          lastUpdated: new Date(),
        },
      },
      {
        title: 'Avg Response Time',
        value: `${data.metrics.avgResponseTime}ms`,
        subtitle: 'API performance',
        status: data.metrics.avgResponseTime > 500 ? 'warning' : 'success',
        trend: {
          value: 5,
          isPositive: data.metrics.avgResponseTime < 200,
          direction: data.metrics.avgResponseTime < 200 ? 'down' : 'up',
        },
        medicalContext: {
          hipaaCompliant: true,
          lastUpdated: new Date(),
        },
      },
      {
        title: 'Critical Alerts',
        value: data.metrics.criticalAlerts,
        subtitle: 'Require attention',
        status: data.metrics.criticalAlerts > 0 ? 'critical' : 'success',
        realTimeUpdate: true,
        medicalContext: {
          isEmergency: data.metrics.criticalAlerts > 0,
          hipaaCompliant: true,
          lastUpdated: new Date(),
        },
      },
    ];
  }, [data]);

  // Get emergency metrics for StatsGrid
  const getEmergencyMetrics = useCallback((): string[] => {
    if (!data) return [];

    const emergencyMetrics: string[] = [];

    if (data.metrics.emergencyConsultations > 5) {
      emergencyMetrics.push('Emergency Consultations');
    }
    if (data.metrics.hipaaCompliance < 95) {
      emergencyMetrics.push('HIPAA Compliance');
    }
    if (data.metrics.criticalAlerts > 0) {
      emergencyMetrics.push('Critical Alerts');
    }

    return emergencyMetrics;
  }, [data]);

  useEffect(() => {
    void fetchDashboardData();

    // Refresh every 30 seconds for real-time admin monitoring
    const interval = setInterval(() => void fetchDashboardData(), 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    emergencyMode,
    isConnected,
    connectionQuality,
    metricsForDisplay: getMetricsForDisplay(),
    emergencyMetrics: getEmergencyMetrics(),
    refresh: fetchDashboardData,
    setEmergencyMode,
  };
};
