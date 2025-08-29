# 🛡️ Admin App - Panel de Superadministrador AltaMedica

## 🤖 FRAGMENTOS PARA AUTOCOMPLETADO ADMIN

### ✅ Script Start (Next.js Admin)
```javascript
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
```

### ✅ Admin Auth Pattern
```javascript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  
  if (!['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
}
```

### ✅ System Monitoring Schema
```javascript
const SystemHealthSchema = z.object({
  services: z.array(z.object({
    name: z.string(),
    status: z.enum(['UP', 'DOWN', 'DEGRADED']),
    port: z.number(),
    lastCheck: z.string().datetime()
  })),
  metrics: z.object({
    cpuUsage: z.number().min(0).max(100),
    memoryUsage: z.number().min(0).max(100),
    diskUsage: z.number().min(0).max(100)
  })
});
```

### ✅ Test Admin Endpoint
```javascript
const testAdminEndpoint = async (endpoint) => {
  const testData = {
    adminId: 'admin-123e4567-e89b-12d3-a456-426614174000',
    action: 'system_check'
  };
  
  try {
    const response = await fetch(`http://localhost:3005/api/${endpoint}`, {
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


**Aplicación**: Panel de control y monitoreo global de la plataforma  
**Puerto**: 3005  
**Estado**: 🟢 PRODUCCIÓN (8.5/10)  
**Última actualización**: 20 de agosto de 2025

## 🌳 WORKTREE PARA ADMIN APP

- **Para auditar componentes admin**: usar `../devaltamedica-audit/`
- **Para conectar features administrativas**: usar `../devaltamedica-integrate/`
- **Para validar funcionalidad admin**: usar `../devaltamedica-validate/`
- **Regla**: Las features administrativas YA EXISTEN - solo necesitan integración

## 🎯 Propósito y Arquitectura

**Admin App** es el **centro de comando** para la gestión global de AltaMedica. Funciona como:

1. **Monitoreo en tiempo real** de toda la plataforma médica
2. **Gestión de usuarios** (pacientes, doctores, empresas)
3. **Panel de auditoría HIPAA** y compliance
4. **Herramientas de análisis** y métricas operacionales
5. **Control de seguridad** y alertas del sistema

### Acceso y Permisos

```
Super Admin → Login → Admin App (3005) → Acceso Total:
├── 👥 User Management (CRUD completo)
├── 🏥 System Health (monitoreo en vivo)
├── 📊 Analytics & Reports (datos globales)
├── 🔐 Security & Audit (logs HIPAA)
└── ⚙️ Platform Settings (configuración)
```

## 🏗️ Estructura del Proyecto

```
C:\Users\Eduardo\Documents\devaltamedica\apps\admin\
├── 📁 src\
│   ├── 📁 app\                    # Next.js App Router
│   │   ├── 📁 api\                # Endpoints administrativos
│   │   │   └── health\            # Health check endpoint
│   │   │
│   │   ├── 📁 dashboard\          # Dashboard principal
│   │   │   └── page.tsx           # Vista principal admin
│   │   │
│   │   ├── 📁 users\              # Gestión de usuarios
│   │   │   ├── page.tsx           # Lista de usuarios
│   │   │   ├── [id]\              # Detalle de usuario
│   │   │   └── roles\             # Gestión de roles
│   │   │
│   │   ├── 📁 audit\              # Auditoría y logs
│   │   │   └── page.tsx           # Logs de auditoría
│   │   │
│   │   ├── 📁 settings\           # Configuración
│   │   │   └── page.tsx           # Settings globales
│   │   │
│   │   ├── 📁 login\              # Autenticación admin
│   │   │   └── page.tsx           # Login super-admin
│   │   │
│   │   ├── layout.tsx             # Layout principal
│   │   ├── page.tsx               # Homepage admin
│   │   └── error.tsx              # Error boundary
│   │
│   ├── 📁 components\
│   │   ├── 📁 dashboard\          # Componentes dashboard
│   │   │   ├── AdminDashboardStandardized.tsx  # Dashboard principal
│   │   │   ├── SystemHealth.tsx   # Monitoreo sistema
│   │   │   ├── UserManagement.tsx # Gestión usuarios
│   │   │   ├── AuditLogs.tsx      # Logs auditoría
│   │   │   └── AdminStats.tsx     # Estadísticas
│   │   │
│   │   ├── 📁 layout\             # Sistema layout
│   │   │   └── AdminLayout.tsx    # Layout admin
│   │   │
│   │   └── OrphanPatientsDashboardStandardized.tsx  # Dashboard pacientes
│   │
│   ├── 📁 hooks\                  # Hooks administrativos
│   │   ├── useAdminDashboardStandardized.tsx  # Hook dashboard
│   │   ├── useRealTimeUpdates.ts  # Updates tiempo real
│   │   ├── useRequireAuth.ts      # Autenticación requerida
│   │   └── useEnhancedAdminDashboard.ts  # Dashboard avanzado
│   │
│   ├── 📁 providers\              # Providers React
│   │   └── AuthProvider.tsx       # Provider autenticación
│   │
│   └── 📁 utils\                  # Utilidades admin
│       └── navigation.ts          # Navegación adminsitrativa
│
├── 📁 middleware.ts               # Middleware de seguridad
├── 📄 Dockerfile                 # Contenedor Docker
├── 📄 next.config.mjs            # Configuración Next.js
└── 📄 package.json               # Dependencias
```

