/**
 * WebMCP - Experto en web-app (Gateway principal y autenticación)
 * Puerto 3000 - Gateway público de AltaMedica
 */

import { BaseMCP, MCPConfig, AppKnowledge } from './BaseMCP';

const webAppConfig: MCPConfig = {
  name: 'WebMCP',
  app: 'web-app',
  port: 3000,
  description: 'Gateway público y sistema de autenticación centralizado',
  location: 'apps/web-app'
};

const webAppKnowledge: AppKnowledge = {
  purpose: 'Gateway principal de AltaMedica que maneja autenticación inicial, landing pages, y redirección basada en roles a las aplicaciones específicas',
  
  mainFeatures: [
    '🔐 Autenticación centralizada con Firebase Auth',
    '🚪 Gateway de entrada con redirección por roles',
    '🎨 Landing page y páginas de marketing',
    '🏥 Demo de componentes 3D médicos',
    '🗺️ Mapas interactivos de marketplace',
    '📱 Diseño responsive mobile-first',
    '🌐 Soporte multiidioma (ES/EN)',
    '♿ Accesibilidad WCAG 2.2 AA',
    '🎭 Modo de rol para demos',
    '📊 Analytics y tracking'
  ],

  techStack: {
    framework: 'Next.js',
    version: '15.3.4',
    ui: ['React 19', '@altamedica/ui', 'Radix UI', 'Framer Motion'],
    state: ['Zustand', 'TanStack Query', 'React Hook Form'],
    styling: ['Tailwind CSS', 'CSS Modules', 'PostCSS'],
    testing: ['Playwright', 'Jest', 'React Testing Library'],
    other: ['Three.js', 'Leaflet', 'Firebase', 'TypeScript 5+']
  },

  keyFiles: [
    {
      pattern: 'src/app/page.tsx',
      description: 'Landing page principal con selector de roles',
      example: 'Componente con HeroSection, RoleSelector, VideoCarousel'
    },
    {
      pattern: 'src/app/layout.tsx',
      description: 'Layout root con providers y configuración global',
      example: 'AuthProvider, QueryProvider, ChunkErrorHandler'
    },
    {
      pattern: 'src/components/auth/*',
      description: 'Componentes de autenticación (Login, Register, SSO)',
      example: 'LoginForm.tsx, RegisterForm.tsx, AuthSystem-firebase.tsx'
    },
    {
      pattern: 'src/components/demo/Medical3DCanvas.tsx',
      description: 'Canvas 3D interactivo con modelos médicos',
      example: 'Órganos 3D rotativos con Three.js'
    },
    {
      pattern: 'src/components/landing/*',
      description: 'Componentes de la landing page',
      example: 'HeroSection, CTA, DayInLifeSection, MedicalAIDemoSection'
    },
    {
      pattern: 'middleware.ts',
      description: 'Middleware de autenticación y redirección por roles'
    },
    {
      pattern: 'src/lib/firebase.ts',
      description: 'Configuración y cliente de Firebase'
    },
    {
      pattern: '.env.local',
      description: 'Variables de entorno (Firebase, API URLs, etc.)'
    }
  ],

  routes: [
    {
      path: '/',
      description: 'Landing page con selector de roles',
      component: 'src/app/page.tsx',
      authentication: false
    },
    {
      path: '/login',
      description: 'Página de inicio de sesión',
      component: 'src/app/login/page.tsx',
      authentication: false
    },
    {
      path: '/register',
      description: 'Página de registro',
      component: 'src/app/register/page.tsx',
      authentication: false
    },
    {
      path: '/especialistas',
      description: 'Directorio de especialistas médicos',
      authentication: false
    },
    {
      path: '/servicios',
      description: 'Catálogo de servicios médicos',
      authentication: false
    },
    {
      path: '/telemedicine',
      description: 'Información sobre telemedicina',
      authentication: false
    },
    {
      path: '/landing-demo',
      description: 'Demo interactiva de la plataforma',
      authentication: false
    },
    {
      path: '/api/health',
      method: 'GET',
      description: 'Health check endpoint',
      authentication: false
    }
  ],

  commands: [
    {
      command: 'pnpm --filter web-app dev',
      description: 'Iniciar servidor de desarrollo',
      example: 'Levanta Next.js en http://localhost:3000'
    },
    {
      command: 'pnpm --filter web-app build',
      description: 'Construir para producción'
    },
    {
      command: 'pnpm --filter web-app start',
      description: 'Iniciar servidor de producción'
    },
    {
      command: 'pnpm --filter web-app lint',
      description: 'Ejecutar linter'
    },
    {
      command: 'pnpm --filter web-app test',
      description: 'Ejecutar tests'
    },
    {
      command: 'pnpm --filter web-app analyze',
      description: 'Analizar bundle size'
    }
  ],

  dependencies: [
    '@altamedica/ui - Sistema de diseño',
    '@altamedica/auth - Autenticación SSO',
    '@altamedica/types - Tipos TypeScript',
    '@altamedica/hooks - React hooks compartidos',
    '@altamedica/firebase - Configuración Firebase',
    '@altamedica/api-client - Cliente API'
  ],

  commonIssues: [
    'ChunkLoadError en desarrollo - Handler implementado en layout.tsx',
    'CORS con api-server - Verificar NEXT_PUBLIC_API_URL en .env.local',
    'Firebase Auth fallando - Verificar configuración en Firebase Console',
    'Mapas no cargan - Leaflet requiere importación dinámica con ssr: false',
    'Modelos 3D no se ven - Verificar que los archivos .glb estén en public/',
    'Hydration mismatch - Usar dynamic imports para componentes client-only'
  ],

  bestPractices: [
    'Usar AuthProvider de @altamedica/auth para manejo de sesiones',
    'Implementar lazy loading para componentes pesados (3D, mapas)',
    'Usar Image de Next.js para optimización automática',
    'Implementar error boundaries para componentes críticos',
    'Usar middleware para redirección por roles',
    'Mantener landing page ligera (<100KB inicial)',
    'Implementar PWA para mejor experiencia móvil',
    'Usar ISR para páginas de contenido estático'
  ],

  integrations: [
    'Firebase Auth - Autenticación y usuarios',
    'Firebase Analytics - Tracking de eventos',
    'Google OAuth - Login social',
    'Cloudinary - CDN de imágenes',
    'Vercel - Deployment y hosting',
    'Sentry - Error tracking'
  ],

  secrets: [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID'
  ]
};

