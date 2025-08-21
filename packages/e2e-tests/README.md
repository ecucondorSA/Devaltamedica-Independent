# @altamedica/e2e-tests

E2E tests (Playwright) para API y UI de la plataforma AltaMedica, con soporte para **generación automática de tests usando IA** a través de Playwright MCP (Model Context Protocol).

## 🚀 Características

### Testing Tradicional

- ✅ API health checks para todos los servicios
- ✅ UI smoke tests para las 7 aplicaciones
- ✅ Tests de autenticación y roles
- ✅ Tests de telemedicina con WebRTC
- ✅ Tests de flujos médicos (citas, prescripciones)

### 🤖 AI-Powered Testing (NEW)

- ✅ **Generación automática de tests** usando Playwright MCP
- ✅ **Análisis inteligente del DOM** sin necesidad de screenshots
- ✅ **Auto-corrección de tests** cuando cambia la UI
- ✅ **Tests compliance HIPAA** automáticos
- ✅ **Multi-app support** para todas las aplicaciones

## 📦 Instalación

```bash
# Instalar dependencias
pnpm install

# Instalar navegadores de Playwright
pnpm --filter @altamedica/e2e-tests exec playwright install

# Instalar servidor MCP (para generación IA)
npx -y @executeautomation/playwright-mcp-server
```

## 🏃‍♂️ Ejecución

### Tests Tradicionales

```bash
# Desde la raíz del proyecto
pnpm test:e2e                    # Todos los tests
pnpm test:e2e:ui                 # Interfaz visual de Playwright
pnpm test:e2e:debug             # Modo debug

# Desde el paquete
cd packages/e2e-tests
pnpm test                        # Ejecutar tests
pnpm test:ui                     # UI interactiva
```

### Suites específicas (@a11y y @telemedicine)

```bash
# Accesibilidad (@a11y)
cd packages/e2e-tests
pnpm test -- --grep "@a11y" 2>&1 | Tee-Object -File test-results/a11y-latest.md

# Telemedicina (@telemedicine)
# Requiere servicios levantados (api-server, patients, doctors). Usa tag o glob.
pnpm test -- --grep "@telemedicine" 2>&1 | Tee-Object -File test-results/telemedicine-latest.md
# Alternativa por patrón de archivos si no hay tag en todos los specs
pnpm test tests/telemedicine/*.spec.ts 2>&1 | Tee-Object -File test-results/telemedicine-latest.md
```

Notas:

- Los reportes HTML/artefactos quedan en `test-results/`. Los logs persistidos se guardan en `test-results/*.md` para consulta rápida.
- En Windows PowerShell, `Tee-Object` se utiliza para generar el `.md` sin perder la salida en consola.

### 🤖 Generación IA de Tests

```bash
cd packages/e2e-tests

# Ver templates disponibles
pnpm ai:list

# Generar tests específicos
pnpm ai:generate --app patients --flow booking
pnpm ai:generate --app doctors --flow consultation
pnpm ai:generate --app companies --flow marketplace

# Ejemplos de otros flujos
node ai-test-generator.js --app patients --flow telemedicine
node ai-test-generator.js --app doctors --flow schedule
```

### Salida Ejemplo:

```
🤖 Generating AI-powered E2E test: Patient Appointment Booking
📊 Analyzing application structure...
🧬 Generating test code...
✅ Test generated: tests/ai-generated/patients-booking-ai-generated.spec.ts
🔍 Validating generated test...

🎉 Test generated successfully!
🚀 To run: pnpm test:e2e patients-booking-ai-generated.spec.ts
```

## 📋 Templates de IA Disponibles

### 🏥 Patients App

- **booking**: Reserva completa de citas médicas
- **telemedicine**: Sesiones de videollamada con doctores
- **profile**: Gestión de perfil y historial médico

### 👨‍⚕️ Doctors App

- **consultation**: Gestión de consultas y registros médicos
- **schedule**: Administración de horarios y disponibilidad

### 🏢 Companies App

- **marketplace**: Publicación y gestión de empleos médicos

## ⚙️ Configuración

### Variables de Entorno

```bash
# URLs base (development)
API_BASE_URL=http://localhost:3001
WEB_BASE_URL=http://localhost:3000
PATIENTS_BASE_URL=http://localhost:3003
DOCTORS_BASE_URL=http://localhost:3002
COMPANIES_BASE_URL=http://localhost:3004

# Configuración de tests
E2E_USE_MOCK_LOGIN=1              # Usar login mock para desarrollo
E2E_TIMEOUT=90000                 # Timeout global en ms
PLAYWRIGHT_BROWSERS_PATH=ms-playwright

# Para MCP (AI test generation)
NODE_ENV=test
```

### Configuración MCP

