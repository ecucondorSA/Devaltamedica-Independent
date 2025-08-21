# 🌐 AltaMedica Web App

**Puerto:** 3000 | **Tipo:** Aplicación Web Principal | **Framework:** Next.js

## ⚠️ REGLA FUNDAMENTAL: USAR PACKAGES CENTRALIZADOS

### 🚫 **LO QUE NO DEBES HACER:**
```typescript
// ❌ NUNCA crear componentes que ya existen
export function LandingHero() {
  // Ya existe en @altamedica/ui - PROHIBIDO
}

// ❌ NUNCA implementar autenticación duplicada
export function LoginForm() {
  // Ya existe en @altamedica/auth - PROHIBIDO  
}

// ❌ NUNCA crear utilidades que ya existen
export function formatDate() {
  // Ya existe en @altamedica/utils - PROHIBIDO
}
```

### ✅ **LO QUE SÍ DEBES HACER:**
```typescript
// ✅ SIEMPRE importar desde packages centralizados
import { useAuth, usePublicData } from '@altamedica/hooks';
import { formatDate, formatCurrency } from '@altamedica/utils';
import { Hero, FeatureCard, AuthModal } from '@altamedica/ui';
import { PublicService, ContactForm } from '@altamedica/types';
```

## 📦 **PASO 1: REVISAR PACKAGES DISPONIBLES**

**ANTES de escribir cualquier código, verifica estos packages:**

### 🪝 Hooks Públicos (`@altamedica/hooks`)
```bash
# Ver hooks públicos disponibles
cd ../../packages/hooks/src/public
ls -la

# Hooks para web pública:
# - usePublicData, useContactForm, useNewsletterSignup
# - useServiceSearch, useLocationFinder, usePricingCalculator
# - useAuth (para login/registro), useGuestMode
```

### 🎨 Componentes UI Públicos (`@altamedica/ui`)
```bash
# Ver componentes públicos disponibles
cd ../../packages/ui/src/public
ls -la

# Componentes para landing:
# - Hero, FeatureSection, TestimonialCarousel
# - PricingTable, ContactForm, Newsletter
# - ServiceShowcase, TeamSection, FAQ
```

### 🌐 Componentes Web (`@altamedica/web-components`)
```bash
# Ver componentes específicos web disponibles
cd ../../packages/web-components/src
ls -la

# Componentes web específicos:
# - LandingPage, AboutUs, Services
# - Blog, Resources, Legal
# - SEO, Analytics, Social
```

### 🔧 Utilidades Web (`@altamedica/utils`)
```bash
# Ver utilidades web disponibles
cd ../../packages/utils/src/web
ls -la

# Utilidades web:
# - SEO helpers, Analytics trackers
# - Form validators, URL builders
# - Cookie management, A/B testing
```

## 🚀 **Configuración de Desarrollo**

### Instalación
```bash
pnpm install
```

### Desarrollo
```bash
pnpm dev  # Puerto 3000
```

### Build
```bash
pnpm build
```

## 🏗️ **Arquitectura de la Web App**

```
src/
├── app/                 # Next.js 13+ App Router
│   ├── (marketing)/     # Rutas de marketing público
│   ├── (auth)/          # Rutas de autenticación
│   └── (dashboard)/     # Dashboard post-login
├── components/          # Componentes ESPECÍFICOS de la web app
│   ├── landing/         # Landing específico de AltaMedica
│   ├── onboarding/      # Proceso de onboarding único
│   └── redirects/       # Lógica de redirección específica
├── hooks/               # Solo hooks ESPECÍFICOS de web app
│   └── useWebAppOnly.ts   # SOLO si no existe en packages
├── lib/                 # Configuración específica web
└── services/            # Servicios específicos de marketing web
```

## ✅ **Checklist Antes de Desarrollar**

### 📋 **OBLIGATORIO - Verificar Web Packages Primero:**
- [ ] ¿El hook ya existe en `@altamedica/hooks`?
- [ ] ¿El componente ya existe en `@altamedica/ui` o `@altamedica/web-components`?
- [ ] ¿La utilidad ya existe en `@altamedica/utils`?
- [ ] ¿El tipo ya existe en `@altamedica/types`?

### 📋 **Solo si NO existe en packages:**
- [ ] ¿Es específico de la experiencia web pública?
- [ ] ¿No puede ser reutilizado por otras apps?
- [ ] ¿Está documentado por qué es específico de web-app?

## 🎯 **Funcionalidades Específicas de la Web App**

### Landing Page de AltaMedica
- **Hero section con propuesta de valor única**
- **Showcase de servicios médicos**
- **Testimonios y casos de éxito**
- **Call-to-actions optimizados para conversión**

