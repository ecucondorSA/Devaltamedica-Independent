# 🌐 Web App - Gateway Principal de AltaMedica

## 🤖 FRAGMENTOS PARA AUTOCOMPLETADO WEB APP

### ✅ Script Start (Next.js Landing)
```javascript
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
```

### ✅ Contact Form Pattern
```javascript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const result = ContactFormSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid form data' });
  }
}
```

### ✅ Lead Capture Schema
```javascript
const ContactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(10),
  type: z.enum(['demo', 'pricing', 'support', 'partnership'])
});
```

### ✅ Test Web App Endpoint
```javascript
const testWebAppEndpoint = async (endpoint) => {
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    type: 'demo'
  };
  
  try {
    const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};
```

---


**Aplicación**: Gateway de entrada y autenticación centralizada  
**Puerto**: 3000  
**Estado**: 🟢 PRODUCCIÓN (9.2/10)  
**Última actualización**: 20 de agosto de 2025

## 🌳 WORKTREE PARA WEB APP

- **Para auditar**: usar `../devaltamedica-audit/`
- **Para conectar features**: usar `../devaltamedica-integrate/`
- **Para validar**: usar `../devaltamedica-validate/`
- **Regla**: Las features web YA EXISTEN - solo necesitan integración

## 🎯 Propósito y Arquitectura

**Web App** es el **punto de entrada único** para toda la plataforma AltaMedica. Funciona como:

1. **Landing page pública** con información médica
2. **Sistema de autenticación SSO** centralizado
3. **Router inteligente** que dirige usuarios según su rol
4. **Portal de demos** y funcionalidades interactivas

### Redirección por Roles

```
Usuario → /login → Web App (3000) → Redirección:
├── PATIENT → Patients App (3003)
├── DOCTOR → Doctors App (3002)
├── COMPANY → Companies App (3004)
└── ADMIN → Admin App (3005)
```

## 🏗️ Estructura del Proyecto

```
C:\Users\Eduardo\Documents\devaltamedica\apps\web-app\
├── 📁 src\
│   ├── 📁 app\                    # Next.js App Router
│   │   ├── 📁 auth\               # Sistema de autenticación
│   │   │   ├── login\             # Login SSO
│   │   │   ├── register\          # Registro de usuarios
│   │   │   ├── forgot-password\   # Recuperación
│   │   │   └── verify-email\      # Verificación
│   │   │
│   │   ├── 📁 api\                # Endpoints API
│   │   │   ├── health\            # Monitoreo de salud
│   │   │   └── font-css\          # Optimización CSS
│   │   │
│   │   ├── page.tsx               # Homepage principal
│   │   ├── layout.tsx             # Layout global
│   │   ├── providers.tsx          # Providers React
│   │   └── middleware.ts          # Middleware Next.js
│   │
│   ├── 📁 components\
│   │   ├── 📁 auth\               # Autenticación
│   │   │   ├── UnifiedAuthSystem.tsx  # Sistema principal (USAR ESTE)
│   │   │   ├── LoginForm.tsx      # Formulario login
│   │   │   └── RouteGuard.tsx     # Protección rutas
│   │   │
│   │   ├── 📁 home\               # Página principal
│   │   │   ├── HeroSection.tsx    # Sección hero
│   │   │   ├── VideoCarouselOptimized.tsx  # Videos optimizados
│   │   │   └── ServicesGrid.tsx   # Grid de servicios
│   │   │
│   │   ├── 📁 layout\             # Sistema layout
│   │   │   ├── Header.tsx         # Header navegación
│   │   │   ├── Footer.tsx         # Footer
│   │   │   └── Container.tsx      # Container responsive
│   │   │
│   │   └── 📁 marketplace\        # Mapas marketplace
│   │       └── UnifiedMarketplaceMap.tsx  # Mapa principal
│   │
│   ├── 📁 config\                 # Configuraciones
│   │   ├── auth-config.ts         # Config autenticación
│   │   ├── firebase.ts            # Config Firebase
│   │   └── app-urls.ts            # URLs aplicación
│   │
│   ├── 📁 services\               # Servicios
│   │   ├── redirect-service.ts    # Servicio redirección
│   │   ├── firebase-chat.ts       # Chat Firebase
│   │   └── analytics.ts           # Analytics
│   │
│   └── 📁 hooks\                  # Hooks personalizados
│       ├── useFirebase.ts         # Hook Firebase
│       ├── useRedirection.ts      # Hook redirección
│       └── useHydrationSafe.ts    # SSR seguro
│
├── 📁 public\                     # Assets estáticos
│   ├── videos\                    # Videos demostración
│   ├── models\                    # Modelos 3D
│   └── icons\                     # Iconos PWA
│
├── next.config.mjs                # Configuración Next.js
├── middleware.ts                  # Middleware global
└── package.json                   # Dependencias
```

## 🔑 Funcionalidades Principales

### 1. Sistema de Autenticación SSO

- **Login unificado** con Firebase Auth
- **Google OAuth** integrado
- **JWT tokens** con cookies HttpOnly
- **MFA** (Multi-Factor Authentication)
- **Recuperación de contraseña**

### 2. Landing Page Optimizada

- **Performance mejorada** 75% en Core Web Vitals
- **SEO completo** con JSON-LD Schema
- **Accesibilidad WCAG** 2.2 AA compliant
- **PWA ready** con manifest optimizado
- **Videos lazy loading** con Intersection Observer

### 3. Marketplace Interactivo

