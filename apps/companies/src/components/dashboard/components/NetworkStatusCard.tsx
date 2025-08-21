/**
 * 🏥 COMPONENTE DE ESTADO DE RED HOSPITALARIA
 * Muestra el estado general de la red con métricas de salud
 */

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Wifi } from 'lucide-react';
import { NetworkStatus } from '../types/HospitalDashboardTypes';

interface NetworkStatusCardProps {
  networkStatus: NetworkStatus;
}

export function NetworkStatusCard({ networkStatus }: NetworkStatusCardProps) {
  const getStatusColor = (type: keyof Omit<NetworkStatus, 'total'>) => {
    switch (type) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusLabel = (type: keyof Omit<NetworkStatus, 'total'>) => {
    switch (type) {
      case 'healthy':
        return 'Saludables';
      case 'warning':
        return 'Advertencia';
      case 'critical':
        return 'Críticos';
      default:
        return 'Total';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Estado de la Red Hospitalaria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {(['healthy', 'warning', 'critical', 'total'] as const).map((status) => (
            <div key={status} className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(status)}`}>
                {networkStatus[status]}
              </div>
              <div className="text-sm text-gray-600">
                {getStatusLabel(status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
