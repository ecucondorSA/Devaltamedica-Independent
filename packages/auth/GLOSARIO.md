# @AltaMedica/Auth - Glosario Alfabético

## 🏷️ Leyenda de Badges

### Runtime Compatibility
- 🏷️ **Edge-safe** - Compatible con Edge Runtime (Vercel Edge, Cloudflare Workers)
- 🔒 **Server-only** - Solo Node.js server (usa APIs de Node)
- 💻 **Client-only** - Solo browser/cliente (componentes React)

### Stability
- 📊 **Stable** - API estable, no cambiará
- 🔄 **Beta** - API puede cambiar en versiones menores
- 🚧 **Experimental** - API inestable, cambios frecuentes
- ⚠️ **Deprecated** - Obsoleto, será removido

### Type
- 📝 **Type** - Tipo TypeScript puro
- 📦 **Enum** - Enumeración TypeScript
- 📦 **Constants** - Constantes exportadas
- ⚛️ **React** - Componente React
- 🪝 **Hook** - React Hook
- 🔧 **Service** - Clase de servicio
- 🛡️ **Middleware** - Middleware function

## 📚 Referencia Rápida de Exports y Tipos

### A
- **@AUTH_COOKIES** - `import { AUTH_COOKIES } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📦 **Constants**
  - Constantes de nombres de cookies estandarizados
  - Ruta: `src/constants/cookies.ts`

- **@AuthContext** - `import { AuthContext } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 💻 **Client**
  - Context de @React para estado de autenticación
  - Ruta: `src/client.ts`

- **@AuthGuard** - `import { AuthGuard } from '@altamedica/auth'`
  - 💻 **Client-only** | 📊 **Stable** | ⚛️ **React**
  - Componente de protección de rutas
  - Ruta: `src/components/index.ts`

- **@AuthGuardProps** - `import { type AuthGuardProps } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Props para componente AuthGuard
  - Ruta: `src/components/index.ts`

- **@AuthProvider** - `import { AuthProvider } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | ⚛️ **React**
  - Provider de @React para autenticación
  - Ruta: `src/client.ts`

- **@AuthResult** - `import { type AuthResult } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Tipo de resultado de autenticación
  - Re-export desde `@altamedica/types`

- **@AuthService** - `import { AuthService } from '@altamedica/auth'`
  - 🔒 **Server-only** | 📊 **Stable** | 🔧 **Service**
  - Servicio principal de autenticación (usa Firebase Admin)
  - Ruta: `src/services/AuthService.ts`

- **@AuthState** - `import { type AuthState } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Estado de autenticación del usuario
  - Ruta: `src/services/AuthService.ts`

- **@AuthToken** - `import { type AuthToken } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Tipo de token de autenticación  
  - Re-export desde `@altamedica/types`

- **@AuthUser** - `import { type AuthUser } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Alias para tipo User de autenticación
  - Ruta: `src/services/AuthService.ts`

- **@authGuard** - `import { authGuard } from '@altamedica/auth'`
  - 🔒 **Server-only** | 📊 **Stable** | 🛡️ **Middleware**
  - Middleware de protección de rutas (Next.js)
  - Ruta: `src/middleware/auth-guard.ts`

### C
- **@createAuthMiddleware** - `import { createAuthMiddleware } from '@altamedica/auth'`
  - 🔒 **Server-only** | 🔄 **Beta** | 🛡️ **Middleware**
  - Factory para crear middleware de autenticación
  - Ruta: `src/middleware/auth-guard.ts`

### G
- **@getAuthService** - `import { getAuthService } from '@altamedica/auth'`
  - 🔒 **Server-only** | 📊 **Stable** | 🔧 **Service**
  - Función para obtener instancia del servicio
  - Ruta: `src/services/AuthService.ts`

### L
- **@LEGACY_AUTH_COOKIES** - `import { LEGACY_AUTH_COOKIES } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | ⚠️ **Deprecated** | 📦 **Constants**
  - Constantes de cookies legacy para @migración
  - Ruta: `src/constants/cookies.ts`

- **@LoginCredentials** - `import { type LoginCredentials } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Tipo para credenciales de @login
  - Ruta: `src/services/AuthService.ts`

### P
- **@ProtectedRoute** - `import { ProtectedRoute } from '@altamedica/auth'`
  - 💻 **Client-only** | 📊 **Stable** | ⚛️ **React**
  - Componente para rutas @protegidas
  - Ruta: `src/components/index.ts`

- **@PublicRoute** - `import { PublicRoute } from '@altamedica/auth'`
  - 💻 **Client-only** | 📊 **Stable** | ⚛️ **React**
  - Componente para rutas @públicas
  - Ruta: `src/components/index.ts`

- **@PublicUserRole** - `import { PublicUserRole } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📦 **Enum**
  - Enum de @roles de usuario públicos
  - Ruta: `src/services/AuthService.ts`

### R
- **@RegisterData** - `import { type RegisterData } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Tipo para datos de @registro
  - Ruta: `src/services/AuthService.ts`

- **@RouteGuard** - `import { RouteGuard } from '@altamedica/auth'`
  - 💻 **Client-only** | 📊 **Stable** | ⚛️ **React**
  - Componente guardian de rutas
  - Ruta: `src/components/index.ts`

### U
- **@User** - `import { type User } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Tipo de usuario principal
  - Ruta: `src/services/AuthService.ts`

- **@UserRole** - `import { UserRole } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 📦 **Enum**
  - Enum de @roles de usuario
  - Re-export desde `@altamedica/types`

