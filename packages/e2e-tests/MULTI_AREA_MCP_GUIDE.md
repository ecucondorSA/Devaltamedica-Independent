# 🔄 Multi-Area MCP Playwright - Guía Completa

## 📋 **¿Qué es Multi-Area MCP?**

Multi-Area MCP permite generar y ejecutar tests E2E que coordinan múltiples aplicaciones de AltaMedica Platform usando Playwright con Model Context Protocol (MCP). 

### 🎯 **Casos de Uso**
- ✅ Flujos completos **Patients → Doctors → Companies**
- ✅ Ecosistemas de **telemedicina coordinados**
- ✅ Procesos **B2B de contratación médica**
- ✅ **Verificación de consistencia** de datos cross-area
- ✅ **Testing de resilencia** multi-aplicación

---

## 🚀 **Uso Inmediato - Sin Reload de VS Code**

### 📝 **1. Ver Workflows Disponibles**

```bash
cd packages/e2e-tests

# Ver todos los workflows multi-área
pnpm multi:list
```

**Salida:**
```
🔄 Workflows Multi-Área Disponibles:

📋 complete-medical-journey:
   📝 Complete Medical Journey (Multi-Area)
   📱 Áreas: patients, doctors, companies
   📋 Flujo completo desde booking hasta consulta y marketplace
   🔗 Steps:
      1. patients → booking: Paciente reserva cita médica
      2. doctors → consultation: Doctor realiza consulta
      3. companies → marketplace: Empresa busca doctores especialistas

📋 telemedicine-ecosystem:
   📝 Telemedicine Ecosystem (Multi-Area)
   📱 Áreas: patients, doctors
   📋 Ecosistema completo de telemedicina entre pacientes y doctores
```

### 🔄 **2. Generar Tests Multi-Area**

#### **A. Workflows Predefinidos**

```bash
# Flujo médico completo (3 áreas)
pnpm multi:medical-journey

# Ecosistema de telemedicina (2 áreas)  
pnpm multi:telemedicine

# Proceso B2B de contratación (2 áreas)
pnpm multi:b2b-hiring
```

#### **B. Workflows Personalizados**

```bash
# Workflow personalizado con áreas específicas
node multi-area-generator.js --areas "patients,doctors"

# Workflow solo para empresas y doctores
node multi-area-generator.js --areas "companies,doctors"

# Workflow completo (todas las áreas)
node multi-area-generator.js --areas "patients,doctors,companies,admin"
```

### ▶️ **3. Ejecutar Tests Multi-Area**

```bash
# Ejecutar test específico generado
pnpm test:e2e complete-medical-journey.spec.ts

# Ejecutar con UI de Playwright
pnpm test:ui tests/multi-area/

# Ejecutar en modo debug
pnpm test:debug -- --grep "Complete Medical Journey"
```

---

## 📊 **Ejemplo Práctico en Acción**

### 🎬 **Flujo "Complete Medical Journey"**

```typescript
// Generado automáticamente por MCP
test('should complete end-to-end medical workflow', async ({ browser }) => {
  
  // STEP 1: 🏥 Patients App
  await test.step('Patient books appointment', async () => {
    const patientsPage = await browser.newPage();
    await patientsPage.goto('http://localhost:3003');
    
    // MCP detecta automáticamente los selectors
    await patientsPage.getByRole('button', { name: /citas/i }).click();
    await patientsPage.getByPlaceholder(/buscar doctor/i).fill('Cardiología');
  });
  
  // STEP 2: 👨‍⚕️ Doctors App  
  await test.step('Doctor conducts consultation', async () => {
    const doctorsPage = await browser.newPage();
    await doctorsPage.goto('http://localhost:3002');
    
    // MCP encuentra la cita del paciente anterior
    await doctorsPage.getByText(/cita pendiente/i).click();
    await doctorsPage.getByLabel(/notas/i).fill('Consulta completada');
  });
  
  // STEP 3: 🏢 Companies App
  await test.step('Company searches specialists', async () => {
    const companiesPage = await browser.newPage();
    await companiesPage.goto('http://localhost:3004');
    
    // MCP detecta necesidad de especialistas basada en consultas
    await companiesPage.getByPlaceholder(/especialidad/i).fill('Cardiología');
  });
});
```

