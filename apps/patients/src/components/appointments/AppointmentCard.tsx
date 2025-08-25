// 🗓️ COMPONENTE APPOINTMENTS: AppointmentCard
// PROACTIVO: <200 líneas, granular, tipado

import React from 'react';

interface AppointmentCardProps {
  appointment: any;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  onJoinVideo?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  className?: string;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onCancel,
  onJoinVideo,
  onViewDetails,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="text-center py-4">
        <h3 className="mb-2 text-sm font-medium text-gray-900">
          Tarjeta temporalmente deshabilitada
        </h3>
        <p className="text-xs text-gray-600">Esta funcionalidad estará disponible próximamente</p>
      </div>
    </div>
  );
};

export default AppointmentCard;