- **@useAuth** - `import { useAuth } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 🪝 **Hook**
  - Hook principal de autenticación
  - Ruta: `src/client.ts`

- **@useProtectedRoute** - `import { useProtectedRoute } from '@altamedica/auth'`
  - 💻 **Client-only** | 📊 **Stable** | 🪝 **Hook**
  - Hook para rutas @protegidas
  - Ruta: `src/client.ts`

- **@useRequireAuth** - `import { useRequireAuth } from '@altamedica/auth'`
  - 💻 **Client-only** | 📊 **Stable** | 🪝 **Hook**
  - Hook que requiere autenticación
  - Ruta: `src/client.ts`

- **@useRole** - `import { useRole } from '@altamedica/auth'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | 🪝 **Hook**
  - Hook para manejo de @roles
  - Ruta: `src/client.ts`

## 🔗 Imports de Utilidades Adicionales

### MFA (Multi-Factor Authentication)
```typescript
// Todas las utilidades @MFA exportadas desde src/mfa.ts
import { /* MFA utilities */ } from '@altamedica/auth';
```

### Redirects
```typescript  
// Todas las utilidades de redirección desde src/utils/redirects.ts
import { /* redirect utilities */ } from '@altamedica/auth';
```

## 📋 Resumen de Patrones de Import

```typescript
// ✅ Imports recomendados
import { AuthProvider, useAuth, AuthService } from '@altamedica/auth';
import { type AuthState, type User } from '@altamedica/auth';

// ✅ Import de componentes
import { AuthGuard, ProtectedRoute } from '@altamedica/auth';

// ✅ Import de middleware
import { authGuard, createAuthMiddleware } from '@altamedica/auth';

// ✅ Import de constantes
import { AUTH_COOKIES } from '@altamedica/auth';
```

## 🎯 Casos de Uso Comunes

### Setup básico de autenticación
```typescript
import { AuthProvider, useAuth } from '@altamedica/auth';
```

### Protección de rutas
```typescript
import { AuthGuard, ProtectedRoute } from '@altamedica/auth';
```

### Middleware de Next.js
```typescript
import { authGuard } from '@altamedica/auth';
```

### Servicios de backend
```typescript
import { AuthService, getAuthService } from '@altamedica/auth';
```

## 🚨 ERRORES COMUNES Y SOLUCIONES

### ⚠️ Error: LoggerService requires data parameter
```typescript
// ❌ INCORRECTO
logger.info('User logged in');
logger.error('Authentication failed');

// ✅ CORRECTO
logger.info('User logged in', { userId: user.id });
logger.error('Authentication failed', { error: error.message });

// 📍 Archivos afectados frecuentemente:
// - src/services/mfa.service.ts
// - src/firebase-admin.ts
// - src/context/AuthContext.tsx
```

### ⚠️ Error: UserRole enum usage
```typescript
// ❌ INCORRECTO
const role = 'ADMIN';
if (user.role === 'DOCTOR') { }

// ✅ CORRECTO
import { UserRole } from '@altamedica/types';
const role = UserRole.ADMIN;
if (user.role === UserRole.DOCTOR) { }

// 📍 Siempre usar el enum, nunca strings literales
```

### ⚠️ Error: Cannot find module '@altamedica/shared/config/environment'
```typescript
// ❌ INCORRECTO - Deep import no permitido
import { Environment } from '@altamedica/shared/config/environment';

// ✅ CORRECTO - Usar exports oficiales
import { Environment } from '@altamedica/shared';
// o si no está exportado, usar:
const Environment = process.env;
```

### ⚠️ Error: createSSOMiddleware is not exported
```typescript
// ❌ INCORRECTO - Export renombrado
import { createSSOMiddleware } from '@altamedica/auth';

// ✅ CORRECTO - Usar el nombre actual
import { createAuthMiddleware } from '@altamedica/auth';
```

## 🏷️ COMPATIBILIDAD DE RUNTIME

### Edge Runtime Compatible ✅
- `@AuthContext` - 🏷️ **Edge-safe** (no usa Node.js APIs)
- `@AuthProvider` - 🏷️ **Edge-safe** 
- `@useAuth` - 🏷️ **Edge-safe**
- `@LoginCredentials` - 🏷️ **Edge-safe** (tipo puro)
- `@RegisterData` - 🏷️ **Edge-safe** (tipo puro)
- `@User` - 🏷️ **Edge-safe** (tipo puro)
- `@UserRole` - 🏷️ **Edge-safe** (enum)

### Server-only 🔒
- `@AuthService` - 🔒 **Server-only** (usa Firebase Admin SDK)
- `@createAuthMiddleware` - 🔒 **Server-only** (middleware de servidor)
- `@authGuard` - 🔒 **Server-only** (middleware de servidor)
- `@getAuthService` - 🔒 **Server-only** (instancia de servicio)
- Cualquier función que use `firebase-admin`

### Client-only 💻
- `@AuthGuard` - 💻 **Client-only** (componente React)
- `@ProtectedRoute` - 💻 **Client-only** (componente React)
- `@PublicRoute` - 💻 **Client-only** (componente React)
- `@RouteGuard` - 💻 **Client-only** (componente React)

## 📊 ESTABILIDAD DE APIs

- **@AuthProvider** - 📊 **Stable** (v1.0+)
- **@useAuth** - 📊 **Stable** (v1.0+)
- **@AuthService** - 📊 **Stable** (v1.0+)
- **@createAuthMiddleware** - 🔄 **Beta** (puede cambiar en v2.0)
- **MFA utilities** - 🚧 **Experimental** (API en desarrollo)