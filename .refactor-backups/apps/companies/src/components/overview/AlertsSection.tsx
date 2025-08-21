'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React from 'react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  time: string;
  icon: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Stock crítico de medicamentos',
    time: 'Hace 2 horas',
    icon: '⚠️'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Mantenimiento programado - Equipos de rayos X',
    time: 'Hace 5 horas',
    icon: '⚡'
  },
  {
    id: '3',
    type: 'info',
    title: 'Nueva actualización del sistema disponible',
    time: 'Hace 1 día',
    icon: 'ℹ️'
  }
];

export default function AlertsSection() {
  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-orange-200">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            ⚠️ Alertas y Notificaciones
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {mockAlerts.length} pendientes
          </span>
        </div>
      </div>
      <div className="divide-y">
        {mockAlerts.map((alert) => (
          <div key={alert.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-start gap-3">
              <span className={getAlertStyles(alert.type)}>{alert.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-gray-100">
        <button className="text-sm text-sky-600 hover:text-sky-700 font-medium">
          Ver todas las alertas
        </button>
      </div>
    </div>
  );
}