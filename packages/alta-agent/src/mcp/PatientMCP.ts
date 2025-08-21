/**
 * PatientMCP - Experto en patients app (Portal de pacientes)
 * Puerto 3003 - Portal de pacientes grado empresarial
 */

import { BaseMCP, MCPConfig, AppKnowledge } from './BaseMCP';

const patientsConfig: MCPConfig = {
  name: 'PatientMCP',
  app: 'patients',
  port: 3003,
  description: 'Portal de pacientes con telemedicina y gestión médica completa',
  location: 'apps/patients'
};

const patientsKnowledge: AppKnowledge = {
  purpose: 'Portal integral para pacientes que permite gestionar citas, historiales médicos, telemedicina, resultados de laboratorio, prescripciones y comunicación con profesionales de salud',
  
  mainFeatures: [
    '📅 Gestión completa de citas médicas',
    '📹 Videoconsultas con WebRTC de alta calidad',
    '📋 Anamnesis interactiva y gamificada',
    '🏥 Historial médico completo y exportable',
    '🧪 Visualización de resultados de laboratorio',
    '💊 Gestión de prescripciones y medicamentos',
    '🚨 Sistema de emergencias con geolocalización',
    '📊 Dashboard de salud personalizado',
    '🤖 Asistente médico con IA (Alta)',
    '📱 Progressive Web App (PWA)',
    '🔔 Notificaciones push para recordatorios',
    '📄 Exportación de datos médicos (PDF/CSV)',
    '🔒 Seguridad HIPAA compliant'
  ],

  techStack: {
    framework: 'Next.js',
    version: '15.3.4',
    ui: ['React 19', '@altamedica/ui', '@altamedica/medical', 'Framer Motion'],
    state: ['Zustand', 'TanStack Query', '@altamedica/hooks'],
    styling: ['Tailwind CSS', 'CSS Modules'],
    testing: ['Playwright', 'Jest', 'React Testing Library'],
    other: ['WebRTC', 'Socket.io', 'Firebase', 'Chart.js', 'jsPDF']
  },

  keyFiles: [
    {
      pattern: 'src/app/dashboard/page.tsx',
      description: 'Dashboard principal del paciente con métricas de salud',
      example: 'HealthMetrics, AppointmentsList, QuickActions'
    },
    {
      pattern: 'src/app/telemedicine/session/[sessionId]/page.tsx',
      description: 'Sala de videoconsulta con WebRTC',
      example: 'VideoCall, Chat, SharedDocuments, Prescriptions'
    },
    {
      pattern: 'src/app/anamnesis-juego/page.tsx',
      description: 'Anamnesis gamificada interactiva',
      example: 'GameAnamnesis con avatares y puntos'
    },
    {
      pattern: 'src/components/telemedicine/TelemedicineMVP.tsx',
      description: 'Componente principal de telemedicina'
    },
    {
      pattern: 'src/components/medical-assistant/MedicalAI.tsx',
      description: 'Asistente médico con IA'
    },
    {
      pattern: 'src/hooks/useMedicalHistoryUnified.ts',
      description: 'Hook unificado para historial médico (1074 líneas)'
    },
    {
      pattern: 'src/hooks/useTelemedicineUnified.ts',
      description: 'Hook unificado para telemedicina (858 líneas)'
    },
    {
      pattern: 'src/services/emergency-service.ts',
      description: 'Servicio de emergencias médicas'
    }
  ],

  routes: [
    {
      path: '/dashboard',
      description: 'Dashboard principal del paciente',
      component: 'src/app/dashboard/page.tsx',
      authentication: true
    },
    {
      path: '/appointments',
      description: 'Gestión de citas médicas',
      authentication: true
    },
    {
      path: '/medical-history',
      description: 'Historial médico completo',
      authentication: true
    },
    {
      path: '/telemedicine/session/[id]',
      description: 'Sala de videoconsulta',
      authentication: true
    },
    {
      path: '/lab-results',
      description: 'Resultados de laboratorio',
      authentication: true
    },
    {
      path: '/prescriptions',
      description: 'Prescripciones médicas',
      authentication: true
    },
    {
      path: '/anamnesis-juego',
      description: 'Anamnesis interactiva gamificada',
      authentication: true
    },
    {
      path: '/alta-anamnesis',
      description: 'Anamnesis con asistente IA',
      authentication: true
    },
    {
      path: '/emergency',
      description: 'Sistema de emergencias',
      authentication: true
    },
    {
      path: '/api/patient/*',
      method: 'ALL',
      description: 'API routes para datos del paciente',
      authentication: true
    }
  ],

  commands: [
    {
      command: 'pnpm --filter patients dev',
      description: 'Iniciar servidor de desarrollo',
      example: 'Levanta en http://localhost:3003'
    },
    {
      command: 'pnpm --filter patients build',
      description: 'Construir para producción'
    },
    {
      command: 'pnpm --filter patients test:e2e',
      description: 'Ejecutar tests E2E de pacientes'
    },
    {
      command: 'pnpm --filter patients storybook',
      description: 'Ver componentes en Storybook'
    }
  ],

  dependencies: [
    '@altamedica/ui - Componentes UI',
    '@altamedica/medical - Componentes médicos',
    '@altamedica/hooks - Hooks compartidos',
    '@altamedica/medical-hooks - Hooks médicos especializados',
    '@altamedica/telemedicine-core - WebRTC y videollamadas',
    '@altamedica/patient-services - Servicios de paciente',
    '@altamedica/api-client - Cliente API',
    '@altamedica/types - Tipos TypeScript'
  ],

  commonIssues: [
    'WebRTC no conecta - Verificar signaling-server en puerto 8888',
    'Cámara/micrófono no funciona - Verificar permisos del navegador',
    'Dashboard lento - Implementar paginación en listas largas',
    'Notificaciones no llegan - Verificar Service Worker y permisos',
    'PDF no se genera - Verificar que jsPDF esté instalado',
    'Anamnesis no carga - Verificar que api-server esté corriendo'
  ],

  bestPractices: [
    'Usar hooks unificados (useMedicalHistoryUnified, useTelemedicineUnified)',
    'Implementar lazy loading para componentes pesados',
    'Cachear datos médicos con TanStack Query',
    'Usar optimistic updates para mejor UX',
    'Implementar offline-first con Service Workers',
    'Validar datos médicos con esquemas Zod',
    'Encriptar datos sensibles antes de enviar',
    'Implementar auto-save en formularios largos',
    'Usar WebSocket para actualizaciones en tiempo real'
  ],

  integrations: [
    'WebRTC - Videollamadas médicas',
    'Socket.io - Comunicación tiempo real',
    'Firebase - Auth y notificaciones',
    'Stripe - Pagos de consultas',
    'Google Calendar - Sincronización de citas',
    'Twilio - SMS recordatorios',
    'SendGrid - Email transaccionales'
  ],

  secrets: [
    'NEXT_PUBLIC_WEBRTC_STUN_URL',
    'NEXT_PUBLIC_WEBRTC_TURN_URL',
    'WEBRTC_TURN_USERNAME',
    'WEBRTC_TURN_CREDENTIAL',
    'NEXT_PUBLIC_SOCKET_URL',
    'STRIPE_SECRET_KEY',
    'TWILIO_AUTH_TOKEN'
  ]
};

