// 🎨 ÍNDICE DE COMPONENTES UI CORPORATIVOS ALTAMEDICA
// Biblioteca completa de componentes con design system aplicado
// CONSERVADOR: Preserva componentes originales, agrega versiones corporativas

// Importar tipos necesarios desde @altamedica/ui
import type { AppointmentData, MedicalRecordData } from '@altamedica/ui';

// ⚠️ COMPONENTES MIGRADOS A @altamedica/ui
// Los siguientes componentes han sido centralizados:
// - ButtonCorporate → @altamedica/ui (corporate)
// - CardCorporate → @altamedica/ui (corporate)
// - AppointmentCard → @altamedica/ui (medical)
// - HealthMetricCard → @altamedica/ui (medical)
// - StatusBadge → @altamedica/ui (medical)
// - LoadingSpinner → @altamedica/ui (base)

// ⚠️ COMPONENTES MIGRADOS A @altamedica/ui PACKAGES
// Los siguientes componentes están ahora centralizados:
// - SearchFilter → @altamedica/ui/forms
// - FormLabel → @altamedica/ui/forms  
// - FormError → @altamedica/ui/forms
// - FormGroup → @altamedica/ui/forms

// 📦 RE-EXPORTACIÓN DE COMPONENTES CENTRALIZADOS
// export { 
//   SearchFilter, 
//   SearchFilterCompact, 
//   SearchFilterExpanded 
// } from '@altamedica/ui/forms';

// export { 
//   FormLabel, 
//   FormLabelCompact, 
//   FormLabelLarge 
// } from '@altamedica/ui/forms';

// export { 
//   FormError 
// } from '@altamedica/ui/forms';

// export { 
//   FormGroup, 
//   FormGroupCompact, 
//   FormGroupHorizontal 
// } from '@altamedica/ui/forms';

// 📝 Tipos y interfaces locales (disponibles en @altamedica/ui)
// export type { 
//   MedicalRecordType,
//   Priority,
//   MedicalRecordData,
//   MedicalRecordCardProps 
// } from '@altamedica/ui';

// ⚠️ NOTA: Los tipos de componentes migrados están disponibles en @altamedica/ui:
// - ButtonCorporateProps, ButtonVariant, ButtonSize → @altamedica/ui
// - CardCorporateProps, CardVariant, CardSize → @altamedica/ui
// - AppointmentCardProps, AppointmentData, AppointmentType → @altamedica/ui
// - StatusType → @altamedica/ui

// 🎯 BIBLIOTECA DE DATOS MOCK PARA DESARROLLO
export const MOCK_APPOINTMENT: AppointmentData = {
  id: 'apt-001',
  title: 'Consulta Cardiológica de Seguimiento',
  description: 'Control post-operatorio y evaluación de recuperación',
  date: '2025-01-15',
  time: '14:30',
  duration: 45,
  type: 'follow_up',
  status: 'confirmed',
  doctor: {
    id: 'doc-001',
    name: 'Dr. Carlos Mendoza',
    specialty: 'Cardiología',
    rating: 4.8
  },
  location: 'Consultorio 205, 2do Piso',
  isTelemedicine: false,
  patientNotes: 'Dolor leve en el pecho ocasionalmente',
  cost: 3500,
  insurance: 'OSDE'
};

export const MOCK_TELEMEDICINE_APPOINTMENT: AppointmentData = {
  id: 'apt-002',
  title: 'Consulta Virtual - Medicina General',
  description: 'Revisión de análisis de laboratorio',
  date: '2025-01-20',
  time: '10:00',
  duration: 30,
  type: 'consultation',
  status: 'scheduled',
  doctor: {
    id: 'doc-002',
    name: 'Dra. Ana López',
    specialty: 'Medicina General',
    rating: 4.9
  },
  isTelemedicine: true,
  patientNotes: 'Resultados de análisis de sangre completos'
};

