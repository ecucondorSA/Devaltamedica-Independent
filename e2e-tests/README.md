# 🧪 Tests E2E de AltaMedica con Playwright

## Descripción

Suite completa de tests End-to-End para la plataforma AltaMedica, cubriendo el flujo completo de registro de usuarios desde el inicio hasta el dashboard específico de cada rol.

## 🎯 Cobertura de Tests

### 1. **Flujo de Registro Completo** (`registration-flow.spec.ts`)
- ✅ Registro exitoso de **Paciente** con redirección a `localhost:3003`
- ✅ Registro exitoso de **Doctor** con redirección a `localhost:3002`  
- ✅ Registro exitoso de **Empresa** con redirección a `localhost:3004`
- ✅ Validaciones del formulario (campos requeridos, email válido, contraseñas)
- ✅ Verificación de disponibilidad de todos los roles
- ✅ Manejo de casos edge (emails duplicados)
- ✅ Tests de responsividad (móvil y desktop)

### 2. **Journey Completo del Usuario** (`complete-user-journey.spec.ts`)
- ✅ Journey completo **Paciente**: Registro → Redirect → Verificación App
- ✅ Journey completo **Doctor**: Registro → Redirect → Verificación App  
- ✅ Journey completo **Empresa**: Registro → Redirect → Verificación App
- ✅ Verificación de disponibilidad de todas las aplicaciones
- ✅ Métricas de performance y tiempos de carga

## 🏗️ Arquitectura

### Estructura de Archivos
```
e2e-tests/
├── fixtures/
│   └── test-data.ts              # Datos de prueba y configuración
├── utils/
│   └── test-helpers.ts           # Funciones utilitarias reutilizables
├── global-setup.ts               # Configuración global (verificar servidores)
├── global-teardown.ts            # Limpieza global
├── registration-flow.spec.ts     # Tests del flujo de registro
├── complete-user-journey.spec.ts # Tests del journey completo
└── README.md                     # Esta documentación
```

### Datos de Prueba
- **Emails únicos**: Generados con timestamp para evitar conflictos
- **Usuarios de prueba**: Configurados para cada rol (patient, doctor, company)
- **URLs centralizadas**: Todas las URLs de las aplicaciones en un lugar

### Utilidades
- **fillRegistrationForm()**: Rellena automáticamente el formulario de registro
- **waitForRedirect()**: Espera y verifica redirecciones automáticas
- **takeScreenshot()**: Capturas de pantalla automáticas para debugging
- **setupDialogHandlers()**: Manejo de alertas y diálogos del navegador

## 🚀 Configuración y Ejecución

### Prerrequisitos
```bash
# Instalar Playwright (ya incluido en package.json)
pnpm install

# Instalar browsers de Playwright
npx playwright install
```

### Comandos Disponibles

#### Ejecutar Tests
```bash
# Ejecutar todos los tests E2E
pnpm test:e2e

# Ejecutar con UI interactiva  
pnpm test:e2e:ui

# Ejecutar en modo debug
pnpm test:e2e:debug

# Ejecutar tests específicos
npx playwright test registration-flow
npx playwright test complete-user-journey
```

#### Gestión de Servidores
```bash
# Iniciar todos los servidores automáticamente
pnpm start:all-servers

# Los tests inician automáticamente los servidores necesarios
# pero también puedes hacerlo manualmente antes
```

### Configuración Automática

Los tests están configurados para:
- ✅ **Levantar servidores automáticamente** antes de ejecutar
- ✅ **Verificar salud de servidores** en global-setup
- ✅ **Limpiar datos** entre tests para evitar interferencias  
- ✅ **Tomar screenshots** automáticos en fallos y puntos clave
- ✅ **Generar reportes** HTML, JSON y consola

## 📊 Aplicaciones Cubiertas

### Servidores Requeridos
| Aplicación | Puerto | URL | Requerido |
|------------|---------|-----|-----------|
| **api-server** | 3001 | http://localhost:3001 | ✅ Sí |
| **web-app** | 3000 | http://localhost:3000 | ✅ Sí |
| **doctors** | 3002 | http://localhost:3002 | ⚪ Opcional |
| **patients** | 3003 | http://localhost:3003 | ⚪ Opcional |
| **companies** | 3004 | http://localhost:3004 | ⚪ Opcional |
| **admin** | 3005 | http://localhost:3005 | ⚪ Opcional |
| **signaling-server** | 8888 | http://localhost:8888 | ⚪ Opcional |