export class PatientMCP extends BaseMCP {
  constructor() {
    super(patientsConfig, patientsKnowledge);
  }

  help(query?: string): void {
    if (!query) {
      logger.info('\n👥 PatientMCP - Experto en patients app\n');
      logger.info('Portal de pacientes empresarial (Puerto 3003)\n');
      logger.info('Comandos disponibles:');
      logger.info('  patientMCP.getInfo() - Información general');
      logger.info('  patientMCP.listFeatures() - Características principales');
      logger.info('  patientMCP.showTechStack() - Stack tecnológico');
      logger.info('  patientMCP.listKeyFiles() - Archivos importantes');
      logger.info('  patientMCP.showRoutes() - Rutas disponibles');
      logger.info('  patientMCP.troubleshoot("webrtc") - Resolver problemas');
      logger.info('  patientMCP.generateExample("telemedicine") - Código ejemplo');
      return;
    }

    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('telemedicine') || queryLower.includes('video')) {
      logger.info('\n📹 Telemedicina en patients:');
      logger.info('1. Hook principal: useTelemedicineUnified (858 líneas)');
      logger.info('2. Componente: TelemedicineMVP.tsx');
      logger.info('3. WebRTC config en telemedicine-config.ts');
      logger.info('4. Signaling server debe estar en puerto 8888');
      logger.info('\nEjemplo: patientMCP.generateExample("telemedicine")');
    }
    
