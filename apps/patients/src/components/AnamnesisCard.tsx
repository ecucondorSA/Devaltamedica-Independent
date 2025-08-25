/**
 * Componente AnamnesisCard - Altamedica
 * Muestra información de anamnesis en el dashboard de pacientes
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Heart,
  Activity,
  Plus,
  ExternalLink,
  Download,
  RefreshCw,
} from 'lucide-react';
import { CardCorporate } from '@altamedica/ui';
import { CardHeaderCorporate, CardContentCorporate } from '@altamedica/ui';
import { ButtonCorporate } from '@altamedica/ui';
import { LoadingSpinner } from '@altamedica/ui';
import { useAnamnesis } from '../hooks/useAnamnesis';
import { AnamnesisStats } from './AnamnesisStats';

interface AnamnesisCardProps {
  pacienteId: string;
  className?: string;
}

export function AnamnesisCard({ pacienteId, className = '' }: AnamnesisCardProps) {
  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="text-center py-6">
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Componente temporalmente deshabilitado
        </h3>
        <p className="text-gray-600">Esta funcionalidad estará disponible próximamente</p>
      </div>
    </div>
  );
}
