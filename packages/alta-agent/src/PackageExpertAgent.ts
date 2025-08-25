/**
 * PackageExpertAgent - Agente experto en el conocimiento de packages de AltaMedica
 * 
 * Este agente conoce TODO sobre los 26+ paquetes del monorepo:
 * - Estructura y organización
 * - APIs y exports disponibles
 * - Dependencias y jerarquías
 * - Mejores prácticas y patrones
 * - Soluciones a problemas comunes
 */

import { logger } from './logger.js';
import type { PackageInfo, PackageQuery, PackageRecommendation } from './types';


export class PackageExpertAgent {
  private packagesKnowledge: Record<string, PackageInfo> = {
    // 🔐 AUTENTICACIÓN Y SEGURIDAD
    '@altamedica/auth': {
      purpose: 'Sistema de autenticación SSO centralizado con JWT y manejo de sesiones',
      location: 'packages/auth',
      mainExports: ['useAuth', 'useSSO', 'AuthProvider', 'ssoClient'],
      dependencies: ['@altamedica/firebase', '@altamedica/shared'],
      whenToUse: 'Cuando necesites autenticación, manejo de sesiones, SSO, JWT tokens',
      keyFiles: [
        'src/sso-client.ts - Cliente SSO con fallback localStorage',
        'src/sso-service.ts - Servicio SSO backend',
        'src/context/AuthContext.tsx - Provider de autenticación',
        'src/hooks/index.ts - Hooks de autenticación'
      ],
      commonIssues: [
        'Si hay problemas con cookies, verificar AUTH_COOKIES y LEGACY_AUTH_COOKIES',
        'Para SSO, asegurarse de que api-server esté corriendo en puerto 3001',
        'No usar localStorage para tokens en producción (HIPAA compliance)'
      ]
    },

    // 🎨 UI Y SISTEMA DE DISEÑO
    '@altamedica/ui': {
      purpose: 'Sistema de diseño médico basado en Tailwind CSS + Radix UI',
      location: 'packages/ui',
      mainExports: [
        'Button', 'Card', 'Input', 'Badge',
        'PatientCard', 'AppointmentCard', 'VitalSignsChart',
        'MedicalIntakeForm', 'MedicalAIAssistant'
      ],
      storybook: 'Puerto 6006 - pnpm storybook',
      whenToUse: 'SIEMPRE para componentes UI. Nunca crear componentes desde cero',
      keyFiles: [
        'src/components/medical/* - Componentes médicos especializados',
        'src/components/forms/* - Formularios médicos',
        'src/components/analytics/* - Dashboards y gráficos'
      ],
      bestPractices: [
        'Importar componentes directamente: import { Button } from "@altamedica/ui"',
        'Usar variantes predefinidas en lugar de clases custom',
        'Los componentes médicos incluyen validación HIPAA'
      ]
    },

    // 📊 TIPOS Y VALIDACIÓN
    '@altamedica/types': {
      purpose: 'Definiciones TypeScript centralizadas con validación Zod',
      location: 'packages/types',
      mainExports: [
        'Patient', 'Doctor', 'Appointment', 'MedicalRecord',
        'PatientSchema', 'DoctorSchema', 'AppointmentSchema'
      ],
      whenToUse: 'SIEMPRE para tipos compartidos entre frontend y backend',
      keyFiles: [
        'src/medical/patient/patient.types.ts',
        'src/medical/clinical/index.ts',
        'src/api/endpoints.types.ts'
      ],
      critical: [
        'Este es EL CONTRATO entre frontend y backend',
        'Todos los tipos deben definirse aquí, no en las apps',
        'Incluye esquemas Zod para validación runtime'
      ]
    },

    // 🔗 HOOKS Y ESTADO
    '@altamedica/hooks': {
      purpose: 'Biblioteca exhaustiva de React hooks organizados por dominio',
      location: 'packages/hooks',
      mainExports: [
        'usePatients', 'useMedicalAI', 'useAuth',
        'useDebounce', 'useLocalStorage', 'useWebSocket'
      ],
      subExports: [
        '/medical - Hooks médicos',
        '/auth - Hooks de autenticación',
        '/api - Hooks de integración API',
        '/realtime - Hooks tiempo real',
        '/providers - QueryProvider unificado'
      ],
      whenToUse: 'Para lógica reutilizable, estado compartido, integración con APIs',
      queryProvider: {
        import: 'import { MedicalQueryProvider } from "@altamedica/hooks/providers"',
        configs: ['MedicalQueryProvider', 'StandardQueryProvider', 'StableQueryProvider'],
        utils: 'QUERY_KEYS, cacheUtils para gestión de caché'
      }
    },

    // 🏥 DOMINIO MÉDICO
    '@altamedica/medical': {
      purpose: 'Componentes y utilidades del dominio médico',
      location: 'packages/medical',
      mainExports: [
        'calculateBMI', 'validateVitalSigns', 'formatMedicalDate',
        'MedicalDashboard', 'VitalSignsMonitor'
      ],
      whenToUse: 'Para cualquier cálculo médico, validación clínica o componente médico',
      utilities: [
        'Cálculos BMI, dosis medicamentos',
        'Validación datos clínicos',
        'Conversiones unidades médicas',
        'Formateo fechas médicas'
      ]
    },

    // 🌐 API Y COMUNICACIÓN
    '@altamedica/api-client': {
      purpose: 'Cliente API unificado con TanStack Query y caché inteligente',
      location: 'packages/api-client',
      mainExports: [
        'useAppointments', 'usePatients', 'useDoctors',
        'apiClient', 'cacheStrategies'
      ],
      whenToUse: 'Para TODAS las llamadas API desde el frontend',
      features: [
        'Manejo automático de errores',
        'Reintentos configurables',
        'Caché con invalidación inteligente',
        'Optimistic updates'
      ],
      usage: 'const { data, isLoading } = usePatients()'
    },

    // 💾 BASE DE DATOS
    '@altamedica/database': {
      purpose: 'Capa de acceso a datos con Prisma ORM y repositorios',
      location: 'packages/database',
      mainExports: [
        'PatientRepository', 'MedicalRecordRepository',
        'CompanyService', 'DatabaseConnection'
      ],
      whenToUse: 'Solo en api-server, nunca en frontend',
      patterns: [
        'Patrón Repository para abstracción',
        'Soporte Firebase y PostgreSQL',
        'Auditoría HIPAA integrada'
      ]
    },

    // 📡 TELEMEDICINA
    '@altamedica/telemedicine-core': {
      purpose: 'Implementación WebRTC para videollamadas médicas',
      location: 'packages/telemedicine-core',
      mainExports: [
        'useTelemedicineUnified', 'useWebRTC',
        'videoCallClient', 'webrtcService'
      ],
      whenToUse: 'Para videollamadas, WebRTC, sesiones de telemedicina',
      features: [
        'Latencia <100ms optimizada',
        'STUN/TURN servers',
        'Grabación HIPAA compliant',
        'QoS monitoring'
      ]
    },

    // 🤖 INTELIGENCIA ARTIFICIAL
    '@altamedica/ai-agents': {
      purpose: 'Agentes IA para diagnóstico y análisis médico',
      location: 'packages/ai-agents',
      mainExports: [
        'aiAgentsService', 'diagnosticAgent',
        'symptomAnalyzer', 'drugInteractionChecker'
      ],
      whenToUse: 'Para análisis con IA, predicciones médicas, asistencia diagnóstica'
    },

    // 🏪 MARKETPLACE
    '@altamedica/marketplace-hooks': {
      purpose: 'Hooks específicos del marketplace B2B',
      location: 'packages/marketplace-hooks',
      mainExports: [
        'useCompanyProfile', 'useJobApplications',
        'useMarketplaceAnalytics', 'useMarketplaceMessaging'
      ],
      whenToUse: 'En companies app para funcionalidad B2B'
    },

    // 🔧 UTILIDADES
    '@altamedica/utils': {
      purpose: 'Utilidades cross-platform y helpers',
      location: 'packages/utils',
      mainExports: ['cn', 'formatting', 'validation', 'storage'],
      whenToUse: 'Para utilidades comunes, formateo, validación'
    },

    // 🔧 CONFIGURACIÓN
    '@altamedica/typescript-config': {
      purpose: 'Configuración TypeScript base',
      location: 'packages/typescript-config',
      whenToUse: 'Extender en tsconfig.json de nuevos paquetes'
    },

    '@altamedica/eslint-config': {
      purpose: 'Reglas ESLint compartidas',
      location: 'packages/eslint-config',
      whenToUse: 'En .eslintrc de todos los paquetes y apps'
    },

    '@altamedica/tailwind-config': {
      purpose: 'Tema y configuración Tailwind',
      location: 'packages/tailwind-config',
      whenToUse: 'Extender en tailwind.config.js'
    }
  };

