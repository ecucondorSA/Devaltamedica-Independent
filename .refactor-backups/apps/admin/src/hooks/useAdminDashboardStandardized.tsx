// 🏥 DASHBOARD ESTANDARIZADO - ALTAMEDICA
// Versión migrada usando el Medical Design System

'use client';

import {
  // Importar iconos necesarios
  Users,
} from 'lucide-react';
import React, { useState } from 'react';

// Importar componentes estandarizados
import { StatsGrid } from '@altamedica/ui/components/dashboard';

import { logger } from '@altamedica/shared/services/logger.service';
// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface DashboardData {
  /** Datos específicos del dashboard administrativo */
  adminMetrics?: any[];
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const useAdminStandardized: React.FC = () => {
  // Estados
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Sidebar items personalizados
  const sidebarItems: any[] = [];

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Implementar carga de datos
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLastUpdated(new Date().toLocaleString('es-ES'));
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Implementar logout
    logger.info('Logout clicked');
  };

  const handleSettings = () => {
    // Implementar settings
    logger.info('Settings clicked');
  };

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  // ============================================================================
  // KPIs ESTANDARIZADOS
  // ============================================================================

  const kpiData = [
    {
      title: 'Métrica 1',
      value: 0,
      change: 0,
      icon: <Users className="h-6 w-6" />,
      color: 'normal' as const,
      trend: 'stable' as const,
      suffix: '',
    },
    // Agregar más KPIs según sea necesario
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <DashboardLayout
      userRole="admin"
      title="useAdmin Dashboard"
      subtitle="Dashboard de admin estandarizado"
      notifications={0}
      onLogout={handleLogout}
      onSettings={handleSettings}
      onRefresh={handleRefresh}
      sidebarItems={sidebarItems}
      showSearch={true}
      showFilters={true}
      compliance={true}
      lastUpdated={lastUpdated}
    >
      {/* KPIs Estándar */}
      <StatsGrid
        metrics={kpiData.map((k) => ({ label: k.title, value: String(k.value) }))}
        columns={4}
      />

      {/* Contenido específico del dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sección 1</h3>
          <p className="text-gray-600">Contenido de la sección 1</p>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sección 2</h3>
          <p className="text-gray-600">Contenido de la sección 2</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default useAdminStandardized;
