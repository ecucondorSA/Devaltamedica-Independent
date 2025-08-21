
/**
 * HealthMetricCard.tsx - Componente para mostrar una métrica de salud
 * Proyecto: Altamedica Pacientes
 */

import React from 'react';
import { CardCorporate } from '@altamedica/ui';
import { CardContentCorporate } from '../CardCorporate';
import Link from 'next/link';

interface HealthMetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: string;
  statusColor: string;
  link: string;
}

export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({ icon, label, value, status, statusColor, link }) => {
  return (
    <Link href={link}>
      <CardCorporate variant="default" size="sm" className="hover:border-sky-400 hover:shadow-md transition-all duration-200 h-full">
        <CardContentCorporate className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">{label}</p>
              <p className="text-base font-bold text-gray-800 truncate">{value}</p>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              {status}
            </span>
          </div>
        </CardContentCorporate>
      </CardCorporate>
    </Link>
  );
};