---

## 🔧 **Configuración Multi-Area**

### 📋 **Estructura de Archivos Generados**

```
packages/e2e-tests/
├── tests/multi-area/                    # Tests multi-área generados
│   ├── complete-medical-journey.spec.ts
│   ├── telemedicine-ecosystem.spec.ts
│   └── custom-workflow.spec.ts
│
├── tests/ai-generated/                  # Tests individuales (base)
│   ├── patients-booking-ai-generated.spec.ts
│   ├── doctors-consultation-ai-generated.spec.ts
│   └── companies-marketplace-ai-generated.spec.ts
│
├── multi-area-generator.js              # Generador principal
├── ai-test-generator.js                 # Generador individual
├── mcp.config.js                        # Configuración MCP
└── MULTI_AREA_MCP_GUIDE.md             # Esta guía
```

### ⚙️ **Configuración Automática**

El sistema ya está configurado con:

- ✅ **Base URLs** para todas las aplicaciones
- ✅ **Autenticación** por rol automática
- ✅ **Context isolation** entre áreas
- ✅ **Shared data** para coordinación
- ✅ **Error handling** multi-área
- ✅ **Performance monitoring**

---

## 🎯 **Workflows Disponibles**

### 🏥 **1. Complete Medical Journey**
**Áreas:** Patients → Doctors → Companies  
**Descripción:** Flujo médico completo desde reserva hasta contratación de especialistas  
**Comando:** `pnpm multi:medical-journey`

**Pasos:**
1. 🏥 **Patients**: Paciente reserva cita con cardiólogo
2. 👨‍⚕️ **Doctors**: Doctor realiza consulta y agrega notas
3. 🏢 **Companies**: Empresa busca especialistas en cardiología

### 📞 **2. Telemedicine Ecosystem**  
**Áreas:** Patients ↔ Doctors  
**Descripción:** Ecosistema de telemedicina con WebRTC  
**Comando:** `pnpm multi:telemedicine`

**Pasos:**
1. 🏥 **Patients**: Paciente inicia sesión de telemedicina
2. 👨‍⚕️ **Doctors**: Doctor conduce consulta virtual
3. 🔄 **Cross-validation**: Verificación de sincronización WebRTC

### 🤝 **3. B2B Medical Hiring**
**Áreas:** Companies ↔ Doctors  
**Descripción:** Proceso de contratación médica B2B  
**Comando:** `pnpm multi:b2b-hiring`

**Pasos:**
1. 🏢 **Companies**: Empresa publica oferta médica
2. 👨‍⚕️ **Doctors**: Doctor gestiona disponibilidad
3. 📋 **Match**: Verificación de compatibilidad

---

## 🔍 **Características Avanzadas**

### 🔄 **Cross-Area Data Consistency**

```typescript
// Verificación automática de consistencia
await test.step('Verify data sync between areas', async () => {
  const patientData = await patientsPage.evaluate(() => localStorage.getItem('appointmentId'));
  const doctorData = await doctorsPage.evaluate(() => localStorage.getItem('patientAppointments'));
  
  expect(patientData).toEqual(expect.stringContaining(doctorData));
});
```

### ⏱️ **Performance Monitoring**

```typescript
// Medición automática de performance cross-area
const areas = ['patients', 'doctors', 'companies'];
const loadTimes = await Promise.all(
  areas.map(area => measureLoadTime(`http://localhost:${getPort(area)}`))
);

