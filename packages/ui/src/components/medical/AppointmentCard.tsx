// 📅 APPOINTMENT CARD - COMPONENTE DE CITAS MÉDICAS ESPECIALIZADO
// Card avanzado para gestión completa de citas médicas con estados y acciones
// MÉDICO-ESPECÍFICO: Consultas, emergencias, telemedicina, seguimientos médicos
// MIGRADO DESDE: apps/patients/src/components/ui/AppointmentCard.tsx

'use client';

import React from 'react';
import { Calendar, Clock, User, MapPin, Phone, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { CardCorporate, CardHeaderCorporate, CardContentCorporate, CardFooterCorporate } from '../corporate/CardCorporate';
import { ButtonCorporate } from '../corporate/ButtonCorporate';
import { StatusBadge } from './StatusBadge';

import { logger } from '@altamedica/shared/services/logger.service';
// 📝 TIPOS MÉDICOS PARA CITAS
export type AppointmentType = 
  | 'consultation' 
  | 'follow_up' 
  | 'emergency' 
  | 'routine_checkup'
  | 'specialist_referral'
  | 'telemedicine'
  | 'vaccination'
  | 'therapy'
  | 'surgery'
  | 'diagnostic';

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress'
  | 'completed' 
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

// 👨‍⚕️ INTERFAZ DOCTOR
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  rating?: number;
  license?: string;
  phone?: string;
}

// 📋 INTERFAZ CITA MÉDICA
export interface AppointmentData {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number; // minutos
  type: AppointmentType;
  status: AppointmentStatus;
  doctor: Doctor;
  location?: string;
  isTelemedicine: boolean;
  patientNotes?: string;
  doctorNotes?: string;
  cost?: number;
  insurance?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  symptoms?: string[];
  diagnosis?: string;
  treatment?: string;
}

export interface AppointmentCardProps {
  /** Datos de la cita médica */
  appointment: AppointmentData;
  /** Variante visual del componente */
  variant?: 'default' | 'compact' | 'detailed';
  /** Mostrar botones de acción */
  showActions?: boolean;
  /** Callback ver detalles */
  onView?: (id: string) => void;
  /** Callback reprogramar cita */
  onReschedule?: (id: string) => void;
  /** Callback cancelar cita */
  onCancel?: (id: string) => void;
  /** Callback unirse a videollamada */
  onJoinCall?: (id: string) => void;
  /** Callback llamar al doctor */
  onCallDoctor?: (id: string) => void;
  /** Clases CSS adicionales */
  className?: string;
}

// 🏥 CONFIGURACIÓN DE TIPOS DE CITA MÉDICA
const APPOINTMENT_TYPE_CONFIG = {
  consultation: {
    label: 'Consulta Médica',
    icon: User,
    color: 'text-primary-altamedica',
    bgColor: 'bg-blue-100',
    description: 'Consulta médica general'
  },
  follow_up: {
    label: 'Seguimiento',
    icon: CheckCircle,
    color: 'text-secondary-altamedica',
    bgColor: 'bg-green-100',
    description: 'Control de seguimiento'
  },
  emergency: {
    label: 'Emergencia',
    icon: AlertCircle,
    color: 'text-danger',
    bgColor: 'bg-red-100',
    description: 'Atención médica urgente'
  },
  routine_checkup: {
    label: 'Chequeo Rutinario',
    icon: Calendar,
    color: 'text-secondary-altamedica',
    bgColor: 'bg-green-100',
    description: 'Chequeo médico preventivo'
  },
  specialist_referral: {
    label: 'Especialista',
    icon: User,
    color: 'text-primary-altamedica',
    bgColor: 'bg-blue-100',
    description: 'Consulta con especialista'
  },
  telemedicine: {
    label: 'Telemedicina',
    icon: Video,
    color: 'text-secondary-altamedica',
    bgColor: 'bg-green-100',
    description: 'Consulta virtual remota'
  },
  vaccination: {
    label: 'Vacunación',
    icon: CheckCircle,
    color: 'text-secondary-altamedica',
    bgColor: 'bg-green-100',
    description: 'Aplicación de vacunas'
  },
  therapy: {
    label: 'Terapia',
    icon: User,
    color: 'text-primary-altamedica',
    bgColor: 'bg-blue-100',
    description: 'Sesión de terapia'
  },
  surgery: {
    label: 'Cirugía',
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-yellow-100',
    description: 'Procedimiento quirúrgico'
  },
  diagnostic: {
    label: 'Diagnóstico',
    icon: Calendar,
    color: 'text-primary-altamedica',
    bgColor: 'bg-blue-100',
    description: 'Estudios diagnósticos'
  }
};

