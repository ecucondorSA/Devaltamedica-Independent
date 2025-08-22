/**
 * APIMCP - Experto en api-server (Backend central)
 * Puerto 3001 - API REST central + WebSocket
 */

import { BaseMCP, MCPConfig, AppKnowledge } from './BaseMCP';
import { logger } from '../logger.js';

const apiConfig: MCPConfig = {
  name: 'APIMCP',
  app: 'api-server',
  port: 3001,
  description: 'API REST central y servidor WebSocket - El cerebro de AltaMedica',
  location: 'apps/api-server'
};

const apiKnowledge: AppKnowledge = {
  purpose: 'Servidor backend central que maneja toda la lógica de negocio, autenticación SSO, comunicación WebSocket, integraciones con bases de datos y servicios externos. Es la única fuente de verdad para todos los datos',
  
  mainFeatures: [
    '🔐 Sistema SSO unificado (UnifiedAuthSystem)',
    '📢 Notificaciones centralizadas (UnifiedNotificationSystem)',
    '🏪 Marketplace unificado (UnifiedMarketplaceSystem)',
    '📹 Controlador de telemedicina (UnifiedTelemedicineController)',
    '💳 Sistema de facturación completo (Stripe + MercadoPago)',
    '📊 Auditoría HIPAA con hash chain',
    '🔒 Seguridad empresarial (RBAC, MFA, rate limiting)',
    '📈 Métricas y monitoreo (Prometheus)',
    '🗄️ Multi-database (Firebase + PostgreSQL)',
    '🔄 WebSocket para tiempo real',
    '📝 Validación con Zod schemas',
    '🏥 Integración HL7/FHIR',
    '⚡ Cache Redis para performance'
  ],

  techStack: {
    framework: 'Next.js API Routes + Express',
    version: '15.3.4',
    ui: [],
    state: ['Redis', 'In-memory cache'],
    styling: [],
    testing: ['Jest', 'Supertest'],
    other: ['Prisma ORM', 'Firebase Admin', 'Socket.io', 'Bull queues', 'Zod']
  },

  keyFiles: [
    {
      pattern: 'src/auth/UnifiedAuthSystem.ts',
      description: 'Sistema de autenticación centralizado SSO',
      example: 'UnifiedAuth middleware, JWT handling, role validation'
    },
    {
      pattern: 'src/notifications/UnifiedNotificationSystem.ts',
      description: 'Sistema de notificaciones multicanal'
    },
    {
      pattern: 'src/marketplace/UnifiedMarketplaceSystem.ts',
      description: 'Gestión completa del marketplace B2B'
    },
    {
      pattern: 'src/telemedicine/unified-telemedicine-controller.ts',
      description: 'Controlador WebRTC y sesiones'
    },
    {
      pattern: 'src/app/api/v1/*',
      description: 'Endpoints API RESTful v1'
    },
    {
      pattern: 'src/services/*',
      description: 'Servicios de negocio (60+ servicios)'
    },
    {
      pattern: 'src/lib/prisma.ts',
      description: 'Cliente Prisma para PostgreSQL'
    },
    {
      pattern: 'src/middleware/*',
      description: 'Middlewares (auth, audit, rate-limit, etc.)'
    }
  ],

  routes: [
    {
      path: '/api/v1/auth/sso',
      method: 'POST',
      description: 'SSO login/logout endpoints',
      authentication: false
    },
    {
      path: '/api/v1/patients/*',
      method: 'ALL',
      description: 'CRUD de pacientes',
      authentication: true
    },
    {
      path: '/api/v1/appointments/*',
      method: 'ALL',
      description: 'Gestión de citas',
      authentication: true
    },
    {
      path: '/api/v1/telemedicine/*',
      method: 'ALL',
      description: 'WebRTC y videollamadas',
      authentication: true
    },
    {
      path: '/api/v1/prescriptions/*',
      method: 'ALL',
      description: 'Prescripciones médicas',
      authentication: true
    },
    {
      path: '/api/v1/billing/*',
      method: 'ALL',
      description: 'Facturación y pagos',
      authentication: true
    },
    {
      path: '/api/v1/audit/*',
      method: 'GET/POST',
      description: 'Logs de auditoría HIPAA',
      authentication: true
    },
    {
      path: '/health',
      method: 'GET',
      description: 'Health check endpoint',
      authentication: false
    }
  ],

  commands: [
    {
      command: 'pnpm --filter api-server dev',
      description: 'Iniciar servidor en puerto 3001'
    },
    {
      command: 'pnpm --filter api-server build',
      description: 'Build de producción'
    },
    {
      command: 'pnpm --filter api-server prisma:migrate',
      description: 'Ejecutar migraciones de DB'
    },
    {
      command: 'pnpm --filter api-server test',
      description: 'Ejecutar tests unitarios e integración'
    }
  ],

  dependencies: [
    '@altamedica/types - Validación con Zod',
    '@altamedica/database - Repositorios y esquemas',
    '@altamedica/shared - Servicios compartidos',
    'Prisma ORM - PostgreSQL',
    'Firebase Admin - Firestore/Auth',
    'Redis - Cache y sesiones',
    'Socket.io - WebSocket',
    'Stripe/MercadoPago - Pagos'
  ],

  commonIssues: [
    'CORS errors - Configurar origenes permitidos en cors.ts',
    'Auth fallando - Verificar JWT_SECRET y Firebase config',
    'DB connection failed - Verificar DATABASE_URL',
    'Redis connection refused - Iniciar Redis server',
    'Rate limit hit - Ajustar límites en rate-limit.ts'
  ],

  bestPractices: [
    'SIEMPRE usar sistemas unificados (Unified*)',
    'Validar TODOS los inputs con Zod schemas',
    'Implementar auditoría en operaciones críticas',
    'Usar transacciones para operaciones múltiples',
    'Cachear respuestas costosas en Redis',
    'Implementar retry logic para servicios externos',
    'Documentar APIs con OpenAPI/Swagger',
    'Usar queues para tareas asíncronas'
  ],

  integrations: [
    'Firebase (Auth, Firestore, Storage)',
    'PostgreSQL via Prisma',
    'Redis para cache',
    'Stripe/MercadoPago para pagos',
    'SendGrid/Twilio para comunicaciones',
    'Prometheus para métricas',
    'Sentry para error tracking'
  ],

  secrets: [
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'FIREBASE_SERVICE_ACCOUNT',
    'STRIPE_SECRET_KEY',
    'MERCADOPAGO_ACCESS_TOKEN'
  ]
};