expect(Math.max(...loadTimes)).toBeLessThan(5000); // < 5s
```

### 🛡️ **Error Resilience**

```typescript
// Manejo automático de errores multi-área
await test.step('Handle area unavailability', async () => {
  const fallbackStrategies = ['retry', 'skip', 'mock'];
  
  for (const strategy of fallbackStrategies) {
    await handleAreaError(area, strategy);
  }
});
```

---

## 📊 **Métricas y Reportes**

### 📈 **Dashboard de Resultados**

Los tests multi-área generan automáticamente:

- 📊 **Métricas de performance** por área
- 🔗 **Mapas de dependencias** entre aplicaciones  
- 📋 **Reportes de consistencia** de datos
- ⚠️ **Alertas de fallos** cross-area
- 🎯 **Coverage multi-área** por workflow

### 📄 **Ejemplo de Reporte**

```
🔄 Multi-Area Test Results Summary:

✅ Complete Medical Journey: PASSED (12.3s)
   📊 patients: 2.1s | doctors: 3.4s | companies: 1.8s
   🔗 Data consistency: 98.5%
   ⚠️ Warnings: 0

✅ Telemedicine Ecosystem: PASSED (8.7s)  
   📊 patients: 2.3s | doctors: 4.2s
   🔗 WebRTC sync: 99.1%
   ⚠️ Warnings: 1 (minor latency spike)

❌ B2B Medical Hiring: FAILED (timeout)
   📊 companies: timeout | doctors: 3.1s
   🔗 Data consistency: N/A
   ⚠️ Errors: companies app unreachable
```

---

## 🚨 **Troubleshooting**

### ❓ **Problemas Comunes**

#### **"No se pueden generar tests"**
```bash
# Verificar que las aplicaciones estén corriendo
pnpm dev:min  # Inicia web-app, patients, doctors, api-server

# Verificar puertos
netstat -ano | findstr :3002
netstat -ano | findstr :3003
netstat -ano | findstr :3004
```

#### **"Tests fallan por timeouts"**
```bash
# Aumentar timeout en playwright.config.ts
timeout: 120 * 1000,  // 2 minutos

# O en el test específico
test.setTimeout(180000); // 3 minutos
```

#### **"Selectors no encontrados"**
```bash
# Re-generar tests con configuración actualizada
node multi-area-generator.js --workflow complete-medical-journey

# Ejecutar con debug para ver selectores
pnpm test:debug -- --grep "Complete Medical Journey"
```

### 🔧 **Configuración de Puertos**

Si los puertos por defecto no funcionan:

```javascript
// Editar multi-area-generator.js
getPortForArea(area) {
  const ports = {
    'patients': 3003,    // Cambiar si es necesario
    'doctors': 3002,     // Cambiar si es necesario  
    'companies': 3004,   // Cambiar si es necesario
    'admin': 3005,
    'web-app': 3000
  };
  return ports[area] || 3000;
}
```

---

## 🎓 **Ejemplos de Comandos Completos**

### 🚀 **Workflow Completo de Desarrollo**

```bash
# 1. Ver workflows disponibles
pnpm multi:list

# 2. Generar workflow médico completo  
pnpm multi:medical-journey

# 3. Ejecutar test generado
pnpm test:e2e complete-medical-journey.spec.ts

# 4. Ver resultados en UI
pnpm test:ui

# 5. Debug si hay fallos
pnpm test:debug -- --grep "Complete Medical Journey"
```

### 🎯 **Workflow Personalizado**

```bash
# 1. Generar workflow personalizado
node multi-area-generator.js --areas "patients,doctors,companies"

# 2. Ejecutar workflow personalizado
pnpm test:e2e tests/multi-area/custom.spec.ts

# 3. Generar reporte HTML
pnpm test -- --reporter=html
```

### 🔄 **Desarrollo Iterativo**

```bash
# Desarrollo continuo con regeneración automática
while true; do
  pnpm multi:medical-journey
  pnpm test:e2e complete-medical-journey.spec.ts
  sleep 30
done
```

---

## ✨ **Próximas Características**

- 🔮 **Visual Regression Testing** multi-área
- 🤖 **Self-healing tests** que se adaptan a cambios
- 📊 **Real-time analytics** dashboard
- 🔗 **API contract testing** cross-area
- 🎯 **Load testing** multi-aplicación
- 🛡️ **Security testing** coordinado

---

**🎉 ¡Multi-Area MCP Playwright está listo para usar! No necesitas reload de VS Code - todo funciona inmediatamente.**