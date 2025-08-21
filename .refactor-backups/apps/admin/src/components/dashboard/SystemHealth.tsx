'use client';

import { Button, Card, Input } from '@altamedica/ui';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Cpu,
    Database,
    HardDrive,
    RefreshCw,
    Server,
    Shield,
    Wifi,
    Zap
} from 'lucide-react';
import React from 'react';

interface SystemHealth {
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  issues: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
  }>;
}

interface SystemHealthProps {
  health: SystemHealth;
  onRefresh: () => void;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ health, onRefresh }) => {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return <CheckCircle className="w-5 h-5" />;
      case 'GOOD': return <CheckCircle className="w-5 h-5" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5" />;
      case 'CRITICAL': return <AlertTriangle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage > 80) return 'bg-red-500';
    if (usage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Salud del Sistema</h2>
          <button
            onClick={onRefresh}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
        </div>

        {/* Estado general */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Estado General</h3>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(health.status)}`}>
                {getHealthIcon(health.status)}
                <span className="ml-1">{health.status}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{health.uptime}</p>
            <p className="text-sm text-gray-500">Uptime</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">CPU</h3>
              <Cpu className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{health.cpuUsage}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${getUsageColor(health.cpuUsage)}`}
                style={{ width: `${health.cpuUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Memoria</h3>
              <HardDrive className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{health.memoryUsage}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${getUsageColor(health.memoryUsage)}`}
                style={{ width: `${health.memoryUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Disco</h3>
              <HardDrive className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{health.diskUsage}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${getUsageColor(health.diskUsage)}`}
                style={{ width: `${health.diskUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Servicios del sistema */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Servicios del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Server className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Servidor Web</p>
                <p className="text-xs text-green-600">Operativo</p>
              </div>
            </div>

            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Base de Datos</p>
                <p className="text-xs text-green-600">Operativo</p>
              </div>
            </div>

            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Red</p>
                <p className="text-xs text-green-600">Operativo</p>
              </div>
            </div>

            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Seguridad</p>
                <p className="text-xs text-green-600">Operativo</p>
              </div>
            </div>

            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Cache</p>
                <p className="text-xs text-green-600">Operativo</p>
              </div>
            </div>

            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Cron Jobs</p>
                <p className="text-xs text-green-600">Operativo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Problemas detectados */}
        {health.issues.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Problemas Detectados</h3>
            <div className="space-y-3">
              {health.issues.map(issue => (
                <div key={issue.id} className="flex items-start p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {getIssueIcon(issue.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(issue.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Resolver
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Reiniciar Servicios</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Database className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Backup</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Shield className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Escaneo de Seguridad</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Activity className="w-6 h-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Logs del Sistema</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth; 