export const MOCK_MEDICAL_RECORD: MedicalRecordData = {
  id: 'rec-001',
  title: 'Evaluación Cardiológica Completa',
  description: 'Examen de rutina con electrocardiograma y ecocardiograma',
  date: '2025-01-10T14:30:00',
  type: 'consultation',
  priority: 'normal',
  doctor: {
    id: 'doc-001',
    name: 'Dr. Carlos Mendoza',
    specialty: 'Cardiología'
  },
  diagnosis: ['Hipertensión arterial leve', 'Arritmia sinusal'],
  symptoms: ['Palpitaciones ocasionales', 'Fatiga leve'],
  treatment: 'Dieta hiposódica, ejercicio moderado 30 min diarios, medicación antihipertensiva',
  medications: ['Enalapril 10mg', 'Aspirina 100mg'],
  testResults: [
    {
      name: 'Presión Arterial',
      result: '145/90 mmHg',
      normalRange: '<120/80 mmHg',
      status: 'abnormal'
    },
    {
      name: 'Frecuencia Cardíaca',
      result: '78 bpm',
      normalRange: '60-100 bpm',
      status: 'normal'
    }
  ],
  followUpRequired: true,
  followUpDate: '2025-02-10T14:30:00',
  tags: ['cardiología', 'hipertensión', 'seguimiento']
};

export const MOCK_EMERGENCY_RECORD: MedicalRecordData = {
  id: 'rec-002',
  title: 'Atención de Emergencia - Dolor Torácico',
  description: 'Paciente ingresa por dolor precordial intenso',
  date: '2025-01-08T22:15:00',
  type: 'emergency',
  priority: 'critical',
  doctor: {
    id: 'doc-003',
    name: 'Dr. Roberto Silva',
    specialty: 'Medicina de Emergencias'
  },
  diagnosis: ['Angina de pecho', 'Descartado infarto agudo de miocardio'],
  symptoms: ['Dolor torácico intenso', 'Sudoración', 'Náuseas'],
  treatment: 'Nitroglicerina sublingual, monitoreo cardíaco continuo, reposo absoluto',
  medications: ['Nitroglicerina 0.4mg', 'Atorvastatina 40mg'],
  testResults: [
    {
      name: 'Troponina I',
      result: '0.02 ng/mL',
      normalRange: '<0.04 ng/mL',
      status: 'normal'
    },
    {
      name: 'ECG',
      result: 'Sin alteraciones agudas',
      status: 'normal'
    }
  ],
  followUpRequired: true,
  followUpDate: '2025-01-12T09:00:00',
  tags: ['emergencia', 'cardiología', 'dolor-torácico']
};

// 🎯 CONFIGURACIÓN DE TEMAS CORPORATIVOS
export const UI_THEME_CONFIG = {
  corporate: {
    primary: 'var(--color-primary-altamedica)',
    secondary: 'var(--color-secondary-altamedica)',
    accent: 'var(--color-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    gradients: {
      primary: 'var(--gradient-primary-altamedica)',
      cta: 'var(--gradient-cta-altamedica)',
      hero: 'var(--gradient-hero)'
    },
    animations: {
      fadeIn: 'animate-fade-in-conservative',
      scaleHover: 'hover:scale-105',
      scaleActive: 'active:scale-95'
    }
  }
};

export default {
  // Componentes locales restantes
  // SearchFilter,
  
  // Datos mock para desarrollo
  MOCK_APPOINTMENT,
  MOCK_TELEMEDICINE_APPOINTMENT,
  MOCK_MEDICAL_RECORD,
  MOCK_EMERGENCY_RECORD,
  
  // Configuración
  UI_THEME_CONFIG
};

// ⚠️ MIGRACIÓN COMPLETADA:
// Para usar componentes centralizados, importar desde @altamedica/ui:
// import { ButtonCorporate, CardCorporate, AppointmentCard, HealthMetricCard, StatusBadge, LoadingSpinner } from '@altamedica/ui';