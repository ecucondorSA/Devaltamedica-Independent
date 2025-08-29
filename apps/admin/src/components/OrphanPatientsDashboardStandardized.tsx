// 🏥 DASHBOARD ESTANDARIZADO - ALTAMEDICA
// Versión migrada usando componentes básicos

'use client';

import React, { useState } from 'react';
import { Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';

import { logger } from '../services/logger.service';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface OrphanPatient {
  id: string;
  name: string;
  disease: string;
  age: number;
}

interface DashboardData {
  /** Datos específicos del dashboard de pacientes huérfanos */
  orphanPatients?: OrphanPatient[];
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const OrphanPatientsStandardized: React.FC = () => {
  // Estados
  const [, setData] = useState<DashboardData | null>(null);
  const [, setIsLoading] = useState(false);
  const [, setLastUpdated] = useState<string>('');

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Implementar carga de datos
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLastUpdated(new Date().toLocaleString('es-ES'));
      // Mock data
      setData({
        orphanPatients: [
          { id: '1', name: 'Juan Perez', disease: 'Fibrosis Quística', age: 25 },
          { id: '2', name: 'Ana Gomez', disease: 'Atrofia Muscular Espinal', age: 12 },
        ],
      });
    } catch (error) {
      logger.error({
        message: 'Error loading dashboard data',
        context: 'OrphanPatientsDashboard',
        error: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    void loadDashboardData();
  }, []);

  // ============================================================================
  // KPIs ESTANDARIZADOS
  // ============================================================================

  const kpiData = [
    {
      title: 'Pacientes Huérfanos Totales',
      value: 127,
      change: 5.2,
      icon: <Users className="h-6 w-6" />,
      color: 'normal' as const,
      trend: 'up' as const,
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard de Pacientes Huérfanos</h1>
        <p className="text-gray-600">Gestión especializada de enfermedades raras</p>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">+{kpi.change}% desde el último mes</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pacientes Huérfanos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center">
              <p className="text-gray-500">Lista de pacientes disponible aquí</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas Médicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center">
              <p className="text-gray-500">Estadísticas médicas disponibles aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrphanPatientsStandardized;