## Guía de mantenimiento y patrones de consistencia (Alta Agent)

## 🌳 WORKTREE PARA ALTA AGENT

- **Para auditar agentes IA duplicados**: usar `../devaltamedica-audit/`
- **Para integrar agentes existentes**: usar `../devaltamedica-integrate/`
- **Para validar agentes IA**: usar `../devaltamedica-validate/`
- **Los agentes IA YA EXISTEN** - solo necesitan integración

Este documento define el estándar que deben seguir todos los contribuyentes del paquete `@altamedica/alta-agent` para mantener builds estables, exports coherentes y compatibilidad con las apps del monorepo.

### Módulos y formato de salida

- El paquete es ESM (`"type": "module"`). Código fuente con `import/export` exclusivamente.
- El build genera ESM y CJS. Las extensiones deben alinearse con `exports`:
  - `import` → `*.esm.js`
  - `require` → `*.js`

### Exports y submódulos

- Si se declara `"./foo"` en `exports`, debe existir `src/foo/index.ts` y una `entry` en `tsup.config.ts`.
- Orden recomendado en `exports`: `types` → `import` → `require`.

Ejemplo:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "import": "./dist/components/index.esm.js",
      "require": "./dist/components/index.js"
    }
  }
}
```

## 🔧 **Configuración de tsup**

### **Entradas de Build**

```typescript
// tsup.config.ts
export default defineConfig({
  entry: [
    'src/index.ts', // Entrada principal
    'src/components/index', // Componentes React
    'src/types/index', // Tipos TypeScript
    'src/services/index', // Servicios y lógica
  ],
  // ... resto de configuración
});
```

### **Extensiones de Salida**

```typescript
outExtension({ format }) => ({
  js: format === 'esm' ? '.esm.js' : '.js',
  dts: '.d.ts'
})
```

## 🚨 **RESOLUCIÓN DE DEPENDENCIAS CIRCULARES - ANÁLISIS COMPLETO**

### **🔍 Problema Identificado y Resuelto**

**Fecha de Resolución**: Diciembre 2024  
**Impacto**: Bloqueo total del build del monorepo  
**Paquetes Afectados**: `alta-agent`, `hooks`, `diagnostic-engine`, `types`

#### **Ciclo de Dependencias Problemático**

```
❌ ANTES (Bloqueo Total):
alta-agent → hooks → diagnostic-engine → types → hooks (CÍRCULO!)
     ↓           ↓           ↓           ↓
   types     types      types      hooks
     ↓           ↓           ↓           ↓
   hooks     hooks      hooks      types
```

#### **Síntomas del Problema**

- ❌ Build falla con "Cannot resolve module"
- ❌ TypeScript no puede resolver tipos
- ❌ `pnpm build` se paraliza indefinidamente
- ❌ Dependencias se resuelven como `undefined`
- ❌ Hot reload no funciona por ciclos

### **🎯 Solución Implementada**

#### **Fase 1: Desacoplamiento de `hooks`**

```typescript
// ANTES: Dependencia directa problemática
// packages/hooks/package.json
{
  "dependencies": {
    "@altamedica/diagnostic-engine": "workspace:*",  // ❌ Crea ciclo
    "@altamedica/types": "workspace:*"
  }
}

// DESPUÉS: Solo tipos compartidos
{
  "dependencies": {
    "@altamedica/types": "workspace:*"  // ✅ Solo interfaces
  }
}
```

#### **Fase 2: Tipos Locales en `hooks`**

```typescript
// packages/hooks/src/medical/types/diagnostic.types.ts
export interface IDiagnosticEngine {
  analyze(symptoms: Symptom[]): Promise<DiagnosticResult>;
  startSession(config: SessionConfig): Promise<SessionState>;
  processAnswer(answer: Answer): Promise<Question | Report>;
}

export interface DiagnosticResult {
  hypothesis: Hypothesis[];
  confidence: number;
  urgency: UrgencyLevel;
}

// Tipos específicos del hook, sin dependencias externas
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
}
```

#### **Fase 3: Inyección de Dependencias**

```typescript
// packages/hooks/src/medical/useDiagnosticEngine.ts
export interface UseDiagnosticEngineOptions {
  patientInfo: PatientInfo;
  engineFactory?: DiagnosticEngineFactory; // ✅ Inyección
}

export function useDiagnosticEngine(options: UseDiagnosticEngineOptions) {
  const engineRef = useRef<IDiagnosticEngine | null>(null);

  const initializeEngine = useCallback(() => {
    if (!engineRef.current) {
      if (!options.engineFactory) {
        throw new Error('Engine factory required');
      }
      engineRef.current = options.engineFactory(); // ✅ Factory pattern
    }
    return engineRef.current;
  }, [options.engineFactory]);
}
```

#### **Fase 4: Adaptadores para Aplicaciones**

```typescript
// packages/hooks/src/medical/adapters/diagnostic-engine.adapter.ts
import { DiagnosticEngine } from '@altamedica/diagnostic-engine';
import type { IDiagnosticEngine, DiagnosticEngineFactory } from '../types/diagnostic.types';