  /**
   * Busca información sobre un paquete específico
   */
  getPackageInfo(packageName: string): PackageInfo | null {
    const info = this.packagesKnowledge[packageName];
    if (!info) {
      const suggestion = this.findSimilarPackage(packageName);
      logger.info(`❌ Paquete '${packageName}' no encontrado.`);
      if (suggestion) {
        logger.info(`💡 ¿Quisiste decir '${suggestion}'?`);
      }
      return null;
    }
    return info;
  }

  /**
   * Encuentra paquetes similares (typo correction)
   */
  private findSimilarPackage(query: string): string | null {
    const packages = Object.keys(this.packagesKnowledge);
    const normalized = query.toLowerCase().replace('@altamedica/', '');
    
    for (const pkg of packages) {
      if (pkg.toLowerCase().includes(normalized)) {
        return pkg;
      }
    }
    return null;
  }

  /**
   * Recomienda paquetes basado en lo que necesitas hacer
   */
  recommendPackages(need: string): PackageRecommendation[] {
    const recommendations: PackageRecommendation[] = [];
    const needLower = need.toLowerCase();

    // Mapeo de necesidades a paquetes
    const needsMap = {
      'auth': ['@altamedica/auth', '@altamedica/firebase'],
      'login': ['@altamedica/auth', '@altamedica/firebase'],
      'ui': ['@altamedica/ui', '@altamedica/tailwind-config'],
      'componente': ['@altamedica/ui', '@altamedica/hooks'],
      'button': ['@altamedica/ui'],
      'form': ['@altamedica/ui', '@altamedica/hooks/forms'],
      'api': ['@altamedica/api-client', '@altamedica/hooks/api'],
      'fetch': ['@altamedica/api-client'],
      'patient': ['@altamedica/types', '@altamedica/medical', '@altamedica/patient-services'],
      'doctor': ['@altamedica/types', '@altamedica/medical'],
      'medical': ['@altamedica/medical', '@altamedica/medical-types', '@altamedica/medical-hooks'],
      'video': ['@altamedica/telemedicine-core'],
      'webrtc': ['@altamedica/telemedicine-core'],
      'types': ['@altamedica/types'],
      'hook': ['@altamedica/hooks'],
      'database': ['@altamedica/database'],
      'cache': ['@altamedica/medical-cache', '@altamedica/api-client'],
      'marketplace': ['@altamedica/marketplace-hooks'],
      'ai': ['@altamedica/ai-agents']
    };

    // Buscar coincidencias
    for (const [key, packages] of Object.entries(needsMap)) {
      if (needLower.includes(key)) {
        packages.forEach(pkg => {
          recommendations.push({
            package: pkg,
            reason: `Necesitas ${key}`,
            info: this.packagesKnowledge[pkg]
          });
        });
      }
    }

    return recommendations;
  }