export class APIMCP extends BaseMCP {
  constructor() {
    super(apiConfig, apiKnowledge);
  }

  help(query?: string): void {
    if (!query) {
      logger.info('\n🚀 APIMCP - Experto en api-server\n');
      logger.info('Backend central de AltaMedica (Puerto 3001)\n');
      logger.info('⚠️ CRÍTICO: Usar SIEMPRE sistemas unificados:\n');
      logger.info('  • UnifiedAuthSystem');
      logger.info('  • UnifiedNotificationSystem');
      logger.info('  • UnifiedMarketplaceSystem');
      logger.info('  • UnifiedTelemedicineController\n');
      logger.info('Usa: apiMCP.[comando]() para más información');
      return;
    }
    
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('unified') || queryLower.includes('auth')) {
      logger.info('\n🔐 Sistemas Unificados:');
      logger.info('NUNCA crear servicios duplicados.');
      logger.info('Siempre usar los sistemas unificados existentes.');
      logger.info('Ubicación: src/[dominio]/Unified[Sistema].ts');
    }
  }

  generateExample(type: string): string {
    switch(type.toLowerCase()) {
      case 'endpoint':
        return `
// Endpoint API con validación y auditoría
import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { PatientSchema } from '@altamedica/types';
import { auditLog } from '@/lib/audit';

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
export async function POST(request: NextRequest) {
  // 1. Autenticación
  const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN']);
  if (!authResult.success) return authResult.response;
  
  // 2. Validación
  const body = await request.json();
  const validated = PatientSchema.parse(body);
  
  // 3. Lógica de negocio
  const patient = await PatientService.create(validated);
  
  // 4. Auditoría
  await auditLog({
    action: 'PATIENT_CREATE',
    userId: authResult.user.id,
    resource: patient.id,
    metadata: { patientName: patient.name }
  });
  
  // 5. Respuesta
  return NextResponse.json({ success: true, patient });
}`;

      case 'service':
        return `
// Servicio con patrón repository
export class PatientService {
  static async create(data: PatientInput): Promise<Patient> {
    // Validación de negocio
    if (await this.isDuplicate(data.email)) {
      throw new ConflictError('Patient already exists');
    }
    
    // Transacción
    return await prisma.$transaction(async (tx) => {
      // Crear paciente
      const patient = await tx.patient.create({ data });
      
      // Crear historial médico inicial
      await tx.medicalHistory.create({
        data: { patientId: patient.id }
      });
      
      // Notificar
      await notificationService.send({
        userId: patient.id,
        type: 'WELCOME',
        channels: ['email', 'push']
      });
      
      return patient;
    });
  }
}`;

      default:
        return 'Tipos: endpoint, service, middleware, websocket';
    }
  }
}

export const apiMCP = new APIMCP();