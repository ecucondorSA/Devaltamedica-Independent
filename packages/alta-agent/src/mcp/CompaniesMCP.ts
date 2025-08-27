/**
 * CompaniesMCP - Experto en companies app (Marketplace B2B)
 * Puerto 3004 - Marketplace médico B2B
 */

import { logger } from '../logger';
import { BaseMCP, MCPConfig, AppKnowledge } from './BaseMCP';

const companiesConfig: MCPConfig = {
  name: 'CompaniesMCP',
  app: 'companies',
  port: 3004,
  description: 'Marketplace B2B para empresas de salud, hospitales y clínicas',
  location: 'apps/companies'
};

const companiesKnowledge: AppKnowledge = {
  purpose: 'Portal B2B para empresas de salud que permite gestionar personal médico, publicar ofertas laborales, monitorear operaciones hospitalarias, gestionar facturación y participar en el marketplace médico',
  
  mainFeatures: [
    '💼 Marketplace de empleo médico',
    '🏥 Dashboard de operaciones hospitalarias',
    '📊 Centro de control de crisis (saturación)',
    '👥 Gestión de personal médico',
    '💰 Sistema de facturación empresarial',
    '🗺️ Mapa interactivo de recursos médicos',
    '📈 Analytics y reportes empresariales',
    '🔄 Matching inteligente de profesionales',
    '📋 Gestión de compliance y certificaciones',
    '🚨 Monitor de saturación hospitalaria',
    '💬 Sistema de mensajería B2B',
    '📱 Hub de operaciones móvil'
  ],

  techStack: {
    framework: 'Next.js',
    version: '15.3.4',
    ui: ['React 19', '@altamedica/ui', 'Recharts', 'Leaflet'],
    state: ['Zustand', 'TanStack Query'],
    styling: ['Tailwind CSS', 'Radix UI'],
    testing: ['Playwright', 'Jest'],
    other: ['Chart.js', 'React-Leaflet', 'Socket.io']
  },

  keyFiles: [
    {
      pattern: 'src/app/marketplace/page.tsx',
      description: 'Marketplace principal con mapa y listados'
    },
    {
      pattern: 'src/app/operations-hub/page.tsx',
      description: 'Centro de operaciones hospitalarias'
    },
    {
      pattern: 'src/components/marketplace/MarketplaceMap.tsx',
      description: 'Mapa interactivo de recursos médicos'
    },
    {
      pattern: 'src/components/crisis/CrisisControlCenter.tsx',
      description: 'Centro de control de crisis'
    },
    {
      pattern: 'src/components/b2c/JobApplicationsManager.tsx',
      description: 'Gestión de aplicaciones laborales'
    },
    {
      pattern: 'src/services/HospitalDataIntegrationService.ts',
      description: 'Integración con sistemas hospitalarios'
    }
  ],

  routes: [
    {
      path: '/marketplace',
      description: 'Marketplace principal',
      authentication: true
    },
    {
      path: '/operations-hub',
      description: 'Hub de operaciones',
      authentication: true
    },
    {
      path: '/billing',
      description: 'Facturación empresarial',
      authentication: true
    },
    {
      path: '/compliance',
      description: 'Gestión de compliance',
      authentication: true
    },
    {
      path: '/api/companies/*',
      method: 'ALL',
      description: 'API endpoints empresariales',
      authentication: true
    }
  ],

  commands: [
    {
      command: 'pnpm --filter companies dev',
      description: 'Iniciar en puerto 3004 (sin --turbopack)'
    },
    {
      command: 'pnpm --filter companies build',
      description: 'Build de producción'
    }
  ],

  dependencies: [
    '@altamedica/ui',
    '@altamedica/marketplace-hooks',
    '@altamedica/api-client',
    'React-Leaflet para mapas',
    'Recharts para gráficos'
  ],

  commonIssues: [
    'Mapa no carga - Usar dynamic import con ssr: false',
    'Turbopack error - NO usar --turbopack en companies',
    'WebSocket disconnects - Verificar Socket.io server',
    'Datos no actualizan - Invalidar caché de TanStack Query'
  ],

  bestPractices: [
    'NO usar --turbopack en desarrollo',
    'Importar mapas con dynamic(..., { ssr: false })',
    'Usar evento "map:invalidate-size" para resize',
    'Implementar virtualización en listas largas',
    'Cachear datos de empresa con staleTime largo'
  ],

  integrations: [
    'Sistemas hospitalarios HL7',
    'APIs de recursos humanos',
    'Sistemas de facturación',
    'Plataformas de compliance'
  ],

  secrets: [
    'HOSPITAL_API_KEY',
    'BILLING_API_SECRET',
    'MAPS_API_KEY'
  ]
};

export class CompaniesMCP extends BaseMCP {
  constructor() {
    super(companiesConfig, companiesKnowledge);
  }

  help(query?: string): void {
    if (!query) {
      logger.info('\n🏢 CompaniesMCP - Experto en companies app\n');
      logger.info('Marketplace B2B (Puerto 3004)\n');
      logger.info('⚠️ IMPORTANTE: NO usar --turbopack\n');
      return;
    }
  }

  generateExample(type: string): string {
    switch(type.toLowerCase()) {
      case 'map':
        return `
// Mapa del marketplace (SSR-safe)
import dynamic from 'next/dynamic';


const MarketplaceMap = dynamic(
  () => import('@/components/marketplace/MarketplaceMap'),
  { ssr: false }
);

export default function MarketplacePage() {
  useEffect(() => {
    // Invalidar tamaño después de mount
    window.dispatchEvent(new Event('map:invalidate-size'));
  }, []);
  
  return <MarketplaceMap height="500px" />;
}`;

      default:
        return 'Tipos: map, job-listing, crisis-center';
    }
  }
}

export const companiesMCP = new CompaniesMCP();