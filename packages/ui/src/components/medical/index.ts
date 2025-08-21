// 🏥 MEDICAL COMPONENTS - EXPORTACIONES ESPECIALIZADAS MÉDICAS
// Componentes específicos para el dominio médico y de salud
// Incluye métricas de salud, vitales, análisis clínicos y componentes especializados

// 📊 MÉTRICAS DE SALUD
export { 
  HealthMetricCard, 
  type HealthMetricCardProps, 
  type HealthStatus, 
  type HealthTrend 
} from './HealthMetricCard';

// 📅 CITAS MÉDICAS
export {
  AppointmentCard,
  type AppointmentCardProps,
  type AppointmentData,
  type AppointmentType,
  type AppointmentStatus,
  type Doctor
} from './AppointmentCard';

// 🎨 ESTADOS Y BADGES MÉDICOS
export {
  StatusBadge,
  type StatusBadgeProps,
  type StatusType
} from './StatusBadge';

// 🖥️ MONITOREO DE SISTEMA
export {
  SystemHealthMonitor,
  type SystemHealthMonitorProps,
  type ServiceHealth
} from './SystemHealthMonitor';

// 🤖 ASISTENTE DE DIAGNÓSTICO
export {
  DiagnosticAssistant,
  type DiagnosticAssistantProps
} from './DiagnosticAssistant';

// 🎯 TIPOS MÉDICOS COMPARTIDOS
export type MedicalPriority = 'low' | 'medium' | 'high' | 'critical';
export type VitalSign = 'heartRate' | 'bloodPressure' | 'temperature' | 'oxygenSaturation' | 'glucose';

// 📋 RE-EXPORTS PARA COMPATIBILIDAD - ELIMINADOS PARA EVITAR DUPLICADOS
// Los componentes ya están exportados arriba con sus tipos