// 👨‍⚕️ COMPONENTE INFORMACIÓN DEL DOCTOR
const DoctorInfo: React.FC<{ doctor: Doctor; compact?: boolean }> = ({ doctor, compact = false }) => (
  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-secondary-altamedica rounded-full flex items-center justify-center shadow-md overflow-hidden">
      {doctor.avatar ? (
        <img 
          src={doctor.avatar} 
          alt={doctor.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to icon if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <User className="w-5 h-5 text-white" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`font-medium text-primary-altamedica truncate ${compact ? 'text-sm' : 'text-base'}`}>
        Dr. {doctor.name}
      </p>
      <p className={`text-gray-600 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {doctor.specialty}
      </p>
      {doctor.rating && (
        <div className="flex items-center space-x-1 mt-1">
          <span className="text-yellow-500 text-sm">★</span>
          <span className="text-xs text-gray-500">{doctor.rating.toFixed(1)}/5</span>
          {doctor.license && (
            <span className="text-xs text-gray-400">• Mat. {doctor.license}</span>
          )}
        </div>
      )}
    </div>
  </div>
);

// 📅 COMPONENTE INFORMACIÓN DE FECHA Y HORA
const DateTimeInfo: React.FC<{ 
  date: string; 
  time: string; 
  duration: number; 
  compact?: boolean;
  priority?: string;
}> = ({ date, time, duration, compact = false, priority }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', { 
        weekday: compact ? 'short' : 'long',
        year: 'numeric', 
        month: compact ? 'short' : 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className={`space-y-2 ${compact ? 'text-sm' : ''}`}>
      <div className="flex items-center space-x-2 text-gray-700">
        <Calendar className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-primary-altamedica flex-shrink-0`} />
        <span className="font-medium truncate">{formatDate(date)}</span>
        {priority === 'critical' && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </div>
      <div className="flex items-center space-x-2 text-gray-700">
        <Clock className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-secondary-altamedica flex-shrink-0`} />
        <span className="truncate">{formatTime(time)} ({duration} min)</span>
      </div>
    </div>
  );
};

// 📍 COMPONENTE INFORMACIÓN DE UBICACIÓN
const LocationInfo: React.FC<{ 
  location?: string; 
  isTelemedicine: boolean; 
  compact?: boolean;
  doctor?: Doctor;
}> = ({ location, isTelemedicine, compact = false, doctor }) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-2 text-gray-700">
      {isTelemedicine ? (
        <>
          <Video className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-secondary-altamedica flex-shrink-0`} />
          <span className={`${compact ? 'text-sm' : ''} truncate`}>Consulta Virtual</span>
        </>
      ) : (
        <>
          <MapPin className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-primary-altamedica flex-shrink-0`} />
          <span className={`${compact ? 'text-sm' : ''} truncate`}>
            {location || 'Consultorio Médico'}
          </span>
        </>
      )}
    </div>
    
    {doctor?.phone && (
      <div className="flex items-center space-x-2 text-gray-700">
        <Phone className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-primary-altamedica flex-shrink-0`} />
        <span className={`${compact ? 'text-sm' : ''} truncate`}>
          {doctor.phone}
        </span>
      </div>
    )}
  </div>
);

