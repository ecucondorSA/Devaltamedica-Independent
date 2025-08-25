'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  Wifi,
  ZapOff,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';

// Types para el sistema de monitoreo
interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    iops: number;
  };
  network: {
    inbound: number;
    outbound: number;
    latency: number;
    connections: number;
  };
  services: ServiceHealth[];
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  port: number;
  responseTime: number;
  uptime: number;
  lastCheck: Date;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  service?: string;
}

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Mock data para demostración
  const generateMockMetrics = (): SystemMetrics => {
    const now = new Date();
    return {
      timestamp: now,
      cpu: {
        usage: Math.random() * 100,
        cores: 8,
        load: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
      },
      memory: {
        used: Math.random() * 32,
        total: 32,
        percentage: Math.random() * 100,
      },
      disk: {
        used: Math.random() * 500,
        total: 1000,
        percentage: Math.random() * 100,
        iops: Math.floor(Math.random() * 1000),
      },
      network: {
        inbound: Math.random() * 100,
        outbound: Math.random() * 50,
        latency: Math.random() * 20 + 10,
        connections: Math.floor(Math.random() * 500) + 100,
      },
      services: [
        {
          name: 'API Server',
          status: Math.random() > 0.1 ? 'healthy' : 'warning',
          port: 3001,
          responseTime: Math.random() * 100 + 50,
          uptime: 99.9,
          lastCheck: now,
        },
        {
          name: 'Patients App',
          status: Math.random() > 0.1 ? 'healthy' : 'warning',
          port: 3003,
          responseTime: Math.random() * 200 + 100,
          uptime: 99.8,
          lastCheck: now,
        },
        {
          name: 'Doctors App',
          status: Math.random() > 0.1 ? 'healthy' : 'critical',
          port: 3002,
          responseTime: Math.random() * 150 + 80,
          uptime: 99.5,
          lastCheck: now,
        },
        {
          name: 'Admin App',
          status: 'healthy',
          port: 3005,
          responseTime: Math.random() * 80 + 40,
          uptime: 100,
          lastCheck: now,
        },
        {
          name: 'Companies App',
          status: Math.random() > 0.2 ? 'healthy' : 'warning',
          port: 3004,
          responseTime: Math.random() * 120 + 60,
          uptime: 99.2,
          lastCheck: now,
        },
        {
          name: 'Signaling Server',
          status: Math.random() > 0.1 ? 'healthy' : 'critical',
          port: 8888,
          responseTime: Math.random() * 50 + 20,
          uptime: 99.95,
          lastCheck: now,
        },
      ],
    };
  };

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // En producción, esto haría una llamada real a la API
      // const response = await fetch('/api/v1/monitoring/metrics');
      // const data = await response.json();

      // Mock data para demostración
      const mockData = generateMockMetrics();
      setMetrics(mockData);

      // Generar alertas basadas en métricas
      const newAlerts: Alert[] = [];

      if (mockData.cpu.usage > 80) {
        newAlerts.push({
          id: `cpu-${Date.now()}`,
          type: 'critical',
          title: 'High CPU Usage',
          message: `CPU usage is at ${mockData.cpu.usage.toFixed(1)}%`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      if (mockData.memory.percentage > 85) {
        newAlerts.push({
          id: `memory-${Date.now()}`,
          type: 'warning',
          title: 'High Memory Usage',
          message: `Memory usage is at ${mockData.memory.percentage.toFixed(1)}%`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      if (mockData.disk.percentage > 90) {
        newAlerts.push({
          id: `disk-${Date.now()}`,
          type: 'critical',
          title: 'Low Disk Space',
          message: `Disk usage is at ${mockData.disk.percentage.toFixed(1)}%`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      // Alertas de servicios
      mockData.services.forEach((service) => {
        if (service.status === 'critical') {
          newAlerts.push({
            id: `service-${service.name}-${Date.now()}`,
            type: 'critical',
            title: `Service Critical: ${service.name}`,
            message: `${service.name} is experiencing critical issues`,
            timestamp: new Date(),
            acknowledged: false,
            service: service.name,
          });
        } else if (service.status === 'warning') {
          newAlerts.push({
            id: `service-${service.name}-${Date.now()}`,
            type: 'warning',
            title: `Service Warning: ${service.name}`,
            message: `${service.name} is experiencing performance issues`,
            timestamp: new Date(),
            acknowledged: false,
            service: service.name,
          });
        }
      });

      if (newAlerts.length > 0) {
        setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50)); // Mantener solo las últimas 50
      }
    } catch (error) {
      // Error handling - metrics fetch failed
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'offline':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <ZapOff className="w-4 h-4" />;
      case 'offline':
        return <Server className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)),
    );
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">Real-time monitoring dashboard for AltaMedica platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Auto Refresh:</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview Cards */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cpu.usage.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.cpu.usage > 80
                        ? 'bg-red-500'
                        : metrics.cpu.usage > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${metrics.cpu.usage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.cpu.cores} cores • Load:{' '}
                  {metrics.cpu.load.map((l) => l.toFixed(1)).join(', ')}
                </p>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memory.percentage.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.memory.percentage > 85
                        ? 'bg-red-500'
                        : metrics.memory.percentage > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${metrics.memory.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.memory.used.toFixed(1)} GB / {metrics.memory.total} GB
                </p>
              </CardContent>
            </Card>

            {/* Disk Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.disk.percentage.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.disk.percentage > 90
                        ? 'bg-red-500'
                        : metrics.disk.percentage > 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${metrics.disk.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.disk.used.toFixed(1)} GB / {metrics.disk.total} GB • {metrics.disk.iops}{' '}
                  IOPS
                </p>
              </CardContent>
            </Card>

            {/* Network */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.network.latency.toFixed(1)}ms</div>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span>In: {metrics.network.inbound.toFixed(1)} MB/s</span>
                    <span>Out: {metrics.network.outbound.toFixed(1)} MB/s</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.network.connections} active connections
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Services Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{service.name}</div>
                        <div className="text-xs text-gray-500">Port {service.port}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{service.responseTime.toFixed(0)}ms</div>
                      <div className="text-xs text-gray-500">
                        {service.uptime.toFixed(2)}% uptime
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  Active Alerts ({alerts.filter((a) => !a.acknowledged).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {alerts
                    .filter((alert) => !alert.acknowledged)
                    .slice(0, 10)
                    .map((alert, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          alert.type === 'critical'
                            ? 'border-red-500 bg-red-50'
                            : alert.type === 'warning'
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{alert.title}</div>
                            <div className="text-sm text-gray-600">{alert.message}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {alert.timestamp.toLocaleTimeString()}
                              {alert.service && ` • ${alert.service}`}
                            </div>
                          </div>
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="ml-4 px-3 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                          >
                            Acknowledge
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                {alerts.filter((a) => !a.acknowledged).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No active alerts. All systems are running smoothly.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timestamp */}
          <div className="text-center text-sm text-gray-500">
            <Clock className="w-4 h-4 inline mr-1" />
            Last updated: {metrics.timestamp.toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default MonitoringDashboard;
