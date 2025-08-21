# 🚨 **ANÁLISIS COMPLETO: Dependencias Circulares en AltaMedica**

## 📋 **Resumen Ejecutivo**

**Fecha de Análisis**: Diciembre 2024  
**Estado**: ✅ **RESUELTO**  
**Impacto**: Bloqueo total del build del monorepo  
**Tiempo de Resolución**: 1 día de análisis + refactoring  
**Paquetes Afectados**: `alta-agent`, `hooks`, `diagnostic-engine`, `types`

---

## 🔍 **Problema Identificado**

### **Ciclo de Dependencias Crítico**
```
❌ ANTES (Bloqueo Total):
alta-agent → hooks → diagnostic-engine → types → hooks (CÍRCULO!)
     ↓           ↓           ↓           ↓
   types     types      types      hooks
     ↓           ↓           ↓           ↓
   hooks     hooks      hooks      types
```

### **Síntomas del Problema**
- ❌ **Build falla** con "Cannot resolve module"
- ❌ **TypeScript no puede resolver** tipos
- ❌ **`pnpm build` se paraliza** indefinidamente
- ❌ **Dependencias se resuelven** como `undefined`
- ❌ **Hot reload no funciona** por ciclos de dependencias
- ❌ **CI/CD se rompe** por builds inconsistentes

---

## 🎯 **Solución Implementada**

### **Fase 1: Desacoplamiento de `hooks`**
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

### **Fase 2: Tipos Locales en `hooks`**
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

### **Fase 3: Inyección de Dependencias**
```typescript
// packages/hooks/src/medical/useDiagnosticEngine.ts
export interface UseDiagnosticEngineOptions {
  patientInfo: PatientInfo;
  engineFactory?: DiagnosticEngineFactory;  // ✅ Inyección
}

export function useDiagnosticEngine(options: UseDiagnosticEngineOptions) {
  const engineRef = useRef<IDiagnosticEngine | null>(null);
  
  const initializeEngine = useCallback(() => {
    if (!engineRef.current) {
      if (!options.engineFactory) {
        throw new Error('Engine factory required');
      }
      engineRef.current = options.engineFactory();  // ✅ Factory pattern
    }
    return engineRef.current;
  }, [options.engineFactory]);
}
```

### **Fase 4: Adaptadores para Aplicaciones**
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

---

## 📊 **Arquitectura Final (Correcta)**

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

### **Separación de Responsabilidades**
- **`types`**: Solo definiciones de tipos e interfaces
- **`hooks`**: Lógica de React hooks con tipos locales
- **`diagnostic-engine`**: Implementación de motor diagnóstico
- **`alta-agent`**: Agente conversacional con inyección de dependencias

---

## 🔧 **Patrones de Arquitectura Aplicados**

### **1. Inversión de Dependencias**
```typescript
// ANTES: Dependencia directa
import { DiagnosticEngine } from '@altamedica/diagnostic-engine';

// DESPUÉS: Dependencia de abstracción
import type { IDiagnosticEngine } from './types/diagnostic.types';
```

### **2. Factory Pattern**
```typescript
// Permite testing y configuración flexible
export interface DiagnosticEngineFactory {
  (): IDiagnosticEngine;
}

// En la aplicación:
const agent = new AltaAgent({
  engineFactory: createDiagnosticEngineFactory
});
```

### **3. Separación de Tipos por Dominio**
```typescript
// packages/hooks/src/medical/types/diagnostic.types.ts
// Tipos específicos del dominio médico en hooks

// packages/types/src/medical/index.ts
// Tipos compartidos a nivel de monorepo
```

---

## 📋 **Checklist de Verificación Post-Refactoring**

- [ ] **Build de `types`** funciona independientemente
- [ ] **Build de `hooks`** funciona sin `diagnostic-engine`
- [ ] **Build de `alta-agent`** funciona con tipos locales
- [ ] **No hay dependencias circulares** en `pnpm list --recursive`
- [ ] **TypeScript resuelve tipos** correctamente
- [ ] **Hot reload funciona** en desarrollo
- [ ] **CI/CD pipeline** funciona correctamente

---

## 🚨 **Prevención de Futuros Problemas**

### **Reglas de Arquitectura**
1. **`types` nunca debe depender** de otros paquetes internos
2. **Cada paquete debe tener tipos locales** para su funcionalidad específica
3. **Usar interfaces en lugar de implementaciones** para dependencias
4. **Inyectar dependencias** en lugar de crearlas internamente
5. **Verificar dependencias** antes de cada nuevo paquete
6. **Documentar arquitectura** de dependencias en cada paquete

### **Comandos de Verificación**
```bash
# Verificar dependencias circulares
pnpm list --recursive --depth=2 | findstr "@altamedica"

# Verificar build individual
pnpm -w -F @altamedica/[package-name] run build

# Verificar tipos
pnpm -w -F @altamedica/[package-name] run type-check

# Verificar build completo del monorepo
pnpm -w run build
```

---

## 📚 **Referencias y Recursos**

### **Patrones de Arquitectura**
- **Patrón de Inyección de Dependencias**: [SOLID Principles](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- **Arquitectura de Monorepos**: [Nx Architecture](https://nx.dev/concepts/more-concepts/why-monorepos)
- **TypeScript Module Resolution**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

### **Herramientas de Análisis**
- **pnpm**: `pnpm list --recursive` para mapear dependencias
- **TypeScript**: `tsc --noEmit` para verificar tipos
- **Turbo**: `turbo build` para builds optimizados

---

## 🔮 **Lecciones Aprendidas**

### **1. Arquitectura Anticipada**
- **Planificar dependencias** antes de crear paquetes
- **Separar tipos de implementaciones** desde el inicio
- **Documentar arquitectura** de dependencias

### **2. Refactoring Incremental**
- **Resolver un paquete a la vez** para evitar cascadas
- **Verificar builds** después de cada cambio
- **Mantener tests** funcionando durante refactoring

### **3. Comunicación del Equipo**
- **Documentar cambios** para otros desarrolladores
- **Compartir patrones** de arquitectura exitosos
- **Revisar dependencias** en code reviews

---

## 📞 **Contacto y Soporte**

**Desarrollador Principal**: Dr. Eduardo Marques  
**Fecha de Documentación**: Diciembre 2024  
**Estado del Documento**: ✅ **ACTUALIZADO**  

**Para consultas sobre dependencias circulares**: Revisar este documento primero, luego consultar con el equipo de arquitectura.

---

*Este documento debe actualizarse cada vez que se resuelvan nuevas dependencias circulares o se implementen mejoras en la arquitectura del monorepo.*