### Onboarding Inteligente
```typescript
// ✅ CORRECTO - Onboarding específico de AltaMedica
export function SmartOnboarding() {
  const { userType, preferences, redirectPath } = useOnboardingFlow();
  
  return (
    <div>
      <UserTypeSelector onSelect={setUserType} />
      <PreferencesWizard type={userType} />
      <RedirectHandler path={redirectPath} />
    </div>
  );
}
```

### Sistema de Redirección Inteligente
```typescript
// ✅ CORRECTO - Redirección específica basada en roles
export function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();
  const redirect = useSmartRedirect();
  
  useEffect(() => {
    if (!isLoading && user) {
      redirect.toOptimalDashboard(user.role, user.preferences);
    }
  }, [user, isLoading]);
  
  return <RedirectingLoader />; // De @altamedica/ui
}
```

## 🔗 **Dependencies Principales**

```json
{
  "@altamedica/hooks": "workspace:*",
  "@altamedica/ui": "workspace:*",
  "@altamedica/web-components": "workspace:*", 
  "@altamedica/utils": "workspace:*",
  "@altamedica/types": "workspace:*",
  "@altamedica/auth": "workspace:*"
}
```

## 📊 **Funcionalidades Principales**

### Marketing y Conversión
- **Landing pages optimizadas para SEO**
- **A/B testing de elementos clave**
- **Lead capture y nurturing**
- **Analytics y tracking de conversión**

### Experiencia de Usuario Pública
```typescript
// ✅ CORRECTO - Experiencia pública optimizada
export function PublicExperience() {
  const { services, pricing, testimonials } = usePublicData();
  
  return (
    <div>
      <Hero /> {/* De @altamedica/ui */}
      <ServiceShowcase services={services} />
      <PricingSection pricing={pricing} />
      <TestimonialCarousel testimonials={testimonials} />
    </div>
  );
}
```

### Portal de Acceso Unificado
```typescript
// ✅ CORRECTO - Portal unificado para acceder a diferentes roles
export function UnifiedAccessPortal() {
  const { availableRoles, loginOptions } = useAccessPortal();
  
  return (
    <div>
      <RoleSelector roles={availableRoles} />
      <LoginOptions options={loginOptions} />
      <GuestModeOption /> {/* Para explorar sin registro */}
    </div>
  );
}
```

## 🛡️ **Autenticación y Acceso**

### Auth Gateway
```typescript
// ✅ CORRECTO - Gateway centralizado de autenticación
import { useAuth, AuthProvider } from '@altamedica/auth';

export function AuthGateway({ children }) {
  return (
    <AuthProvider>
      <RouteGuard>
        {children}
      </RouteGuard>
    </AuthProvider>
  );
}
```

### Guest Mode y Demo
```typescript
// ✅ CORRECTO - Modo invitado para explorar funcionalidades
export function GuestModeDemo() {
  const { demoData, limitations } = useGuestMode();
  
  return (
    <div>
      <DemoNotification limitations={limitations} />
      <LimitedFeatureSet data={demoData} />
      <ConversionPrompts /> {/* Invitar a registrarse */}
    </div>
  );
}
```

## 🎨 **UI/UX Optimizada para Web Pública**

### Tema de Marketing
```typescript
// ✅ CORRECTO - Tema específico para web pública
export const marketingTheme = {
  colors: {
    primary: '#0369a1',     // Azul médico confiable
    secondary: '#059669',   // Verde salud
    accent: '#7c3aed',      // Púrpura tecnología
    neutral: '#64748b'      // Gris profesional
  },
  marketing: {
    hero: '#1e40af',
    features: '#0ea5e9',
    testimonials: '#10b981',
    cta: '#dc2626'
  }
};
```

### Responsive y Mobile-First
```typescript
// ✅ CORRECTO - Design responsive optimizado
export function ResponsiveLandingLayout() {
  return (
    <div className="min-h-screen">
      <MobileHeader /> {/* Específico para mobile */}
      <DesktopNavigation /> {/* Específico para desktop */}
      <ResponsiveHero />
      <AdaptiveContent />
    </div>
  );
}
```

## 📈 **SEO y Performance**

### SEO Optimizado
```typescript
// ✅ CORRECTO - SEO específico para web pública
import { SEOMetadata, StructuredData } from '@altamedica/web-components';

export function SEOOptimizedPage({ page }) {
  return (
    <div>
      <SEOMetadata 
        title={page.title}
        description={page.description}
        keywords={page.keywords}
      />
      <StructuredData 
        type="MedicalOrganization"
        data={page.structuredData}
      />
    </div>
  );
}
```

