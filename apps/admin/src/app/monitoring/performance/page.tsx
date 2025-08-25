'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PerformanceMetric {
  name: string;
  current: number;
  previous: number;
  unit: string;
  threshold: number;
  icon: React.ComponentType<any>;
}

interface ServicePerformance {
  name: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      name: 'CPU Usage',
      current: 45.2,
      previous: 42.8,
      unit: '%',
      threshold: 80,
      icon: Cpu,
    },
    {
      name: 'Memory Usage',
      current: 67.5,
      previous: 65.1,
      unit: '%',
      threshold: 85,
      icon: MemoryStick,
    },
    {
      name: 'Disk Usage',
      current: 34.8,
      previous: 33.2,
      unit: '%',
      threshold: 90,
      icon: HardDrive,
    },
    {
      name: 'Network I/O',
      current: 125.3,
      previous: 118.7,
      unit: 'MB/s',
      threshold: 1000,
      icon: Network,
    },
  ]);

  const [services] = useState<ServicePerformance[]>([
    {
      name: 'API Server',
      responseTime: 120,
      throughput: 1250,
      errorRate: 0.02,
      uptime: 99.95,
    },
    {
      name: 'Patients App',
      responseTime: 85,
      throughput: 890,
      errorRate: 0.01,
      uptime: 99.92,
    },
    {
      name: 'Doctors App',
      responseTime: 95,
      throughput: 670,
      errorRate: 0.03,
      uptime: 99.88,
    },
    {
      name: 'Companies App',
      responseTime: 230,
      throughput: 340,
      errorRate: 0.08,
      uptime: 98.45,
    },
    {
      name: 'Admin App',
      responseTime: 105,
      throughput: 125,
      errorRate: 0.01,
      uptime: 99.91,
    },
    {
      name: 'Web App',
      responseTime: 180,
      throughput: 2100,
      errorRate: 0.04,
      uptime: 99.78,
    },
    {
      name: 'Signaling Server',
      responseTime: 45,
      throughput: 5600,
      errorRate: 0.01,
      uptime: 99.95,
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => ({
          ...metric,
          previous: metric.current,
          current: Math.max(0, metric.current + (Math.random() - 0.5) * 5),
        })),
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getMetricStatus = (current: number, threshold: number) => {
    if (current >= threshold * 0.9) return 'critical';
    if (current >= threshold * 0.7) return 'warning';
    return 'healthy';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceStatus = (responseTime: number, errorRate: number) => {
    if (responseTime > 500 || errorRate > 0.05) return 'critical';
    if (responseTime > 200 || errorRate > 0.02) return 'warning';
    return 'healthy';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
        <div className="text-sm text-gray-500">
          Real-time • Updated {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const status = getMetricStatus(metric.current, metric.threshold);
          const Icon = metric.icon;

          return (
            <Card key={metric.name} className={`border-2 ${getStatusColor(status)}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Icon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {metric.current.toFixed(1)}
                  {metric.unit}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Threshold: {metric.threshold}
                    {metric.unit}
                  </span>
                  <div className="flex items-center">
                    {getTrendIcon(metric.current, metric.previous)}
                    <span className="ml-1">
                      {Math.abs(metric.current - metric.previous).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      status === 'critical'
                        ? 'bg-red-500'
                        : status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (metric.current / metric.threshold) * 100)}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Service Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Service</th>
                  <th className="text-right py-2">Response Time</th>
                  <th className="text-right py-2">Throughput</th>
                  <th className="text-right py-2">Error Rate</th>
                  <th className="text-right py-2">Uptime</th>
                  <th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const status = getPerformanceStatus(service.responseTime, service.errorRate);

                  return (
                    <tr key={service.name} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{service.name}</td>
                      <td className="text-right py-3">
                        <span
                          className={
                            service.responseTime > 200 ? 'text-yellow-600' : 'text-green-600'
                          }
                        >
                          {service.responseTime}ms
                        </span>
                      </td>
                      <td className="text-right py-3">
                        {service.throughput.toLocaleString()} req/min
                      </td>
                      <td className="text-right py-3">
                        <span
                          className={service.errorRate > 0.02 ? 'text-red-600' : 'text-green-600'}
                        >
                          {(service.errorRate * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-right py-3">
                        <span
                          className={service.uptime < 99.5 ? 'text-yellow-600' : 'text-green-600'}
                        >
                          {service.uptime}%
                        </span>
                      </td>
                      <td className="text-right py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : status === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(services.reduce((acc, s) => acc + s.responseTime, 0) / services.length)}ms
            </div>
            <div className="text-xs text-gray-600 mt-1">Across all services</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {services.reduce((acc, s) => acc + s.throughput, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mt-1">Requests per minute</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overall Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(
                (services.reduce((acc, s) => acc + s.errorRate, 0) / services.length) *
                100
              ).toFixed(2)}
              %
            </div>
            <div className="text-xs text-gray-600 mt-1">Weighted average</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
