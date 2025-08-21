# 🔐 UnifiedAuthSystem - Documentación API

## 📋 Resumen

El **UnifiedAuthSystem** es el sistema de autenticación consolidado de AltaMedica que unifica 9 implementaciones previas en una sola API coherente. Proporciona autenticación JWT + Firebase, SSO, control de roles y permisos granulares.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Client Request │───▶│ UnifiedAuth      │───▶│ Route Handler   │
│  (with JWT)     │    │ Middleware       │    │ (authorized)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ UnifiedAuthService│
                       │ - JWT validation │
                       │ - Firebase Auth  │
                       │ - Role checking  │
                       │ - Permission mgmt│
                       └──────────────────┘
```

## 🎯 Clases Principales

### UnifiedAuthService

Servicio principal que maneja toda la lógica de autenticación.

#### Métodos Estáticos

```typescript
// Generación de tokens
static generateAuthToken(user: Partial<AuthToken>, expiresIn?: string): string
static generateRefreshToken(userId: string): string

// Verificación de tokens  
static async verifyAuthToken(token: string): Promise<AuthToken | null>
static async verifyRefreshToken(token: string): Promise<string | null>
static async verifyFirebaseToken(idToken: string): Promise<DecodedIdToken | null>

// SSO y autenticación
static async ssoLogin(data: SSOLoginRequest): Promise<SSOLoginResponse>
static async refreshToken(refreshToken: string): Promise<SSOLoginResponse>
static async logout(userId: string): Promise<{success: boolean; error?: string}>
static async getUserProfile(userId: string): Promise<AuthToken | null>
```

### UnifiedAuth Middleware

Middleware principal para validación de rutas API.

```typescript
async function UnifiedAuth(
  request: NextRequest, 
  requiredRoles?: UserRole[] | 'any'
): Promise<AuthResult>
```

## 📚 Tipos y Interfaces

### UserRole Enum

```typescript
enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient', 
  COMPANY = 'company',
  STAFF = 'staff'
}
```

### AuthToken Interface

```typescript
interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  firebaseUid?: string;
  permissions?: string[];
  patientId?: string;
  doctorId?: string;
  companyId?: string;
  firstName?: string;
  lastName?: string;
  exp: number;
  iat?: number;
}
```

### SSOLoginRequest/Response

```typescript
interface SSOLoginRequest {
  email: string;
  password?: string;
  idToken?: string; // Firebase ID token
  rememberMe?: boolean;
}

interface SSOLoginResponse {
  success: boolean;
  user?: AuthToken;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}
```

## 🚀 Uso en API Routes

### Ejemplo Básico

```typescript
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';

export async function GET(request: NextRequest) {
  // Verificar autenticación básica
  const authResult = await UnifiedAuth(request);
  
  if (!authResult.success) {
    return authResult.response; // 401/403 response
  }

  // Usuario autenticado disponible
  const user = authResult.user!;
  
  return NextResponse.json({ 
    message: `Hello ${user.email}`,
    role: user.role 
  });
}
```

### Control de Roles

```typescript
export async function POST(request: NextRequest) {
  // Solo doctores y admins
  const authResult = await UnifiedAuth(request, [UserRole.DOCTOR, UserRole.ADMIN]);
  
  if (!authResult.success) {
    return authResult.response;
  }

  // Lógica específica para doctores/admins
  return NextResponse.json({ authorized: true });
}
```

### Usando HOCs (High-Order Components)

```typescript
import { withAuth, withRole, UserRole } from '@/auth/UnifiedAuthSystem';

// Cualquier usuario autenticado
export const GET = withAuth(async (request, { user }) => {
  return NextResponse.json({ user: user.email });
});

// Solo doctores
export const POST = withRole([UserRole.DOCTOR], async (request, { user }) => {
  return NextResponse.json({ doctorAction: true });
});
```

## 🔧 Configuración de Permisos

### Permisos por Defecto por Rol

```typescript
const routePermissions = {
  '/api/v1/patients': { 
    roles: [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN] 
  },
  '/api/v1/prescriptions': { 
    roles: [UserRole.DOCTOR], 
    permissions: ['prescriptions:write'] 
  },
  '/api/v1/admin': { 
    roles: [UserRole.ADMIN] 
  }
};
```

### Verificación de Permisos Personalizados

```typescript
import { createAuthContext } from '@/auth/UnifiedAuthSystem';

