/**
 * 🏥 COMPONENTE DE MÉTRICAS DEL HOSPITAL
 * Muestra métricas clave de ocupación, personal y calidad de datos
 */

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Activity, Bed, Clock, Users } from 'lucide-react';
import { HospitalMetrics } from '../types/HospitalDashboardTypes';

interface MetricsDisplayProps {
  metrics: HospitalMetrics;
  isCompact?: boolean;
}

export function MetricsDisplay({ metrics, isCompact = false }: MetricsDisplayProps) {
  if (!metrics) return null;

  const { occupancy, staff, dataQuality } = metrics;

  return (
    <div className={`grid gap-4 ${isCompact ? 'grid-cols-2' : 'grid-cols-4'}`}>
      {/* Ocupación de Camas */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Ocupación de Camas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            {occupancy.beds.percentage}%
          </div>
          <div className="text-xs text-blue-700">
            {occupancy.beds.occupied}/{occupancy.beds.total} camas
          </div>
          <div className="mt-2">
            <Badge variant={occupancy.beds.percentage > 90 ? 'destructive' : 'default'}>
              {occupancy.beds.available} disponibles
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Personal Activo */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personal Activo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">
            {staff.active}
          </div>
          <div className="text-xs text-green-700">
            de {staff.total} total
          </div>
          <div className="mt-2">
            <Badge variant="outline" className="text-green-700 border-green-300">
              {Math.round((staff.active / staff.total) * 100)}% activo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tiempo de Espera */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tiempo de Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900">
            {occupancy.emergency.averageWaitTime} min
          </div>
          <div className="text-xs text-orange-700">
            Promedio emergencias
          </div>
          <div className="mt-2">
            <Badge variant={occupancy.emergency.averageWaitTime > 60 ? 'destructive' : 'default'}>
              {occupancy.emergency.waiting} esperando
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Calidad de Datos */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Calidad de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">
            {dataQuality.confidence}%
          </div>
          <div className="text-xs text-purple-700">
            Fuente: {dataQuality.source}
          </div>
          <div className="mt-2">
            <Badge variant={dataQuality.confidence > 80 ? 'default' : 'secondary'}>
              {dataQuality.confidence > 80 ? 'Alta' : 'Media'} confianza
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
