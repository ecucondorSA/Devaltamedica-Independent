# 🧪 Testing E2E - AltaMedica Companies App

Documentación completa para el sistema de pruebas End-to-End con Playwright.

## 📋 Índice

- [Introducción](#introducción)
- [Configuración](#configuración)
- [Estructura de Pruebas](#estructura-de-pruebas)
- [Ejecución de Pruebas](#ejecución-de-pruebas)
- [Page Objects](#page-objects)
- [Datos de Prueba](#datos-de-prueba)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

## 🚀 Introducción

El sistema de testing E2E de AltaMedica Companies App utiliza **Playwright** para garantizar la calidad y funcionalidad de toda la aplicación de gestión médica empresarial.

### Cobertura de Pruebas

- ✅ **Dashboard Principal** - Métricas y navegación
- ✅ **Gestión de Empleados** - CRUD completo
- ✅ **Gestión de Doctores** - Perfiles y horarios
- ✅ **Sistema de Citas** - Agendamiento y calendario
- ✅ **Gestión de Pacientes** - Historiales médicos
- ✅ **Marketplace** - Servicios médicos y carrito
- ✅ **Analytics** - Reportes y métricas

## ⚙️ Configuración

### Prerequisitos

```bash
# Node.js 18+ y pnpm
node --version  # v18+
pnpm --version  # 8+

# Instalar dependencias
pnpm install

# Instalar navegadores de Playwright
pnpm test:install
```

### Variables de Entorno

Crear archivo `.env.test`:

```env
# URL de la aplicación
PLAYWRIGHT_BASE_URL=http://localhost:3006

# Base de datos de testing
TEST_DATABASE_URL=memory://test.db

# Configuración de autenticación
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_SECRET=test-secret-key

# Configuración de APIs
USE_MOCK_APIS=true
SKIP_EMAIL_SENDING=true
```

## 📁 Estructura de Pruebas

```
tests/
├── helpers/
│   ├── page-objects.ts     # Page Objects y helpers
│   └── test-data.ts        # Datos de prueba
├── setup/
│   ├── global-setup.ts     # Setup global
│   └── global-teardown.ts  # Cleanup global
├── dashboard.spec.ts       # Pruebas del dashboard
├── employees.spec.ts       # Gestión de empleados
├── doctors.spec.ts         # Gestión de doctores
├── appointments.spec.ts    # Sistema de citas
├── patients.spec.ts        # Gestión de pacientes
├── marketplace.spec.ts     # Marketplace de servicios
└── analytics.spec.ts       # Sistema de analytics
```

## 🏃‍♂️ Ejecución de Pruebas

### Comandos Básicos

```bash
# Todas las pruebas
pnpm test

# Con navegador visible
pnpm test:headed

# Modo debug
pnpm test:debug

# Interfaz visual
pnpm test:ui
```

### Por Navegador

```bash
# Chrome/Chromium
pnpm test:chrome

# Firefox
pnpm test:firefox

# Safari/WebKit
pnpm test:webkit

# Móvil
pnpm test:mobile

# Tablet
pnpm test:tablet
```

### Pruebas Específicas

```bash
# Dashboard
pnpm test:dashboard

# Empleados
pnpm test:employees

# Doctores
pnpm test:doctors

# Citas
pnpm test:appointments

# Pacientes
pnpm test:patients

# Marketplace
pnpm test:marketplace

# Analytics
pnpm test:analytics
```

### Script Personalizado

```bash
# Usar el runner personalizado
pnpm test:custom --help

# Ejemplos
pnpm test:custom --debug
pnpm test:custom --mobile
pnpm test:custom --project firefox
pnpm test:custom dashboard.spec.ts
```

## 🎭 Page Objects

### Estructura de Page Objects

```typescript
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}

export class DashboardPage extends BasePage {
  async navigateToSection(section: string) {
    await this.page.click(`[href*="/${section}"]`);
    await this.waitForPageLoad();
  }
}
```

### Page Objects Disponibles

- `AuthPage` - Autenticación y login
- `DashboardPage` - Dashboard principal
- `EmployeePage` - Gestión de empleados
- `DoctorPage` - Gestión de doctores
- `AppointmentPage` - Sistema de citas
- `PatientPage` - Gestión de pacientes
- `MarketplacePage` - Marketplace de servicios
- `AnalyticsPage` - Sistema de analytics

## 📊 Datos de Prueba

### Datos Predefinidos

```typescript
export const testData = {
  employee: {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@test.com',
    position: 'Desarrollador',
    department: 'IT',
  },
  doctor: {
    firstName: 'Dr. Ana',
    lastName: 'García',
    email: 'ana.garcia@test.com',
    specialty: 'Cardiología',
    licenseNumber: 'MED123456',
  },
  patient: {
    firstName: 'María',
    lastName: 'López',
    email: 'maria.lopez@test.com',
    phone: '+54 11 1234-5678',
    dni: '12345678',
    dateOfBirth: '1990-05-15',
  },
};
```

### Generación Dinámica

```typescript
// Generar datos únicos para cada prueba
const uniqueEmployee = {
  ...testData.employee,
  email: `employee.${Date.now()}@test.com`,
  dni: Math.random().toString().substr(2, 8),
};
```

## 📝 Ejemplos de Pruebas

### Prueba Básica

```typescript
test('debería crear un nuevo empleado', async ({ page }) => {
  const employeePage = new EmployeePage(page);

  await employeePage.goto();
  await employeePage.createEmployee(testData.employee);
  await employeePage.assertEmployeeInList(testData.employee.firstName);
});
```

### Prueba con Setup

```typescript
test.beforeEach(async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.login();
});

test('debería mostrar el dashboard', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto('/dashboard');
  await dashboardPage.assertDashboardStats();
});
```

### Prueba de Flujo Completo

```typescript
test('flujo completo: crear paciente y agendar cita', async ({ page }) => {
  const authPage = new AuthPage(page);
  const patientPage = new PatientPage(page);
  const appointmentPage = new AppointmentPage(page);

  // Login
  await authPage.login();

  // Crear paciente
  await patientPage.goto();
  await patientPage.createPatient(testData.patient);

  // Agendar cita
  await appointmentPage.goto();
  await appointmentPage.createAppointment({
    patientName: testData.patient.firstName,
    doctorName: 'Dr. Ana García',
    date: '2024-02-15',
    time: '10:00',
    type: 'Consulta General',
  });
});
```

## 🏆 Mejores Prácticas

### 1. Selectores Estables

```typescript
// ✅ Usar data-testid
await page.click('[data-testid="create-employee-button"]');

// ❌ Evitar selectores frágiles
await page.click('.btn.btn-primary:nth-child(2)');
```

### 2. Esperas Apropiadas

```typescript
// ✅ Esperar elementos específicos
await expect(page.locator('[data-testid="employee-list"]')).toBeVisible();

// ❌ Evitar esperas arbitrarias
await page.waitForTimeout(5000);
```

### 3. Datos Únicos

```typescript
// ✅ Generar datos únicos
const uniqueEmail = `test.${Date.now()}@example.com`;

// ❌ Reutilizar datos que pueden causar conflictos
const email = 'test@example.com';
```

### 4. Cleanup Apropiado

```typescript
test.afterEach(async ({ page }) => {
  // Limpiar datos de prueba si es necesario
  await cleanupTestData();
});
```

### 5. Assertions Específicas

```typescript
// ✅ Assertions específicas
await expect(page.locator('[data-testid="success-message"]')).toContainText(
  'Empleado creado exitosamente',
);

// ❌ Assertions genéricas
await expect(page.locator('div')).toBeVisible();
```

## 📊 Reportes

### Ver Reportes

```bash
# Abrir reporte HTML
pnpm test:report

# Archivos de reporte
test-results/
├── html-report/        # Reporte HTML interactivo
├── results.json        # Resultados en JSON
├── junit.xml          # Reporte JUnit
└── artifacts/         # Screenshots, videos, traces
```

### Configurar CI/CD

```yaml
# GitHub Actions ejemplo
- name: Run Playwright tests
  run: pnpm test

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: test-results/
```

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Servidor no inicia

```bash
# Verificar puerto disponible
lsof -ti:3006

# Matar proceso si existe
kill -9 $(lsof -ti:3006)

# Verificar variables de entorno
echo $PLAYWRIGHT_BASE_URL
```

#### 2. Navegadores no instalados

```bash
# Instalar navegadores
pnpm test:install

# Instalar dependencias del sistema
pnpm test:install-deps
```

#### 3. Timeouts frecuentes

```typescript
// Aumentar timeouts en playwright.config.ts
export default defineConfig({
  timeout: 60000,
  use: {
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
});
```

#### 4. Pruebas fallan en CI

```bash
# Ejecutar en modo headless en CI
CI=true pnpm test

# Reducir paralelismo en CI
pnpm test --workers=1
```

### Debug de Pruebas

```bash
# Modo debug interactivo
pnpm test:debug

# Con logs detallados
DEBUG=pw:api* pnpm test

# Guardar trace para análisis
pnpm test --trace=on
```

### Logs y Debugging

```typescript
// Logs en las pruebas
test('ejemplo con logs', async ({ page }) => {
  console.log('Iniciando prueba...');

  // Ver requests de red
  page.on('request', (request) => {
    console.log('Request:', request.url());
  });

  // Ver errores de consola
  page.on('console', (msg) => {
    console.log('Console:', msg.text());
  });
});
```

## 📞 Soporte

- **Documentación Playwright**: https://playwright.dev/
- **Issues del proyecto**: Crear issue en el repositorio
- **Slack**: Canal #testing (interno)

---

## 🎯 Próximos Pasos

1. **Integración con CI/CD** - Automatizar ejecución en pipeline
2. **Visual Testing** - Comparación de screenshots
3. **Performance Testing** - Métricas de rendimiento
4. **Accessibility Testing** - Pruebas de accesibilidad
5. **API Testing** - Pruebas de endpoints REST

---

_Última actualización: ${new Date().toLocaleDateString('es-AR')}_
