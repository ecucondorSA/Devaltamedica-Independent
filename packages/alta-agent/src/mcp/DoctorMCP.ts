/**
 * DoctorMCP - Experto en doctors app (Portal de profesionales médicos)
 * Puerto 3002 - Portal de doctores con telemedicina
 */

import { logger } from '../logger';
import { BaseMCP, MCPConfig, AppKnowledge } from './BaseMCP';

const doctorsConfig: MCPConfig = {
  name: 'DoctorMCP',
  app: 'doctors',
  port: 3002,
  description: 'Portal profesional para médicos con telemedicina y gestión de pacientes',
  location: 'apps/doctors'
};

const doctorsKnowledge: AppKnowledge = {
  purpose: 'Portal profesional para médicos que permite gestionar pacientes, realizar videoconsultas, emitir prescripciones, visualizar historiales médicos y participar en el marketplace médico',
  
  mainFeatures: [
    '📹 Videoconsultas profesionales con WebRTC',
    '👥 Gestión completa de pacientes',
    '📝 Sistema de prescripciones digitales',
    '📊 Dashboard analítico de práctica médica',
    '🏥 Integración con sistemas hospitalarios',
    '💼 Marketplace de oportunidades laborales',
    '📈 Crystal Ball - Predictor de salud con IA',
    '📋 Notas médicas y evolución de pacientes',
    '🔔 Sistema de alertas críticas',
    '📅 Agenda médica inteligente',
    '💳 Gestión de pagos y facturación',
    '📊 QoS monitoring para videollamadas'
  ],

  techStack: {
    framework: 'Next.js',
    version: '15.3.4',
    ui: ['React 19', '@altamedica/ui', '@altamedica/medical'],
    state: ['Zustand', 'TanStack Query'],
    styling: ['Tailwind CSS', 'Radix UI'],
    testing: ['Playwright', 'Jest'],
    other: ['WebRTC', 'Socket.io', 'Chart.js', 'React Hook Form']
  },

  keyFiles: [
    {
      pattern: 'src/app/dashboard/page.tsx',
      description: 'Dashboard principal del doctor con métricas',
      example: 'PatientStats, AppointmentsToday, Revenue, Alerts'
    },
    {
      pattern: 'src/app/telemedicine/session/[sessionId]/page.tsx',
      description: 'Sala de videoconsulta profesional'
    },
    {
      pattern: 'src/app/patients/[id]/crystal-ball/page.tsx',
      description: 'Predictor de salud con IA'
    },
    {
      pattern: 'src/components/telemedicine/IntegratedDoctorVideoCall.tsx',
      description: 'Componente de videollamada con herramientas médicas'
    },
    {
      pattern: 'src/components/prescriptions/PrescriptionForm.tsx',
      description: 'Formulario de prescripciones digitales'
    },
    {
      pattern: 'src/hooks/useWebRTCDoctorHybrid.ts',
      description: 'Hook WebRTC optimizado para doctores'
    }
  ],

  routes: [
    {
      path: '/dashboard',
      description: 'Dashboard profesional',
      authentication: true
    },
    {
      path: '/patients',
      description: 'Lista y gestión de pacientes',
      authentication: true
    },
    {
      path: '/patients/[id]',
      description: 'Perfil detallado del paciente',
      authentication: true
    },
    {
      path: '/telemedicine/dashboard',
      description: 'Centro de control de telemedicina',
      authentication: true
    },
    {
      path: '/job-applications',
      description: 'Marketplace de oportunidades',
      authentication: true
    },
    {
      path: '/qos',
      description: 'Dashboard de calidad de servicio',
      authentication: true
    }
  ],

  commands: [
    {
      command: 'pnpm --filter doctors dev',
      description: 'Iniciar servidor de desarrollo en puerto 3002'
    },
    {
      command: 'pnpm --filter doctors build',
      description: 'Build de producción'
    },
    {
      command: 'pnpm --filter doctors test',
      description: 'Ejecutar tests'
    }
  ],

  dependencies: [
    '@altamedica/ui',
    '@altamedica/medical',
    '@altamedica/medical-hooks',
    '@altamedica/telemedicine-core',
    '@altamedica/api-client'
  ],

  commonIssues: [
    'WebRTC no conecta - Verificar STUN/TURN servers',
    'Dashboard lento - Implementar virtualización en listas',
    'Prescripciones no se guardan - Verificar api-server',
    'QoS no muestra datos - Verificar WebSocket connection'
  ],

  bestPractices: [
    'Validar prescripciones antes de emitir',
    'Usar templates para notas médicas frecuentes',
    'Implementar autosave en formularios largos',
    'Cachear datos de pacientes frecuentes',
    'Usar optimistic updates en UI'
  ],

  integrations: [
    'Sistema hospitalario via HL7',
    'Facturación electrónica',
    'Firma digital para prescripciones',
    'Calendar sync para agenda'
  ],

  secrets: [
    'DIGITAL_SIGNATURE_KEY',
    'HL7_API_KEY',
    'BILLING_API_SECRET'
  ]
};

export class DoctorMCP extends BaseMCP {
  constructor() {
    super(doctorsConfig, doctorsKnowledge);
  }

  help(query?: string): void {
    if (!query) {
      logger.info('\n👨‍⚕️ DoctorMCP - Experto en doctors app\n');
      logger.info('Portal profesional médico (Puerto 3002)\n');
      logger.info('Usa: doctorMCP.[comando]() para más información');
      return;
    }
    // Implementación específica de ayuda
  }

  generateExample(type: string): string {
    switch(type.toLowerCase()) {
      case 'prescription':
        return `
// Formulario de prescripción digital
import { PrescriptionForm } from '@/components/prescriptions';
import { useDigitalSignature } from '@/hooks/useDigitalSignature';


export default function NewPrescription({ patientId }: { patientId: string }) {
  const { sign } = useDigitalSignature();
  
  const handleSubmit = async (data: PrescriptionData) => {
    const signed = await sign(data);
    await api.prescriptions.create(signed);
  };
  
  return <PrescriptionForm onSubmit={handleSubmit} patientId={patientId} />;
}`;
      
      default:
        return 'Tipos: prescription, patient-list, video-call, crystal-ball';
    }
  }
}

export const doctorMCP = new DoctorMCP();