### Performance Web
```typescript
// ✅ CORRECTO - Optimizaciones específicas para web pública
const LandingHero = lazy(() => import('./components/LandingHero'));
const TestimonialSection = lazy(() => import('./components/TestimonialSection'), {
  ssr: false // No crítico para first paint
});
```

## 🚨 **Code Review Checklist Web**

### ❌ **Rechazar PR si:**
- Implementa componentes que ya existen en packages
- No considera SEO y performance web
- Duplica lógica de autenticación
- No es responsive o mobile-friendly
- No justifica por qué es específico de web-app

### ✅ **Aprobar PR si:**
- Usa packages centralizados
- Optimiza SEO y performance
- Es completamente responsive
- Incluye analytics apropiados
- Está bien documentado para marketing web

## 📊 **Analytics y Tracking**

### Google Analytics y Tracking
```typescript
// ✅ CORRECTO - Analytics específicos para web pública
import { useAnalytics, trackConversion } from '@altamedica/utils';

export function ConversionTracking() {
  const { trackEvent } = useAnalytics();
  
  const handleSignupClick = () => {
    trackEvent('signup_click', {
      source: 'landing_hero',
      user_type: 'potential_patient'
    });
    
    trackConversion('signup_started');
  };
  
  return (
    <button onClick={handleSignupClick}>
      Comenzar Ahora
    </button>
  );
}
```

### A/B Testing
```typescript
// ✅ CORRECTO - A/B testing para optimización de conversión
export function ABTestingProvider({ children }) {
  const { variant, trackExperiment } = useABTesting('landing_hero_v2');
  
  return (
    <div data-variant={variant}>
      {children}
    </div>
  );
}
```

## 🌐 **Integración con Diferentes Portales**

### Portal Selector
```typescript
// ✅ CORRECTO - Selector inteligente de portales
export function PortalSelector() {
  const { user, preferences } = useAuth();
  
  const getOptimalPortal = () => {
    if (user?.role === 'doctor') return '/doctors';
    if (user?.role === 'patient') return '/patients';
    if (user?.role === 'company') return '/companies';
    if (user?.role === 'admin') return '/admin';
    
    return '/dashboard'; // Portal genérico
  };
  
  return (
    <RedirectHandler to={getOptimalPortal()} />
  );
}
```

## 🧪 **Testing Web Específico**

### Tests de Conversión
```bash
# Tests de landing y conversión
pnpm test:conversion

# Tests de SEO
pnpm test:seo

# Tests de performance web
pnpm test:lighthouse

# Tests E2E de flujos web críticos
pnpm test:e2e:web-conversion
```

### Cypress Tests Web
```typescript
// ✅ Tests específicos del flujo web
describe('Web App Conversion Flow', () => {
  it('should convert visitors to registered users', () => {
    // Test del funnel de conversión completo
  });
  
  it('should redirect users to correct portal based on role', () => {
    // Test de redirección inteligente
  });
  
  it('should track all conversion events', () => {
    // Test de analytics y tracking
  });
});
```

## 📱 **PWA y Mobile Experience**

### Progressive Web App
```typescript
// ✅ CORRECTO - PWA específica para web app
export function PWAFeatures() {
  return (
    <div>
      <ServiceWorkerProvider />
      <OfflineIndicator />
      <InstallPrompt />
      <NotificationManager />
    </div>
  );
}
```

## 🎯 **Conversión y Lead Generation**

### Lead Capture Forms
```typescript
// ✅ CORRECTO - Forms optimizados para conversión
export function LeadCaptureForm() {
  const { submitLead, isLoading } = useLeadCapture();
  
  return (
    <form onSubmit={submitLead}>
      <OptimizedFormFields />
      <ConversionButton loading={isLoading}>
        Obtener Consulta Gratuita
      </ConversionButton>
    </form>
  );
}
```

### Nurturing Campaigns
```typescript
// ✅ CORRECTO - Campaigns específicos del funnel web
export function NurturingCampaigns() {
  const { userJourney, nextStep } = useLeadNurturing();
  
  return (
    <div>
      <PersonalizedContent journey={userJourney} />
      <NextStepRecommendation step={nextStep} />
    </div>
  );
}
```

---

## 🎯 **RECUERDA:**
> **"CONVERSIÓN PRIMERO, FEATURES DESPUÉS"**
> 
> El objetivo principal de la web app es convertir visitantes en usuarios registrados de la plataforma.

## 📞 **Soporte Web**

- **Marketing Documentation:** `../../packages/web-*/README.md`
- **SEO Guidelines:** Documentación de SEO
- **Conversion Analytics:** Dashboard de conversión
- **A/B Testing:** Panel de experimentos