// 🎯 COMPONENTE PRINCIPAL APPOINTMENT CARD
export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  variant = 'default',
  showActions = true,
  onView,
  onReschedule,
  onCancel,
  onJoinCall,
  onCallDoctor,
  className = ''
}) => {
  // 🛡️ VALIDACIONES ROBUSTAS
  if (!appointment?.id) {
    logger.warn('AppointmentCard: appointment con id es requerido');
    return null;
  }

  const typeConfig = APPOINTMENT_TYPE_CONFIG[appointment.type];
  const TypeIcon = typeConfig.icon;
  
  // 📅 LÓGICA DE FECHAS Y ESTADOS
  const appointmentDate = new Date(appointment.date);
  const now = new Date();
  const isUpcoming = appointmentDate > now;
  const isToday = appointmentDate.toDateString() === now.toDateString();
  
  // 🔐 PERMISOS DE ACCIONES
  const canJoinCall = appointment.isTelemedicine && 
                     appointment.status === 'confirmed' && 
                     (isUpcoming || isToday);
  const canReschedule = ['scheduled', 'confirmed'].includes(appointment.status) && isUpcoming;
  const canCancel = ['scheduled', 'confirmed'].includes(appointment.status) && isUpcoming;
  const canCall = appointment.doctor.phone && isUpcoming;

  // 🎨 VARIANTES DE VISUALIZACIÓN
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  // 🚨 DETERMINAR VARIANTE DE CARD SEGÚN TIPO/ESTADO
  const getCardVariant = () => {
    if (appointment.type === 'emergency') return 'emergency';
    if (appointment.status === 'cancelled') return 'warning';
    if (appointment.status === 'completed') return 'success';
    if (appointment.priority === 'critical') return 'emergency';
    return 'medical';
  };

  return (
    <CardCorporate
      variant={getCardVariant()}
      medical={appointment.type !== 'emergency'}
      emergency={appointment.type === 'emergency' || appointment.priority === 'critical'}
      hover={true}
      className={className}
    >
      {/* 📋 HEADER CON TÍTULO Y BADGES */}
      <CardHeaderCorporate
        title={appointment.title}
        subtitle={isDetailed ? typeConfig.description : undefined}
        medical={appointment.type !== 'emergency'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge 
              status={appointment.status} 
              size={isCompact ? 'sm' : 'md'}
              animate={appointment.priority === 'critical'}
            />
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${typeConfig.bgColor}`}>
              <TypeIcon className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} ${typeConfig.color}`} />
              <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium ${typeConfig.color} whitespace-nowrap`}>
                {typeConfig.label}
              </span>
            </div>
            {appointment.priority === 'critical' && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 rounded-lg">
                <AlertCircle className="w-3 h-3 text-red-600" />
                <span className="text-xs font-medium text-red-600">URGENTE</span>
              </div>
            )}
          </div>
        }
      />

      {/* 📄 CONTENIDO PRINCIPAL */}
      <CardContentCorporate>
        <div className={`space-y-${isCompact ? '3' : '4'}`}>
          {/* 👨‍⚕️ INFORMACIÓN DEL DOCTOR */}
          <DoctorInfo doctor={appointment.doctor} compact={isCompact} />

          {/* 📅 FECHA, HORA Y UBICACIÓN */}
          <div className={`grid ${isCompact ? 'grid-cols-1 gap-3' : 'grid-cols-1 lg:grid-cols-2 gap-4'}`}>
            <DateTimeInfo 
              date={appointment.date} 
              time={appointment.time} 
              duration={appointment.duration}
              compact={isCompact}
              priority={appointment.priority}
            />
            <LocationInfo 
              location={appointment.location} 
              isTelemedicine={appointment.isTelemedicine}
              compact={isCompact}
              doctor={appointment.doctor}
            />
          </div>

          {/* 🩺 INFORMACIÓN MÉDICA ADICIONAL */}
          {isDetailed && (appointment.symptoms || appointment.diagnosis) && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {appointment.symptoms && appointment.symptoms.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Síntomas:</p>
                  <div className="flex flex-wrap gap-1">
                    {appointment.symptoms.map((symptom, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {appointment.diagnosis && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Diagnóstico:</p>
                  <p className="text-sm text-gray-600">{appointment.diagnosis}</p>
                </div>
              )}
            </div>
          )}

          {/* 📝 NOTAS MÉDICAS */}
          {isDetailed && (appointment.patientNotes || appointment.doctorNotes) && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {appointment.patientNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Notas del Paciente:</p>
                  <p className="text-sm text-gray-600 italic">{appointment.patientNotes}</p>
                </div>
              )}
              {appointment.doctorNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Indicaciones Médicas:</p>
                  <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">{appointment.doctorNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* 💰 INFORMACIÓN DE COSTO Y SEGURO */}
          {isDetailed && (appointment.cost || appointment.insurance) && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              {appointment.cost && (
                <span className="text-sm text-gray-600">
                  Costo: <span className="font-bold text-primary-altamedica">${appointment.cost}</span>
                </span>
              )}
              {appointment.insurance && (
                <span className="text-sm text-gray-600">
                  Obra Social: <span className="font-medium text-secondary-altamedica">{appointment.insurance}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </CardContentCorporate>

      {/* 🦶 FOOTER CON ACCIONES */}
      {showActions && (
        <CardFooterCorporate align="between">
          <div className="flex items-center space-x-2 flex-wrap">
            {/* 📞 BOTÓN UNIRSE A VIDEOLLAMADA */}
            {canJoinCall && (
              <ButtonCorporate
                variant="medical"
                size={isCompact ? 'sm' : 'md'}
                icon={<Video className="w-4 h-4" />}
                onClick={() => onJoinCall?.(appointment.id)}
                animate={true}
                gradient={true}
              >
                Unirse a Consulta
              </ButtonCorporate>
            )}
            
            {/* 📞 BOTÓN LLAMAR AL DOCTOR */}
            {canCall && !appointment.isTelemedicine && (
              <ButtonCorporate
                variant="secondary"
                size={isCompact ? 'sm' : 'md'}
                icon={<Phone className="w-4 h-4" />}
                onClick={() => onCallDoctor?.(appointment.id)}
              >
                Llamar
              </ButtonCorporate>
            )}
            
            {/* 👁️ BOTÓN VER DETALLES */}
            <ButtonCorporate
              variant="ghost"
              size={isCompact ? 'sm' : 'md'}
              onClick={() => onView?.(appointment.id)}
            >
              Ver Detalles
            </ButtonCorporate>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            {/* 📅 BOTÓN REPROGRAMAR */}
            {canReschedule && (
              <ButtonCorporate
                variant="outline"
                size={isCompact ? 'sm' : 'md'}
                onClick={() => onReschedule?.(appointment.id)}
              >
                Reprogramar
              </ButtonCorporate>
            )}
            
            {/* ❌ BOTÓN CANCELAR */}
            {canCancel && (
              <ButtonCorporate
                variant="danger"
                size={isCompact ? 'sm' : 'md'}
                onClick={() => onCancel?.(appointment.id)}
              >
                Cancelar
              </ButtonCorporate>
            )}
          </div>
        </CardFooterCorporate>
      )}
    </CardCorporate>
  );
};

// 🎯 EXPORTS
export default AppointmentCard;