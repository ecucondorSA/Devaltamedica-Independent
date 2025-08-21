# 🏥 Alta Agent - Asistente Médica & Experto en Packages

<div align="center">
  <img src="/assets/alta-logo.png" alt="Alta Logo" width="200" />
  
  **Alta** - Tu asistente médica inteligente para anamnesis
  
  Desarrollada por **Dr. Eduardo Marques** (Medicina-UBA)
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/altamedica/alta-agent)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19.0%2B-blue)](https://reactjs.org/)
</div>

## 📋 Descripción

Alta es una asistente médica virtual con inteligencia artificial, diseñada específicamente para realizar anamnesis médicas de manera conversacional, empática y profesional. Cuenta con un avatar 3D interactivo, procesamiento de lenguaje natural y detección automática de urgencias médicas.

**NUEVO**: Alta ahora incluye un **Package Expert Agent** - Un agente experto que conoce TODO sobre los 26+ paquetes del monorepo AltaMedica, ayudándote a encontrar la funcionalidad correcta y evitar duplicación de código.

## ✨ Características

- 🤖 **IA Conversacional**: Diálogo natural y empático con pacientes
- 👩‍⚕️ **Conocimiento Médico**: Basado en protocolos de Álvarez (Semiología Médica)
- 🎭 **Avatar 3D Interactivo**: Modelo .glb con animaciones y expresiones
- 🎤 **Voz y Audio**: Text-to-Speech y Speech-to-Text integrados
- 🚨 **Detección de Urgencias**: Identificación automática de síntomas críticos
- 📊 **Análisis Clínico**: Evaluación de síntomas y recomendaciones
- 🌐 **Multilingüe**: Español (AR/ES) e Inglés
- 📱 **Responsive**: Adaptable a cualquier dispositivo
- 🔒 **HIPAA Compliant**: Cumple estándares de privacidad médica

## 🚀 Instalación

```bash
# Con pnpm (recomendado)
pnpm add @altamedica/alta-agent

# Con npm
npm install @altamedica/alta-agent

# Con yarn
yarn add @altamedica/alta-agent
```

## 🏗️ **ARQUITECTURA Y DEPENDENCIAS - LECCIONES APRENDIDAS**

### ⚠️ **Dependencias Circulares - Problema Crítico Resuelto**

**Problema Identificado**: El paquete `alta-agent` tenía dependencias circulares que bloqueaban completamente el build del monorepo:

```
❌ ANTES (Problemático):
alta-agent → hooks → diagnostic-engine → types → hooks (CÍRCULO!)
```

**Solución Implementada**: Refactoring completo para desacoplar dependencias:

```
✅ DESPUÉS (Correcto):
alta-agent → types (solo interfaces)
alta-agent → hooks (tipos locales)
alta-agent → ui (componentes)
```

### 🔧 **Patrones de Arquitectura Aplicados**

#### **1. Separación de Tipos por Dominio**
```typescript
// ✅ CORRECTO: Tipos locales en cada paquete
// packages/alta-agent/src/types/alta.types.ts
export interface AltaMessage {
  id: string;
  content: string;
  timestamp: Date;
}

// ❌ INCORRECTO: Depender de tipos de otros paquetes
// import { MessageType } from '@altamedica/hooks/types';
```

#### **2. Inyección de Dependencias**
```typescript
// ✅ CORRECTO: Recibir dependencias como parámetros
export class AltaAgent {
  constructor(
    private config: AltaConfig,
    private engineFactory?: () => IDiagnosticEngine
  ) {}
}

// ❌ INCORRECTO: Crear dependencias internamente
// private engine = new DiagnosticEngine(); // Crea acoplamiento
```

#### **3. Interfaces en Lugar de Implementaciones**
```typescript
// ✅ CORRECTO: Solo interfaces compartidas
export interface IDiagnosticEngine {
  analyze(symptoms: Symptom[]): Promise<DiagnosticResult>;
}

// ❌ INCORRECTO: Importar clases completas
// import { DiagnosticEngine } from '@altamedica/diagnostic-engine';
```

### 📋 **Checklist de Prevención de Dependencias Circulares**

- [ ] **Verificar dependencias** antes de agregar nuevas
- [ ] **Usar tipos locales** para funcionalidad específica del paquete
- [ ] **Implementar interfaces** en lugar de dependencias directas
- [ ] **Inyectar dependencias** en lugar de crearlas internamente
- [ ] **Separar tipos por dominio** (core, medical, shared)
- [ ] **Documentar arquitectura** de dependencias en cada paquete

### 🚨 **Señales de Alerta**

Si ves estos patrones, **¡ALERTA!** tienes dependencias circulares:

- ❌ `hooks` importa de `diagnostic-engine`
- ❌ `diagnostic-engine` importa de `types`
- ❌ `types` importa de `hooks`
- ❌ Build falla con "Cannot resolve module"
- ❌ TypeScript no puede resolver tipos

### 🎯 **Solución Inmediata**

1. **Identificar el ciclo** usando `pnpm list --recursive`
2. **Crear tipos locales** en el paquete problemático
3. **Refactorizar imports** para usar solo interfaces
4. **Remover dependencias** del `package.json`
5. **Verificar build** del paquete afectado

## 📖 Uso Básico

### Componente de Chat Completo

```tsx
import { AltaChat } from '@altamedica/alta-agent';

function MyApp() {
  const handleSessionComplete = (summary: string) => {
    console.log('Anamnesis completada:', summary);
  };

  return (
    <AltaChat
      patientId="patient-123"
      onSessionComplete={handleSessionComplete}
      enableVoice={true}
      enableAvatar={true}
      height="600px"
    />
  );
}
```

### Uso del Agente Directamente

```tsx
import { AltaAgent } from '@altamedica/alta-agent';

const agent = new AltaAgent({
  name: 'Alta',
  developer: ' Eduardo Marques',
  credentials: 'Medicina-UBA',
  personality: {
    tone: 'empática',
    language: 'es-AR',
  },
});

// Iniciar sesión
const welcome = await agent.startSession('patient-123');
console.log(welcome.text); // "Hola, soy Alta..."

// Procesar mensaje del paciente
const response = await agent.processMessage('Me duele el pecho');
console.log(response.text); // Respuesta contextual de Alta

// Generar resumen
const summary = await agent.generateSummary();
```

### Avatar 3D Standalone

```tsx
import { AltaAvatar3D } from '@altamedica/alta-agent';

function AvatarView() {
  return (
    <AltaAvatar3D
      emotion="empathetic"
      state="speaking"
      isSpeaking={true}
      scale={1.2}
      enableControls={true}
    />
  );
}
```

## 🎮 API Completa

### AltaChat Props

| Prop                | Tipo                        | Default    | Descripción                  |
| ------------------- | --------------------------- | ---------- | ---------------------------- |
| `patientId`         | `string`                    | _required_ | ID del paciente              |
| `onSessionComplete` | `(summary: string) => void` | -          | Callback al completar sesión |
| `enableVoice`       | `boolean`                   | `true`     | Habilitar TTS y STT          |
| `enableAvatar`      | `boolean`                   | `true`     | Mostrar avatar 3D            |
| `className`         | `string`                    | `''`       | Clases CSS adicionales       |
| `height`            | `string`                    | `'600px'`  | Altura del componente        |

### AltaAgent Methods

```typescript
interface AltaAgent {
  // Sesión
  startSession(patientId: string, language?: string): Promise<AltaMessage>;
  endSession(): Promise<void>;

  // Conversación
  processMessage(message: string): Promise<AltaMessage>;

  // Estado
  getState(): AltaState;
  getEmotion(): AltaEmotion;
  getContext(): AltaConversationContext | null;
  getHistory(): AltaResponse[];

  // Utilidades
  generateSummary(): Promise<string>;
  isSessionActive(): boolean;
}
```

### Eventos

Alta emite los siguientes eventos:

- `session.start` - Cuando inicia una sesión
- `session.end` - Cuando termina una sesión
- `message.received` - Al recibir mensaje del paciente
- `message.sent` - Al enviar respuesta
- `urgency.detected` - Cuando detecta una urgencia médica
- `state.changed` - Cambio de estado (idle, listening, thinking, speaking)
- `emotion.changed` - Cambio de emoción del avatar

```typescript
agent.on('urgency.detected', (data) => {
  console.log('⚠️ Urgencia detectada:', data);
  // Activar protocolo de emergencia
});
```

## 🎨 Personalización

### Configuración Completa

```typescript
const config: AltaConfig = {
  // Identificación
  name: 'Alta',
  version: '1.0.0',
  developer: 'Dr. Eduardo Marques',
  credentials: 'Medicina-UBA',

  // Avatar 3D
  avatarModel: '/models/alta-avatar.glb',
  avatarScale: 1,
  avatarPosition: [0, 0, 0],

  // Personalidad
  personality: {
    role: 'Asistente Médica',
    tone: 'empática', // 'profesional' | 'amigable' | 'empática'
    language: 'es-AR', // 'es-AR' | 'es-ES' | 'en-US'
    specialties: ['medicina-general', 'medicina-interna'],
  },

  // Capacidades
  features: {
    voiceEnabled: true,
    videoEnabled: true,
    emotionDetection: true,
    urgencyDetection: true,
    adaptiveQuestioning: true,
    medicalValidation: true,
    multilingualSupport: false,
  },

  // Configuración médica
  medical: {
    protocolBase: 'alvarez', // 'alvarez' | 'harrison' | 'cecil'
    urgencyThreshold: 0.7,
    validationLevel: 'intermediate', // 'basic' | 'intermediate' | 'strict'
  },
};

const agent = new AltaAgent(config);
```

### Emociones del Avatar

Alta puede expresar las siguientes emociones:

- `neutral` - Estado base
- `empathetic` - Empática y comprensiva
- `concerned` - Preocupada
- `happy` - Feliz/positiva
- `focused` - Concentrada
- `urgent` - Alerta/urgente

### Estados de Alta

- `idle` - En espera
- `listening` - Escuchando al paciente
- `thinking` - Procesando información
- `speaking` - Hablando
- `analyzing` - Analizando síntomas
- `alert` - Estado de alerta

## 🏥 Casos de Uso Médicos

### Triaje Inicial

```typescript
// Alta detecta automáticamente urgencias
const response = await agent.processMessage('Tengo dolor en el pecho y me falta el aire');
// Alta activará protocolo de emergencia automáticamente
```

### Anamnesis Completa

```typescript
// Alta guía al paciente por todas las secciones
// 1. Datos personales
// 2. Motivo de consulta
// 3. Enfermedad actual
// 4. Antecedentes personales
// 5. Antecedentes familiares
// 6. Revisión por sistemas
// 7. Hábitos
// 8. Alergias y medicamentos
```

### Detección de Síntomas

```typescript
// Alta extrae información médica relevante
const response = await agent.processMessage(
  'Tengo fiebre de 39°, dolor de cabeza y tos desde hace 3 días',
);
// Alta identificará: fiebre alta, cefalea, tos, duración 3 días
```

## 🔧 Requisitos Técnicos

- Node.js >= 18.0.0
- React >= 18.0.0
- Navegador con soporte para:
  - WebGL (para avatar 3D)
  - Web Speech API (para voz)
  - WebRTC (opcional, para video)

## 🤖 Integración con Agentes de IA

### Manus SDK - Conversacional AI & Medical NLP

✅ **IMPLEMENTADO** - Procesamiento conversacional inteligente con razonamiento médico real:

- Análisis médico con NLP especializado
- Detección de urgencias basada en IA
- Extracción automática de entidades médicas (síntomas, medicamentos, condiciones)
- Diagnóstico diferencial con probabilidades
- Generación de preguntas de seguimiento contextual
- Insights clínicos con referencias médicas

### GenSpark SDK - Dynamic Content Generation

✅ **IMPLEMENTADO** - Generación dinámica de contenido médico:

- Generación automática de documentos médicos (anamnesis, resúmenes clínicos)
- Formularios dinámicos adaptados al perfil del paciente
- Contenido educativo personalizado
- Visualizaciones médicas interactivas
- Exportación en múltiples formatos (HTML, PDF, FHIR)

### Uso con AI

```typescript
// Con variables de entorno configuradas
// NEXT_PUBLIC_MANUS_API_KEY=tu_api_key
// NEXT_PUBLIC_GENSPARK_API_KEY=tu_api_key

import { AltaAgentWithAI } from '@altamedica/alta-agent';

const agent = new AltaAgentWithAI(config);

// Capacidades mejoradas disponibles
const capabilities = agent.getAICapabilities();
console.log(capabilities);
// {
//   manus: true,
//   genSpark: true,
//   features: [
//     'Procesamiento conversacional inteligente',
//     'Análisis médico con NLP',
//     'Generación de documentos médicos',
//     ...
//   ]
// }

// Obtener diagnóstico diferencial
const diagnosis = await agent.getDifferentialDiagnosis();

// Generar formulario dinámico
const form = await agent.generateDynamicForm('intake', 'cardiologia');

// Generar contenido educativo
const education = await agent.generateEducationalContent('hipertensión');
```

## 🎯 Roadmap

- [x] ✅ Integración con Manus SDK
- [x] ✅ Integración con GenSpark
- [ ] Soporte para más idiomas
- [ ] Modelos 3D adicionales
- [ ] Análisis de sentimientos avanzado
- [ ] Integración con wearables
- [ ] Exportación a formatos médicos (FHIR, HL7)

## 👨‍⚕️ Autor

**Dr. Eduardo Marques**  
Médico - Universidad de Buenos Aires (UBA)  
Especialista en Telemedicina e IA Médica  
[eduardo@altamedica.com](mailto:eduardo@altamedica.com)

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🧭 Guía de consistencia para desarrolladores (patrón oficial)

Para mantener este paquete estable y consumible desde todas las apps del monorepo, seguimos un patrón único de módulos, exports, tipado y build. Usá esta guía cada vez que agregues código o submódulos.

### 1) Sistema de módulos (ESM/CJS)

- Este paquete es ESM: `package.json` define `"type": "module"`.
- El bundler genera ambos formatos: ESM (`.esm.js`) y CJS (`.js`).
- No mezclar sintaxis: en el código fuente usar siempre `import/export` (no `require`).

### 2) Exports y subpaquetes

- Regla: si `package.json` exporta `"./foo"`, entonces debe existir `src/foo/index.ts` y una entrada correspondiente en el bundler.
- Orden en `exports`: `types` → `import` → `require`.

Ejemplo de `package.json`:

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

### 3) Entradas de build (tsup)

- Cada subpaquete exportado debe declararse en `tsup.config.ts` dentro de `entry`.
- Forzar extensiones de salida para alinear con `exports`.

Ejemplo:

```ts
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'components/index': 'src/components/index.ts',
    'types/index': 'src/types/index.ts',
    'services/index': 'src/services/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.esm.js' : '.js' };
  },
  external: ['react', 'react-dom'],
});
```

### 4) Tipos compartidos

- Usar SIEMPRE el namespace público de tipos: `@altamedica/types/medical` con alias de espacio de nombres.
- Ejemplo: `import type { Anamnesis as Medical } from '@altamedica/types/medical';` y luego `Medical.UrgencyLevel`.
- Evitar rutas internas como `@altamedica/types/medical/anamnesis.types`.

### 5) Componentes React (patrón de props y re-exports)

- Definir props como `export interface XxxProps { ... }` en el componente.
- Re-exportar componentes y sus props desde `src/components/index.ts`:

```ts
export { AltaChat } from './AltaChat';
export type { AltaChatProps } from './AltaChat';
```

### 6) Dependencias y peers

- Si el componente usa una lib (p.ej. `lucide-react`), agregarla en `dependencies`.
- `react` y `react-dom` van en `peerDependencies` con rango `>=18`.

### 7) TSConfig recomendado (extracto)

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

### 8) Scripts y CI

- `pnpm build` debe generar artefactos para todos los subpaquetes listados en `exports`.
- Agregar verificación de tipos en CI: `pnpm type-check`.

### 9) Checklist antes de abrir PR

- [ ] ¿Todos los `exports` tienen su `src/<sub>/index.ts` y su entrada en `tsup`?
- [ ] ¿El build genera `.esm.js` para `import` y `.js` para `require`?
- [ ] ¿Se usó `@altamedica/types/medical` (namespace) en vez de rutas internas?
- [ ] ¿Las `Props` de componentes están exportadas y re-exportadas?
- [ ] ¿Las dependencias nuevas están en `dependencies` o `peerDependencies` según corresponda?
- [ ] `pnpm -w -F @altamedica/alta-agent run type-check` pasa sin errores.
- [ ] `pnpm -w -F @altamedica/alta-agent run build` genera `dist/` sin warnings críticos.

## 🤖 Sistema MCP - Model Context Protocol Agents

Alta-Agent ahora incluye un **sistema completo de agentes MCP especializados**, cada uno experto en su dominio específico del ecosistema AltaMedica.

### 🎯 Agentes Disponibles

| Agente            | App        | Puerto | Descripción                                    |
| ----------------- | ---------- | ------ | ---------------------------------------------- |
| **WebMCP**        | web-app    | 3000   | Gateway público, autenticación, landing pages  |
| **PatientMCP**    | patients   | 3003   | Portal de pacientes, telemedicina, historiales |
| **DoctorMCP**     | doctors    | 3002   | Portal médico, prescripciones, videoconsultas  |
| **APIMCP**        | api-server | 3001   | Backend central, lógica de negocio, SSO        |
| **CompaniesMCP**  | companies  | 3004   | Marketplace B2B, gestión hospitalaria          |
| **PackageExpert** | packages   | -      | Experto en 26+ paquetes compartidos            |

### 🚀 Uso del Sistema MCP

```typescript
import { mcp } from '@altamedica/alta-agent';

// Sistema coordinado
mcp.help(); // Ayuda general
mcp.listSystems(); // Ver todos los sistemas
mcp.findFeature('telemedicine'); // Buscar en todos
mcp.troubleshoot('webrtc not working'); // Resolver problemas

// Agentes específicos
mcp.web.help(); // Ayuda de web-app
mcp.patients.listFeatures(); // Features de patients
mcp.doctors.showRoutes(); // Rutas de doctors
mcp.api.showTechStack(); // Stack de api-server
mcp.companies.generateExample('map'); // Ejemplo de código

// Package Expert
mcp.packages.recommendPackages('authentication');
mcp.packages.checkDuplication('notifications');
```

### 📋 Comandos Comunes por Agente

```typescript
// Cada agente tiene estos métodos base:
agent.getInfo(); // Información general
agent.listFeatures(); // Características principales
agent.showTechStack(); // Stack tecnológico
agent.listKeyFiles(); // Archivos importantes
agent.showRoutes(); // Rutas disponibles
agent.listCommands(); // Comandos de desarrollo
agent.troubleshoot(issue); // Resolver problemas
agent.generateExample(type); // Generar código ejemplo
```

### 💡 Ejemplos de Uso

#### Buscar funcionalidad específica

```typescript
// ¿Dónde está la telemedicina?
mcp.findFeature('video');
// Resultado: patients, doctors, api-server

// ¿Cómo implemento autenticación?
mcp.troubleshoot('authentication');
// Sugerencias de WebMCP y APIMCP
```

#### Generar código ejemplo

```typescript
// Login en web-app
const loginCode = mcp.web.generateExample('login');

// Videollamada en patients
const videoCode = mcp.patients.generateExample('telemedicine');

// Endpoint en api-server
const apiCode = mcp.api.generateExample('endpoint');
```

#### Resolver problemas específicos

```typescript
// Mapa no carga en companies
mcp.companies.troubleshoot('map not loading');

// WebRTC no conecta
mcp.doctors.troubleshoot('webrtc connection failed');
```

### 🎓 Casos de Uso Avanzados

#### Desarrollo de nueva feature

```typescript
// 1. Verificar si existe funcionalidad similar
mcp.findFeature('prescriptions');

// 2. Ver implementaciones existentes
mcp.doctors.listKeyFiles(); // Ver archivos de prescripciones

// 3. Generar ejemplo base
const example = mcp.doctors.generateExample('prescription');

// 4. Verificar dependencias necesarias
mcp.packages.recommendPackages('medical forms');
```

#### Debugging cross-app

```typescript
// Problema: Login funciona en web pero no en patients

// 1. Revisar auth en web-app
mcp.web.troubleshoot('authentication');

// 2. Verificar configuración en api-server
mcp.api.troubleshoot('sso');

// 3. Revisar implementación en patients
mcp.patients.troubleshoot('login redirect');
```

## 🤖 Package Expert Agent

### Descripción

El Package Expert Agent es tu consultor personal para navegar el ecosistema de packages de AltaMedica. Conoce cada paquete, sus exports, cuándo usarlos y cómo resolver problemas comunes.

### Uso Rápido

```typescript
import { packageExpert } from '@altamedica/alta-agent';

// Obtener información de un paquete
const info = packageExpert.getPackageInfo('@altamedica/auth');

// Recomendar paquetes para una necesidad
const recommendations = packageExpert.recommendPackages('necesito autenticación');

// Verificar duplicación antes de crear código
packageExpert.checkDuplication('patient management');

// Resolver problemas
packageExpert.troubleshoot('cannot find module');

// Listar todos los paquetes
packageExpert.listAllPackages();
```

### CLI Interactivo

```bash
# Instalar globalmente
pnpm add -g @altamedica/alta-agent

# Modo interactivo
alta-agent interactive

# Comandos directos
alta-agent info auth
alta-agent recommend "crear formulario médico"
alta-agent check "video calls"
alta-agent troubleshoot "import error"
alta-agent list
```

### Funciones de Acceso Rápido

```typescript
import { agent, info, recommend, check, help } from '@altamedica/alta-agent';

// Información rápida
info('@altamedica/ui');

// Recomendaciones
recommend('telemedicina');

// Verificar duplicación
check('notifications');

// Ayuda contextual
help('how to use hooks');
```

### Prevención de Duplicación

Antes de crear cualquier código nuevo, SIEMPRE consulta al agente:

```typescript
// MALO ❌ - Crear sin verificar
const MyAuthService = new AuthService();

// BUENO ✅ - Verificar primero
packageExpert.checkDuplication('authentication');
// Output: "YA EXISTE en @altamedica/auth"
```

### Conocimiento del Agente

El agente conoce:

- ✅ 26+ paquetes del monorepo
- ✅ Todos los exports principales
- ✅ Cuándo usar cada paquete
- ✅ Dependencias y jerarquías
- ✅ Soluciones a problemas comunes
- ✅ Mejores prácticas y patrones

## 🙏 Agradecimientos

- Libro de Semiología Médica de Álvarez
- Comunidad médica de la UBA
- Equipo de desarrollo de AltaMedica

---

<div align="center">
  Hecho con ❤️ por el Dr. Eduardo Marques para mejorar la atención médica
</div>