export class WebMCP extends BaseMCP {
  constructor() {
    super(webAppConfig, webAppKnowledge);
  }

  help(query?: string): void {
    if (!query) {
      logger.info('\n🌐 WebMCP - Experto en web-app\n');
      logger.info('Gateway principal de AltaMedica (Puerto 3000)\n');
      logger.info('Comandos disponibles:');
      logger.info('  webMCP.getInfo() - Información general');
      logger.info('  webMCP.listFeatures() - Características principales');
      logger.info('  webMCP.showTechStack() - Stack tecnológico');
      logger.info('  webMCP.listKeyFiles() - Archivos importantes');
      logger.info('  webMCP.showRoutes() - Rutas disponibles');
      logger.info('  webMCP.listCommands() - Comandos de desarrollo');
      logger.info('  webMCP.troubleshoot("error") - Resolver problemas');
      logger.info('  webMCP.generateExample("login") - Generar código ejemplo');
      return;
    }

    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('auth') || queryLower.includes('login')) {
      logger.info('\n🔐 Autenticación en web-app:');
      logger.info('1. Usa componentes de src/components/auth/');
      logger.info('2. Firebase Auth configurado en src/lib/firebase.ts');
      logger.info('3. AuthProvider envuelve toda la app');
      logger.info('4. Middleware maneja redirección por roles');
      logger.info('\nEjemplo: webMCP.generateExample("login")');
    }
    
    if (queryLower.includes('3d') || queryLower.includes('three')) {
      logger.info('\n🎮 Componentes 3D:');
      logger.info('1. Medical3DCanvas en src/components/demo/');
      logger.info('2. Modelos .glb en public/models/');
      logger.info('3. Usar React Three Fiber');
      logger.info('4. Lazy loading con dynamic import');
    }
    
    if (queryLower.includes('map') || queryLower.includes('leaflet')) {
      logger.info('\n🗺️ Mapas interactivos:');
      logger.info('1. Importar con dynamic(..., { ssr: false })');
      logger.info('2. Componentes en src/components/marketplace/');
      logger.info('3. Configurar markers y popups');
      logger.info('4. Invalidar size después de mount');
    }
  }

  generateExample(type: string): string {
    switch(type.toLowerCase()) {
      case 'login':
        return `
// Página de login con Firebase Auth
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@altamedica/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await login(email, password);
      // Redirección basada en rol
      switch(user.role) {
        case 'PATIENT': router.push('/patients'); break;
        case 'DOCTOR': router.push('/doctors'); break;
        case 'COMPANY': router.push('/companies'); break;
        default: router.push('/');
      }
    } catch (error) {
      logger.error('Login failed:', error);
    }
  };
  
  return <LoginForm onSubmit={handleLogin} />;
}`;

      case 'protected':
        return `
// Ruta protegida con middleware
import { withAuth } from '@altamedica/auth/middleware';

export default withAuth(
  function ProtectedPage() {
    return <div>Contenido protegido</div>;
  },
  {
    roles: ['DOCTOR', 'ADMIN'],
    redirectTo: '/login'
  }
);`;

      case '3d':
        return `
// Componente 3D con lazy loading
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Medical3DCanvas = dynamic(
  () => import('@/components/demo/Medical3DCanvas'),
  { 
    ssr: false,
    loading: () => <div>Cargando modelo 3D...</div>
  }
);

export default function Demo3D() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Medical3DCanvas 
        model="/models/heart.glb"
        autoRotate
        zoom={1.5}
      />
    </Suspense>
  );
}`;

      case 'map':
        return `
// Mapa interactivo con Leaflet
import dynamic from 'next/dynamic';

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
const MarketplaceMap = dynamic(
  () => import('@/components/marketplace/MarketplaceMap'),
  { ssr: false }
);

export default function MapPage() {
  const locations = [
    { lat: -34.603, lng: -58.381, name: 'Hospital Italiano' },
    { lat: -34.599, lng: -58.373, name: 'Sanatorio Güemes' }
  ];
  
  return (
    <MarketplaceMap 
      center={[-34.603, -58.381]}
      zoom={13}
      locations={locations}
      height="500px"
    />
  );
}`;

      default:
        return 'Tipos disponibles: login, protected, 3d, map';
    }
  }
}

// Exportar instancia singleton
export const webMCP = new WebMCP();