## 🔑 Funcionalidades Principales

### 1. Dashboard Administrativo Unificado

- **Métricas en tiempo real** de toda la plataforma
- **Gráficos interactivos** con estadísticas médicas
- **Alertas automáticas** de incidentes críticos
- **Resumen ejecutivo** de KPIs médicos

### 2. Gestión Completa de Usuarios

- **CRUD completo** para todos los tipos de usuario
- **Asignación de roles** granular (RBAC)
- **Historial de actividad** de usuarios
- **Gestión de permisos** por módulo

### 3. Monitoreo de Sistema en Tiempo Real

- **Health checks** automáticos de todos los servicios
- **Métricas de performance** (latencia, throughput)
- **Monitoreo de base de datos** (Firestore + PostgreSQL)
- **Alertas de capacidad** y uso de recursos

### 4. Auditoría HIPAA Completa

- **Logs de auditoría** con hash chain blockchain
- **Reportes de compliance** automáticos
- **Tracking de PHI** (Protected Health Information)
- **Verificación de integridad** de datos médicos

### 5. Análisis y Reportes Avanzados

- **Métricas de adopción** por aplicación
- **Análisis de uso** de features médicas
- **Reportes financieros** (billing, subscripciones)
- **Exportación de datos** en múltiples formatos

## 🏗️ Arquitectura Backend Integrada

### API Server Endpoints (Puerto 3001)

```typescript
// Endpoints privilegiados para Admin App
GET    /api/v1/users                    // Lista completa usuarios
POST   /api/v1/users                    // Crear nuevo usuario
PUT    /api/v1/users/:id                // Actualizar usuario
DELETE /api/v1/users/:id                // Eliminar usuario

GET    /api/v1/audit-logs               // Logs de auditoría
POST   /api/v1/audit/verify-integrity   // Verificar integridad

GET    /api/v1/metrics                  // Métricas del sistema
GET    /api/v1/health                   // Estado de servicios

GET    /api/v1/finops/cost-estimation   // Sistema FinOps (312 líneas)
GET    /api/v1/rate-limit-stats         // Estadísticas rate limiting
```

### Permisos y Seguridad

- **Rol requerido**: `SUPER_ADMIN` con Firebase Auth
- **Middleware UnifiedAuth**: Validación de permisos en cada request
- **Rate limiting especial**: Protección para operaciones críticas
- **Auditoría completa**: Todas las acciones administrativas se registran

### Integración con Servicios

```typescript
// Servicios disponibles para Admin App
- UnifiedAuthSystem: Autenticación con privilegios elevados
- AuditLogger: Registro de todas las operaciones admin
- MetricsService: Recolección de métricas en tiempo real
- NotificationService: Alertas críticas del sistema
- BackupService: Gestión de respaldos automáticos
```

## 📦 Stack Tecnológico

### Core Framework

- **Next.js 15** con App Router
- **React 18** con Server Components
- **TypeScript 5.8.3** estricto

### UI y Visualización

- **Tailwind CSS** con tema administrativo
- **Chart.js/Recharts** para gráficos
- **Radix UI** para componentes complejos
- **Lucide React** para iconografía

### Estado y Datos

- **TanStack Query** para estado servidor
- **Zustand** para estado cliente
- **React Hook Form** para formularios complejos

### Backend Integration

- **Firebase Admin SDK** para operaciones privilegiadas
- **Prisma ORM** para queries complejas
- **Redis** para cache de métricas

## 🚀 Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev                    # Puerto 3005

# Build y Producción
pnpm build                  # Build optimizado
pnpm start                  # Servidor producción

# Docker
docker build -f Dockerfile.dev .      # Build desarrollo
docker build -f Dockerfile.production .  # Build producción