    if (queryLower.includes('medical') || queryLower.includes('history')) {
      logger.info('\n📋 Historial médico:');
      logger.info('1. Hook: useMedicalHistoryUnified (1074 líneas)');
      logger.info('2. Incluye: records, prescriptions, lab results');
      logger.info('3. Exportable a PDF/CSV');
      logger.info('4. Caché con TanStack Query');
    }
    
    if (queryLower.includes('anamnesis')) {
      logger.info('\n🎮 Anamnesis interactiva:');
      logger.info('1. Versión gamificada: /anamnesis-juego');
      logger.info('2. Con IA: /alta-anamnesis');
      logger.info('3. Componentes en src/components/anamnesis/');
      logger.info('4. Datos en src/data/anamnesis-data.ts');
    }
  }

  generateExample(type: string): string {
    switch(type.toLowerCase()) {
      case 'telemedicine':
        return `
// Componente de videoconsulta médica
import { useTelemedicineUnified } from '@/hooks/useTelemedicineUnified';
import { VideoCall } from '@altamedica/telemedicine-core';

export default function TelemedicineSession({ sessionId }: { sessionId: string }) {
  const {
    session,
    localStream,
    remoteStream,
    isConnected,
    startCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useTelemedicineUnified(sessionId);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <VideoCall
        localStream={localStream}
        remoteStream={remoteStream}
        onEndCall={endCall}
        controls={{
          mute: toggleMute,
          video: toggleVideo
        }}
      />
      
      <div className="space-y-4">
        <Chat sessionId={sessionId} />
        <SharedDocuments />
        <PrescriptionPad />
      </div>
    </div>
  );
}`;

      case 'dashboard':
        return `
// Dashboard del paciente con métricas
import { useMedicalHistoryUnified } from '@/hooks/useMedicalHistoryUnified';
import { HealthMetricCard, AppointmentCard } from '@altamedica/medical';

export default function PatientDashboard() {
  const {
    medicalHistory,
    appointments,
    prescriptions,
    labResults,
    isLoading
  } = useMedicalHistoryUnified();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <HealthMetricCard
        title="Próximas Citas"
        value={appointments.upcoming.length}
        trend="+2 este mes"
      />
      
      <HealthMetricCard
        title="Medicamentos Activos"
        value={prescriptions.active.length}
        status="warning"
      />
      
      <HealthMetricCard
        title="Últimos Resultados"
        value={labResults.recent.length}
        action="Ver todos"
      />
      
      <div className="col-span-full">
        <AppointmentsList appointments={appointments.upcoming} />
      </div>
    </div>
  );
}`;

      case 'anamnesis':
        return `
// Anamnesis gamificada
import { GameAnamnesis } from '@/components/anamnesis/GameComponents';
import { useAnamnesis } from '@/hooks/useAnamnesis';

export default function AnamnesisGame() {
  const {
    currentStep,
    progress,
    points,
    submitAnswer,
    nextStep
  } = useAnamnesis();
  
  return (
    <GameAnamnesis
      step={currentStep}
      progress={progress}
      points={points}
      onAnswer={submitAnswer}
      onNext={nextStep}
      rewards={{
        milestone: 100,
        achievement: 'Primera consulta completa'
      }}
    />
  );
}`;

      case 'emergency':
        return `
// Sistema de emergencias
import { useEmergency } from '@/hooks/useEmergency';
import { EmergencyButton } from '@altamedica/ui';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
export default function EmergencySystem() {
  const {
    location,
    nearestHospitals,
    callEmergency,
    sendAlert
  } = useEmergency();
  
  const handleEmergency = async () => {
    // Enviar ubicación y datos vitales
    await sendAlert({
      location,
      patientId: user.id,
      symptoms: 'Dolor torácico agudo',
      priority: 'HIGH'
    });
    
    // Llamar al 911
    callEmergency();
  };
  
  return (
    <div className="space-y-4">
      <EmergencyButton 
        onClick={handleEmergency}
        size="large"
        pulse
      />
      
      <NearestHospitals 
        hospitals={nearestHospitals}
        currentLocation={location}
      />
    </div>
  );
}`;

      default:
        return 'Tipos disponibles: telemedicine, dashboard, anamnesis, emergency';
    }
  }
}

// Exportar instancia singleton
export const patientMCP = new PatientMCP();