// Solo se importa en aplicaciones, no en el paquete hooks
export const createDiagnosticEngineFactory: DiagnosticEngineFactory = () => {
  return new DiagnosticEngine();
};

export const createMockDiagnosticEngineFactory: DiagnosticEngineFactory = () => {
  return new MockDiagnosticEngine();
};
```

### **📊 Arquitectura Final (Correcta)**

```
✅ DESPUÉS (Arquitectura Limpia):
alta-agent → types (solo interfaces)
     ↓
   hooks → types (solo interfaces)
     ↓
diagnostic-engine → types (solo interfaces)
     ↓
   types (paquete base, sin dependencias)
```

### **🔧 Patrones de Arquitectura Aplicados**

#### **1. Separación de Responsabilidades**

- **`types`**: Solo definiciones de tipos e interfaces
- **`hooks`**: Lógica de React hooks con tipos locales
- **`diagnostic-engine`**: Implementación de motor diagnóstico
- **`alta-agent`**: Agente conversacional con inyección de dependencias

#### **2. Inversión de Dependencias**

```typescript
// ANTES: Dependencia directa
import { DiagnosticEngine } from '@altamedica/diagnostic-engine';

// DESPUÉS: Dependencia de abstracción
import type { IDiagnosticEngine } from './types/diagnostic.types';
```

#### **3. Factory Pattern**

```typescript
// Permite testing y configuración flexible
export interface DiagnosticEngineFactory {
  (): IDiagnosticEngine;
}

// En la aplicación:
const agent = new AltaAgent({
  engineFactory: createDiagnosticEngineFactory,
});
```

### **📋 Checklist de Verificación Post-Refactoring**

- [ ] **Build de `types`** funciona independientemente
- [ ] **Build de `hooks`** funciona sin `diagnostic-engine`
- [ ] **Build de `alta-agent`** funciona con tipos locales
- [ ] **No hay dependencias circulares** en `pnpm list --recursive`
- [ ] **TypeScript resuelve tipos** correctamente
- [ ] **Hot reload funciona** en desarrollo

### **🚨 Prevención de Futuros Problemas**

#### **Reglas de Arquitectura**

1. **`types` nunca debe depender** de otros paquetes internos
2. **Cada paquete debe tener tipos locales** para su funcionalidad específica
3. **Usar interfaces en lugar de implementaciones** para dependencias
4. **Inyectar dependencias** en lugar de crearlas internamente
5. **Verificar dependencias** antes de cada nuevo paquete

#### **Comandos de Verificación**

```bash
# Verificar dependencias circulares
pnpm list --recursive --depth=2 | findstr "@altamedica"

# Verificar build individual
pnpm -w -F @altamedica/[package-name] run build

# Verificar tipos
pnpm -w -F @altamedica/[package-name] run type-check
```

### **📚 Referencias y Recursos**

- **Patrón de Inyección de Dependencias**: [SOLID Principles](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- **Arquitectura de Monorepos**: [Nx Architecture](https://nx.dev/concepts/more-concepts/why-monorepos)
- **TypeScript Module Resolution**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

## 📖 **Patrones de Consistencia**

### Tipos compartidos (@altamedica/types)

- Usar el namespace público: `@altamedica/types/medical`.
- Importar como namespace para evitar rutas internas frágiles:

```ts
import type { Anamnesis as Medical } from '@altamedica/types/medical';
```

- Referir tipos como `Medical.UrgencyLevel`, `Medical.ClinicalAnalysis`, etc.

### Componentes React

- Exportar las props desde el archivo del componente:

```ts
export interface AltaChatProps { ... }
```

- Re-exportar componente y props desde `src/components/index.ts`:

```ts
export { AltaChat } from './AltaChat';
export type { AltaChatProps } from './AltaChat';
```

### Dependencias

- React y React DOM deben declararse en `peerDependencies` (>=18).
- Librerías de UI usadas por los componentes (p.ej., `lucide-react`) van en `dependencies`.

### TSConfig (extracto recomendado)

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "skipLibCheck": true
  }
}
```

### Checklist de PR

- [ ] `exports` ↔ entradas en `tsup` sincronizadas
- [ ] Build genera `.esm.js` (import) y `.js` (require)
- [ ] Tipos importados vía namespace público `@altamedica/types/...`
- [ ] Props exportadas y re-exportadas en `components/index.ts`
- [ ] Dependencias agregadas correctamente (`dependencies`/`peerDependencies`)
- [ ] `pnpm -w -F @altamedica/alta-agent run type-check` OK
- [ ] `pnpm -w -F @altamedica/alta-agent run build` OK

### Solución de problemas comunes

1. Cannot find module './components/AltaChat'
   - Verificar que `src/components/index.ts` exporte el componente y que exista `entry` en `tsup`.
2. d.ts build error con tipos médicos
   - Usar `@altamedica/types/medical` (namespace) en lugar de rutas internas.
3. Desalineación entre `exports` y artefactos
   - Ajustar `outExtension` y nombres de entradas en `tsup`.

---

Este patrón es obligatorio para mantener compatibilidad en todas las apps del monorepo.