# Testing
pnpm test                   # Tests unitarios
pnpm test:e2e              # Tests E2E administrativos
```

## 🔐 Configuración de Seguridad

### Variables de Entorno Críticas

```env
# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=xxx
FIREBASE_ADMIN_PRIVATE_KEY=xxx
FIREBASE_ADMIN_CLIENT_EMAIL=xxx

# Base de datos
DATABASE_URL=postgresql://xxx
REDIS_URL=redis://xxx

# APIs
API_SERVER_URL=http://localhost:3001
API_ADMIN_SECRET=xxx

# Monitoring
SENTRY_DSN=xxx
ADMIN_WEBHOOK_SECRET=xxx
```

### Middleware de Seguridad Robusto

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 1. Verificar cookies de autenticación (altamedica_token)
  // 2. Validar rol SUPER_ADMIN
  // 3. Rate limiting por IP
  // 4. Auditar acceso a rutas sensibles
  // 5. Redireccionar si no autorizado
}
```

### Configuración HIPAA

- **Cookies HttpOnly/Secure** obligatorias
- **Headers de seguridad** completos
- **CSP policies** restrictivas
- **Logging completo** de accesos administrativos

## 🎨 Sistema de Diseño Administrativo

### Tema Visual

- **Colores primarios**: Admin Dark Blue (#1e293b)
- **Colores de estado**: Success Green, Warning Orange, Error Red
- **Tipografía**: Inter para legibilidad en dashboards
- **Iconografía**: Lucide React con iconos administrativos

### Componentes Especializados

```typescript
// Componentes críticos para administración
import { AdminDashboardStandardized } from '@/components/dashboard';
import { UserManagement } from '@/components/dashboard';
import { AuditLogs } from '@/components/dashboard';
import { SystemHealth } from '@/components/dashboard';
import { OrphanPatientsDashboardStandardized } from '@/components';
```

### Layout Administrativo

- **Sidebar navegación** persistente
- **Header con usuario** logueado
- **Breadcrumbs** para navegación profunda
- **Toast notifications** para feedback inmediato

## 🧪 Testing y Calidad

### Tests Críticos Implementados

```bash
# Tests de seguridad
- Verificación de permisos admin
- Validación de tokens JWT
- Rate limiting efectivo

# Tests de funcionalidad
- CRUD completo de usuarios
- Visualización de métricas
- Exportación de reportes
- Logs de auditoría

# Tests de integración
- Conexión con API Server
- Sincronización con Firebase
- Cache de Redis
```

### Métricas de Calidad

- **Security score**: 95%+ (Snyk analysis)
- **Performance**: <1s load time para dashboards
- **Coverage**: 85%+ en funcionalidad crítica
- **Accessibility**: WCAG AA compliance

## 🔄 Integraciones Críticas

### API Server (Puerto 3001)

- **Autenticación**: Bearer tokens con privilegios admin
- **Endpoints**: Acceso completo a `/api/v1/*`
- **WebSocket**: Updates en tiempo real para dashboards
- **Rate limiting**: Protección especial para operaciones admin

### Firebase Admin SDK

- **User management**: Operaciones CRUD en Firebase Auth
- **Firestore admin**: Queries directas sin restricciones
- **Cloud Functions**: Trigger de operaciones administrativas

### Bases de Datos

- **PostgreSQL**: Queries analíticas complejas
- **Firestore**: Datos médicos en tiempo real
- **Redis**: Cache de métricas y sesiones admin

## 📊 Dashboards y Métricas

### Dashboard Principal

```typescript
interface AdminMetrics {
  // Usuarios y actividad
  totalUsers: number;
  activeUsers24h: number;
  newRegistrations7d: number;

  // Sistema y performance
  systemHealth: 'healthy' | 'warning' | 'critical';
  averageResponseTime: number;
  errorRate: number;

  // Médico y compliance
  totalAppointments: number;
  hipaaComplianceScore: number;
  auditAlerts: number;

  // Financiero
  monthlyRevenue: number;
  subscriptionGrowth: number;
  costPerUser: number;
}
```

### Reportes Automatizados

- **Daily health reports** enviados por email
- **Weekly compliance reports** para auditoría
- **Monthly business reports** con KPIs ejecutivos
- **Alertas inmediatas** para incidentes críticos

## 🚨 Alertas y Monitoreo

### Sistema de Alertas Automáticas

```typescript
interface AlertConfig {
  // Umbrales críticos
  errorRateThreshold: 5%;           // > 5% errores activa alerta
  responseTimeThreshold: 2000ms;    // > 2s respuesta activa alerta
  userGrowthAnomaly: 50%;          // Cambio súbito en usuarios

  // Seguridad
  failedLoginAttempts: 10;         // > 10 intentos fallidos
  hipaaViolationAlert: true;       // Cualquier violación HIPAA
  unauthorizedAccess: true;        // Acceso no autorizado

  // Recursos
  dbConnectionsHigh: 80%;          // > 80% conexiones DB
  memoryUsageHigh: 85%;           // > 85% memoria
  diskSpaceWarning: 90%;          // > 90% espacio disco
}
```

### Canales de Notificación

- **Email**: Alertas críticas al equipo admin
- **Slack/Teams**: Notificaciones en tiempo real
- **SMS**: Alertas de emergencia fuera de horario
- **In-app**: Notifications dentro del admin panel

## 🔧 Herramientas de Administración

### Gestión de Usuarios Avanzada

```typescript
// Operaciones disponibles para super admins
interface UserManagementTools {
  // CRUD básico
  createUser(userData: CreateUserRequest): Promise<User>;
  updateUser(id: string, updates: UpdateUserRequest): Promise<User>;
  deleteUser(id: string, reason: string): Promise<void>;

  // Operaciones especiales
  suspendUser(id: string, reason: string): Promise<void>;
  restoreUser(id: string): Promise<void>;
  resetPassword(id: string): Promise<void>;

  // Análisis
  getUserActivity(id: string, dateRange: DateRange): Promise<ActivityLog[]>;
  exportUserData(id: string): Promise<UserDataExport>;

  // Bulk operations
  bulkUpdateUsers(filters: UserFilters, updates: BulkUpdate): Promise<void>;
  importUsers(csvData: string): Promise<ImportResult>;
}
```

### Herramientas de Sistema

- **Database maintenance**: Optimización de queries
- **Cache management**: Invalidación y warmup de cache
- **Backup management**: Respaldos manuales y programados
- **Feature flags**: Activación/desactivación de features

## 🔄 Cambios Recientes

### Migración a Cookies Estandarizadas (2025-08-20)

- **Cookie principal**: `altamedica_token` (HttpOnly/Secure)
- **Fallback compatibility**: `auth-token` y `adminToken`
- **Redirección centralizada**: Logout redirige a web-app `/login`

### Middleware Endurecido (2025-08-15)

- **Parsing defensivo** de JWT para evitar errores Edge
- **Múltiples fallbacks** de cookies para compatibilidad
- **Rate limiting mejorado** por IP y usuario

### Dashboard Estandarizado (2025-08-10)

- **AdminDashboardStandardized**: Componente unificado
- **Real-time updates**: WebSocket para métricas en vivo
- **Mobile responsive**: Dashboard optimizado para tablets

## 🎯 Próximas Mejoras

### Funcionalidad Avanzada

- [ ] **AI-powered analytics**: Detección de anomalías automática
- [ ] **Predictive alerts**: Alertas proactivas basadas en ML
- [ ] **Advanced reporting**: Reportes personalizables con drag & drop
- [ ] **Multi-tenant management**: Soporte para múltiples organizaciones

### UX/UI Mejoradas

- [ ] **Dark mode**: Tema oscuro para administradores
- [ ] **Customizable dashboards**: Dashboards personalizables por admin
- [ ] **Mobile app**: App móvil para monitoring on-the-go
- [ ] **Voice commands**: Control por voz para operaciones comunes

### Seguridad y Compliance

- [ ] **Zero-trust architecture**: Implementación completa zero-trust
- [ ] **Advanced audit trails**: Blockchain immutable audit logs
- [ ] **Automated compliance**: Verificación automática de regulaciones
- [ ] **Incident response**: Herramientas automatizadas de respuesta

## 📚 Documentación Adicional

### Guías de Operación

- **Runbook de incidentes**: Procedimientos para emergencias
- **Guía de troubleshooting**: Resolución de problemas comunes
- **Manual de compliance**: Mantenimiento de cumplimiento HIPAA
- **Procedimientos de backup**: Gestión de respaldos y recuperación

### APIs Administrativas

- **Swagger/OpenAPI**: Documentación completa de endpoints admin
- **Postman collection**: Colección de requests para testing
- **Rate limiting guide**: Límites y mejores prácticas
- **Error handling**: Códigos de error y resolución

**Esta aplicación es el centro de comando del ecosistema AltaMedica, proporcionando control total, visibilidad completa y herramientas avanzadas para la administración de la plataforma médica más sofisticada del mercado.**