  /**
   * Explica cómo usar un paquete específico
   */
  explainUsage(packageName: string): void {
    const info = this.getPackageInfo(packageName);
    if (!info) return;

    logger.info(`\n📦 ${packageName}`);
    logger.info(`📍 Ubicación: ${info.location}`);
    logger.info(`🎯 Propósito: ${info.purpose}`);
    
    if (info.mainExports) {
      logger.info(`\n✨ Exports principales:`);
      info.mainExports.forEach(exp => logger.info(`  - ${exp}`));
    }

    if (info.whenToUse) {
      logger.info(`\n🔧 Cuándo usar: ${info.whenToUse}`);
    }

    if (info.usage) {
      logger.info(`\n💻 Ejemplo de uso:`);
      logger.info(`  ${info.usage}`);
    }

    if (info.critical) {
      logger.info(`\n⚠️ CRÍTICO:`);
      info.critical.forEach(c => logger.info(`  - ${c}`));
    }
  }

  /**
   * Lista todos los paquetes disponibles
   */
  listAllPackages(): void {
    logger.info('\n🏥 PAQUETES DE ALTAMEDICA (26 total)\n');
    
    const categories = {
      '🔐 Autenticación': ['@altamedica/auth', '@altamedica/firebase'],
      '🎨 UI/Diseño': ['@altamedica/ui', '@altamedica/tailwind-config'],
      '📊 Tipos': ['@altamedica/types', '@altamedica/medical-types'],
      '🔗 Hooks': ['@altamedica/hooks', '@altamedica/medical-hooks', '@altamedica/marketplace-hooks'],
      '🏥 Médico': ['@altamedica/medical', '@altamedica/patient-services', '@altamedica/medical-services'],
      '🌐 API': ['@altamedica/api-client', '@altamedica/api-helpers'],
      '💾 Datos': ['@altamedica/database', '@altamedica/medical-cache'],
      '📡 Telemedicina': ['@altamedica/telemedicine-core'],
      '🤖 IA': ['@altamedica/ai-agents'],
      '🔧 Config': ['@altamedica/typescript-config', '@altamedica/eslint-config']
    };

    for (const [category, packages] of Object.entries(categories)) {
      logger.info(`${category}:`);
      packages.forEach(pkg => {
        const info = this.packagesKnowledge[pkg];
        if (info) {
          logger.info(`  • ${pkg} - ${info.purpose}`);
        }
      });
      logger.info('');
    }
  }