La configuración de MCP para VS Code está en `.vscode/mcp.json`:

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "capabilities": ["vision", "pdf"]
    }
  }
}
```

## 🧪 Tipos de Tests

### Smoke Tests (@smoke)

Tests rápidos de funcionalidad básica:

- Health checks de APIs
- Login y redirección por roles
- Navegación principal

### E2E Tests (@e2e)

Flujos completos de usuario:

- Booking completo de citas
- Consultas médicas end-to-end
- Telemedicina con WebRTC
- Marketplace B2B

### AI-Generated Tests (@ai-generated)

Tests generados automáticamente:

- Análisis de DOM automático
- Casos edge incluidos
- Compliance HIPAA verificado
- Auto-adaptación a cambios de UI

## 📁 Estructura de Archivos

```
packages/e2e-tests/
├── tests/                           # Tests manuales existentes
│   ├── auth.spec.ts
│   ├── health.spec.ts
│   ├── patients-appointments.spec.ts
│   └── helpers/
│       └── auth.ts                  # Utilidades de autenticación
│
├── tests/ai-generated/              # Tests generados por IA
│   ├── patients-booking-flow.spec.ts
│   └── *.spec.ts                    # Otros tests generados
│
├── playwright.config.ts             # Configuración Playwright
├── mcp.config.js                    # Configuración MCP para IA
├── ai-test-generator.js             # Generador de tests IA
└── PLAYWRIGHT_MCP_INTEGRATION.md    # Documentación completa
```

## 🔧 Configuración por App

Los tests están configurados para ejecutarse contra 5 proyectos:

| Proyecto      | Puerto | Base URL       | Descripción             |
| ------------- | ------ | -------------- | ----------------------- |
| **api**       | 3001   | localhost:3001 | Tests de endpoints REST |
| **web-app**   | 3000   | localhost:3000 | Gateway y autenticación |
| **patients**  | 3003   | localhost:3003 | Portal de pacientes     |
| **doctors**   | 2002   | localhost:3002 | Portal de doctores      |
| **companies** | 3004   | localhost:3004 | Marketplace B2B         |

## 🛠️ Troubleshooting

### Problemas Comunes

**Tests fallan por timeout**:

```bash
# Aumentar timeout global
export E2E_TIMEOUT=120000

# O editar playwright.config.ts
timeout: 120 * 1000
```

**Servicios no disponibles**:

```bash
# Verificar que los servicios estén corriendo
curl http://localhost:3001/api/v1/health
curl http://localhost:3000/api/health

# Iniciar servicios mínimos
pnpm dev:min
```

**MCP no funciona**:

```bash
# Reinstalar servidor MCP
npx -y @executeautomation/playwright-mcp-server

# Reiniciar VS Code completamente
# Verificar configuración en .vscode/mcp.json
```

**Tests AI-generated fallan**:

```bash
# Verificar configuración base URLs
node -e "console.log(require('./mcp.config.js').baseURLs)"

# Re-generar tests con configuración actualizada
pnpm ai:generate --app patients --flow booking
```

### Debug Tests

```bash
# Ejecutar test específico en debug
pnpm test:debug -- --grep "should login successfully"

# Ver tests en modo UI
pnpm test:ui

# Generar reporte HTML
pnpm test -- --reporter=html
```

## 📊 Métricas y Reportes

### Coverage Objetivo

- **Smoke tests**: 100% de endpoints críticos
- **User flows**: 80% de journeys principales
- **AI tests**: 90% de casos edge automatizados

### Reportes Generados

- HTML report en `test-results/`
- Logs de suites en `test-results/a11y-latest.md` y `test-results/telemedicine-latest.md`
- Screenshots en fallos
- Videos de tests fallidos
- Trace files para debugging

## 🚀 Próximos Pasos

- [ ] Integración con CI/CD para tests automáticos (pipeline básico con matrix por proyecto y artefactos en `test-results/`)
- [ ] Visual regression testing (snapshots Playwright y canales de aprobación)
- [ ] Performance testing con métricas (tracing/video, lighthouse opcional)
- [ ] Tests de seguridad automatizados (headers, rate-limit, auth flows)
- [ ] Mobile testing para apps responsivas (devices preconfigurados)

## 📚 Documentación Adicional

- [Playwright MCP Integration Guide](./PLAYWRIGHT_MCP_INTEGRATION.md) - Documentación completa de MCP
- [E2E Test Expansion Plan](./E2E_TEST_EXPANSION_PLAN.md) - Plan de expansión de tests
- [Playwright Config Reference](./playwright.config.ts) - Configuración detallada

---

**Este paquete representa el futuro del testing E2E en AltaMedica, combinando tests tradicionales robustos con la potencia de la generación automática de tests mediante IA.**