export async function PUT(request: NextRequest) {
  const authResult = await UnifiedAuth(request);
  if (!authResult.success) return authResult.response;

  const authContext = createAuthContext(authResult.user!);
  
  if (!authContext.hasPermission('medical:write')) {
    return NextResponse.json(
      { error: 'Insufficient permissions' }, 
      { status: 403 }
    );
  }

  // Proceder con operación médica
}
```

## 🔐 Manejo de SSO

### Login con Firebase ID Token

```typescript
import { UnifiedAuthService } from '@/auth/UnifiedAuthSystem';

export async function POST(request: NextRequest) {
  const { email, idToken, rememberMe } = await request.json();
  
  const result = await UnifiedAuthService.ssoLogin({
    email,
    idToken,
    rememberMe
  });
  
  if (result.success) {
    return NextResponse.json({
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    });
  }
  
  return NextResponse.json(
    { error: result.error }, 
    { status: 400 }
  );
}
```

### Refresh Token

```typescript
export async function POST(request: NextRequest) {
  const { refreshToken } = await request.json();
  
  const result = await UnifiedAuthService.refreshToken(refreshToken);
  
  return NextResponse.json(result);
}
```

## 🛡️ Características de Seguridad

### Headers de Seguridad Automáticos

Todas las respuestas incluyen headers de seguridad:

```typescript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', 
  'X-XSS-Protection': '1; mode=block',
  'Cache-Control': 'no-store'
}
```

### Rate Limiting Integrado

El sistema incluye validaciones automáticas:
- Verificación de estructura de token
- Validación de usuario activo
- Checking de expiración
- Verificación de rol y permisos

### Auditoría HIPAA

```typescript
// Todas las operaciones se registran automáticamente
await UnifiedAuthService.ssoLogin(loginData); // ✅ Auto-logged
```

## 🔄 Migration Guide

### Desde auth.ts legacy

```typescript
// ❌ ANTES
import { verifyAuthToken, UserRole } from '../lib/auth';

// ✅ DESPUÉS  
import { UnifiedAuth, UserRole } from '../auth/UnifiedAuthSystem';
```

### Desde middleware separados

```typescript
// ❌ ANTES
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';

// ✅ DESPUÉS
import { UnifiedAuth, withRole } from '../auth/UnifiedAuthSystem';
```

## ⚠️ Consideraciones Importantes

### Variables de Entorno Requeridas

```env
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-token-secret
FIREBASE_PROJECT_ID=your-firebase-project
```

### Compatibilidad

- ✅ **Backward Compatible**: Archivos legacy actúan como proxies
- ✅ **Gradual Migration**: Migra endpoints uno por uno
- ✅ **Type Safety**: TypeScript estricto en toda la API

### Performance

- 🚀 **Single Source**: Una sola implementación vs 9 duplicadas
- 🚀 **Cached Validation**: JWT verification optimizada
- 🚀 **Efficient Queries**: Consultas Firebase optimizadas

## 📊 Métricas y Monitoring

El sistema incluye logging automático para:
- Login attempts (exitosos y fallidos)
- Token generation y refresh
- Permission denials
- Role changes

## 🧪 Testing

```typescript
import { UnifiedAuthService, UserRole } from '@/auth/UnifiedAuthSystem';

describe('UnifiedAuthSystem', () => {
  it('should generate valid JWT tokens', () => {
    const token = UnifiedAuthService.generateAuthToken({
      userId: 'test-user',
      email: 'test@example.com',
      role: UserRole.PATIENT
    });
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });
});
```

---

## 📞 Support

Para soporte técnico o preguntas sobre la implementación, contacta al equipo de desarrollo AltaMedica.

**Esta documentación cubre el 100% de la funcionalidad del UnifiedAuthSystem consolidado.**