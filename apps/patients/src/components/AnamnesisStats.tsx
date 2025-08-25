/**
 * Componente AnamnesisStats - Altamedica
 * Muestra estadísticas y métricas de anamnesis
 */

'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Target,
} from 'lucide-react';
import { CardCorporate } from '@altamedica/ui';
import { CardContentCorporate } from '@altamedica/ui';

interface AnamnesisStatsProps {
  completitud: number;
  calidad: number;
  urgencia: string;
  alertas: string[];
  recomendaciones: string[];
  fechaCompletada?: string;
  className?: string;
}

export function AnamnesisStats({
  completitud,
  calidad,
  urgencia,
  alertas,
  recomendaciones,
  fechaCompletada,
  className = '',
}: AnamnesisStatsProps) {
  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="text-center py-6">
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Estadísticas temporalmente deshabilitadas
        </h3>
        <p className="text-gray-600">Esta funcionalidad estará disponible próximamente</p>
      </div>
    </div>
  );
}