  /**
   * Resuelve problemas comunes
   */
  troubleshoot(problem: string): void {
    const problemLower = problem.toLowerCase();
    
    logger.info('\n🔍 Analizando problema...\n');

    // Problemas comunes y soluciones
    if (problemLower.includes('import') || problemLower.includes('cannot find')) {
      logger.info('📦 Problema de importación detectado:');
      logger.info('1. Verificar que el paquete esté construido: pnpm build');
      logger.info('2. Verificar exports en package.json del paquete');
      logger.info('3. Para hooks: usar subpath imports como @altamedica/hooks/medical');
      logger.info('4. Verificar workspace:* en dependencies');
    }

    if (problemLower.includes('type') || problemLower.includes('typescript')) {
      logger.info('📊 Problema de tipos detectado:');
      logger.info('1. Reconstruir @altamedica/types: pnpm --filter @altamedica/types build');
      logger.info('2. Verificar que tsconfig extienda de @altamedica/typescript-config');
      logger.info('3. Limpiar y reconstruir: pnpm clean && pnpm build');
    }

    if (problemLower.includes('auth') || problemLower.includes('session')) {
      logger.info('🔐 Problema de autenticación:');
      logger.info('1. Verificar que api-server esté corriendo (puerto 3001)');
      logger.info('2. Usar cookies altamedica_token, no localStorage');
      logger.info('3. Importar desde @altamedica/auth');
      logger.info('4. Verificar UnifiedAuthSystem en api-server');
    }

    if (problemLower.includes('ui') || problemLower.includes('component')) {
      logger.info('🎨 Problema de UI:');
      logger.info('1. Siempre usar @altamedica/ui, no crear componentes custom');
      logger.info('2. Para ver componentes: pnpm --filter @altamedica/ui storybook');
      logger.info('3. Importar directamente: import { Button } from "@altamedica/ui"');
    }
  }

  /**
   * Muestra la jerarquía de dependencias
   */
  showDependencyHierarchy(): void {
    logger.info('\n🏗️ JERARQUÍA DE DEPENDENCIAS\n');
    logger.info('Nivel 0 (Sin dependencias):');
    logger.info('  • typescript-config, eslint-config, tailwind-config, utils\n');
    
    logger.info('Nivel 1 (Dependencias básicas):');
    logger.info('  • types, medical-types, shared\n');
    
    logger.info('Nivel 2 (Dependencias intermedias):');
    logger.info('  • firebase, auth, database\n');
    
    logger.info('Nivel 3 (Dependencias complejas):');
    logger.info('  • ui, hooks, api-client, medical\n');
    
    logger.info('Nivel 4 (Alto nivel):');
    logger.info('  • patient-services, marketplace-hooks, telemedicine-core\n');
    
    logger.info('Nivel 5 (Integración):');
    logger.info('  • ai-agents\n');
  }

  /**
   * Comando de ayuda principal
   */
  help(query?: string): void {
    if (!query) {
      logger.info('\n🤖 ALTA-AGENT - Experto en Packages de AltaMedica\n');
      logger.info('Comandos disponibles:');
      logger.info('  • agent.getPackageInfo("@altamedica/auth") - Info de un paquete');
      logger.info('  • agent.recommendPackages("necesito autenticación") - Recomendaciones');
      logger.info('  • agent.explainUsage("@altamedica/ui") - Cómo usar un paquete');
      logger.info('  • agent.listAllPackages() - Lista todos los paquetes');
      logger.info('  • agent.troubleshoot("error de importación") - Resolver problemas');
      logger.info('  • agent.showDependencyHierarchy() - Ver jerarquía');
      logger.info('  • agent.checkDuplication("auth") - Verificar duplicación');
      return;
    }

    // Buscar información específica
    if (query.startsWith('@altamedica/')) {
      this.explainUsage(query);
    } else {
      const recommendations = this.recommendPackages(query);
      if (recommendations.length > 0) {
        logger.info(`\n💡 Recomendaciones para "${query}":\n`);
        recommendations.forEach(rec => {
          logger.info(`📦 ${rec.package}`);
          logger.info(`   ${rec.info.purpose}`);
        });
      }
    }
  }

  /**
   * Verifica posible duplicación de código
   */
  checkDuplication(functionality: string): void {
    logger.info(`\n🔍 Verificando duplicación para: ${functionality}\n`);
    
    const recommendations = this.recommendPackages(functionality);
    if (recommendations.length > 0) {
      logger.info('⚠️ YA EXISTE funcionalidad en estos paquetes:');
      recommendations.forEach(rec => {
        logger.info(`  • ${rec.package} - ${rec.info.purpose}`);
      });
      logger.info('\n❌ NO CREAR código duplicado. Usa los paquetes existentes.');
    } else {
      logger.info('✅ No se encontró funcionalidad similar.');
      logger.info('   Puedes crear nuevo código si es necesario.');
    }
  }
}

// Exportar instancia singleton
export const packageExpert = new PackageExpertAgent();