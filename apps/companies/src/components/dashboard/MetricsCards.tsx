import React from 'react';
import { Card, CardContent } from '@altamedica/ui';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  DollarSign,
} from 'lucide-react';
import { CompanyMetrics } from '@altamedica/shared';

interface MetricsCardsProps {
  metrics: CompanyMetrics;
  formatCurrency: (value: number) => string;
}

export function MetricsCards({ metrics, formatCurrency }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-sky-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pacientes Activos</p>
              <p className="text-2xl font-bold text-sky-700">{metrics.activePatients.toLocaleString()}</p>
              <p className="text-xs text-gray-500">de {metrics.totalPatients.toLocaleString()} total</p>
            </div>
            <div className="h-12 w-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-sky-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Médicos Activos</p>
              <p className="text-2xl font-bold text-blue-700">{metrics.activeDoctors}</p>
              <p className="text-xs text-gray-500">de {metrics.totalDoctors} total</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(metrics.monthlyRevenue)}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% vs mes anterior
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Citas del Mes</p>
              <p className="text-2xl font-bold text-purple-700">{metrics.totalAppointments}</p>
              <p className="text-xs text-purple-600">{metrics.completedAppointments} completadas</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}