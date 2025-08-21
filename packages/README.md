# 📦 AltaMedica Packages

Biblioteca de paquetes compartidos para la plataforma médica AltaMedica. Este monorepo contiene 26+ paquetes que proporcionan funcionalidad central, componentes reutilizables y servicios médicos especializados.

## 🚀 Quick Start

```bash
# Instalar dependencias
pnpm install

# Construir todos los paquetes
pnpm build

# Desarrollo con watch mode
pnpm dev
```

## 📚 Paquetes Principales

### Core

- **[@altamedica/types](./types)** - TypeScript definitions + Zod schemas
- **[@altamedica/auth](./auth)** - Sistema de autenticación SSO
- **[@altamedica/ui](./ui)** - Sistema de diseño (Tailwind + Radix UI)
- **[@altamedica/hooks](./hooks)** - React hooks compartidos

### Medical Domain

- **[@altamedica/medical](./medical)** - Componentes y utilidades médicas
- **[@altamedica/telemedicine-core](./telemedicine-core)** - WebRTC para videollamadas
- **[@altamedica/patient-services](./patient-services)** - Servicios de pacientes

### API & Data

- **[@altamedica/api-client](./api-client)** - Cliente API con TanStack Query
- **[@altamedica/database](./database)** - Prisma ORM + repositorios

### AI & Innovation

- **[@altamedica/ai-agents](./ai-agents)** - Agentes IA médicos
- **[@altamedica/alta-agent](./alta-agent)** - Asistente médico Alta

## 🏗️ Arquitectura y Mejores Prácticas

### Estabilización (2025-08-21)

- Build estandarizado con `tsup` (dual CJS/ESM) en librerías
- `main/module/types/exports` apuntan a `dist/` en todos los packages
- React en `peerDependencies`: `^18.2.0 || ^19.0.0`
- TypeScript devDependency: `^5.8.3` (unificado)
- Scripts de `clean`: uso de `rimraf` (Windows-friendly)
- Generación de tipos habilitada y estable en `@altamedica/types` (tsup + tsconfig corregido)
- Subruta de logger disponible: `@altamedica/shared/services/logger.service` (CJS/ESM/DTS)
- Paquetes actualizados: `auth`, `ui`, `maps`, `medical`, `types`, `firebase`, `config-next`, `diagnostic-engine`, `api-client`, `hooks`, `medical-services`, `telemedicine-core`, `patient-services`, `alta-agent`

### Contratos de Herencia

Al extender clases base (especialmente agentes IA):

```typescript
// ✅ CORRECTO
class CustomAgent extends AltaAgent {
  constructor(config?: Partial<AltaConfig>) {
    const merged = { ...DEFAULT_ALTA_CONFIG, ...config };
    super(merged);
  }

  processMessage() {
    // Usar campos protected y métodos API
    this.state;  // protected
    this.addToHistory(...);  // API method
  }
}
```

### Importación de Tipos

```typescript
// ✅ CORRECTO - Usar exports públicos
import type { Patient } from '@altamedica/types';
import type { Anamnesis as Medical } from '@altamedica/types/medical';

// ❌ INCORRECTO - Nunca importar rutas internas
import { Patient } from '@altamedica/types/src/medical/patient';
```

### Factory Pattern

```typescript
// Uso recomendado de factories
import { createAltaAgent } from '@altamedica/alta-agent';

const agent = createAltaAgent({
  useAI: true,
  config: {
    personality: 'professional',
    specialization: 'cardiology',
  },
});
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Con coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# E2E tests
cd packages/e2e-tests && pnpm test:e2e
```

### Coverage Requirements

- **Utilities**: 80% mínimo
- **Medical packages**: 95% mínimo
- **UI components**: 90% + a11y tests

## 📋 Checklist de Desarrollo

Antes de hacer PR:

- [ ] ✅ No acceder a miembros `private` de clases base
- [ ] ✅ Usar `Partial<Config>` en constructores
- [ ] ✅ Importar tipos desde exports públicos
- [ ] ✅ No duplicar schemas Zod existentes
- [ ] ✅ Build sin referencias a `src/`
- [ ] ✅ Tests con coverage adecuado
- [ ] ✅ JSDoc en APIs públicas
- [ ] ✅ CHANGELOG.md actualizado

## 🔐 Seguridad y Compliance

### HIPAA Requirements

- Encriptación AES-256-GCM para PHI
- Audit logging obligatorio
- No almacenar tokens en localStorage
- Cookies HttpOnly/Secure únicamente

### Paquetes Críticos

- `@altamedica/auth` - Autenticación segura
- `@altamedica/medical-cache` - Cache HIPAA-compliant
- `@altamedica/database` - Persistencia segura

## 🛠️ Comandos Útiles

```bash
# Limpiar builds
pnpm clean

# Lint con fix
pnpm lint:fix

# Type checking
pnpm type-check

# Analizar bundle size
pnpm analyze-bundle

# Storybook (UI package)
cd packages/ui && pnpm storybook
```

## 📊 Métricas

- **Paquetes totales**: 26+
- **Líneas de código**: ~75,000
- **Componentes React**: 150+
- **Coverage promedio**: 82%
- **Build time**: <3 min

## 🤝 Contribuir

1. Revisar [CLAUDE.md](./CLAUDE.md) para guías detalladas
2. Seguir estructura estándar de paquetes
3. Mantener coverage mínimo
4. Actualizar documentación
5. Usar conventional commits

## 📄 Licencia

Propiedad de AltaMedica Platform. Todos los derechos reservados.

---

Para documentación exhaustiva, ver [CLAUDE.md](./CLAUDE.md)