### Flujos de Redirección Verificados
- **Paciente** registrado en `web-app` → Redirige a `patients-app` (3003)
- **Doctor** registrado en `web-app` → Redirige a `doctors-app` (3002)  
- **Empresa** registrada en `web-app` → Redirige a `companies-app` (3004)

## 🐛 Debugging y Troubleshooting

### Screenshots Automáticos
Los tests toman screenshots en:
- ✅ Formularios completados
- ✅ Mensajes de éxito/error  
- ✅ Redirecciones completadas
- ✅ Fallos de tests
- ✅ Estados finales

Ubicación: `e2e-results/screenshot-*.png`

### Logs Detallados
Los tests incluyen logging extensivo:
```bash
📝 Rellenando formulario para patient: test.patient.123@altamedica.test
🎭 Seleccionando rol: patient
🚀 Enviando formulario de registro...
✅ Mensaje de éxito detectado
🔄 Esperando redirección a: http://localhost:3003
✅ Redirección exitosa a: http://localhost:3003/
```

### Casos Edge Manejados
- ❌ **Servidores no disponibles**: Fallback graceful para servidores opcionales
- ❌ **Timeouts**: Configurados apropiadamente para cada operación
- ❌ **Errores de red**: Reintentos automáticos configurados
- ❌ **Diálogos del navegador**: Handlers automáticos para alerts/confirms

## 📈 Métricas y Reporting

### Reportes Generados
- **HTML Report**: Vista interactiva con screenshots y traces
- **JSON Report**: Para integración con CI/CD
- **Console Output**: Para debugging inmediato

### Métricas de Performance
- ⏱️ **Tiempo de carga** de páginas
- ⏱️ **Tiempo de rellenado** de formularios
- ⏱️ **Tiempo de envío** y respuesta
- ⏱️ **Tiempo total** del flujo completo

### Configuración de Browsers
- **Desktop Chrome**: Viewport 1920x1080, permisos para cámara/micrófono
- **Mobile Chrome**: Pixel 7, para tests de responsividad
- **Cross-browser**: Firefox y Safari comentados (activar si es necesario)

## 🔧 Personalización

### Modificar Datos de Prueba
Editar `fixtures/test-data.ts`:
```typescript
export const testUsers: Record<string, TestUser> = {
  patient: {
    email: `custom.patient@test.com`,
    firstName: 'Custom',
    lastName: 'Patient',
    // ...
  }
};
```

### Añadir Nuevos Tests
1. Crear archivo `.spec.ts` en `/e2e-tests/`
2. Importar utilidades desde `utils/test-helpers.ts`
3. Usar datos desde `fixtures/test-data.ts`
4. Seguir patrones existentes para consistencia

### Configurar Timeouts
En `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 15000,      // Acciones individuales
  navigationTimeout: 30000,  // Navegación entre páginas
},
timeout: 60000, // Timeout por test
```

## 🎯 Casos de Uso

### Desarrollo Local
```bash
# Ejecutar durante desarrollo
pnpm test:e2e:ui
```

### CI/CD Pipeline
```bash
# Ejecución automática en pipeline
pnpm test:e2e --reporter=json
```

### Debugging de Problemas
```bash
# Ejecutar con debug paso a paso
pnpm test:e2e:debug
```

### Validación antes de Deploy
```bash
# Verificar que todo funciona antes de desplegar
pnpm start:all-servers
pnpm test:e2e
```

## ✅ Checklist de Verificación

Antes de hacer push, verificar que:
- [ ] Todos los tests pasan localmente
- [ ] Los 7 servidores se levantan correctamente
- [ ] Las redirecciones funcionan entre aplicaciones
- [ ] Los screenshots se generan correctamente
- [ ] Los reportes HTML se crean sin errores
- [ ] Los datos de prueba no interfieren con datos reales

---

**Desarrollado para AltaMedica Platform** 🏥  
*Eduardo Marques, MD - Full-Stack Developer*