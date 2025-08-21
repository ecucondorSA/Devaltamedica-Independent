/**
 * 🏥 COMPONENTE DE ENCABEZADO DEL DASHBOARD
 * Muestra el título principal y información del hospital
 */

import { Badge } from '@altamedica/ui';
import { Building2 } from 'lucide-react';

interface DashboardHeaderProps {
  hospitalId: string;
  emergencyMode: boolean;
}

export function DashboardHeader({ hospitalId, emergencyMode }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Building2 className="h-8 w-8 text-blue-600" />
        Dashboard de Red Hospitalaria
        {emergencyMode && (
          <Badge variant="destructive" className="ml-2">
            🚨 MODO EMERGENCIA
          </Badge>
        )}
      </h1>
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          ID: {hospitalId}
        </Badge>
      </div>
    </div>
  );
}
