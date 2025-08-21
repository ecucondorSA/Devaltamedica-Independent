// 🗓️ COMPONENTE APPOINTMENTS: AppointmentCard
// PROACTIVO: <200 líneas, granular, tipado

import { Button, Card, Input } from '@altamedica/ui';
import React from 'react';
import { Calendar, Clock, MapPin, Video, User, Edit, Trash2 } from 'lucide-react';
import StatusBadge, { StatusType } from '../StatusBadge';

// Removed local interface - using @altamedica/types
import { Appointment } from '@altamedica/types';

interface AppointmentCardProps {
  appointment: Appointment;
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
  className = ""
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <User className="w-4 h-4" />;
      case 'follow_up': return <Clock className="w-4 h-4" />;
      case 'emergency': return <div className="w-4 h-4 rounded-full bg-red-500" />;
      case 'routine_checkup': return <div className="w-4 h-4 rounded-full bg-green-500" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'routine_checkup': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const canCancel = appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const canJoinVideo = appointment.status === 'confirmed' && appointment.isTelemedicine;

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-2">
              {getTypeIcon(appointment.type)}
              <h3 className="text-lg font-semibold text-gray-900">
                {appointment.doctorName}
              </h3>
              <StatusBadge status={appointment.status as StatusType} />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                {appointment.type}
              </span>
            </div>
            
            {/* Specialty */}
            <p className="text-gray-600 mb-3">{appointment.specialty}</p>
            
            {/* Details */}
            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(appointment.date).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {appointment.time} ({appointment.estimatedDuration} min)
              </div>
              
              <div className="flex items-center">
                {appointment.isTelemedicine ? (
                  <>
                    <Video className="w-4 h-4 mr-1" />
                    Teleconsulta
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-1" />
                    {appointment.location || 'Presencial'}
                  </>
                )}
              </div>
            </div>
            
            {/* Reason */}
            <p className="text-gray-700 text-sm">
              <span className="font-medium">Motivo:</span> {appointment.reason}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 ml-6">
            {/* Join Video Button */}
            {canJoinVideo && (
              <button
                onClick={() => onJoinVideo?.(appointment.id)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Video className="w-4 h-4 mr-1" />
                Unirse
              </button>
            )}
            
            {/* View Details */}
            <button
              onClick={() => onViewDetails?.(appointment.id)}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Ver detalles
            </button>
            
            {/* Edit Button */}
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(appointment.id)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </button>
            )}
            
            {/* Cancel Button */}
            {canCancel && onCancel && (
              <button
                onClick={() => onCancel(appointment.id)}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