- **Mapa Leaflet** con ubicaciones médicas
- **SSR-safe** con dynamic imports
- **Filtros avanzados** por especialidad
- **Geolocalización** automática

### 4. Sistema de Redirección Inteligente

- **Middleware optimizado** con cache de tokens
- **Fallback cookies** múltiples
- **Parsing defensivo** de JWT
- **Redirección por rol** automática

## 📦 Stack Tecnológico

### Core Framework

- **Next.js 15.3.4** con App Router
- **React 19.0.0** con Concurrent Features
- **TypeScript 5.8.3** estricto

### UI y Styling

- **Tailwind CSS** con preset médico
- **Framer Motion** para animaciones
- **Radix UI** para componentes accesibles

### Backend Integration

- **Firebase 10.0.0** (Auth, Firestore, Storage)
- **TanStack Query** para estado servidor
- **Axios** para cliente HTTP

### Performance y Monitoring

- **Sentry** para error tracking
- **Web Vitals** monitoring automático
- **Google Analytics** integrado

## 🚀 Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev                    # Puerto 3000

# Build y Producción
pnpm build                  # Build optimizado
pnpm start                  # Servidor producción

# Testing
pnpm playwright:install     # E2E tests
pnpm exec playwright test   # Ejecutar tests
```

## 🔐 Configuración de Seguridad

### Variables de Entorno Requeridas

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx

# APIs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=xxx
```

### Middleware de Seguridad

- **Rate limiting** por IP
- **CORS headers** configurados
- **CSP policies** HIPAA compliant
- **XSS protection** habilitado

## 🎨 Sistema de Diseño

### Componentes Principales

```typescript
// Autenticación
import { UnifiedAuthSystem } from '@/components/auth';

// Layout
import { Header, Footer, Container } from '@/components/layout';

// Home
import { HeroSection, VideoCarouselOptimized } from '@/components/home';

// Marketplace
import { UnifiedMarketplaceMap } from '@/components/marketplace';
```

### Tema Médico

- **Colores primarios**: AltaMedica Blue (#0066CC)
- **Colores secundarios**: Medical Green (#00AA66)
- **Tipografía**: Inter para UI, Merriweather para contenido
- **Iconografía**: Heroicons + iconos médicos personalizados

## 🧪 Testing y Calidad

### E2E Tests con Playwright

```bash
# Tests críticos implementados
- Flujo de login completo
- Redirección por roles
- Navegación marketplace
- Formularios médicos
- Responsive design
```

### Métricas de Performance

- **LCP**: <2.5s
- **FID**: <100ms
- **CLS**: <0.1
- **Coverage**: 85%+ en tests críticos

## 🔄 Integraciones

### API Backend

- **Base URL**: `http://localhost:3001`
- **Autenticación**: Bearer tokens via cookies
- **Endpoints**: `/api/v1/*` del api-server

### Apps Conectadas

- **Patients** (3003): Portal pacientes
- **Doctors** (3002): Portal médicos
- **Companies** (3004): Portal empresas
- **Admin** (3005): Panel administración

## 🚨 Problemas Conocidos y Soluciones

### 1. Hydration Mismatch

```typescript
// Solución con hook seguro
const isHydrated = useHydrationSafe();
if (!isHydrated) return <LoadingScreen />;
```

### 2. Leaflet en SSR

```typescript
// Dynamic import para componentes map
const Map = dynamic(() => import('./Map'), { ssr: false });
```

### 3. Bundle Size Optimization

- Lazy loading implementado
- Code splitting en rutas
- Tree shaking habilitado
- Bundle size reducido 43%

## 📊 Métricas Actuales

### Performance

- **Bundle size**: 1.6MB (reducido desde 2.8MB)
- **Load time**: <2s en 3G
- **Lighthouse score**: 95+ en todas las métricas

### SEO y Accesibilidad

- **Google PageSpeed**: 95/100
- **WCAG compliance**: AA level
- **PWA score**: 90/100

## 🔄 Cambios Recientes

### Migración ESM (2025-08-20)

- `next.config.mjs` como archivo principal
- `next.config.js` como puente de compatibilidad
- Preparación para Next.js 15

### Optimizaciones Performance (2025-08-17)

- **VideoCarouselOptimized**: Intersection Observer + lazy loading
- **WebVitalsReporter**: Monitoreo automático Core Web Vitals
- **JsonLdSchema**: SEO estructurado completo

### Unificación Home Page (2025-08-16)

- Eliminadas variantes duplicadas (`page.new.tsx`, `page-optimized.tsx`)
- Constantes centralizadas en `src/constants/homePage.ts`
- Única fuente de verdad en `app/page.tsx`

### Seguridad HIPAA (2025-08-15)

- Headers de seguridad unificados
- Cookies HttpOnly/Secure obligatorias
- Auditoría completa de middleware

## 🎯 Próximas Mejoras

### Funcionalidad

- [ ] Implementar ISR para páginas estáticas
- [ ] Optimizar bundle con webpack analyzer
- [ ] Mejorar skeleton loaders

### UX/UI

- [ ] Animations más fluidas con Framer Motion
- [ ] Dark mode toggle
- [ ] Mejor feedback visual en formularios

### Performance

- [ ] Service Worker para cache avanzado
- [ ] Optimistic UI updates
- [ ] Prefetch inteligente de rutas

**Esta aplicación es el corazón del ecosistema AltaMedica, proporcionando una puerta de entrada segura, rápida y accesible para todos los usuarios de la plataforma médica.**
