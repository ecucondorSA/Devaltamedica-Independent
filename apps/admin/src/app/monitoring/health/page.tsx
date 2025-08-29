'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Activity, AlertCircle, CheckCircle, Server } from 'lucide-react';

export default function SystemHealthPage() {
  const services = [
    { name: 'API Server', status: 'healthy', port: 3001, uptime: 99.95 },
    { name: 'Patients App', status: 'healthy', port: 3003, uptime: 99.92 },
    { name: 'Doctors App', status: 'healthy', port: 3002, uptime: 99.88 },
    { name: 'Companies App', status: 'warning', port: 3004, uptime: 98.45 },
    { name: 'Admin App', status: 'healthy', port: 3005, uptime: 99.91 },
    { name: 'Web App', status: 'healthy', port: 3000, uptime: 99.78 },
    { name: 'Signaling Server', status: 'healthy', port: 8888, uptime: 99.95 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'healthy':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
              {getStatusIcon(service.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className={getStatusBadge(service.status)}>
                    {service.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Port</span>
                  <span className="text-xs font-mono">:{service.port}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Uptime</span>
                  <span className="text-xs font-medium">{service.uptime}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      service.uptime >= 99.5
                        ? 'bg-green-500'
                        : service.uptime >= 98
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${service.uptime}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {services.filter((s) => s.status === 'healthy').length}
              </div>
              <div className="text-sm text-gray-600">Healthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {services.filter((s) => s.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Warning Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {services.filter((s) => s.status === 'critical').length}
              </div>
              <div className="text-sm text-gray-600">Critical Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(services.reduce((acc, s) => acc + s.uptime, 0) / services.length).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Overall Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
